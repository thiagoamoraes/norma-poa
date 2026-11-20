#!/usr/bin/env node
// ingestao/gerar-revisao.mjs
//
// Gera os dados do dashboard de revisão (PLANO-REVISAO.md, F1) em docs/dados/revisao/:
//   fila.json      índice leve das normas RECENTES (sanção da LC 611 em diante) em revisão
//   n/<id>.cmd.json comandos de uma alteradora: o que o extrator entendeu e, com a lei-alvo na base, antes/depois (F2)
//   n/<id>.json    uma norma: texto de origem, dispositivos com âncora e situação, lacunas
//   historico/<id>.json + historico-lista.json  históricos apurados das leis alteradas, para comparar com a compilação do leis.org (F3)
//   decisoes.jsonl cópia de dados/revisao/decisoes.jsonl (as decisões já entregues)
// e copia o módulo de decisões para docs/js/ingestao/ (roda no navegador).
// Sem rede. Executa ao ser importado (como os demais coletores): use `node --check` para checar sintaxe.
// Uso: node ingestao/gerar-revisao.mjs

import { readFile, writeFile, mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { lerJsonl, agora } from './sapl-io.mjs';
import { epocaDaNorma } from './estrutura.mjs';
import { prepararTextoExtraido } from './extracao-texto.mjs';
import { ancorarConferencia } from './revisao-ancoras.mjs';
import { descreverComandos, fonteDoRegistroCatalogo, TIPO_ATO_DO_CATALOGO } from './revisao-comandos.mjs';
import { chaveLei } from '../norma-core.js';

const DIR_EST = './dados/estruturado/sapl';
const SAIDA = './docs/dados/revisao';
const NOMES = { 1: 'Lei Orgânica', 2: 'Emenda à Lei Orgânica', 5: 'Lei', 6: 'Lei Complementar' };

const catalogo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);
}

// F2: lei-alvo → { registro, texto } quando o texto dela está na base
const porChave = new Map();
for (const r of catalogo.values()) if (TIPO_ATO_DO_CATALOGO[r.tipoSapl]) porChave.set(chaveLei(TIPO_ATO_DO_CATALOGO[r.tipoSapl], r.numero, String(r.ano)), r);
const resolverBase = (chave) => {
  const r = porChave.get(chave);
  const arq = r && `./dados/textos/sapl/${r.idSapl}.txt`;
  return r && existsSync(arq) ? { registro: r, texto: prepararTextoExtraido(readFileSync(arq, 'utf8')) } : null;
};

await rm(path.join(SAIDA, 'n'), { recursive: true, force: true });
await mkdir(path.join(SAIDA, 'n'), { recursive: true });
await mkdir('./docs/js/ingestao', { recursive: true });

