// teste_promulgacao_parcial.mjs — rodada 11 (regra corrigida + exemplos reais)
//
// Fixtures REAIS (PDFs do DOPA/SEI, extraídos com pdftotext -layout):
//   lc1075_promulgacao_parcial.txt — LC 1.075/2026, promulgação de 1 dispositivo pelo PREFEITO
//   lei14504_parcial.txt           — Lei 14.504/2026, promulgação de 1 dispositivo pela CÂMARA
//   res3006.txt                    — Resolução 3.006/2026 (ato próprio do Legislativo)
//   os12.txt                       — Ordem de Serviço 12/2026
// Casos marcados "(sintético)" usam redação NÃO confirmada em texto real —
// existem pra travar a lógica, não pra afirmar como o DOPA escreve.
import fs from 'node:fs';
import {
  detectarPromulgacaoParcial, localizarPreambulo, parseLeiPublicada,
  criarVersaoOriginal, criarVersaoOriginalDeLeiPublicada, extrairProvenienciaPromulgacao, limparMarkdownLinks,
  extrairCabecalhoLeiPublicada, urnLei, chaveLei
} from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));
const L = f => fs.readFileSync(f, 'utf8');
const linhasNV = raw => raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const lc1075 = L('./lc1075_promulgacao_parcial.txt');
const lei14504 = L('./lei14504_parcial.txt');
const res3006 = L('./res3006.txt');
const os12 = L('./os12.txt');
const lc320 = L('./lc320.txt').trim();
const lc384 = limparMarkdownLinks(L('./lc384.txt').trim());
const lc412 = limparMarkdownLinks(L('./lc412.txt').trim());
const lc611 = L('./lc611.txt').trim();

// Molde sintético de lei: preâmbulo e corpo variam.
const molde = (preambulo, corpo = 'Art. 1º Texto.', fecho = 'PREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de janeiro de 2020.') =>
  `LEI COMPLEMENTAR Nº 999, DE 1º DE JANEIRO DE 2020.\n\nDISPÕE SOBRE TESTE.\n\n${preambulo}\n\n${corpo}\n\n${fecho}`;

linha('REAL · LC 1.075/2026 — promulgação de dispositivo pelo PREFEITO');
{
  const r = detectarPromulgacaoParcial(lc1075);
  ok('parcial = true, objeto = "dispositivo"', r.parcial === true && r.sinais.objetoPromulgado === 'dispositivo');
  ok('datas divergem: lei 2026-07-14 × fecho 2026-09-23', r.sinais.datasDivergem === true && r.sinais.dataDaLei === '2026-07-14' && r.sinais.dataDoFecho === '2026-09-23');
  ok('linhas de pontos (4) só informativas', r.sinais.linhasDePontos === 4);
}

linha('REAL · Lei 14.504/2026 — promulgação de dispositivo pela CÂMARA (variante usual, agora confirmada)');
{
  const linhas = linhasNV(lei14504);
  const idxPromulgo = linhas.findIndex(l => /promulgo/i.test(l));
  ok('pré-condição do achado: o "promulgo" está DEPOIS da linha 15 (ementa de 27 linhas) — a janela antiga de 15 linhas nunca o alcançaria', idxPromulgo > 15);
  const r = detectarPromulgacaoParcial(lei14504);
  ok('parcial = true, objeto = "dispositivo"', r.parcial === true && r.sinais.objetoPromulgado === 'dispositivo');
  ok('datas divergem: lei 2026-03-11 × fecho 2026-06-26 (fecho "CÂMARA MUNICIPAL DE PORTO ALEGRE, 26 DE JUNHO DE 2026.")',
    r.sinais.datasDivergem === true && r.sinais.dataDaLei === '2026-03-11' && r.sinais.dataDoFecho === '2026-06-26');
  ok('o preâmbulo real NÃO tem "manteve" (diz "aprovou e eu promulgo dispositivo") — diferente da LC 412', !/manteve/i.test(lei14504));
  let erro = null;
  try { criarVersaoOriginalDeLeiPublicada(lei14504); } catch (e) { erro = e; }
  ok('criarVersaoOriginalDeLeiPublicada falha alto e cita a lei (14504/2026)', erro instanceof Error && /PROMULGAÇÃO PARCIAL/.test(erro.message) && /14504\/2026/.test(erro.message));
  ok('o fragmento é, ele mesmo, uma alteradora (Art. 4º altera o § 3º do art. 38-A da Lei 10.605) — a guarda recusa a v0, mas o texto NÃO deve ser descartado',
    /Art\. 4º Fica alterado o § 3º do art\. 38-A da Lei nº 10\.605/.test(lei14504));
}

