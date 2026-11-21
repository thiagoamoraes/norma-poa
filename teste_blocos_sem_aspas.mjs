// teste_blocos_sem_aspas.mjs
//
// Rodada 30 (core + estruturador): blocos de redação alterada que as aspas não delimitam bem
// (PLANO-ALTERADORA-SEM-ASPAS.md; decisões 9 a 12 do mantenedor, 20/11/2026):
//  R1 fechamento pareado com a abertura · R2 bloco sem fechamento (fronteira inferida) · R3 cue plural e "$" ·
//  R4 cabeçalho com reticências sem aspa de abertura · detector de falso aceite (introdução forte sem bloco).
// Textos REAIS em fixtures/alteradoras-sem-aspas/ (extraídos do acervo, sem retoque); registros do catálogo em
// registros.json. O que for inventado leva "(sintético)". Sem rede. Uso: node teste_blocos_sem_aspas.mjs

import fs from 'node:fs';
import { detectNRCandidates, limparMarkdownLinks } from './norma-core.js';
import { estruturarNorma, introsDeAlteracaoSemBloco } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };
const DIR = './fixtures/alteradoras-sem-aspas';
const regs = JSON.parse(fs.readFileSync(`${DIR}/registros.json`, 'utf8'));
const carregar = (id) => {
  const texto = prepararTextoExtraido(fs.readFileSync(`${DIR}/${id}.txt`, 'utf8'));
  const reg = regs.find((r) => r.idSapl === id);
  return { texto, e: estruturarNorma(texto, reg), blocos: detectNRCandidates(limparMarkdownLinks(texto.trim())) };
};
const ids = (e) => e.dispositivos.map((d) => d.id).join(' ');
const motivo = (e, m) => e.verificacao.motivos.includes(m);

// --- R1: fechamento pareado -------------------------------------------------------------------------------
{
  const { e, blocos } = carregar(26970);
  ok('LC 293/1993 (real): a aspa simples de \'jetton\'. no fim da linha NÃO fecha o bloco; ele vai até o § 3º (1 bloco, fecha em aspa dupla)', blocos.length === 1 && blocos[0].endIdx - blocos[0].startIdx >= 10);
  ok('LC 293/1993: a lei-alvo NÃO vira dispositivo da alteradora (só art-1 a art-4) e o articulado é aceito (o único motivo, se houver, é o anexo não lido)', ids(e) === 'art-1 art-2 art-3 art-4' && e.verificacao.motivos.every((m) => m === 'anexo_nao_lido'));
  for (const [id, rot] of [[36136, 'LC 615/2009'], [35006, 'LC 575/2007']]) {
    const r = carregar(id);
    ok(`${rot} (real, guarda): aspas simples dentro do texto não quebram o bloco que fecha em (NR): 1 bloco, aceita, sem fronteira inferida`, r.blocos.length === 1 && r.blocos[0].semNR === false && r.e.verificacao.situacao === 'aceita' && !r.e.verificacao.metricas.fronteirasInferidas);
  }
}

// --- R2: bloco sem fechamento (fronteira INFERIDA: aplica, mas nunca aceita limpa) -----------------------------
{
  const casos = [[28859, 'LC 398/1997', 'media'], [29409, 'LC 417/1998', 'media'], [29528, 'LC 422/1998', 'media'], [29581, 'LC 425/1998', 'media'], [29705, 'LC 426/1998', 'baixa'], [27750, 'LC 329/1994', 'baixa'], [30711, 'LC 453/2000', 'media']];
  for (const [id, rot, conf] of casos) {
    const { e, blocos } = carregar(id);
    const inf = blocos.find((b) => b.sem_fecho);
    ok(`${rot} (real): bloco sem fechamento é delimitado, com confiança "${conf}", e a norma sai "a revisar" com o motivo (nunca aceita limpa)`, !!inf && inf.confianca === conf && e.verificacao.situacao === 'revisar' && motivo(e, 'bloco_sem_fechamento_de_aspas') && e.verificacao.metricas.fronteirasInferidas?.[0]?.confianca === conf);
  }
  ok('LC 398/1997 (real): a lei-alvo deixa de virar dispositivo da alteradora (art-1 art-2 art-3)', ids(carregar(28859).e) === 'art-1 art-2 art-3');
  const lc450 = carregar(30641);
  ok('LC 450/2000 (real): um bloco com fechamento normal e outro sem nenhum fecho — só o segundo é inferido (confiança baixa)', lc450.blocos.length === 2 && lc450.blocos.filter((b) => b.sem_fecho).length === 1 && lc450.blocos.find((b) => b.sem_fecho).confianca === 'baixa');
  const lc611 = estruturarNorma(fs.readFileSync('./lc611.txt', 'utf8'), JSON.parse(fs.readFileSync('./fixtures/sapl/registros_estrutura.json', 'utf8')).find((r) => r.tipoSapl === 6 && r.numero === '611'));
  ok('LC 611 (real, negativa): "§" e aspas citados no meio do texto NÃO viram bloco sem fechamento; segue aceita', !detectNRCandidates(fs.readFileSync('./lc611.txt', 'utf8')).some((b) => b.sem_fecho || b.sem_abertura) && lc611.verificacao.situacao === 'aceita');
}

