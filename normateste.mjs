/**
 * norma-teste.mjs — script de verificação rápida
 * Executa: node norma-teste.mjs
 *
 * Demonstra o fluxo: texto bruto → árvore estruturada → patch detectado
 */
import {
  parseMinuta, normalizar, detectNRCandidates,
  extrairRedacaoAlterada, parseLeiAlvoIndex, parseLeiAlvoAnotacoes,
  extrairCitacoesExternas, construirMapaNumeracaoOriginal,
  flat, visText, serializarArvore
} from './norma-core.js';

// ─── Lei-base fictícia (estrutura da LC 320/1994 simplificada) ────────────────

const LEI_BASE = `
LEI COMPLEMENTAR Nº 320, DE 2 DE MAIO DE 1994.

Dispõe sobre a denominação de logradouros públicos e dá outras providências.

Art. 1º Fica estabelecida a denominação de logradouros e equipamentos públicos, observado o disposto nesta Lei Complementar.

Art. 2º Os logradouros e equipamentos públicos podem receber a denominação de pessoas, datas e fatos históricos e geográficos ou outros reconhecidos pela comunidade.

§ 1º A denominação dos logradouros e equipamentos públicos deverá observar um percentual mínimo de 30% (trinta por cento) e um máximo de 70% (setenta por cento) para cada sexo, quando recair sobre nome de pessoas.

§ 2º Cada Vereador deverá observar, em relação às suas proposições, os percentuais referidos no parágrafo anterior.

Art. 3º Fica vedada a denominação de logradouros públicos e equipamentos públicos com nome de pessoa que tenha contra si ação julgada procedente em decisão transitada em julgado por crime de corrupção de qualquer espécie.

Art. 4º Esta Lei Complementar entra em vigor na data de sua publicação.
`.trim();

// ─── Lei alteradora fictícia (simplificada) ───────────────────────────────────

const LEI_ALTERADORA = `
LEI COMPLEMENTAR Nº 525, DE 15 DE JUNHO DE 2005.

Altera a Lei Complementar nº 320, de 2 de maio de 1994, que dispõe sobre a denominação de logradouros públicos.

Art. 1º O § 1º do art. 2º da Lei Complementar nº 320, de 2 de maio de 1994, passa a ter a seguinte redação:

"§ 1º A denominação dos logradouros e equipamentos públicos deverá observar um percentual mínimo de 30% (trinta por cento) e um máximo de 70% (setenta por cento) para cada sexo, quando recair sobre nome de pessoas. (NR)"

Art. 2º Fica acrescido o § 3º ao art. 2º da Lei Complementar nº 320, de 2 de maio de 1994, com a seguinte redação:

"§ 3º Não será permitido que mais de um logradouro ou mais de um equipamento público receba a denominação de uma mesma pessoa, data, fato histórico e geográfico ou outro reconhecido pela comunidade."

Art. 3º Esta Lei Complementar entra em vigor na data de sua publicação.
`.trim();

// ─── 1. Parseia a lei-base ────────────────────────────────────────────────────
console.log("=== 1. Parsing da lei-base ===\n");
const docBase = parseMinuta(LEI_BASE);
normalizar(docBase, (regra, alvo, antes, depois) => {
  console.log(`  [NORM] ${alvo}: ${regra}`);
});
console.log(`Tipo: ${docBase.tipoAto} | Número: ${docBase.numero} | Ano: ${docBase.ano}`);
console.log(`Ementa: ${visText(docBase.ementa)}`);
console.log(`Artigos: ${docBase.artigos.length}`);

// ─── 2. Parseia a lei alteradora e detecta blocos NR ─────────────────────────
console.log("\n=== 2. Detecção de blocos NR na lei alteradora ===\n");
const candidatos = detectNRCandidates(LEI_ALTERADORA);
console.log(`Blocos NR detectados: ${candidatos.length}`);
candidatos.forEach((c, i) => {
  console.log(`  Bloco ${i+1}: linhas ${c.startIdx}–${c.endIdx}${c.semNR ? " (sem (NR) explícito)" : " (com (NR))"}`);
  console.log(`  Preview: ${c.preview}`);
});

// ─── 3. Parseia a lei alteradora com os blocos NR isolados ────────────────────
console.log("\n=== 3. Parsing da lei alteradora ===\n");
const docAlteradora = parseMinuta(LEI_ALTERADORA, candidatos);
normalizar(docAlteradora);
console.log(`Artigos da lei alteradora: ${docAlteradora.artigos.length}`);
docAlteradora.artigos.forEach((a, i) => {
  console.log(`\n  Art. ${i+1}: ${visText(a)}`);
  if (a.nrBloco) {
    console.log(`  ↳ Bloco NR (temNR=${a.nrBloco.temNR}):`);
    a.nrBloco.artigos.forEach(n => {
      console.log(`    [${n.desFixo}] ${visText(n)}`);
      n.children.forEach(c => console.log(`      [${c.desFixo}] ${visText(c)}`));
    });
  }
});

// ─── 4. Extrai citações (qual dispositivo cada artigo cita) ───────────────────
console.log("\n=== 4. Citações a dispositivos ===\n");
docAlteradora.artigos.forEach((a, i) => {
  const cits = extrairCitacoesExternas(visText(a));
  if (cits.length) {
    console.log(`  Art. ${i+1} cita:`);
    cits.forEach(c => console.log(`    "${c.raw}" → chave: "${c.chave}"`));
  }
});

// ─── 5. Índice da lei-base (resolve chaves de citação) ───────────────────────
console.log("\n=== 5. Índice da lei-base ===\n");
const idx = parseLeiAlvoIndex(LEI_BASE);
Object.entries(idx).forEach(([chave, texto]) => {
  console.log(`  "${chave}":`);
  console.log(`    ${texto.slice(0,80)}${texto.length>80?"…":""}`);
});

// ─── 6. Mapa de numeração original ───────────────────────────────────────────
console.log("\n=== 6. Mapa de numeração (endereço → id) ===\n");
const mapa = construirMapaNumeracaoOriginal(docBase.artigos);
Object.entries(mapa).forEach(([chave, id]) => console.log(`  ${chave} → ${id}`));

// ─── 7. Anotações do texto compilado ─────────────────────────────────────────
console.log("\n=== 7. Anotações marginais de compilação ===\n");
// Simula texto já compilado com anotações (como o que o Leis.org exibe)
const COMPILADO_COM_ANOTACOES = `
Art. 2º Os logradouros e equipamentos públicos podem receber a denominação...

§ 1º A denominação dos logradouros... (Redação dada pela Lei Complementar nº 514/2004)

§ 2º Cada Vereador deverá observar... (Redação acrescida pela Lei Complementar nº 514/2004)

§ 3º Não será permitido que mais de um logradouro... (Redação dada pela Lei Complementar nº 525/2005)
`.trim();
const anot = parseLeiAlvoAnotacoes(COMPILADO_COM_ANOTACOES);
Object.entries(anot).forEach(([chave, anotacao]) => {
  console.log(`  "${chave}": ${anotacao}`);
});

console.log("\n=== Concluído ===");
