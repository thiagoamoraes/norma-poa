// teste_agrupadores.mjs — título de agrupador em várias linhas / separado por linha em branco ou quebra de
// página, "CAPÍTULO ÚNICO", e frase que só COMEÇA por "Seção…/Título…" (não é agrupador). Decisão 23 do mantenedor,
// 20/11/2026. Textos REAIS do SAPL da PGM (fixtures/textos/agrup_*.txt). Sem rede. Uso: node teste_agrupadores.mjs
import fs from 'node:fs';
import { parseMinuta } from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/agrup_registros.json', 'utf8'));
const texto = (id) => prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/agrup_${id}.txt`, 'utf8'));
const grupos = (t) => parseMinuta(t).artigos.flatMap((a) => a.gruposAntes || []);
const motivos = (id) => estruturarNorma(texto(id), regs.find((r) => r.idSapl === id)).verificacao.motivos;

const g1 = grupos(texto(51486)).find((g) => g.tipo === 'capitulo' && g.numero === 'III');
ok('LC 1.076/2026 (real): título de 3 linhas fica inteiro no capítulo III', !!g1 && /PARCELAMENTO DO SOLO,\s+EDIFICAÇÕES E REGIME URBANÍSTICO$/.test(g1.titulo));
ok('LC 1.076/2026 (real): sem "trecho_nao_localizado_na_origem"', !motivos(51486).includes('trecho_nao_localizado_na_origem'));
const g2 = grupos(texto(49739)).find((g) => g.tipo === 'secao' && g.numero === 'III');
ok('LC 1.037/2025 (real): título depois de quebra de página ("Seção III" / "Das Competências") é lido', !!g2 && g2.titulo === 'Das Competências');
const g3 = grupos(texto(47599)).find((g) => g.numero === 'ÚNICO');
ok('LC 992/2023 (real): "CAPÍTULO ÚNICO" é agrupador (numero ÚNICO) com o título de 2 linhas', !!g3 && g3.tipo === 'capitulo' && /CRÉDITO NÃO TRIBUTÁRIO$/.test(g3.titulo));
for (const id of [50386, 43376, 39862]) {
  const gs = grupos(texto(id));
  ok(`id ${id} (real): nenhum "agrupador" com título que começa por minúscula ou pontuação (frase que só começa por Seção/Título)`, gs.every((g) => !/^[a-zà-ÿ,;.)]/.test(g.titulo || '')));
}
ok('LC 1.050/2025 (real): a linha da ementa "Seção IV do Capítulo II; e revoga…" fica na ementa', !motivos(50386).includes('trecho_nao_localizado_na_origem'));
ok('LC 915/2021 (real): a introdução partida "…Seção I do Capítulo III do / Título II da Lei…" fica no artigo', !motivos(43376).includes('trecho_nao_localizado_na_origem'));

// negativos (sintéticos): título que engoliria artigo/parágrafo, ou que não termina em artigo, fica como estava
const pre = 'LEI COMPLEMENTAR Nº 1\nEmenta do teste.\nO PREFEITO MUNICIPAL DE PORTO ALEGRE\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei Complementar:\n';
const tit = (corpo) => (grupos(parseMinuta(pre + corpo) && pre + corpo)[0] || {}).titulo;
ok('(sintético) título de 2 linhas sem artigo dentro é juntado', tit('CAPÍTULO I\nDAS DISPOSIÇÕES\nGERAIS\nArt. 1º Fica.') === 'DAS DISPOSIÇÕES GERAIS');
ok('(sintético) linha com "Art. 5" no meio NÃO é engolida pelo título', tit('CAPÍTULO I\nDAS DISPOSIÇÕES\nconforme o Art. 5 desta Lei\nArt. 1º Fica.') === 'DAS DISPOSIÇÕES');
ok('(sintético) mais de 3 linhas extras: fica só a 1ª linha, como antes', tit('CAPÍTULO I\nA\nB\nC\nD\nE\nArt. 1º Fica.') === 'A');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
