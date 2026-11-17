import fs from 'node:fs';
import {
  parseMinuta, normalizar, detectNRCandidates, visText,
  limparMarkdownLinks, prepararTextoOrigem,
  extrairCabecalhoLeiPublicada, extrairCitacoesExternas, parseLeiPublicada,
  parseLeiAlvoIndex, parseLeiAlvoAnotacoes
} from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const lc320 = fs.readFileSync('./lc320.txt', 'utf8').trim();
const lc384 = fs.readFileSync('./lc384.txt', 'utf8').trim();
const lc412 = fs.readFileSync('./lc412.txt', 'utf8').trim();
const compilado = fs.readFileSync('./lc320_compilado_leisorg.txt', 'utf8').trim();

// ─── 1. Cabeçalho de lei publicada (peça 1) ───────────────────────────────────
linha('1. extrairCabecalhoLeiPublicada()');
{
  const c320 = extrairCabecalhoLeiPublicada(lc320);
  ok('LC 320: tipoAto = LEI COMPLEMENTAR', c320?.tipoAto === 'LEI COMPLEMENTAR');
  ok('LC 320: numero = 320', c320?.numero === '320');
  ok('LC 320: ano = 1994', c320?.ano === '1994');
  ok('LC 320: dataPublicacao = 1994-05-02', c320?.dataPublicacao === '1994-05-02');

  const c384 = extrairCabecalhoLeiPublicada(lc384);
  ok('LC 384: numero/ano = 384/1996', c384?.numero === '384' && c384?.ano === '1996');
  ok('LC 384: dataPublicacao = 1996-09-04 (dia com zero à esquerda)', c384?.dataPublicacao === '1996-09-04');

  const c412 = extrairCabecalhoLeiPublicada(lc412);
  ok('LC 412: dataPublicacao = 1998-03-24 (março com cedilha)', c412?.dataPublicacao === '1998-03-24');
}

// ─── 2. Sufixo de letra no parser principal (achado crítico) ──────────────────
linha('2. parseMinuta() com designadores de sufixo de letra (Art. 9º-A, 12-A, 12-B)');
{
  const docC = parseMinuta(compilado);
  const porTexto = i => visText(docC.artigos[i]);
  ok('Art. 9º-A não vaza "A " no início do texto', !porTexto(17).startsWith('A O Executivo'));
  ok('Art. 9º-A texto correto', porTexto(17).startsWith('O Executivo Municipal, após a publicação'));
  ok('Art. 12-A não vaza "A " no início do texto', !porTexto(21).startsWith('A Monumentos'));
  ok('Art. 12-A texto correto', porTexto(21).startsWith('Monumentos e espaços físicos'));
  ok('Art. 12-B não vaza "B " no início do texto', !porTexto(22).startsWith('B Para fins'));
  ok('Art. 12-B texto correto', porTexto(22).startsWith('Para fins do disposto'));
}

// ─── 3. normalizar() não confunde Art. N-A com numeração posicional ──────────
// Nota: parseMinuta() rodado direto num texto COMPILADO (repetido) gera
// numeração posicional divergente da grafia original para TODOS os artigos
// duplicados — isso é esperado (parseMinuta não foi feito pra texto
// compilado, só pra passagem única) e não é o que este teste verifica. O que
// importa aqui é que os designadores COM SUFIXO DE LETRA especificamente
// (9º-A, 12-A, 12-B) não apareçam na lista de "grafia errada", já que pra
// eles a checagem posicional nem se aplica.
linha('3. normalizar() não confunde designador com sufixo de letra com numeração posicional');
{
  const docC = parseMinuta(compilado);
  let logs = [];
  normalizar(docC, (regra, alvo, antes) => logs.push({ regra, alvo, antes }));
  const grafiaLogs = logs.filter(r => r.regra.includes('Grafia do designador'));
  const suspeitos = grafiaLogs.filter(r => /-[A-Z]\b/.test(r.antes || ''));
  ok('Nenhum log de grafia envolve designador com sufixo de letra (9º-A/12-A/12-B)', suspeitos.length === 0);
}

