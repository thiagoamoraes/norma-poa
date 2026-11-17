// teste_dopa_discovery.mjs — roda a extração contra cadernos reais do DOPA
// (sem rede) e confere contra gabaritos montados à mão a partir do texto de
// cada PDF.
//
// Uso: node teste_dopa_discovery.mjs [exe6179.pdf] [leg6171.pdf] [exe6180.pdf] [leg6112.pdf] [leg6158.pdf]
// Argumento ausente ou arquivo inexistente → aquela seção é PULADA (não
// falha): a API só lista os últimos 5 dias, então caderno velho some do
// cadernos-baixados/. Guarde os PDFs de gabarito fora dessa pasta.

import { existsSync } from 'node:fs';
import {
  extrairEntradasIndice, interpretarCabecalho, ehRotuloNaoNorma, agruparPorLinha,
} from './dopa-discovery.mjs';

const [, , pdfExe, pdfLeg, pdfExe6180, pdfLeg6112, pdfLeg6158] = process.argv;
let falhas = 0;
let total = 0;
let puladas = 0;
const ok = (desc, cond, extra = '') => {
  total++;
  if (!cond) falhas++;
  console.log(`  ${cond ? '✓' : '✗ FALHOU'}  ${desc}${!cond && extra ? '\n      ' + extra : ''}`);
};
const linha = (t) => console.log(`\n═══ ${t} ═══`);
const temArquivo = (p, rotulo) => {
  if (p && existsSync(p)) return true;
  puladas++;
  console.log(`\n═══ ${rotulo} ═══\n  ⊘ PULADO — arquivo não encontrado: ${p ?? '(não informado)'}`);
  return false;
};

const TIPOS_EXE = ['Lei Complementar', 'Lei'];
const TIPOS_LEG = [
  'Lei Complementar', 'Lei', 'Resolução de Mesa', 'Resolução',
  'Decreto Legislativo', 'Emenda à Lei Orgânica', 'Ordem de Serviço',
];

