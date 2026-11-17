#!/usr/bin/env node
// debug-pagina.mjs — inspeciona o texto bruto (item a item, sem agrupamento
// de linha nem regex) de uma página de PDF já baixada, pra calibrar a
// extração do dopa-discovery.mjs sem precisar rodar o pipeline inteiro.
//
// Uso: node debug-pagina.mjs <caminho-do-pdf> [numero-da-pagina=1]

import { readFile } from 'node:fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const [, , caminhoPdf, paginaArg] = process.argv;
if (!caminhoPdf) {
  console.error('Uso: node debug-pagina.mjs <caminho-do-pdf> [numero-da-pagina]');
  process.exit(1);
}
const numeroPagina = parseInt(paginaArg || '1', 10);

const dados = new Uint8Array(await readFile(caminhoPdf));
const doc = await pdfjsLib.getDocument({ data: dados }).promise;
console.log(`Documento tem ${doc.numPages} página(s). Inspecionando página ${numeroPagina}.\n`);

const pagina = await doc.getPage(numeroPagina);
const conteudo = await pagina.getTextContent();

console.log(`${conteudo.items.length} item(ns) de texto bruto (x, y, conteúdo exato entre aspas):\n`);
for (const item of conteudo.items) {
  const y = item.transform[5].toFixed(1);
  const x = item.transform[4].toFixed(1);
  console.log(`  x=${x.padStart(7)} y=${y.padStart(7)}  ${JSON.stringify(item.str)}`);
}