linha('REAL · Resolução 3.006/2026 e Ordem de Serviço 12/2026 — atos próprios do Legislativo');
{
  ok('Resolução: preâmbulo real diz "eu promulgo a seguinte Resolução"', /promulgo a seguinte Resolução/.test(res3006));
  const r = detectarPromulgacaoParcial(res3006);
  ok('Resolução: parcial = false (ato inteiro; "promulgo" sozinho não decide)', r.parcial === false && r.sinais.objetoPromulgado === null);
  ok('Resolução: fecho reconhecido, data 2026-07-10', r.sinais.dataDoFecho === '2026-07-10');
  ok('Ordem de Serviço: preâmbulo real não usa "promulgo" nem "sanciono" (diz "RESOLVE:")', !/promulg|sanciono/i.test(os12) && /RESOLVE:/.test(os12));
  const r2 = detectarPromulgacaoParcial(os12);
  ok('Ordem de Serviço: parcial = false, sem suspeita', r2.parcial === false && r2.suspeita === false);
  ok('Ordem de Serviço: fecho reconhecido, data 2026-08-18', r2.sinais.dataDoFecho === '2026-08-18');
  ok('(sintético) "promulga a Emenda à Lei Orgânica nº 45" sem "seguinte" (ato inteiro): parcial = false',
    detectarPromulgacaoParcial('A MESA DIRETORA DA CÂMARA promulga a Emenda à Lei Orgânica nº 45, de 3 de março de 2026:\n\nArt. 1º Texto.').parcial === false);
}

linha('localizarPreambulo() — âncora "Faço saber", sem contar linhas');
{
  const pre = localizarPreambulo(linhasNV(lei14504));
  ok('Lei 14.504: ancorado, e o preâmbulo contém "promulgo dispositivo"', pre.ancorado && /promulgo dispositivo/.test(pre.linhas.join(' ')));
  ok('Lei 14.504: o preâmbulo NÃO inclui a ementa de 27 linhas', !pre.linhas.some(l => /Inclui arts\./.test(l)));
  ok('Resolução 3.006: ancorado, termina antes de "Art. 1º"', localizarPreambulo(linhasNV(res3006)).linhas.every(l => !/^Art\. 1º/.test(l)));
  ok('LC 1.075: ancorado (inclui a linha "O PREFEITO MUNICIPAL…" que vem antes de "Faço saber")', /O PREFEITO MUNICIPAL/.test(localizarPreambulo(linhasNV(lc1075)).linhas.join(' ')));
  ok('Ordem de Serviço (sem "Faço saber"): ancorado = false', localizarPreambulo(linhasNV(os12)).ancorado === false);
  const citacaoQuebrada = molde('O PREFEITO MUNICIPAL DE PORTO ALEGRE\nFaço saber que, no uso das atribuições que me confere o § 5º do\nart. 77 da Lei Orgânica do Município, promulgo dispositivo da\nLei Complementar nº 320, de 2 de maio de 1994, como segue:');
  ok('(sintético) linha quebrada que começa com "art. 77" (minúsculo = citação) NÃO corta o preâmbulo antes do "promulgo"',
    detectarPromulgacaoParcial(citacaoQuebrada).parcial === true);
}

