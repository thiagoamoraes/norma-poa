#!/usr/bin/env node
// ingestao/gerar-revisao.mjs
//
// Gera os dados do dashboard de revisão (PLANO-REVISAO.md, F1) em docs/dados/revisao/:
//   fila.json      índice leve das normas RECENTES (sanção da LC 611 em diante) em revisão
//   n/<id>.json    uma norma: texto de origem, dispositivos com âncora e situação, lacunas
//   decisoes.jsonl cópia de dados/revisao/decisoes.jsonl (as decisões já entregues)
// e copia o módulo de decisões para docs/js/ingestao/ (roda no navegador).
// Sem rede. Executa ao ser importado (como os demais coletores): use `node --check` para checar sintaxe.
// Uso: node ingestao/gerar-revisao.mjs

import { readFile, writeFile, mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { lerJsonl, agora } from './sapl-io.mjs';
import { epocaDaNorma } from './estrutura.mjs';
import { prepararTextoExtraido } from './extracao-texto.mjs';
import { ancorarConferencia } from './revisao-ancoras.mjs';

const DIR_EST = './dados/estruturado/sapl';
const SAIDA = './docs/dados/revisao';
const NOMES = { 1: 'Lei Orgânica', 2: 'Emenda à Lei Orgânica', 5: 'Lei', 6: 'Lei Complementar' };

const catalogo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);
}

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
  fila.push({
    idSapl: reg.idSapl, rotulo: reg.rotulo, tipo: norma.tipo, numero: norma.numero, data: norma.data, motivos: reg.verificacao.motivos,
    ocr: reg.verificacao.avisos.includes('texto_de_ocr'), pontos: a.resumo.rotulosDivergentes + a.resumo.naoLocalizados + a.resumo.lacunasReais,
    sha256Origem: reg.sha256Origem, versaoEstruturador: reg.versaoEstruturador, urlFonte,
  });
}
fila.sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : y.idSapl - x.idSapl));
await writeFile(path.join(SAIDA, 'fila.json'), JSON.stringify({ geradoEm: agora(), versaoEstruturador: fila[0]?.versaoEstruturador ?? null, normas: fila }) + '\n');

const decisoes = './dados/revisao/decisoes.jsonl';
await writeFile(path.join(SAIDA, 'decisoes.jsonl'), existsSync(decisoes) ? await readFile(decisoes, 'utf8') : '');
await copyFile('./ingestao/revisao.mjs', './docs/js/ingestao/revisao.mjs');
console.log(`${agora()} revisão: ${fila.length} norma(s) recente(s) em revisão → ${SAIDA}`);
