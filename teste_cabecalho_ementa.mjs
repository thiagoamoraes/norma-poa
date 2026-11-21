// teste_cabecalho_ementa.mjs — decisão 52: o carimbo de processo ("PROC. Nº 0541/24", "PELO/PLCE/PLCL Nº …"), o timbre e a EPÍGRAFE ("EMENDA À LEI
// ORGÂNICA Nº 51, DE 28 DE AGOSTO DE 2024.") NÃO fazem parte da ementa. Antes, o campo ementa de toda norma começava por eles ("PELO Nº 004/24 EMENDA À
// LEI ORGÂNICA Nº 51, DE 28 DE AGOSTO DE 2024. Inclui inc. III…"). Agora `parseLeiPublicada` os separa em `doc.cabecalhoTexto` e a ementa fica só com o
// texto da ementa; o estruturador conserva `cabecalhoTexto` (entra na conferência de conservação). Sem epígrafe reconhecível, nada é cortado.
// Textos REAIS do SAPL da PGM (dados/textos/sapl/<id>.txt). Sem rede. Uso: node teste_cabecalho_ementa.mjs
import fs from 'node:fs';
import * as c from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const ler = (id) => prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8'));
const pub = (id) => c.parseLeiPublicada(ler(id));
const em = (d) => c.visText(d.ementa);

const a = pub(49145);
ok('EC 51/2024 (real, id 49145): o cabeçalho separado é "PELO Nº 004/24 EMENDA À LEI ORGÂNICA Nº 51, DE 28 DE AGOSTO DE 2024." e a ementa começa em "Inclui inc. III…"', /^PELO N[º°] 004\/24 EMENDA À LEI ORG[ÂA]NICA N[º°] 51, DE 28 DE AGOSTO DE 2024\.$/.test(a.cabecalhoTexto || '') && /^Inclui inc\. III/.test(em(a)));
const b = pub(47888);
ok('LC 1.003/2024 (real, id 47888): "PLCE Nº 025/23 LEI COMPLEMENTAR Nº 1003, DE 5 DE JANEIRO DE 2024." sai da ementa ("Altera o inc. II do § 1º do art. 63…")', /^PLCE/.test(b.cabecalhoTexto || '') && /^Altera o inc\. II/.test(em(b)));
const d = pub(51966);
ok('Lei 14.693/2026 (real, id 51966): "LEI Nº 14.693, DE 12 DE NOVEMBRO DE 2026." sai da ementa ("Denomina…")', /^LEI N[º°] 14\.693, DE 12 DE NOVEMBRO DE 2026\.$/.test(d.cabecalhoTexto || '') && /^Denomina/.test(em(d)));
const e = pub(38041);
ok('LC 688/2012 (real, id 38041; OCR "15 DEFEVEREIRO DE 2012."): a data com OCR é consumida até o ano e a ementa começa em "Altera a ementa…"', /DE 2012\.$/.test(e.cabecalhoTexto || '') && /^Altera a ementa/.test(em(e)));
const f = pub(40062);
ok('LC 762/2015 (real, id 40062; resíduo do SIREL "(2807 bytes) Alegre" do brasão antes da epígrafe): cortado junto, ementa começa em "Cria o Fundo…"', /LEI COMPLEMENTAR N[º°] 762/.test(f.cabecalhoTexto || '') && /^Cria o Fundo/.test(em(f)));
const g = pub(17878);
ok('LC 12/1975 compilada (real, id 17878): "LEI COMPLEMENTAR Nº 12 (ALTERAÇÕES INSERIDAS NO TEXTO ATÉ A LC 702/12)" é cabeçalho; ementa "Institui posturas…"', /^LEI COMPLEMENTAR N[º°] 12/.test(g.cabecalhoTexto || '') && /^Institui posturas/.test(em(g)));
const h = pub(21359);
ok('negativo (real, id 21359; OCR sem epígrafe legível): nada é cortado e a ementa fica como estava', !h.cabecalhoTexto);
const est = estruturarNorma(ler(49145), null);
ok('estruturação da EC 51 (real): `cabecalhoTexto` gravado, ementa limpa, norma segue aceita (a conservação de texto inclui o cabeçalho)', /EMENDA À LEI ORG[ÂA]NICA N[º°] 51/.test(est.cabecalhoTexto || '') && /^Inclui inc\. III/.test(est.ementa) && est.verificacao.situacao === 'aceita');
ok('(sintético) negativo: epígrafe depois de palavra real da ementa (não é carimbo) não corta', c.separarCabecalhoDaEmenta('Dispõe sobre a revogação da LEI COMPLEMENTAR Nº 43, DE 21 DE JULHO DE 1979.').cabecalho === '');
ok('(sintético) negativo: se a epígrafe é a única coisa que há, a ementa não fica vazia', c.separarCabecalhoDaEmenta('PLCE Nº 025/23 LEI COMPLEMENTAR Nº 1003, DE 5 DE JANEIRO DE 2024.').cabecalho === '');
ok('(sintético) epígrafe longe do começo (mais de 300 caracteres) não corta', c.separarCabecalhoDaEmenta('x'.repeat(320) + ' LEI COMPLEMENTAR Nº 1, DE 1 DE JANEIRO DE 2000. Altera.').cabecalho === '');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