linha('extrairProvenienciaPromulgacao() — ementa longa não pode empurrar o preâmbulo pra fora da janela');
{
  const linhas = lc320.split(/\r?\n/);
  const padded = [linhas[0], linhas[1], ...Array.from({ length: 25 }, (_, i) => `continuação da ementa, linha ${i + 1}`), ...linhas.slice(2)].join('\n');
  ok('(sintético) LC 320 com ementa de 27 linhas: continua "sancao_normal" (a janela antiga de 15 linhas dava "indeterminado")',
    extrairProvenienciaPromulgacao(padded).motivoProvavel === 'sancao_normal');
  ok('LC 320 / 384 / 611: sancao_normal (inalterado)', [lc320, lc384, lc611].every(r => extrairProvenienciaPromulgacao(r).motivoProvavel === 'sancao_normal'));
  ok('LC 412: veto_derrubado pela Câmara (inalterado)', extrairProvenienciaPromulgacao(lc412).motivoProvavel === 'veto_derrubado');
}

linha('extrairProvenienciaPromulgacao() — categorias novas: promulgacao_parcial e promulgacao_propria');
{
  const p1075 = extrairProvenienciaPromulgacao(lc1075);
  ok('LC 1.075 (Prefeito, "promulgo dispositivo", sem "sanciono"): promulgacao_parcial, promulgadoPor = PREFEITO',
    p1075.motivoProvavel === 'promulgacao_parcial' && p1075.promulgadoPor === 'PREFEITO');
  ok('LC 1.075: baseLegal extraído do formato "§ 5º do artigo 77 da Lei Orgânica"',
    p1075.baseLegal === 'art. 77, § 5º, da Lei Orgânica');

  const p14504 = extrairProvenienciaPromulgacao(lei14504);
  ok('Lei 14.504 (Câmara, "aprovou e eu promulgo dispositivo", sem "manteve"): promulgacao_parcial, promulgadoPor = PRESIDENTE_CAMARA',
    p14504.motivoProvavel === 'promulgacao_parcial' && p14504.promulgadoPor === 'PRESIDENTE_CAMARA');
  ok('Lei 14.504: baseLegal extraído do formato plural "§§ 3º e 7° do art. 77 da Lei Orgânica"',
    p14504.baseLegal === 'art. 77, §§ 3º e 7º, da Lei Orgânica');

  const pRes = extrairProvenienciaPromulgacao(res3006);
  ok('Resolução 3.006 (Câmara, "aprovou e eu promulgo A SEGUINTE Resolução" — ato inteiro, não fragmento): promulgacao_propria',
    pRes.motivoProvavel === 'promulgacao_propria' && pRes.promulgadoPor === 'PRESIDENTE_CAMARA');
  ok('Resolução 3.006: baseLegal não é sobre a Lei Orgânica (é sobre outra Resolução/Regimento) — fica ausente/null, sem inventar',
    !pRes.baseLegal);

  ok('Ordem de Serviço 12/2026 (sem "Faço saber"/"promulgo"/"sanciono"): continua indeterminado — 1 exemplo só não vira categoria',
    extrairProvenienciaPromulgacao(os12).motivoProvavel === 'indeterminado' && extrairProvenienciaPromulgacao(os12).promulgadoPor === null);

  ok('LC 412 (veto_derrubado) não regride: baseLegal continua vindo do formato com a palavra "parágrafo" (não dos regex novos com §/§§)',
    extrairProvenienciaPromulgacao(lc412).baseLegal === 'art. 77, § 7º, da Lei Orgânica');
}