// ─── Unidade: interpretarCabecalho() ────────────────────────────────────────
linha('interpretarCabecalho() — variantes reais + republicação');
{
  const c = (t) => interpretarCabecalho(t);
  ok('padrão Executivo', c('LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026')?.numero === '14.663');
  ok('LC com ponto final', c('LEI COMPLEMENTAR Nº 1.080, DE 18 DE AGOSTO DE 2026.')?.tipoAto === 'Lei Complementar');
  ok('Ordem de Serviço Nº/ANO (sem data)',
    c('ORDEM DE SERVIÇO Nº 13/2026')?.tipoAto === 'Ordem de Serviço' &&
    c('ORDEM DE SERVIÇO Nº 13/2026')?.ano === '2026' &&
    c('ORDEM DE SERVIÇO Nº 13/2026')?.numero === '13');
  ok('Resolução sem vírgula após o número', c('RESOLUÇÃO Nº 3.021 DE 25 DE AGOSTO DE 2026.')?.numero === '3.021');
  ok('typo "Nº DE 3.025"', c('RESOLUÇÃO Nº DE 3.025, DE 01 DE SETEMBRO DE 2026.')?.numero === '3.025');
  ok('Resolução de Mesa não vira "Resolução"', c('RESOLUÇÃO DE MESA Nº 674, DE 20 DE AGOTO DE 2026.')?.tipoAto === 'Resolução de Mesa');
  ok('Decreto Legislativo não vira "Decreto"', c('DECRETO LEGISLATIVO Nº 12, DE 3 DE MARÇO DE 2026')?.tipoAto === 'Decreto Legislativo');
  ok('Emenda à Lei Orgânica', c('EMENDA À LEI ORGÂNICA Nº 45, DE 3 DE MARÇO DE 2026')?.tipoAto === 'Emenda à Lei Orgânica');
  ok('ementa longa NÃO é cabeçalho curto',
    c('LEI Nº 14.655, DE 21 DE SETEMBRO DE 2026, que "inclui as efemérides Dia do Arroio') === null);
  ok('ementa de Ordem de Serviço NÃO é cabeçalho',
    c('ORDEM DE SERVIÇO Nº 13/2026, que dispõe sobre o procedimento de devolução dos') === null);
  ok('linha "Para visualizar..." NÃO é cabeçalho',
    c('Para visualizar, na íntegra, a LEI COMPLEMENTAR Nº 1.080, DE 18 DE AGOSTO DE 2026,') === null);
  ok('citação no meio de frase NÃO é cabeçalho',
    c('no Anexo da Lei nº 10.904, de 31 de maio de 2010 – Calendário') === null);
  ok('citação isolada com data numérica NÃO é cabeçalho', c('Lei nº 6.309, de 28/12/1988') === null);
  ok('data com ordinal "1º DE MARÇO" é aceita', c('LEI Nº 100, DE 1º DE MARÇO DE 2026')?.dataExtenso === '1º DE MARÇO DE 2026');
  ok('"ANEXOS I e II do DECRETO Nº ..." NÃO é cabeçalho de decreto',
    c('ANEXOS I e II do DECRETO Nº 23.968, DE 25 DE SETEMBRO DE 2026') === null);

  const os12 = c('ORDEM DE SERVIÇO Nº 12 - 2026');
  ok('Ordem de Serviço com HÍFEN "Nº 12 - 2026" (visto no caderno 6158)', os12?.tipoAto === 'Ordem de Serviço' && os12?.numero === '12' && os12?.ano === '2026', JSON.stringify(os12));
  ok('Ordem de Serviço com travessão "Nº 12 – 2026"', c('ORDEM DE SERVIÇO Nº 12 – 2026')?.numero === '12');
  ok('"RESOLUÇÃO Nº 3.013, DE 20 DE JULHO DE 2026." (Resolução real)', c('RESOLUÇÃO Nº 3.013, DE 20 DE JULHO DE 2026.')?.numero === '3.013');

  const r1 = c('LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026 – REPUBLICAÇÃO');
  ok('REPUBLICAÇÃO após o número: cabeçalho ainda reconhecido + flag',
    r1?.numero === '14.663' && r1?.republicacaoNoCabecalho === true && r1?.dataExtenso === '21 DE SETEMBRO DE 2026',
    JSON.stringify(r1));
  const r2 = c('LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026 (REPUBLICAÇÃO)');
  ok('(REPUBLICAÇÃO) entre parênteses', r2?.republicacaoNoCabecalho === true && r2?.numero === '14.663', JSON.stringify(r2));
  const r3 = c('REPUBLICAÇÃO - LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026');
  ok('REPUBLICAÇÃO antes do tipo', r3?.republicacaoNoCabecalho === true && r3?.tipoAto === 'Lei', JSON.stringify(r3));
  ok('sem marcador → flag false', c('LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026')?.republicacaoNoCabecalho === false);
}