// ─── 4. Omissão de caput inalterado ("Art. 2º ...") ───────────────────────────
linha('4. extrairRedacaoAlterada() reconhece "Art. 2º ..." como omitido');
{
  const cand = detectNRCandidates(lc384);
  const doc = parseMinuta(lc384, cand);
  const art2NR = doc.artigos[0].nrBloco.artigos[0];
  ok('Art. 2º do bloco NR está omitido=true', art2NR.omitido === true);
  ok('Art. 2º do bloco NR tem texto vazio (não ".")', art2NR.texto === '');
  const paragrafo = art2NR.children[0];
  ok('Parágrafo único ainda foi capturado corretamente como filho', paragrafo && paragrafo.texto.includes('sejam homenageados mais de uma vez'));
}

// ─── 5. limparMarkdownLinks resolve citação a lei-alvo ────────────────────────
linha('5. limparMarkdownLinks() + extrairCitacoesExternas em texto com link');
{
  const semLink = limparMarkdownLinks(lc384);
  ok('Link markdown removido do texto', !semLink.includes('[320]('));
  ok('Número da lei-alvo preservado após limpeza (com ou sem espaço antes do número)', /n[ºo]\s*320/i.test(semLink));
  const cits = extrairCitacoesExternas('Acrescenta parágrafo único ao artigo 2º da Lei Complementar nº 320');
  ok('extrairCitacoesExternas encontra "art. 2º" após limpeza', cits.some(c => c.chave === 'art. 2º'));
}

// ─── 6. Flag vetado ────────────────────────────────────────────────────────────
linha('6. normalizar() marca parágrafos VETADO');
{
  const doc = parseMinuta(lc320);
  normalizar(doc);
  const art2 = doc.artigos[1];
  ok('§ 1º do art. 2º marcado vetado=true', art2.children[0].vetado === true);
  ok('§ 2º do art. 2º marcado vetado=true', art2.children[1].vetado === true);
  const art7 = doc.artigos[6];
  ok('§ 2º do art. 7º marcado vetado=true', art7.children[1].vetado === true);
  ok('§ 1º do art. 7º (não vetado) NÃO tem a flag', !art7.children[0].vetado);
}

// ─── 7. parseLeiAlvoIndex: compilado → consolidado (só vigente) ──────────────
linha('7. parseLeiAlvoIndex() extrai só o texto VIGENTE do compilado');
{
  const idx = parseLeiAlvoIndex(compilado);
  ok('§ 1º do art. 2º = texto vigente (LC 514/2004), sem "VETADO" concatenado',
    idx['§ 1º do art. 2º'] !== undefined && !idx['§ 1º do art. 2º'].includes('VETADO'));
  ok('§ 1º do art. 2º contém o texto correto (percentual mínimo)',
    idx['§ 1º do art. 2º']?.includes('percentual mínimo de 30%'));
  ok('§ 3º do art. 2º = versão vigente (LC 525/2005), não a de 1996',
    idx['§ 3º do art. 2º']?.includes('Não será permitido que mais de um logradouro') &&
    !idx['§ 3º do art. 2º']?.includes('homenageados mais de uma vez'));
  ok('art. 4º = só a versão vigente (LC 525/2005: "defeso")',
    idx['art. 4º']?.startsWith('É defeso atribuir') &&
    !idx['art. 4º']?.includes('É proibida a duplicidade'));
  ok('art. 5º = só a versão vigente (LC 958/2022)',
    idx['art. 5º']?.includes('deverão conter os seguintes documentos') &&
    !idx['art. 5º']?.includes('croqui, aero ou outro'));
  ok('art. 8º = só a versão vigente (pós-LC 412/1998, "mediante consulta")',
    idx['art. 8º']?.includes('mediante consulta prévia') &&
    !idx['art. 8º']?.includes('através de plebiscito'));
}