linha('Fecho "CÂMARA MUNICIPAL DE PORTO ALEGRE, DD DE MÊS DE AAAA." (3 exemplos reais idênticos)');
{
  const d = parseLeiPublicada(lei14504);
  const par = d.artigos[0].children[0];
  ok('Lei 14.504: o texto do § 3º NÃO engole mais o fecho nem o bloco de assinaturas do SEI',
    !/CÂMARA MUNICIPAL|Documento assinado|Referência:/.test(par.texto));
  ok('Lei 14.504: o fecho guarda a data e as duas assinaturas eletrônicas',
    /^CÂMARA MUNICIPAL DE PORTO ALEGRE, 26 DE JUNHO DE 2026\./.test(d.fecho) && /Moisés da Silva Barboza/.test(d.fecho) && /Tanise Amalia Pazzim/.test(d.fecho));
  const r = parseLeiPublicada(res3006);
  ok('Resolução 3.006: o último artigo NÃO engole mais o fecho',
    r.artigos.length === 2 && !/CÂMARA MUNICIPAL/.test(r.artigos[1].texto) && /^CÂMARA MUNICIPAL DE PORTO ALEGRE, 10 DE JULHO DE 2026\./.test(r.fecho));
  const wrap = molde('O PREFEITO MUNICIPAL, Faço saber que aprovou e eu sanciono a seguinte Lei:',
    'Art. 1º A fiscalização será feita pela\nCâmara Municipal de Porto Alegre, 3 vezes por ano, na forma da Lei.\n\nArt. 2º Vigência.');
  const dw = parseLeiPublicada(wrap);
  ok('(sintético) linha que só COMEÇA com "Câmara Municipal de Porto Alegre, 3 vezes…" NÃO vira fecho (regex estrita) — os 2 artigos ficam',
    dw.artigos.length === 2 && !dw.fecho.includes('3 vezes'));
}

linha('Linhas de pontos NÃO decidem (típicas de lei ALTERADORA) — correção do usuário');
{
  const alteradora = molde(
    'O PREFEITO MUNICIPAL DE PORTO ALEGRE, Faço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei Complementar:',
    'Art. 1º O art. 5º da Lei Complementar nº 320 passa a vigorar com a seguinte redação:\n\n..............................................\n\n"Art. 5º Texto novo.\n\n..............................................\n\n§ 2º Texto novo."\n\nArt. 2º Esta Lei entra em vigor na data de sua publicação.');
  const r = detectarPromulgacaoParcial(alteradora);
  ok('(sintético) alteradora com linhas só de pontos + "sanciono": parcial = false, sem suspeita', r.parcial === false && r.suspeita === false);
  ok('(sintético) os pontos são só contados', r.sinais.linhasDePontos === 2);
  let v = null, e = null;
  try { v = criarVersaoOriginalDeLeiPublicada(alteradora); } catch (x) { e = x; }
  ok('(sintético) alteradora com pontos continua gerando v0 (a guarda não a bloqueia)', !e && v && v.artigos.length === 2);
}

linha('Artigo INTEIRO com veto derrubado (sem pontos) também é parcial — correção do usuário');
{
  const artigoInteiro = molde(
    'O PREFEITO MUNICIPAL DE PORTO ALEGRE\nFaço saber que a Câmara Municipal aprovou e eu, no uso das atribuições que me confere o § 5º do artigo 77 da Lei Orgânica do Município, promulgo o art. 5º da Lei Complementar nº 999, de 1º de janeiro de 2020, como segue:',
    'Art. 5º Texto do artigo que havia sido vetado, agora promulgado na íntegra.');
  const r = detectarPromulgacaoParcial(artigoInteiro);
  ok('(sintético) "promulgo o art. 5º da Lei Complementar nº 999": parcial = true, sem linha de pontos', r.parcial === true && r.sinais.linhasDePontos === 0);
  ok('(sintético) objeto = "o art. 5º"', r.sinais.objetoPromulgado === 'o art. 5º');
  ok('(sintético) vários dispositivos, com "art." no meio do objeto: parcial',
    detectarPromulgacaoParcial(molde('O PREFEITO MUNICIPAL, promulgo o § 2º do art. 6º e o inciso III do art. 7º da Lei Complementar nº 320, de 2 de maio de 1994:')).parcial === true);
}

linha('Leis integrais REAIS: nunca parciais — inclusive a LC 412, onde a CÂMARA diz "promulgo"');
for (const [nome, raw] of [['LC 320/1994', lc320], ['LC 384/1996', lc384], ['LC 412/1998 (veto derrubado, lei INTEIRA)', lc412], ['LC 611/2009', lc611]]) {
  const r = detectarPromulgacaoParcial(raw);
  ok(`${nome}: parcial = false, data da lei = data do fecho`, r.parcial === false && r.sinais.datasDivergem === false && r.suspeita === false);
}

