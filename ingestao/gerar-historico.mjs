#!/usr/bin/env node
// ingestao/gerar-historico.mjs
//
// Apura o histórico (ingestao/historico.mjs) de toda lei que tenha alteradoras
// e grava dados/historico/sapl/<idSapl>.json. Sem rede.
//
// De onde vem a lista de leis:
//   1. dos VÍNCULOS da fonte (dados/catalogo/sapl/vinculos.jsonl), quando já
//      coletados — automático, para o acervo inteiro;
//   2. das EMENTAS do catálogo ("Inclui § 4º no art. 2º da Lei Complementar nº 320…") —
//      candidatas, porque o cadastro de vínculos da fonte tem falhas (na LC 320,
//      3 das 10 alteradoras não têm vínculo);
//   3. de dados/historico/_piloto.json — lista manual, que pode apontar o
//      arquivo de texto de uma norma enquanto ele não está em dados/textos/sapl/.
// As três se somam (nenhuma tira nada da outra).
//
// Também grava:
//   dados/historico/_situacao.json  { comHistorico: [ids], revogadas: { id: idDeQuemRevogou } }
//   dados/historico/RELATORIO.md    quantas leis, quantas completas, o que ficou de fora e por quê
//
// Só regrava um arquivo de histórico quando o conteúdo muda (para o git não
// encher de diferenças vazias). Uso: node ingestao/gerar-historico.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { apurarHistorico, montarListaDeHistoricos, alteradorasPelaEmenta } from './historico.mjs';
import { lerJsonl, agora } from './sapl-io.mjs';
import { prepararTextoExtraido } from './extracao-texto.mjs';

const DIR = './dados/historico';
await mkdir(path.join(DIR, 'sapl'), { recursive: true });

const catalogo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);
}
const estruturacao = existsSync('./dados/estruturado/_situacao.json') ? JSON.parse(await readFile('./dados/estruturado/_situacao.json', 'utf8')) : {};

// ── lista de leis ─────────────────────────────────────────────────────────────
const vinculos = await lerJsonl('./dados/catalogo/sapl/vinculos.jsonl');
const auto = montarListaDeHistoricos(vinculos, catalogo);
const leis = new Map(); // base → { alteradoras: Set, soPelaEmenta: Set, arquivos: Map id → caminho }
const entrada = (base) => { if (!leis.has(base)) leis.set(base, { alteradoras: new Set(), soPelaEmenta: new Set(), arquivos: new Map() }); return leis.get(base); };
for (const l of auto.leis) for (const a of l.alteradoras) entrada(l.base).alteradoras.add(a);
const pelaEmenta = alteradorasPelaEmenta(catalogo);
for (const { base, alteradora } of pelaEmenta) { const e = entrada(base); if (!e.alteradoras.has(alteradora)) { e.alteradoras.add(alteradora); e.soPelaEmenta.add(alteradora); } }
const manual = existsSync(path.join(DIR, '_piloto.json')) ? JSON.parse(await readFile(path.join(DIR, '_piloto.json'), 'utf8')).leis : [];
for (const l of manual) {
  const e = entrada(l.base.idSapl);
  if (l.base.arquivo) e.arquivos.set(l.base.idSapl, l.base.arquivo);
  for (const a of l.alteradoras) { e.alteradoras.add(a.idSapl); e.soPelaEmenta.delete(a.idSapl); if (a.arquivo) e.arquivos.set(a.idSapl, a.arquivo); }
}

async function texto(id, arquivos) {
  const manualArq = arquivos.get(id);
  const arq = manualArq && existsSync(manualArq) ? manualArq : `./dados/textos/sapl/${id}.txt`;
  return existsSync(arq) ? prepararTextoExtraido(await readFile(arq, 'utf8')) : null;
}

