// teste_pdf_normas.mjs — Tarefa C (Limite 1), rodada 11
//
// Três blocos: (1) padrões de ruído isolados (ehLinhaDeRuido), com as
// strings REAIS já confirmadas nos fixtures .txt (extraídos por pdftotext,
// não por este módulo); (2) comparação ponta a ponta — extrairTextoNorma()
// (pdfjs-dist) × o .txt correspondente (pdftotext) — pra cada um dos 4 PDFs
// do DOPA/SEI (fixtures/pdf/); (3) mesma comparação pra LC 320/384/412/611
// (PDFs reais do leis.org, formato bem diferente do DOPA/SEI — sem rodapé
// SEI nem cabeçalho de impressão do navegador; banner "NORMA EM VIGOR" no
// topo e rodapé de proveniência do leis.org, nenhum dos dois vaza pra
// dentro de nenhum dispositivo).
import { ehLinhaDeRuido, extrairTextoNorma } from './ingestao/pdf-normas.mjs';
import { agruparPorLinha } from './ingestao/coletor-comum.mjs';
import { parseLeiPublicada, limparMarkdownLinks } from './norma-core.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

linha('ehLinhaDeRuido() — rodapé do SEI (visto em Lei 14.504 e Resolução 3.006 reais)');
{
  ok('Lei: "Lei (CMPA) 1106982                       SEI 034.00361/2024-16 / pg. 2" (real, lei14504)',
    ehLinhaDeRuido('Lei (CMPA) 1106982                       SEI 034.00361/2024-16 / pg. 2'));
  ok('Resolução: "Resolução 1114767     SEI 368.00016/2026-55 / pg. 1" (real, res3006 — sem "(CMPA)")',
    ehLinhaDeRuido('Resolução 1114767     SEI 368.00016/2026-55 / pg. 1'));
  ok('(sintético) mesmo padrão pra Lei Complementar (mesma forma, tipo diferente)',
    ehLinhaDeRuido('Lei Complementar (CMPA) 999999 SEI 034.00361/2024-16 / pg. 3'));
}

linha('ehLinhaDeRuido() — cabeçalho/rodapé de impressão do navegador (OS 12/2026 real)');
{
  ok('cabeçalho: "31/08/2026, 15:23 SEI/CMPA - 1133397 - Ordem de Serviço" (real, os12)',
    ehLinhaDeRuido('31/08/2026, 15:23 SEI/CMPA - 1133397 - Ordem de Serviço'));
  ok('(sintético) rodapé de impressão: URL do controlador + contador de página "1/7"',
    ehLinhaDeRuido('https://sei.camarapoa.rs.gov.br/sei/controlador.php?acao=documento_imprimir_web&id_documento=123 1/7'));
}

linha('ehLinhaDeRuido() — NADA de texto normativo real vira ruído por engano');
{
  const linhasReaisOS = [
    'ORDEM DE SERVIÇO Nº 12/2026',
    'O PRESIDENTE DA CÂMARA MUNICIPAL DE PORTO ALEGRE, no uso das atribuições',
    'Art. 1º Esta Ordem de Serviço estabelece os procedimentos básicos sobre o processo administrativo',
    'Parágrafo único. Para os fins desta Ordem de Serviço, considera-se:',
  ];
  for (const l of linhasReaisOS) {
    ok(`NÃO é ruído: "${l.slice(0, 50)}..."`, !ehLinhaDeRuido(l));
  }
  const linhasReaisRes = [
    'RESOLUÇÃO Nº 3.006, DE 10 DE JULHO DE 2026.',
    'Art. 1º Fica concedida a Comenda Porto do Sol ao senhor Abel Carlos da Silva Braga, com base na',
    'CÂMARA MUNICIPAL DE PORTO ALEGRE, 10 DE JULHO DE 2026.',
    'Documento assinado eletronicamente por Moisés da Silva Barboza, Presidente, em 10/07/2026, às 15:30,',
  ];
  for (const l of linhasReaisRes) {
    ok(`NÃO é ruído: "${l.slice(0, 50)}..."`, !ehLinhaDeRuido(l));
  }
  // Confusão plausível: uma citação de lei com "SEI" no meio de frase (nome de sistema, não rodapé).
  ok('(sintético) citação de "Lei" em frase corrida com número, sem o resto do padrão do rodapé: NÃO é ruído',
    !ehLinhaDeRuido('Lei nº 10.605, de 2008, autoriza o Executivo a regulamentar a matéria.'));
}

linha('Reuso confirmado: agruparPorLinha() importado do módulo compartilhado (não duplicado)');
{
  const it = (str, x, y, width) => ({ str, transform: [1, 0, 0, 1, x, y], width, height: 10 });
  const r = agruparPorLinha([it('Art. ', 10, 5, 25), it('1º', 36, 5, 10)]);
  ok('agruparPorLinha() funciona via import de ingestao/coletor-comum.mjs', r.length === 1 && r[0].texto === 'Art. 1º');
}