linha('Suspeita por data divergente — sinaliza, NÃO bloqueia (republicação pode divergir legitimamente)');
{
  const dataAlterada = lc320.replace('PREFEITURA MUNICIPAL DE PORTO ALEGRE, 02 de maio de 1994.', 'PREFEITURA MUNICIPAL DE PORTO ALEGRE, 20 de junho de 1994.');
  ok('(sintético) pré-condição: a troca de data no fecho aconteceu', dataAlterada !== lc320);
  const r = detectarPromulgacaoParcial(dataAlterada);
  ok('(sintético) sanção normal + datas divergentes: parcial = false, suspeita = true', r.parcial === false && r.suspeita === true);
  let v = null, e = null;
  try { v = criarVersaoOriginalDeLeiPublicada(dataAlterada); } catch (x) { e = x; }
  ok('(sintético) e a guarda NÃO bloqueia (fica pra revisão humana)', !e && v);
  ok('fecho sem data reconhecível → datasDivergem = null',
    detectarPromulgacaoParcial(molde('O PREFEITO, eu sanciono a seguinte Lei:', 'Art. 1º Texto.', 'Registre-se e publique-se.')).sinais.datasDivergem === null);
}

linha('parseLeiPublicada() expõe o resultado; guarda não atrapalha leis integrais');
{
  ok('doc.promulgacaoParcial.parcial = true nas duas promulgações parciais reais', parseLeiPublicada(lc1075).promulgacaoParcial.parcial && parseLeiPublicada(lei14504).promulgacaoParcial.parcial);
  ok('doc.promulgacaoParcial.parcial = false na LC 320', parseLeiPublicada(lc320).promulgacaoParcial.parcial === false);
  for (const [nome, raw] of [['LC 320', lc320], ['LC 384', lc384], ['LC 412', lc412], ['LC 611', lc611]]) {
    let v = null, e2 = null;
    try { v = criarVersaoOriginalDeLeiPublicada(raw); } catch (e) { e2 = e; }
    ok(`${nome}: lei integral continua gerando v0 normalmente`, !e2 && v && v.artigos.length > 0);
  }
}

linha('DOCUMENTA o risco que a guarda evita (o que o parser faz com o fragmento, sem ela)');
{
  const doc = parseLeiPublicada(lc1075);
  ok('LC 1.075: UM artigo cujo texto é só pontos e espaços (o "Art. 185" se perde)', doc.artigos.length === 1 && /^[.\s]+$/.test(doc.artigos[0].texto));
  const parsed = parseLeiPublicada(lei14504);
  const v0 = criarVersaoOriginal(parsed, parsed);   // o que a guarda impede de acontecer
  ok('Lei 14.504 SEM a guarda: a v0 numeraria o dispositivo como "Art. 1º" — e não "Art. 4º", o número real', v0.artigos.length === 1 && v0.artigos[0].desFixo === 'Art. 1º');
  ok('Lei 14.504 SEM a guarda: e o § 3º viraria "Parágrafo único."', v0.artigos[0].children[0].desFixo === 'Parágrafo único.');
}

