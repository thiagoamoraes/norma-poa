#!/usr/bin/env node
// ingestao/relatorio-cobertura.mjs
//
// Lê dados/catalogo/sapl/tipo-*.jsonl (saída do catalogo-sapl.mjs) e escreve
// dados/catalogo/COBERTURA.md: integridade da coleta, cobertura de texto por
// tipo e década, lacunas de numeração e a fila de normas sem texto.
// Sem rede. Uso: node ingestao/relatorio-cobertura.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESCOPO_INICIAL, lacunasDeSequencia, compactarFaixas } from './sapl-comum.mjs';

const DIR = './dados/catalogo/sapl';
const SAIDA = './dados/catalogo/COBERTURA.md';
const NOMES = { 1: 'Lei Orgânica', 2: 'Emenda à Lei Orgânica', 6: 'Lei Complementar', 5: 'Lei ordinária' };

const estado = existsSync(path.join(DIR, '_estado.json'))
  ? JSON.parse(await readFile(path.join(DIR, '_estado.json'), 'utf8')) : { tipos: {} };

const L = [];
L.push('# Cobertura do catálogo (fonte: SAPL da PGM)', '');
L.push(`Gerado em ${new Date().toISOString()} por \`ingestao/relatorio-cobertura.mjs\`. Não editar à mão.`, '');

const arquivos = (await readdir(DIR)).filter((f) => /^tipo-\d+\.jsonl$/.test(f)).sort();
const semTextoGeral = [];

L.push('## Integridade da coleta', '');
L.push('| Tipo | Registros únicos | Total declarado pela API | Linhas repetidas | Coleta |', '|---|---|---|---|---|');
const porTipo = {};
for (const f of arquivos) {
  const tipo = Number(/\d+/.exec(f)[0]);
  const linhas = (await readFile(path.join(DIR, f), 'utf8')).split('\n').filter(Boolean);
  const mapa = new Map();
  for (const l of linhas) { const r = JSON.parse(l); mapa.set(r.idSapl, r); }
  porTipo[tipo] = [...mapa.values()];
  const et = estado.tipos[tipo] || {};
  const situ = et.concluido ? 'concluída' : `parcial (próxima página ${et.proximaPagina ?? '?'} de ${et.totalPaginas ?? '?'})`;
  L.push(`| ${NOMES[tipo] || ESCOPO_INICIAL[tipo] || tipo} | ${mapa.size} | ${et.totalRegistros ?? '?'} | ${linhas.length - mapa.size} | ${situ} |`);
}
L.push('', 'Se "registros únicos" ≠ "total declarado" numa coleta concluída, a base mudou durante a coleta: recolher de novo o tipo.', '');

L.push('## Texto disponível por tipo e década', '');
for (const [tipo, regs] of Object.entries(porTipo)) {
  L.push(`### ${NOMES[tipo] || tipo}`, '', '| Década | Normas | Arquivo anexado | Link SIREL | Sem texto | % sem texto |', '|---|---|---|---|---|---|');
  const dec = new Map();
  for (const r of regs) {
    const d = Math.floor(r.ano / 10) * 10;
    const c = dec.get(d) || { n: 0, arquivo: 0, link_observacao: 0, sem_texto: 0 };
    c.n++; c[r.texto.situacao]++; dec.set(d, c);
    if (r.texto.situacao === 'sem_texto') semTextoGeral.push(r);
  }
  const tot = { n: 0, arquivo: 0, link_observacao: 0, sem_texto: 0 };
  for (const d of [...dec.keys()].sort((a, b) => a - b)) {
    const c = dec.get(d);
    for (const k of Object.keys(tot)) tot[k] += c[k];
    L.push(`| ${d} | ${c.n} | ${c.arquivo} | ${c.link_observacao} | ${c.sem_texto} | ${Math.round((100 * c.sem_texto) / c.n)}% |`);
  }
  L.push(`| **Total** | **${tot.n}** | **${tot.arquivo}** | **${tot.link_observacao}** | **${tot.sem_texto}** | **${tot.n ? Math.round((100 * tot.sem_texto) / tot.n) : 0}%** |`, '');

  const formatos = {};
  for (const r of regs) if (r.texto.formato) formatos[r.texto.formato] = (formatos[r.texto.formato] || 0) + 1;
  L.push(`Formatos dos arquivos: ${Object.entries(formatos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}`, '');

  // Numeração: a série recomeça em regimes antigos (Intendência etc.), então
  // a lacuna é medida por rótulo-base (texto do rótulo antes de " nº").
  const series = new Map();
  for (const r of regs) {
    const base = (r.rotulo || '').split(' nº')[0];
    (series.get(base) || series.set(base, []).get(base)).push(r.numero);
  }
  L.push('Lacunas de numeração (por série):', '');
  for (const [base, nums] of series) {
    const l = lacunasDeSequencia(nums);
    const rep = nums.length - new Set(nums).size;
    L.push(`- **${base}** — ${nums.length} registros, nº ${l.minimo}–${l.maximo}; faltam ${l.faltantes.length}${l.faltantes.length ? `: ${compactarFaixas(l.faltantes).slice(0, 600)}` : ''}${rep ? `; ${rep} número(s) repetido(s)` : ''}${l.naoNumericos.length ? `; não numéricos: ${l.naoNumericos.slice(0, 10).join(', ')}` : ''}`);
  }
  L.push('');
}

L.push('## Normas sem texto no SAPL', '');
L.push(`Total: ${semTextoGeral.length}. A lista completa está em \`dados/catalogo/sem-texto.tsv\`.`, '');
const tsv = ['idSapl\ttipo\tnumero\tdata\tementa']
  .concat(semTextoGeral
    .sort((a, b) => a.tipoSapl - b.tipoSapl || String(b.data).localeCompare(String(a.data)))
    .map((r) => [r.idSapl, NOMES[r.tipoSapl] || r.tipoSapl, r.numero, r.data, (r.ementa || '').replace(/\s+/g, ' ').trim()].join('\t')));
await writeFile('./dados/catalogo/sem-texto.tsv', tsv.join('\n') + '\n');
await writeFile(SAIDA, L.join('\n') + '\n');
console.log(`escrito ${SAIDA} (${Object.values(porTipo).reduce((s, r) => s + r.length, 0)} normas; ${semTextoGeral.length} sem texto)`);
