// teste_referencias_alvo.mjs
//
// Rodada 30 (core): lei-alvo de comando. Cobre (1) a citação só com o ANO ("Lei Complementar nº 12,
// de 1975"), (2) a Lei Orgânica do Município como alvo presumido, (3) o 4º padrão de fecho
// ("Porto Alegre, 19 de março de 2009.") e (4) as travas do caminho de revogação que ficaram
// expostas quando mais leis-alvo passaram a ser reconhecidas. Textos REAIS em fixtures/textos/
// (extraídos do acervo, sem retoque); o que for inventado leva "(sintético)".
// Sem rede. Uso: node teste_referencias_alvo.mjs

import fs from 'node:fs';
import * as c from './norma-core.js';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };
const ler = (n) => c.limparMarkdownLinks(fs.readFileSync(`./fixtures/textos/${n}.txt`, 'utf8').trim());
const comandos = (n) => { const raw = ler(n); return c.extrairComandosLei(c.parseMinuta(raw, c.detectNRCandidates(raw)), {}); };
const efeito = (cs) => cs.filter((k) => !['nao_classificado', 'clausula_generica_sem_efeito'].includes(k.operacao));

// --- (1) citação só com o ano ------------------------------------------------------------------
{
  const cs = efeito(comandos('lc747_2014'));
  ok('LC 747/2014 (real): o art. 1º (data por extenso) e o art. 2º (só "de 1995") têm a MESMA lei-alvo, a LC 341/1995', cs.length === 3 && cs.every((k) => k.leiAlvo && k.leiAlvo?.chave === 'lc 341/1995'));
  const lc897 = efeito(comandos('lc897_2021')).filter((k) => k.artigoOrigem === 3);
  ok('LC 897/2021 art. 3º (real): "…na Lei Complementar nº 810, de 2017, alterada pela Lei Complementar nº 817, de 2017" — a lei-alvo é a PRIMEIRA citada (810), não a "alterada pela"', lc897.length > 0 && lc897.every((k) => k.leiAlvo?.chave === 'lc 810/2017'));
  const r = c.extrairReferenciasLei('Fica alterado o art. 1º da Lei Complementar nº 12, de 1975, e alterações posteriores.');
  ok('(sintético) "Lei Complementar nº 12, de 1975" → LC 12/1975 (tipo + número + ano)', r.length === 1 && r[0].chave === 'lc 12/1975' && r[0].tipoAto === 'LEI COMPLEMENTAR' && r[0].ano === '1975');
  ok('(sintético) sem espaços ("nº12, de1975") e com milhar ("Lei nº 6.309, de 1988") também', c.extrairReferenciasLei('Lei Complementar nº12, de1975')[0]?.chave === 'lc 12/1975' && c.extrairReferenciasLei('Lei nº 6.309, de 1988')[0]?.chave === 'l 6309/1988');
  ok('(sintético) a data por extenso continua sendo UMA referência só (sem duplicar pelo ano)', c.extrairReferenciasLei('Lei nº 6.309, de 28 de dezembro de 1988').length === 1);
  const ordem = c.extrairReferenciasLei('Fica alterada a Lei Complementar nº 7, de 1973, e a Lei nº 100, de 28 de dezembro de 1988.');
  ok('(sintético) a ordem é a do TEXTO, não a da forma de escrever (1ª citada = lei-alvo)', ordem.map((x) => x.chave).join(' ') === 'lc 7/1973 l 100/1988');
  ok('"Lei Orgânica do Município" citada de passagem NÃO é referência a outra lei', c.extrairReferenciasLei('nos termos da Lei Orgânica do Município de Porto Alegre').length === 0);
}

