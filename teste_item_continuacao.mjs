// teste_item_continuacao.mjs — a linha de continuação de um ITEM ("1.", "2.") dentro de alínea
// tem de ficar no item, não colar na alínea. Texto REAL: LC 799/2016 (art. 39, inc. I, al. c) itens 1 e 2),
// extraído do SAPL da PGM. Sem rede. Uso: node teste_item_continuacao.mjs
import fs from 'node:fs';
import { parseMinuta } from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const txt = prepararTextoExtraido(fs.readFileSync('./fixtures/textos/lc799_2016.txt', 'utf8'));
const reg = JSON.parse(fs.readFileSync('./fixtures/textos/lc799_2016.json', 'utf8'));

const doc = parseMinuta(txt);
const achar = (n, f) => { if (f(n)) return n; for (const c of n.children || []) { const r = achar(c, f); if (r) return r; } return null; };
const item2 = doc.artigos.map((a) => achar(a, (n) => n.tipo === 'item' && /^altura de 52m/.test(n.texto))).find(Boolean);
ok('LC 799 (real): o item 2 de "c) para volumetria" existe', !!item2);
ok('LC 799 (real): a continuação "metros) do alinhamento da Av. Bento Gonçalves…" fica NO item 2', !!item2 && /até a profundidade de 60m \(sessenta metros\) do alinhamento da Av\. Bento Gonçalves e, no interior, de 18m/.test(item2.texto));
const alineaC = doc.artigos.map((a) => achar(a, (n) => n.tipo === 'alinea' && /^para volumetria:/.test(n.texto))).find(Boolean);
ok('LC 799 (real): a alínea c) fica só com "para volumetria:" (a continuação não cola nela)', !!alineaC && alineaC.texto.trim() === 'para volumetria:');
const r = estruturarNorma(txt, reg);
ok('LC 799 (real): sem "trecho_nao_localizado_na_origem"', !r.verificacao.motivos.includes('trecho_nao_localizado_na_origem'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