linha('extrairTextoNorma() ponta a ponta — PDF (pdfjs) × .txt (pdftotext), 4 PDFs reais');
{
  const casos = [
    ['LC 1.075/2026 (Prefeito, parcial)', 'fixtures/pdf/lc1075.pdf', 'lc1075_promulgacao_parcial.txt'],
    ['Lei 14.504/2026 (Câmara, parcial)', 'fixtures/pdf/lei14504.pdf', 'lei14504_parcial.txt'],
    ['Resolução 3.006/2026', 'fixtures/pdf/res3006.pdf', 'res3006.txt'],
    ['Ordem de Serviço 12/2026', 'fixtures/pdf/os12.pdf', 'os12.txt'],
  ];

  if (!fs.existsSync('fixtures/pdf/lc1075.pdf')) {
    console.log('  ⊘ PULADO — fixtures/pdf/ não encontrado nesta execução.');
  } else {
    for (const [nome, pdfPath, txtPath] of casos) {
      if (!fs.existsSync(pdfPath)) { console.log(`  ⊘ PULADO — ${pdfPath} não está no repositório.`); continue; }
      const textoPdf = await extrairTextoNorma(pdfPath);
      const docPdf = parseLeiPublicada(textoPdf);
      const docTxt = parseLeiPublicada(fs.readFileSync(txtPath, 'utf8'));
      ok(`${nome}: mesmo nº de artigos (pdf=${docPdf.artigos.length}, txt=${docTxt.artigos.length})`,
        docPdf.artigos.length === docTxt.artigos.length);
      ok(`${nome}: mesmo tipoAto (${docPdf.tipoAto})`, docPdf.tipoAto === docTxt.tipoAto);
      ok(`${nome}: mesmo promulgacaoParcial.parcial (${docPdf.promulgacaoParcial.parcial})`,
        docPdf.promulgacaoParcial.parcial === docTxt.promulgacaoParcial.parcial);
    }

    // Exigência específica da tarefa: OS 12 sem NENHUM resíduo da URL do controlador
    // do SEI em nenhum dispositivo da árvore (não só no texto bruto).
    if (fs.existsSync('fixtures/pdf/os12.pdf')) {
    const docOS = parseLeiPublicada(await extrairTextoNorma('fixtures/pdf/os12.pdf'));
    const todos = [];
    (function walk(nos) { for (const n of nos) { todos.push(n); if (n.children) walk(n.children); } })(docOS.artigos);
    const comResiduo = todos.filter((n) => /sei\.camarapoa\.rs\.gov\.br\/sei\/controlador/.test(n.texto || ''));
    ok(`Ordem de Serviço 12/2026: nenhum resíduo de URL do SEI em nenhum dos ${todos.length} dispositivos`,
      comResiduo.length === 0);

    ok('Ordem de Serviço 12/2026: 22 artigos reais (bug do reArt corrigido nesta rodada — herdado do core, não é regressão daqui)',
      docOS.artigos.length === 22);
    }
  }
}

linha('extrairTextoNorma() ponta a ponta — LC 320/384/412/611 (PDFs reais do leis.org)');
{
  const casosAntigos = [
    ['LC 320/1994', 'fixtures/pdf/lc320_leisorg.pdf', 'lc320.txt'],
    ['LC 384/1996', 'fixtures/pdf/lc384_leisorg.pdf', 'lc384.txt'],
    ['LC 412/1998', 'fixtures/pdf/lc412_leisorg.pdf', 'lc412.txt'],
    ['LC 611/2009', 'fixtures/pdf/lc611_leisorg.pdf', 'lc611.txt'],
  ];

  if (!fs.existsSync('fixtures/pdf/lc320_leisorg.pdf')) {
    console.log('  ⊘ PULADO — fixtures/pdf/*_leisorg.pdf não encontrado nesta execução.');
  } else {
    for (const [nome, pdfPath, txtPath] of casosAntigos) {
      // limparMarkdownLinks() é o mesmo pré-processamento que os testes de regressão já
      // aplicam a estes .txt (rodada 1) — o PDF real não tem links markdown, então é um
      // no-op nele, mas mantém a comparação justa dos dois lados.
      const textoPdf = limparMarkdownLinks(await extrairTextoNorma(pdfPath));
      const textoTxt = limparMarkdownLinks(fs.readFileSync(txtPath, 'utf8').trim());
      const docPdf = parseLeiPublicada(textoPdf);
      const docTxt = parseLeiPublicada(textoTxt);
      ok(`${nome}: mesmo nº de artigos (pdf=${docPdf.artigos.length}, txt=${docTxt.artigos.length})`,
        docPdf.artigos.length === docTxt.artigos.length);
      ok(`${nome}: mesmo numero/dataPublicacao (${docPdf.numero}, ${docPdf.dataPublicacao})`,
        docPdf.numero === docTxt.numero && docPdf.dataPublicacao === docTxt.dataPublicacao);
    }

    // Banner "NORMA EM VIGOR" (topo) e rodapé de proveniência do leis.org ("Nota: Este
    // texto não substitui..." / "Data de Publicação no Leis.org:") não podem vazar pra
    // dentro de nenhum dispositivo — achado real, mesmo princípio do rodapé do SEI.
    const docLC320 = parseLeiPublicada(limparMarkdownLinks(await extrairTextoNorma('fixtures/pdf/lc320_leisorg.pdf')));
    const todosLC320 = [];
    (function walk(nos) { for (const n of nos) { todosLC320.push(n); if (n.children) walk(n.children); } })(docLC320.artigos);
    const comRuidoLeisOrg = todosLC320.filter((n) => /NORMA EM VIGOR|Leis\.org|não substitui o original/i.test(n.texto || ''));
    ok(`LC 320/1994: nenhum resíduo do banner/rodapé do leis.org em nenhum dos ${todosLC320.length} dispositivos`,
      comRuidoLeisOrg.length === 0);
  }
}

console.log('\n' + '='.repeat(70) + `\nRESULTADO: ${pass} passaram, ${fail} falharam\n` + '='.repeat(70));
process.exit(fail ? 1 : 0);