// ── apuração ──────────────────────────────────────────────────────────────────
const cont = { apuradas: 0, completas: 0, incompletas: 0, semTextoDaBase: 0, erro: 0, regravadas: 0 };
const comHistorico = [];
const semBase = [];
const comErro = [];
for (const [base, e] of leis) {
  const registro = catalogo.get(base);
  if (!registro) continue;
  const tBase = await texto(base, e.arquivos);
  if (!tBase) { cont.semTextoDaBase++; semBase.push(registro.rotulo); continue; }
  try {
    const alts = [];
    const semTexto = [];
    for (const id of e.alteradoras) {
      const reg = catalogo.get(id);
      if (!reg) continue;
      const t = await texto(id, e.arquivos);
      (t ? alts : semTexto).push({ registro: reg, texto: t, candidataPelaEmenta: e.soPelaEmenta.has(id) });
    }
    const h = apurarHistorico({ registro, texto: tBase }, alts);
    for (const x of semTexto) h.naoAplicadas.push({ alteradora: { idSapl: x.registro.idSapl, rotulo: x.registro.rotulo }, motivo: 'texto_indisponivel', detalhe: 'o texto desta alteradora ainda não foi baixado ou extraído', enderecos: [] });
    // anexos do arquivo ORIGINAL da lei (nós `anexo` da estruturação): o texto vigente apurado não os traz (decisão 35); a consulta avisa (decisão 49)
    let anexosNoOriginal = [];
    try { const est = JSON.parse(await readFile(path.join('dados', 'estruturado', 'sapl', `${base}.json`), 'utf8')); anexosNoOriginal = (est.dispositivos || []).filter((x) => x.tipo === 'anexo').map((x) => ({ rotulo: x.rotulo, grafico: !!x.semTexto })); } catch { /* ainda não estruturada */ }
    const corpo = { idSapl: base, rotulo: registro.rotulo,
      // a árvore da lei-base só é confiável se a estruturação dela foi aceita (quando já foi estruturada)
      baseConferida: estruturacao[base] ? estruturacao[base] === 'aceita' : null,
      ...(anexosNoOriginal.length ? { anexosNoOriginal } : {}),
      ...h };
    const arqSaida = path.join(DIR, 'sapl', `${base}.json`);
    let igual = false;
    if (existsSync(arqSaida)) { const ant = JSON.parse(await readFile(arqSaida, 'utf8')); delete ant.geradoEm; igual = JSON.stringify(ant) === JSON.stringify(corpo); }
    if (!igual) { await writeFile(arqSaida, JSON.stringify({ geradoEm: agora(), ...corpo }, null, 1) + '\n'); cont.regravadas++; }
    cont.apuradas++;
    comHistorico.push(base);
    if (h.naoAplicadas.length) cont.incompletas++; else cont.completas++;
  } catch (err) {
    cont.erro++;
    comErro.push(`${registro.rotulo}: ${String(err.message).slice(0, 160)}`);
  }
}

await writeFile(path.join(DIR, '_situacao.json'), JSON.stringify({ comHistorico: comHistorico.sort((a, b) => a - b), revogadas: auto.revogadas }) + '\n');

const L = ['# Histórico — relatório', '', `Gerado em ${agora()} por \`ingestao/gerar-historico.mjs\`. Não editar à mão.`, '',
  `Vínculos lidos: ${vinculos.length} · pares (lei, alteradora) propostos pelas ementas: ${pelaEmenta.length} · leis com alteradoras conhecidas ou candidatas: ${leis.size}`, '',
  '| Situação | Leis |', '|---|---|',
  `| histórico apurado, todas as alteradoras aplicadas | ${cont.completas} |`,
  `| histórico apurado, mas incompleto (alguma alteradora não aplicada por inteiro) | ${cont.incompletas} |`,
  `| ainda sem o texto da lei-base | ${cont.semTextoDaBase} |`,
  `| erro do leitor | ${cont.erro} |`, '',
  `Leis revogadas por inteiro, segundo os vínculos da fonte: ${Object.keys(auto.revogadas).length}`, '',
  `Vínculos com norma fora do catálogo do escopo (decretos, por exemplo): ${auto.foraDoCatalogo.length} · vínculos com datas invertidas (não aplicados): ${auto.datasInvertidas.length}`, ''];
if (comErro.length) L.push('## Erros do leitor', '', ...comErro.slice(0, 200).map((x) => `- ${x}`), '');
if (semBase.length) L.push('## Aguardando o texto da lei-base', '', semBase.length > 200 ? `Mostrando 200 de ${semBase.length}.` : '', '', ...semBase.slice(0, 200).map((x) => `- ${x}`), '');
await writeFile(path.join(DIR, 'RELATORIO.md'), L.join('\n'));
await writeFile(path.join(DIR, '_resumo.json'), JSON.stringify({ em: agora(), leis: leis.size, completas: cont.completas, incompletas: cont.incompletas, semTextoDaBase: cont.semTextoDaBase, erro: cont.erro }) + '\n');
console.log(`${agora()} histórico: ${cont.apuradas} lei(s) apurada(s) (${cont.completas} completas, ${cont.incompletas} incompletas), ${cont.semTextoDaBase} sem texto da base, ${cont.erro} com erro; ${cont.regravadas} arquivo(s) regravado(s).`);