// ─── Unidade: agruparPorLinha() — coordenadas reais do dump do caderno 6179 ─
linha('agruparPorLinha() — ordem por x e espaço perdido (dados do dump real)');
{
  const it = (str, x, y, width, height = 10) => ({ str, width, height, transform: [1, 0, 0, 1, x, y] });
  // Linha da ementa da Lei 14.663 como o PDF a entrega (MEDIDAS REAIS do
  // caderno 6179, pág. 1, y≈360): itens FORA da ordem de leitura, item " " com
  // largura absurda (64.8) e altura 0, e SEM item de espaço entre
  // "Nº 14.663," e "DE 21…" (o vão real ali é 3,87pt, corpo 12).
  const l1 = agruparPorLinha([
    it('', 34.4, 360, 0, 0), it('LEI', 34.4, 360, 18.7, 12), it(' ', 53.1, 360, 64.8, 0),
    it('DE 21 DE SETEMBRO DE 2026, que "estabelece', 117.8, 360, 443.1, 12),
    it('Nº 14.663,', 56.9, 360, 57.1, 12),
  ]);
  ok('itens fora de ordem são reordenados por x e o espaço entre "14.663," e "DE" é recuperado',
    l1[0].texto === 'LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026, que "estabelece', JSON.stringify(l1[0].texto));
  // "link" + "a seguir": vão real ≈ 0,28 do corpo (visto no caderno 6158).
  const l2 = agruparPorLinha([it('acesse o ', 10, 5, 42), it('link', 52, 5, 18), it('a seguir', 72.8, 5, 40)]);
  ok('"link" + "a seguir" com vão de 0,28 do corpo vira "link a seguir" (antes: "linka seguir")', l2[0].texto === 'acesse o link a seguir', l2[0].texto);
  const l3 = agruparPorLinha([it('PORT', 10, 5, 30), it('O', 40.3, 5, 8)]);   // vão 0,03 do corpo = mesma palavra
  ok('fragmentos de uma MESMA palavra (vão ~0) NÃO ganham espaço', l3[0].texto === 'PORTO', l3[0].texto);
  const l4 = agruparPorLinha([it('a', 10, 5, 5), it(' ', 15, 5, 2.5), it('b', 17.5, 5, 5)]);
  ok('item de espaço explícito não gera espaço duplicado', l4[0].texto === 'a b', l4[0].texto);
}

// ─── Unidade: ehRotuloNaoNorma() — contextos REAIS de links sem cabeçalho ──
linha('ehRotuloNaoNorma() — rótulos reais de anexo/edital vs. controles negativos');
{
  const reais = [
    ['Porto Alegre, 25 de setembro de 2026.', 'FÁBIO BANDEIRA MACHADO, Secretário Municipal de Cultura, em exercício.', 'EDITAL COMPLETO'],
    ['ANEXO I: Linha 1'],
    ['ANEXOS I e II do DECRETO Nº 23.968, DE 25 DE SETEMBRO DE 2026'],
    ['Anexo - Lista de Isenção'],
    ['Cronograma do Edital - Retificado'],
    ['Resultado Preliminar da Fase de Seleção'],
    ['ANEXO VI: DECLARAÇÃO DE MULHER E/OU PESSOA TRANS NA FUNÇÃO DE ROTEIRO, DIREÇÃO OU', 'PRODUÇÃO'],
    ['ANEXO ÚNICO - Lista do Resultado da Avaliação dos Cotistas Raciais'],
    ['JHONNY PRADO SILVA, Procurador-Geral do Município.', 'Anexo - Edital na Íntegra'],
  ];
  reais.forEach((ctx) => ok(`anexo/edital: ${ctx[ctx.length - 1].slice(0, 55)}`, ehRotuloNaoNorma(ctx) === true));
  ok('controle negativo: link após texto qualquer NÃO é anexo',
    ehRotuloNaoNorma(['Para visualizar, na íntegra, o DECRETO LEGISLATIVO X, acesse o link a seguir:', 'DEC. LEG. 12/2026']) === false);
  ok('controle negativo: contexto vazio NÃO é anexo', ehRotuloNaoNorma([]) === false);
}

// ─── Executivo 6179 ─────────────────────────────────────────────────────────
if (temArquivo(pdfExe, 'Executivo · edição 7853 (6179)')) {
  linha('Executivo · edição 7853 (6179) — 10 leis esperadas');
  const r = await extrairEntradasIndice(pdfExe, TIPOS_EXE);
  const esperado = [
    ['14.663', '628957'], ['14.655', '628971'], ['14.658', '628974'],
    ['14.659', '628980'], ['14.662', '628983'], ['14.656', '628985'],
    ['14.661', '628989'], ['14.660', '628991'], ['14.657', '628995'],
    ['14.654', '628996'],
  ];
  ok(`10 entradas (veio ${r.entradas.length})`, r.entradas.length === 10);
  esperado.forEach(([num, id], i) => {
    const e = r.entradas[i];
    ok(`Lei ${num} → ...6179_ce_${id}_1.pdf`,
      e?.numero === num && e?.tipoAto === 'Lei' && e?.linkNorma.endsWith(`6179_ce_${id}_1.pdf`) && e?.ano === '2026',
      JSON.stringify(e));
  });
  ok('nenhuma marcada como republicação', r.entradas.every((e) => !e.isRepublicacao));
  ok('anexo do edital (628967) contado como anexo, não como lei nem como "desconhecido"',
    r.anexosEditais === 1 && r.semCabecalho.length === 0, JSON.stringify({ a: r.anexosEditais, s: r.semCabecalho }));
}