// --- (2) Lei Orgânica como alvo presumido -------------------------------------------------------
{
  const cs = efeito(comandos('ec28_2009'));
  ok('EC 28/2009 (real): o comando "inclui inc. XXI no art. 94 da Lei Orgânica do Município" tem lei-alvo = Lei Orgânica nº 1/1990, marcada como presumida', cs.length === 1 && cs[0].operacao === 'insert_node' && cs[0].leiAlvo?.chave === 'lo 1/1990' && cs[0].leiAlvo?.presumida === true);
  ok('chaveLei("LEI ORGÂNICA", 1, 1990) = "lo 1/1990"', c.chaveLei('LEI ORGÂNICA', '1', '1990') === 'lo 1/1990');
  ok('(sintético) extrairReferenciaLeiOrganica: acha a frase; sem a frase, null', c.extrairReferenciaLeiOrganica?.('no art. 94 da Lei Orgânica do Município de Porto Alegre')?.chave === 'lo 1/1990' && c.extrairReferenciaLeiOrganica?.('Lei nº 100, de 1988') === null);
  // alvo presumido NUNCA recusa comando: a mesma frase vale para a LO de 1970 (a "única vigente" é presunção)
  const v0 = c.criarVersaoOriginal(c.parseMinuta('LEI ORGÂNICA\nArt. 1º Texto.'), { tipoAto: 'LEI ORGÂNICA', numero: '1', ano: '1970', dataPublicacao: '1970-12-15' });
  const k = { operacao: 'replace_text', leiAlvo: c.extrairReferenciaLeiOrganica?.('da Lei Orgânica do Município'), dispositivoAlvo: 'art. 1º', novoTexto: 'Novo.' };
  const r = c.aplicarComandoLei(v0, k, { tipoAto: 'EMENDA À LEI ORGÂNICA', numero: '11', ano: '1970', dataPublicacao: '1970-12-20' });
  ok('(sintético) alvo presumido (LO 1990) aplicado sobre uma base de OUTRO ano: não é recusado', !r.erro && r.versao);
}

// --- (3) 4º padrão de fecho -----------------------------------------------------------------------
{
  for (const [n, rot, linha] of [['lc613_2009', 'LC 613/2009', 'Porto Alegre, 19 de março de 2009.'], ['ec28_2009', 'EC 28/2009', 'Porto Alegre, 20 de março de 2009.']]) {
    const raw = ler(n); const doc = c.parseMinuta(raw, c.detectNRCandidates(raw));
    const ult = doc.artigos[doc.artigos.length - 1];
    ok(`${rot} (real): o fecho "${linha}" é reconhecido`, doc.fecho.startsWith(linha));
    ok(`${rot}: o fecho e as assinaturas NÃO grudam no último artigo`, !/Porto Alegre, \d/.test(c.visText(ult)));
  }
  const raw = 'LEI COMPLEMENTAR Nº 1, DE 1 DE JANEIRO DE 2009\n\nDispõe sobre algo.\n\nArt. 1º Fica criado o algo, conforme a cidade de\nPorto Alegre, 19 de março de 2009 foi a data.\nArt. 2º Esta Lei entra em vigor.';
  ok('(sintético) linha que só COMEÇA como o fecho ("Porto Alegre, 19 de março de 2009 foi a data") não vira fecho', c.parseMinuta(raw).fecho === '');
}

