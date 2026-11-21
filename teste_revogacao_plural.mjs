// teste_revogacao_plural.mjs — decisões 43 e 45–48: revogação no PLURAL na mesma frase ("Ficam revogados os arts. 59, 60, 61 e 62 da LC 765"),
// com âncora herdada ("o inc. VIII e o § 8º do art. 1º"), "todos da Lei X" e leis inteiras no plural. Antes, "Ficam revogados/revogadas" nunca era
// lido (nao_classificado, sem aviso). Textos REAIS do SAPL da PGM (fixtures/textos/revoga_plural_<id>.txt: o artigo da alteradora).
// O que o motor não lê continua `indeterminado`, com motivo e dispositivosCitados — nunca um revoke_node do artigo inteiro. Sem rede.
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const cmds = (texto) => { const t = c.limparMarkdownLinks(texto); return c.extrairComandosLei(c.parseMinuta(t, c.detectNRCandidates(t)), {}); };
const art = (id) => cmds(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/revoga_plural_${id}.txt`, 'utf8')));
const nos = (id) => art(id).filter((k) => k.operacao === 'revoke_node').map((k) => k.dispositivoAlvo);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok('id 47888 (real): "os arts. 59, 60, 61 e 62 da LC 765" → 4 revoke_node, na LC 765/2015', igual(nos(47888), ['art. 59', 'art. 60', 'art. 61', 'art. 62']) && art(47888).every((k) => k.leiAlvo.chave === 'lc 765/2015'));
ok('id 50015 (real): "os §§ 1º e 2º do art. 165" → § 1º e § 2º do art. 165 (nunca o art. 165 inteiro)', igual(nos(50015), ['§ 1º do art. 165', '§ 2º do art. 165']));
ok('id 42635 (real): "o § 4º do art. 45 e o art. 47" → dois endereços, cada um no seu nível', igual(nos(42635), ['§ 4º do art. 45', 'art. 47']));
ok('id 37039 (real): "o inc. VIII e o § 8º do art. 1º" → o inciso herda o artigo do objeto seguinte', igual(nos(37039), ['inc. viii do art. 1º', '§ 8º do art. 1º']));
ok('id 41522 (real): "as als. a e b do inc. XIX do caput do art. 21" → alíneas a e b do inciso XIX ("caput" é só passagem)', igual(nos(41522), ['al. a) do inc. xix do art. 21', 'al. b) do inc. xix do art. 21']));
ok('id 44070 (real): "o inc. XX do caput e o § 2º do art. 21" → inc. XX e § 2º do art. 21', igual(nos(44070), ['inc. xx do art. 21', '§ 2º do art. 21']));
ok('id 44114 (real): "os arts. 6º e 11 e os incs. I, II, III e IV do parágrafo único do art. 17, todos da LC 625" → 6 endereços', igual(nos(44114), ['art. 6º', 'art. 11', 'inc. i do parágrafo único do art. 17', 'inc. ii do parágrafo único do art. 17', 'inc. iii do parágrafo único do art. 17', 'inc. iv do parágrafo único do art. 17']));
ok('id 42014 (real): três grupos de incisos de artigos diferentes, "todos da LC 284" → 6 endereços', igual(nos(42014), ['inc. i do art. 41', 'inc. ii do art. 41', 'inc. i do art. 43', 'inc. ii do art. 43', 'inc. i do art. 44', 'inc. ii do art. 44']));
ok('id 41909 (real): "os incs. I e II do caput do art. 4º e os §§ 1º, 2º e 3º do art 6º, todos da Lei 9.329" → 5 endereços', igual(nos(41909), ['inc. i do art. 4º', 'inc. ii do art. 4º', '§ 1º do art. 6º', '§ 2º do art. 6º', '§ 3º do art. 6º']));
ok('id 42031 (real): "Ficam revogadas a LC 315/1994 e a LC 644/2010" → um revoke_lei por lei', igual(art(42031).map((k) => k.operacao + ':' + k.leiAlvo.chave), ['revoke_lei:lc 315/1994', 'revoke_lei:lc 644/2010']));
const i1 = art(37103).filter((k) => /revog/i.test(k.raw));
ok('id 37103 (real): "o caput e os §§ 1º e 2º do art. 9º" → indeterminado (caput isolado é decisão humana), sem revoke_node, com o código do motivo', i1.length === 1 && i1[0].operacao === 'indeterminado' && i1[0].codigoMotivo === 'revogacao_caput_ou_agrupador');
const i2 = art(45807).filter((k) => /revog/i.test(k.raw));
ok('id 45807 (real): "os incs. I a VIII do parágrafo único do art. 1º" → indeterminado (intervalo sem lei-base), nada revogado', i2.length === 1 && i2[0].operacao === 'indeterminado' && i2[0].codigoMotivo === 'revogacao_intervalo_sem_lei_base' && i2[0].leiAlvoDaCitacao.chave === 'lc 906/2021');
ok('negativo (real, id 45422 art. 14): "Ficam mantidos os benefícios… até que sejam revogados" não é revogação', !art(45422).some((k) => /^revoke_|^revoga|^indeterminado/.test(k.operacao)));
ok('negativo (real, id 30209 art. 111): "…não revogados…" no meio da frase não é revogação', !art(30209).some((k) => /^revoke_|^indeterminado/.test(k.operacao)));
const sint = (frase) => cmds(`LEI Nº 1\nEmenta.\nO PREFEITO MUNICIPAL\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:\nArt. 1º ${frase}\nArt. 2º Esta Lei entra em vigor na data de sua publicação.\nPREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de março de 2020.\nFulano,\nPrefeito.`).filter((k) => /revog/i.test(k.raw || ''));
const g = (f) => c.interpretarObjetosRevogados(f);
ok('(sintético) lei mista "o art. 3º da Lei 100 e o art. 5º da Lei 200" não aplica a 1ª lei aos dois: indeterminado', sint('Ficam revogados o art. 3º da Lei nº 100, de 1990, e o art. 5º da Lei nº 200, de 1991.').every((k) => k.operacao === 'indeterminado'));
ok('(sintético) "Ficam revogados os arts. 3º e 5º da LC 7" → 2 revoke_node (antes: nada, em silêncio)', sint('Ficam revogados os arts. 3º e 5º da Lei Complementar nº 7, de 7 de dezembro de 1973.').filter((k) => k.operacao === 'revoke_node').length === 2);
ok('(sintético) "Revogam-se os arts. 3º e 5º da LC 7" → 2 revoke_node (antes: revoke_lei da LC 7 inteira)', igual(sint('Revogam-se os arts. 3º e 5º da Lei Complementar nº 7, de 7 de dezembro de 1973.').map((k) => k.operacao), ['revoke_node', 'revoke_node']));
ok('(sintético) "Ficam revogadas as disposições em contrário" fica fora da gramática (sem revoke_ nem indeterminado: segue como era)', sint('Ficam revogadas as disposições em contrário.').every((k) => !/^revoke_|^indeterminado/.test(k.operacao)));
ok('(sintético) gramática: item, tabela, capítulo, decreto e "com seus" falham com código', g('o item 4 do art. 3º').ok === false && g('a Tabela II').codigo === 'revogacao_de_anexo_ou_tabela' && g('o Capítulo V, com seus arts. 29 a 34').codigo === 'revogacao_caput_ou_agrupador' && g('o Decreto nº 5').codigo === 'revogacao_de_ato_fora_do_acervo');
ok('(sintético) gramática: ancestral e filho na mesma lista ficam só com o ancestral', igual(g('o art. 5º e o § 1º do art. 5º').chaves, ['art. 5º']));
ok('(sintético) gramática: alínea sem inciso e nível fora de ordem falham', g('as als. a e b do art. 4º').ok === false && g('o art. 4º do § 2º').ok === false);
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