// ─── Executivo 6180 (gabarito conferido de forma independente) ─────────────
if (temArquivo(pdfExe6180, 'Executivo · edição 7854 (6180)')) {
  linha('Executivo · edição 7854 (6180) — 1 LC + 4 decretos (fora de escopo) + 18 anexos = 23 links');
  const r = await extrairEntradasIndice(pdfExe6180, TIPOS_EXE);
  ok(`1 entrada (veio ${r.entradas.length})`, r.entradas.length === 1);
  ok('é a LC 1.075/2026 → ...6180_ce_629213_1.pdf',
    r.entradas[0]?.tipoAto === 'Lei Complementar' && r.entradas[0]?.numero === '1.075' &&
    r.entradas[0]?.linkNorma.endsWith('6180_ce_629213_1.pdf'), JSON.stringify(r.entradas[0]));
  ok('4 decretos contados como fora de escopo', r.foraDeEscopo.Decreto === 4, JSON.stringify(r.foraDeEscopo));
  ok('18 anexos de edital', r.anexosEditais === 18, String(r.anexosEditais));
  ok('nenhum link "desconhecido"', r.semCabecalho.length === 0, JSON.stringify(r.semCabecalho));
  const totalLinks = r.entradas.length + Object.values(r.foraDeEscopo).reduce((a, b) => a + b, 0) + r.anexosEditais + r.semCabecalho.length;
  ok('soma das categorias = 23 (contagem independente de URLs no PDF)', totalLinks === 23, String(totalLinks));
}

// ─── Legislativo 6171 ───────────────────────────────────────────────────────
if (temArquivo(pdfLeg, 'Legislativo · edição 7848 (6171)')) {
  linha('Legislativo · edição 7848 (6171) — 1 LC + 2 OS + 9 resoluções + 1 R. Mesa');
  const r = await extrairEntradasIndice(pdfLeg, TIPOS_LEG);
  const esperado = [
    ['Lei Complementar', '1.080', '627762'],
    ['Ordem de Serviço', '13', '627740'],
    ['Ordem de Serviço', '14', '627747'],
    ['Resolução', '3.019', '627724'],
    ['Resolução de Mesa', '674', '627725'],
    ['Resolução', '3.021', '627727'],
    ['Resolução', '3.020', '627751'],
    ['Resolução', '3.022', '627758'],
    ['Resolução', '3.023', '627760'],
    ['Resolução', '3.026', '627761'],
    ['Resolução', '3.024', '627765'],
    ['Resolução', '3.025', '627768'],
    ['Resolução', '3.027', '627770'],
  ];
  ok(`13 entradas (veio ${r.entradas.length})`, r.entradas.length === 13);
  esperado.forEach(([tipo, num, id], i) => {
    const e = r.entradas[i];
    ok(`${tipo} ${num} → ...6171_cl_${id}_1.pdf`,
      e?.tipoAto === tipo && e?.numero === num && e?.linkNorma.endsWith(`6171_cl_${id}_1.pdf`),
      JSON.stringify(e));
  });
  ok('nenhuma marcada como republicação', r.entradas.every((e) => !e.isRepublicacao));
  ok('nenhum link desconhecido no Legislativo', r.semCabecalho.length === 0, JSON.stringify(r.semCabecalho));
}