linha('extrairCabecalhoLeiPublicada() — Resolução e Ordem de Serviço (Limite 2)');
{
  const cRes = extrairCabecalhoLeiPublicada(res3006);
  ok('Resolução 3.006: tipoAto/numero/ano/dataPublicacao corretos, atravessando as linhas "PROC. Nº"/"PR Nº"',
    cRes && cRes.tipoAto === 'RESOLUÇÃO' && cRes.numero === '3006' && cRes.ano === '2026' && cRes.dataPublicacao === '2026-07-10');

  const cOS = extrairCabecalhoLeiPublicada(os12);
  ok('Ordem de Serviço 12/2026: tipoAto/numero/ano corretos; SEM data no cabeçalho (dataPublicacao = null aqui)',
    cOS && cOS.tipoAto === 'ORDEM DE SERVIÇO' && cOS.numero === '12' && cOS.ano === '2026' && cOS.dataPublicacao === null);

  const docOS = parseLeiPublicada(os12);
  ok('Ordem de Serviço via parseLeiPublicada: dataPublicacao = data do FECHO (18/08/2026), decisão do usuário — não há data no cabeçalho',
    docOS.tipoAto === 'ORDEM DE SERVIÇO' && docOS.dataPublicacao === '2026-08-18');

  const docRes = parseLeiPublicada(res3006);
  ok('Resolução via parseLeiPublicada: dataPublicacao = data do CABEÇALHO (convenção mantida, igual Lei/LC)',
    docRes.dataPublicacao === '2026-07-10');

  // Cabeçalho "RESOLUÇÃO DE MESA Nº 674, ..." é visto no ÍNDICE do DOPA (CLAUDE.md), mas sem
  // PDF de norma real — molde sintético só pra confirmar que a rede de proteção dispara.
  const mesaRaw = 'RESOLUÇÃO DE MESA Nº 674, DE 12 DE MAIO DE 2026.\n\nDispõe sobre algo interno.\n\nArt. 1º Texto.';
  const cMesa = extrairCabecalhoLeiPublicada(mesaRaw);
  ok('(sintético) Resolução de Mesa: tipoAto = null, tipoNaoSuportado = "RESOLUÇÃO DE MESA" — rede de proteção, não silêncio',
    cMesa && cMesa.tipoAto === null && cMesa.tipoNaoSuportado === 'RESOLUÇÃO DE MESA');
  const decretoRaw = 'DECRETO LEGISLATIVO Nº 12, DE 1º DE JANEIRO DE 2026.\n\nArt. 1º Texto.';
  const cDecreto = extrairCabecalhoLeiPublicada(decretoRaw);
  ok('(sintético) Decreto Legislativo: mesma rede de proteção', cDecreto && cDecreto.tipoNaoSuportado === 'DECRETO LEGISLATIVO');

  ok('Lei/LC continuam sem regressão: LC 320 não aciona nem Resolução, nem OS, nem tipoNaoSuportado',
    extrairCabecalhoLeiPublicada(lc320).tipoAto === 'LEI COMPLEMENTAR');

  ok('urnLei: Resolução tem termo confirmado no vocabulário LexML ("resolucao") — URN válida',
    urnLei('RESOLUÇÃO', '3006', '2026-07-10') === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:resolucao:2026-07-10;3006');
  ok('urnLei: Ordem de Serviço NÃO tem termo no vocabulário LexML (conferido em lexml/lexml-vocabulary) — devolve null, não inventa slug',
    urnLei('ORDEM DE SERVIÇO', '12', '2026-08-18') === null);
  ok('chaveLei: Ordem de Serviço usa sigla interna "os" (convenção deste projeto, não do LexML)',
    chaveLei('ORDEM DE SERVIÇO', '12', '2026') === 'os 12/2026');
}

linha('Comportamentos CONHECIDOS e não alterados (pendências de OUTRAS tarefas, não desta)');
{
  ok('dataPublicacao = data da LEI (cabeçalho), não a da promulgação parcial — a real está no fecho',
    parseLeiPublicada(lc1075).dataPublicacao === '2026-07-14' && /23 de setembro de 2026/.test(parseLeiPublicada(lc1075).fecho));
}

linha('BUG CORRIGIDO nesta rodada: reArt exige "Art."/"ART." (maiúsculo), não mais case-insensitive');
{
  ok('OS 12/2026: 22 artigos reais (era 24 — linha quebrada "art. 141…"/"art. 45…" minúsculo não vira mais artigo novo)',
    parseLeiPublicada(os12).artigos.length === 22);
}

console.log('\n' + '='.repeat(70) + `\nRESULTADO: ${pass} passaram, ${fail} falharam\n` + '='.repeat(70));
process.exit(fail ? 1 : 0);
