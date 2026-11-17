#!/usr/bin/env node
// ingestao/gerar-site.mjs
//
// Gera o arquivo de dados da página de consulta (docs/): um JSON compacto com
// o catálogo inteiro. Sem rede. Uso: node ingestao/gerar-site.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { lerJsonl, agora } from './sapl-io.mjs';

const NOMES = { 1: 'Lei Orgânica', 2: 'Emenda à Lei Orgânica', 6: 'Lei Complementar', 5: 'Lei' };
const ultimo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) ultimo.set(r.idSapl, r);
}
const situacao = existsSync('./dados/estruturado/_situacao.json') ? JSON.parse(await readFile('./dados/estruturado/_situacao.json', 'utf8')) : {};
const baixados = new Set((await lerJsonl('./dados/textos/sapl/_indice.jsonl')).filter((l) => l.situacao === 'baixado').map((l) => l.idSapl));

// colunas: id, tipo, número, data, ementa, texto (0 sem · 1 só na fonte · 2 baixado), estrutura (0 não · 1 aceita · 2 revisar), url do arquivo na fonte
const normas = [...ultimo.values()]
  .sort((a, b) => String(b.data).localeCompare(String(a.data)) || b.idSapl - a.idSapl)
  .map((r) => [r.idSapl, r.tipoSapl, r.numero, r.data, (r.ementa || '').replace(/\s+/g, ' ').trim(),
    baixados.has(r.idSapl) ? 2 : r.texto?.url ? 1 : 0,
    situacao[r.idSapl] === 'aceita' ? 1 : situacao[r.idSapl] === 'revisar' ? 2 : 0,
    r.texto?.url || '']);

await mkdir('./docs/dados', { recursive: true });
await writeFile('./docs/dados/catalogo.json', JSON.stringify({ geradoEm: agora(), tipos: NOMES, normas }) + '\n');
console.log(`${agora()} site: ${normas.length} normas em docs/dados/catalogo.json`);