// ─── Legislativo 6112 (Lei em REPUBLICAÇÃO + 14 resoluções) ────────────────
if (temArquivo(pdfLeg6112, 'Legislativo · edição 7811 (6112)')) {
  linha('Legislativo · edição 7811 (6112) — Lei 14.504 (REPUBLICAÇÃO no índice) + 14 Resoluções');
  const r = await extrairEntradasIndice(pdfLeg6112, TIPOS_LEG);
  const esperado = [
    ['Lei', '14.504', '620603'], ['Resolução', '3.006', '620602'], ['Resolução', '3.005', '620606'],
    ['Resolução', '3.007', '620608'], ['Resolução', '3.009', '620609'], ['Resolução', '3.010', '620610'],
    ['Resolução', '3.008', '620612'], ['Resolução', '3.011', '620613'], ['Resolução', '3.012', '620615'],
    ['Resolução', '3.013', '620617'], ['Resolução', '3.014', '620618'], ['Resolução', '3.015', '620619'],
    ['Resolução', '3.016', '620620'], ['Resolução', '3.017', '620623'], ['Resolução', '3.018', '620627'],
  ];
  ok(`15 entradas (veio ${r.entradas.length})`, r.entradas.length === 15);
  esperado.forEach(([tipo, num, id], i) => {
    const e = r.entradas[i];
    ok(`${tipo} ${num} → ...6112_cl_${id}_1.pdf`, e?.tipoAto === tipo && e?.numero === num && e?.linkNorma.endsWith(`6112_cl_${id}_1.pdf`), JSON.stringify(e));
  });
  ok('Lei 14.504: REPUBLICAÇÃO detectada — o marcador está no FIM DA EMENTA do índice (não no cabeçalho curto), sinal "bloco"',
    r.entradas[0]?.isRepublicacao === true && r.entradas[0]?.sinalRepublicacao === 'bloco');
  ok('as 14 Resoluções NÃO são marcadas como republicação (o marcador da Lei não vaza pro bloco seguinte)',
    r.entradas.slice(1).every((e) => e.isRepublicacao === false));
  ok('Resolução 3.013: cabeçalho no fim da pág. 3 e link no topo da pág. 4 — casados mesmo com o rodapé/cabeçalho de página no meio',
    r.entradas[9]?.numero === '3.013' && r.entradas[9]?.linkNorma.endsWith('620617_1.pdf'));
  ok('nenhum link desconhecido, nenhum anexo', r.semCabecalho.length === 0 && r.anexosEditais === 0);
}

// ─── Legislativo 6158 (Ordem de Serviço 12/2026, índice com hífen) ──────────
if (temArquivo(pdfLeg6158, 'Legislativo · edição 7839 (6158)')) {
  linha('Legislativo · edição 7839 (6158) — Ordem de Serviço 12/2026 (índice: "Nº 12 - 2026")');
  const r = await extrairEntradasIndice(pdfLeg6158, TIPOS_LEG);
  ok(`1 entrada (veio ${r.entradas.length})`, r.entradas.length === 1);
  ok('Ordem de Serviço 12/2026 → ...6158_cl_625901_1.pdf',
    r.entradas[0]?.tipoAto === 'Ordem de Serviço' && r.entradas[0]?.numero === '12' && r.entradas[0]?.ano === '2026' &&
    r.entradas[0]?.linkNorma.endsWith('6158_cl_625901_1.pdf'), JSON.stringify(r.entradas[0]));
  ok('sem data por extenso (OS não tem) e sem republicação', r.entradas[0]?.dataExtenso === null && r.entradas[0]?.isRepublicacao === false);
  ok('nenhum link desconhecido', r.semCabecalho.length === 0);
}

console.log(`\n${total - falhas}/${total} asserções passaram${falhas ? ` — ${falhas} FALHA(S)` : ''}${puladas ? ` · ${puladas} seção(ões) pulada(s)` : ''}.`);
process.exit(falhas ? 1 : 0);