// --- (4) travas da revogação -------------------------------------------------------------------------
{
  const rev = (n) => comandos(n).filter((k) => ['revoke_node', 'revoke_lei'].includes(k.operacao));
  ok('LC 665/2010 (real): "Ocorrendo a REVOGAÇÃO do parcelamento… art. 3º desta Lei Complementar…" (substantivo) NÃO emite revoke_node de outra lei', rev('lc665_2010').length === 0);
  const ec13 = comandos('ec13_1997_ocr');
  ok('EC 13/1997 (real, OCR "$ 1º"): "Revogam-se… em especial o inc. IV do $ 1º do art. 82" NÃO revoga o art. 82 inteiro: vira indeterminado, com o motivo', !ec13.some((k) => k.operacao === 'revoke_node') && ec13.some((k) => k.operacao === 'indeterminado' && /incompleta/.test(k.motivo)));
  const lc361 = comandos('lc361_1995_ocr');
  ok('LC 361/1995 (real, OCR): "a alínea "e" do inciso 111 do art. 71" NÃO revoga o art. 71 inteiro', !lc361.some((k) => k.operacao === 'revoke_node' && k.dispositivoAlvo === 'art. 71'));
  const ok583 = rev('lc583_2007');
  ok('LC 583/2007 (real): revogação explícita ("Fica revogado o § 2º do art. 16 da Lei Complementar nº 7, de 1973…") continua sendo revoke_node, agora com a lei-alvo LC 7/1973', ok583.some((k) => k.operacao === 'revoke_node' && k.dispositivoAlvo === '§ 2º do art. 16' && k.leiAlvo?.chave === 'lc 7/1973'));
  ok('(sintético) extrairCitacoesExternas: endereço completo não é "incompleta"; com sobra de endereço ilegível é', !c.extrairCitacoesExternas('o inc. IV do § 1º do art. 82')[0]?.incompleta && c.extrairCitacoesExternas('o inc. IV do $ 1º do art. 82')[0]?.incompleta === true);
  ok('(sintético) "nos termos do art. 82" (preposição, sem endereço pendente) não é "incompleta"', c.extrairCitacoesExternas('nos termos do art. 82')[0]?.incompleta === undefined);
}

// --- (5) "§ 1º" escrito sozinho: o endereço segue o que a lei escreveu ---------------------------
{
  const raw = ler('lc521_2005');
  const v0 = c.criarVersaoOriginal(c.parseMinuta(raw), { tipoAto: 'LEI COMPLEMENTAR', numero: '521', ano: '2005', dataPublicacao: '2005-01-01' });
  const p1 = v0.artigos[0].children.find((x) => x.tipo === 'paragrafo');
  ok('LC 521/2005 (real): o único parágrafo do art. 1º, escrito "§ 1º", tem desFixo "§ 1º" (não "Parágrafo único.") e fica marcado', p1.desFixo === '§ 1º' && p1.numeradoSemIrmao === true);
  ok('LC 521/2005: uma alteradora que cite "§ 1º do art. 1º" agora ACHA o dispositivo', c.localizarCaminho(v0, '§ 1º do art. 1º') !== null && c.localizarCaminho(v0, 'parágrafo único do art. 1º') === null);
  const lc611 = c.parseMinuta(fs.readFileSync('./lc611.txt', 'utf8').trim()); c.atribuirDesFixoOriginal(lc611);
  ok('LC 611 (real): "Parágrafo único" escrito como tal continua "Parágrafo único." e sem marca', lc611.artigos[0].children.some((x) => x.tipo === 'paragrafo' && x.desFixo === 'Parágrafo único.' && !x.numeradoSemIrmao));
  const dois = c.parseMinuta('LEI COMPLEMENTAR Nº 1, DE 1 DE JANEIRO DE 2010\n\nDispõe sobre algo.\n\nArt. 1º Caput.\n§ 1º Primeiro.\n§ 2º Segundo.\nArt. 2º Esta Lei entra em vigor.'); c.atribuirDesFixoOriginal(dois);
  ok('(sintético) dois parágrafos "§ 1º" e "§ 2º": nada muda, e nenhum recebe a marca', dois.artigos[0].children.filter((x) => x.tipo === 'paragrafo').map((x) => x.desFixo).join(' ') === '§ 1º § 2º' && !dois.artigos[0].children.some((x) => x.numeradoSemIrmao));
  const solo = c.parseMinuta('LEI COMPLEMENTAR Nº 1, DE 1 DE JANEIRO DE 2010\n\nDispõe sobre algo.\n\nArt. 1º Caput.\n§ 3º Só este.\nArt. 2º Esta Lei entra em vigor.'); c.atribuirDesFixoOriginal(solo);
  ok('(sintético) um "§ 3º" sozinho segue o escrito ("§ 3º"), sem renumerar para "§ 1º"', solo.artigos[0].children.find((x) => x.tipo === 'paragrafo').desFixo === '§ 3º');
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
