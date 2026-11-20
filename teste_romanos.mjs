// teste_romanos.mjs — incisos além de XXV ("XXVI –" … "XXXVIII –"). Antes, o 26º inciso virava o rótulo "26 –"
// e a lei inteira era acusada de rótulo que não confere (um inciso lido a mais/menos desloca todos os seguintes).
// Textos REAIS: LC 1.076/2026 (id 51486, fixtures/textos/agrup_*) e id 49557 (fixtures/textos/romanos_*, até XXXVIII).
// Sem rede. Uso: node teste_romanos.mjs
import fs from 'node:fs';
import { roman, romanToInt } from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const lerReg = (arq, id) => { const r = JSON.parse(fs.readFileSync(arq, 'utf8')); return Array.isArray(r) ? r.find((x) => x.idSapl === id) : r; };

ok('roman(26) = XXVI, roman(38) = XXXVIII, roman(49) = XLIX, roman(99) = XCIX', roman(26) === 'XXVI' && roman(38) === 'XXXVIII' && roman(49) === 'XLIX' && roman(99) === 'XCIX');
ok('romanToInt lê XXVI e XXXVIII', romanToInt('XXVI') === 26 && romanToInt('XXXVIII') === 38);
ok('os 25 primeiros não mudaram', roman(4) === 'IV' && roman(9) === 'IX' && roman(14) === 'XIV' && roman(19) === 'XIX' && roman(25) === 'XXV');

const t49557 = prepararTextoExtraido(fs.readFileSync('./fixtures/textos/romanos_49557.txt', 'utf8'));
const e49557 = estruturarNorma(t49557, lerReg('./fixtures/textos/romanos_49557.json', 49557));
ok('id 49557 (real, incisos até XXXVIII): sem "rotulo_nao_confere_com_a_origem"', !e49557.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
ok('id 49557 (real): existe o inciso "XXXVIII" na árvore (rótulo romano, não "38")', e49557.dispositivos.some((d) => /inc-XXXVIII$/.test(d.id || d.endereco || '')));
const t51486 = prepararTextoExtraido(fs.readFileSync('./fixtures/textos/agrup_51486.txt', 'utf8'));
const e51486 = estruturarNorma(t51486, lerReg('./fixtures/textos/agrup_registros.json', 51486));
ok('LC 1.076/2026 (real, 26º inciso): sem "rotulo_nao_confere_com_a_origem"', !e51486.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));

// negativo (sintético): inciso REALMENTE pulado continua acusado
const i = t49557.indexOf('XXVI –');
ok('(sintético) negativo: apagar o inciso "XXVI –" do texto real continua sendo acusado', i > 0 && estruturarNorma(t49557.slice(0, i) + t49557.slice(i).replace(/^XXVI\s*[–-]\s*[^\n]*\n/, ''), lerReg('./fixtures/textos/romanos_49557.json', 49557)).verificacao.motivos.some((m) => /rotulo_nao_confere|trecho_nao_localizado/.test(m)));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