const fila = [];
for (const f of (await readdir(DIR_EST)).filter((f) => /^\d+\.json$/.test(f))) {
  const reg = JSON.parse(await readFile(path.join(DIR_EST, f), 'utf8'));
  if (reg.verificacao.situacao !== 'revisar') continue;
  const cat = catalogo.get(reg.idSapl) || {};
  if (epocaDaNorma(cat) !== 'recente') continue;
  const arq = `./dados/textos/sapl/${reg.idSapl}.txt`;
  if (!existsSync(arq)) continue;
  const a = ancorarConferencia(prepararTextoExtraido(await readFile(arq, 'utf8')), reg);

  const porId = new Map(a.itens.filter((i) => i.ref === 'dispositivo').map((i) => [i.id, i]));
  const blocos = new Map(a.itens.filter((i) => i.ref === 'bloco').map((i) => [i.id, i]));
  const dispositivos = reg.dispositivos.map((d) => {
    const it = porId.get(d.id);
    const o = { id: d.id, pai: d.pai, tipo: d.tipo, rotulo: d.rotulo, texto: d.texto, situacao: it.situacao };
    if (it.ini !== undefined) { o.ini = it.ini; o.fim = it.fim; }
    if (it.naOrigem) o.naOrigem = it.naOrigem;
    if (d.vetado) o.vetado = true;
    if (d.revogado) o.revogado = true;
    const b = blocos.get(d.id);
    if (b) o.bloco = { situacao: b.situacao, ini: b.ini, fim: b.fim };
    return o;
  });
  const especiais = a.itens.filter((i) => ['ementa', 'preambulo', 'fecho'].includes(i.ref)).map((i) => ({ ref: i.ref, situacao: i.situacao, ini: i.ini, fim: i.fim }));
  const urlFonte = cat.texto?.url || null;
  const norma = {
    idSapl: reg.idSapl, rotulo: reg.rotulo, tipo: NOMES[cat.tipoSapl] || String(cat.tipoSapl), numero: cat.numero, data: cat.data,
    motivos: reg.verificacao.motivos, avisos: reg.verificacao.avisos, urlFonte,
    sha256Origem: reg.sha256Origem, versaoEstruturador: reg.versaoEstruturador,
    resumo: a.resumo, texto: a.texto, dispositivos, especiais, lacunas: a.lacunas.filter((l) => !l.esperada),
  };
  await writeFile(path.join(SAIDA, 'n', `${reg.idSapl}.json`), JSON.stringify(norma) + '\n');
  const cmd = descreverComandos(await readFile(arq, 'utf8').then(prepararTextoExtraido), fonteDoRegistroCatalogo(cat), resolverBase);
  if (cmd.comandos.length) await writeFile(path.join(SAIDA, 'n', `${reg.idSapl}.cmd.json`), JSON.stringify(cmd) + '\n');
  fila.push({
    idSapl: reg.idSapl, rotulo: reg.rotulo, tipo: norma.tipo, numero: norma.numero, data: norma.data, motivos: reg.verificacao.motivos,
    ocr: reg.verificacao.avisos.includes('texto_de_ocr'), pontos: a.resumo.rotulosDivergentes + a.resumo.naoLocalizados + a.resumo.lacunasReais,
    sha256Origem: reg.sha256Origem, versaoEstruturador: reg.versaoEstruturador, urlFonte,
    comandos: cmd.comandos.length, comandosAVer: cmd.comandos.filter((k) => ['recusado', 'dispositivo_nao_encontrado', 'alvo_nao_identificado'].includes(k.situacao)).length,
  });
}
fila.sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : y.idSapl - x.idSapl));
await writeFile(path.join(SAIDA, 'fila.json'), JSON.stringify({ geradoEm: agora(), versaoEstruturador: fila[0]?.versaoEstruturador ?? null, normas: fila }) + '\n');

const decisoes = './dados/revisao/decisoes.jsonl';
await writeFile(path.join(SAIDA, 'decisoes.jsonl'), existsSync(decisoes) ? await readFile(decisoes, 'utf8') : '');
await copyFile('./ingestao/revisao.mjs', './docs/js/ingestao/revisao.mjs');

// F3: históricos das leis que tiveram alteração aplicada (versões > 1), para a página de comparação
await rm(path.join(SAIDA, 'historico'), { recursive: true, force: true });
await mkdir(path.join(SAIDA, 'historico'), { recursive: true });
const lista = [];
if (existsSync('./dados/historico/sapl')) {
  for (const f of (await readdir('./dados/historico/sapl')).filter((f) => /^\d+\.json$/.test(f))) {
    const h = JSON.parse(await readFile(`./dados/historico/sapl/${f}`, 'utf8'));
    if (h.versoes.length < 2) continue;
    await copyFile(`./dados/historico/sapl/${f}`, path.join(SAIDA, 'historico', f));
    lista.push({ idSapl: h.idSapl, rotulo: h.rotulo, versoes: h.versoes.length, dispositivos: h.dispositivos.length });
  }
}
lista.sort((a, b) => b.versoes - a.versoes || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
await writeFile(path.join(SAIDA, 'historico-lista.json'), JSON.stringify(lista) + '\n');
// módulos que a página de comparação importa no navegador (todos puros)
for (const m of ['revisao-compilacao.mjs', 'historico.mjs', 'estrutura.mjs']) await copyFile(`./ingestao/${m}`, `./docs/js/ingestao/${m}`);
console.log(`${agora()} comparação: ${lista.length} lei(s) com histórico publicadas`);
console.log(`${agora()} revisão: ${fila.length} norma(s) recente(s) em revisão → ${SAIDA}`);