// ─── 8. parseLeiAlvoAnotacoes: cobre "acrescida" e "Suprimido" ───────────────
linha('8. parseLeiAlvoAnotacoes() reconhece "Redação acrescida" e "Suprimido"');
{
  const anot = parseLeiAlvoAnotacoes(compilado);
  ok('§ 1º do art. 2º: anotação capturada (antes ficava ausente)',
    anot['§ 1º do art. 2º'] === 'Redação acrescida pela Lei Complementar nº 514/2004');
  ok('§ 2º do art. 2º: anotação capturada',
    anot['§ 2º do art. 2º'] === 'Redação acrescida pela Lei Complementar nº 514/2004');
  ok('§ 3º do art. 2º: mantém a anotação vigente (525/2005), não a de 1996',
    anot['§ 3º do art. 2º'] === 'Redação dada pela Lei Complementar nº 525/2005');
  ok('art. 4º: anotação vigente (525/2005)',
    anot['art. 4º'] === 'Redação dada pela Lei Complementar nº 525/2005');
  ok('art. 5º: anotação vigente (958/2022)',
    anot['art. 5º'] === 'Redação dada pela Lei Complementar nº 958/2022');
}

// ─── 9. prepararTextoOrigem remove ruído do leis.org ──────────────────────────
linha('9. prepararTextoOrigem() remove banner/rodapé do leis.org');
{
  const limpo = prepararTextoOrigem(compilado);
  ok('Remove "NORMA EM VIGOR"', !limpo.includes('NORMA EM VIGOR'));
  ok('Remove nota de rodapé "Este texto não substitui"', !limpo.includes('não substitui o original'));
  ok('Remove linha de "Data de Publicação no Leis.org"', !limpo.includes('Data de Publicação no Leis.org'));
  ok('Preserva o corpo da lei', limpo.includes('Art. 1º Fica estabelecida'));
}

// ─── Bug real: "PLE" sem borda de palavra casava dentro de "COMPLEMENTAR" ────
linha('Regressão: cabeçalho de lei publicada não cai no ramo de sigla de minuta');
{
  const doc = parseMinuta(lc320);
  ok('tipoAto detectado corretamente como LEI COMPLEMENTAR (não fica vazio)', doc.tipoAto === 'LEI COMPLEMENTAR');
  normalizar(doc);
  ok('Art. 1º preserva "Lei Complementar" na autorreferência (não vira "Lei" por bug de substring)',
    doc.artigos[0].texto.includes('nesta Lei Complementar'));
}

// ─── 8. Regressão: fecho de publicação não gruda no último artigo ─────────────
linha('Regressão: fecho de publicação não gruda no último artigo (art. 14 da LC 320)');
{
  const lc611 = fs.readFileSync('./lc611.txt', 'utf8').trim();

  const doc320 = parseLeiPublicada(lc320);
  const art14 = doc320.artigos[doc320.artigos.length - 1];
  ok('LC 320 art. 14: texto termina na última lei revogada, sem "PREFEITURA..."',
    !art14.texto.includes('PREFEITURA') && art14.texto.trim().endsWith('225, de 05 de junho de 1990.'));
  ok('LC 320 art. 14: mantém a revogação nominal (não é só cláusula genérica)',
    art14.texto.includes('Lei Complementar nº 225'));
  ok('LC 320: doc.fecho captura o bloco separadamente (padrão Executivo)',
    doc320.fecho.startsWith('PREFEITURA MUNICIPAL DE PORTO ALEGRE') && doc320.fecho.includes('TARSO GENRO'));

  const doc412 = parseLeiPublicada(lc412);
  const ultimo412 = doc412.artigos[doc412.artigos.length - 1];
  ok('LC 412: último artigo não carrega o fecho da Mesa',
    !ultimo412.texto.includes('GABINETE'));
  ok('LC 412: doc.fecho captura o bloco separadamente (padrão Mesa/Presidência)',
    doc412.fecho.startsWith('GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL'));

  const doc611 = parseLeiPublicada(lc611);
  const ultimo611 = doc611.artigos[doc611.artigos.length - 1];
  ok('LC 611: último artigo (art. 34) não carrega fecho nem nota do leis.org',
    !ultimo611.texto.includes('PREFEITURA') && !ultimo611.texto.includes('Data de Publicação'));
}

// ─── Resumo ────────────────────────────────────────────────────────────────────
linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