// --- R3: cue no plural e "$" no lugar de "§" ------------------------------------------------------------------
{
  const { e, blocos } = carregar(29024);
  ok('EC 11/1997 (real): "seguintes redações" (plural) com "$ 5º" (OCR de "§ 5º") abre o bloco; a estrutura sai certa (art-1 art-2 art-3, 1 bloco)', blocos.length === 1 && ids(e) === 'art-1 art-2 art-3' && e.verificacao.situacao === 'aceita');
}

// --- R4: cabeçalho com reticências, sem aspa de abertura (decisão 11) -----------------------------------------------
{
  for (const [id, rot] of [[48226, 'LC 964/2022'], [48437, 'LC 1.011/2024'], [51463, 'LC 1.074/2026']]) {
    const { e, blocos } = carregar(id);
    const b = blocos.find((x) => x.sem_abertura);
    ok(`${rot} (real): bloco que abre com "Art. N ......" (sem aspa) é delimitado com confiança média; a norma sai "a revisar" com aspa_de_abertura_ausente`, !!b && b.confianca === 'media' && b.semNR === false && motivo(e, 'aspa_de_abertura_ausente') && e.verificacao.situacao === 'revisar');
  }
  const r5 = carregar(37945);
  ok('LC 685/2011 (real, negativa R5): cabeçalho sem pontos não delimita nada além dos blocos com aspas; segue aceita no articulado (o único motivo, se houver, é o anexo não lido)', !r5.blocos.some((b) => b.sem_abertura) && r5.e.verificacao.motivos.every((m) => m === 'anexo_nao_lido'));
  const sint = 'Art. 2º Fica alterado o art. 3º da Lei Complementar nº 12, de 1975, conforme segue:\n\nArt. 3º ...........................\n\n§ 1º Novo texto.\n\n..........................” (NR)\n\nArt. 3º Esta Lei entra em vigor.';
  ok('(sintético) cabeçalho com pontos cujo número é o do PRÓXIMO artigo da alteradora ("Art. 3º ......" logo depois do art. 2º) é ambíguo: nunca delimita', !detectNRCandidates(sint).some((b) => b.sem_abertura));
  const sint2 = 'Art. 2º Fica alterado o art. 7º da Lei Complementar nº 12, de 1975, conforme segue:\n\nArt. 7º ...........................\n\n§ 1º Novo texto.\n\nArt. 3º Esta Lei entra em vigor.';
  ok('(sintético) cabeçalho com pontos mas SEM fechamento ((NR) ou aspa): não inventa fim, nenhum bloco', !detectNRCandidates(sint2).some((b) => b.sem_abertura));
}

// --- detector de falso aceite (decisão 10) -------------------------------------------------------------------------
{
  const intro = { texto: 'Fica alterado o art. 1º da Lei Complementar nº 12, de 1975, conforme segue:' };
  ok('(sintético) introdução forte sem bloco lido é achada; com bloco (nrBloco) não; texto comum não', introsDeAlteracaoSemBloco([intro]).length === 1 && introsDeAlteracaoSemBloco([{ ...intro, nrBloco: {} }]).length === 0 && introsDeAlteracaoSemBloco([{ texto: 'Fica criado o Conselho, com as seguintes competências:' }]).length === 0);
  const anexo = carregar(35933);
  ok('LC 606/2008 (real): altera o Regime Urbanístico do Anexo 1.2 da LC 434 (tabela, sem bloco lido) — antes aceita em silêncio; agora vai a revisão com alteracao_sem_aspas_nao_delimitada', anexo.e.verificacao.situacao === 'revisar' && motivo(anexo.e, 'alteracao_sem_aspas_nao_delimitada'));
  for (const [id, rot, esperado] of [[33217, 'LC 504/2004', 'art-1 art-2'], [30297, 'LC 436/1999', 'art-1 art-2 art-3']]) {
    const r = carregar(id);
    ok(`${rot} (real, aspas gravadas como controle cp1252): o bloco é lido, a lei-alvo NÃO vira dispositivo da alteradora (${esperado}), aceita e sem o motivo`, r.blocos.length === 1 && ids(r.e) === esperado && r.e.verificacao.situacao === 'aceita' && !motivo(r.e, 'alteracao_sem_aspas_nao_delimitada'));
  }
  const c689 = estruturarNorma(prepararTextoExtraido(fs.readFileSync('./fixtures/textos/lc689_2012.txt', 'utf8')), JSON.parse(fs.readFileSync('./fixtures/sapl/registros_estrutura.json', 'utf8')).find((r) => r.idSapl === 38042));
  ok('LC 689/2012 (real, negativa): alteradora com bloco lido NÃO leva o motivo novo; segue aceita', c689.verificacao.situacao === 'aceita' && !motivo(c689, 'alteracao_sem_aspas_nao_delimitada'));
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
