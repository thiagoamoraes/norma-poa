// teste_revogacao_lista.mjs — decisão 46: lista de revogação em INCISOS ("Ficam revogados, na Lei X: I – o art. 45; II – …"). Cada item é lido
// sozinho, com a lei do item (senão a do caput): o que se lê limpo vira revoke_node/revoke_lei; o que não se lê (Tabela, "caput e seus §§",
// intervalo sem lei-base, decreto, revogação condicionada) vira `indeterminado` SÓ naquele item, com o código do motivo. Antes, tudo era
// silencioso (nao_classificado). Textos REAIS do SAPL da PGM (fixtures/textos/revoga_lista_<id>.txt: o artigo com os incisos). Sem rede.
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const cmds = (texto) => { const t = c.limparMarkdownLinks(texto); return c.extrairComandosLei(c.parseMinuta(t, c.detectNRCandidates(t)), {}); };
const art = (id) => cmds(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/revoga_lista_${id}.txt`, 'utf8'))).filter((k) => k.artigoOrigem === 1);
const res = (id) => art(id).map((k) => k.operacao + ':' + (k.dispositivoAlvo ?? k.leiAlvo?.chave ?? k.codigoMotivo));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

ok('id 43501 (real): lista na LC 7 — itens limpos viram revoke_node; "o caput do art. 47 e seus §§" e "as Tabelas II e III" ficam indeterminado (nunca o art. 47 inteiro)',
  igual(res(43501), ['revoke_node:al. e) do inc. ii do art. 2º', 'revoke_node:art. 45', 'revoke_node:art. 46', 'indeterminado:revogacao_caput_ou_agrupador', 'revoke_node:art. 48-a', 'revoke_node:art. 48-b', 'indeterminado:revogacao_de_anexo_ou_tabela']));
ok('id 43501 (real): todos os revoke_node da lista miram a LC 7/1973 (a lei do caput)', art(43501).filter((k) => k.operacao === 'revoke_node').every((k) => k.leiAlvo.chave === 'lc 7/1973'));
ok('id 46293 (real): "o parágrafo único do art. 52-L" é revoke_node; "als. … da Tabela IV" e "a Tabela V" são indeterminado (anexo/tabela)',
  igual(res(46293), ['revoke_node:parágrafo único do art. 52-l', 'indeterminado:revogacao_de_anexo_ou_tabela', 'indeterminado:revogacao_de_anexo_ou_tabela', 'indeterminado:revogacao_de_anexo_ou_tabela']));
ok('id 50200 (real): 4 itens "Tabela II … Anexo I..IV" → 4 indeterminado e nenhum revoke_node', art(50200).length === 4 && art(50200).every((k) => k.operacao === 'indeterminado' && k.codigoMotivo === 'revogacao_de_anexo_ou_tabela'));
const l41 = art(41098);
ok('id 41098 (real): "Ficam revogados:" com uma lei por item → cada revoke_node na SUA lei (nunca todos na 1ª)', l41.length === 13 && l41[0].leiAlvo.chave === 'l 9782/2005' && l41[1].leiAlvo.chave === 'l 9722/2005' && l41[5].leiAlvo.chave === 'l 1621/1956' && l41[11].leiAlvo.chave === 'l 9693/2004' && l41.every((k) => k.operacao === 'revoke_node'));
ok('id 50308 (real): "os §§ 5º e 6º do art. 4º; o inc. IV do art. 8º; o inc. VI do art. 9º" na Lei 4.080 → 4 revoke_node', igual(res(50308), ['revoke_node:§ 5º do art. 4º', 'revoke_node:§ 6º do art. 4º', 'revoke_node:inc. iv do art. 8º', 'revoke_node:inc. vi do art. 9º']));
ok('id 45422 (real): item com intervalo ("os incs. I a XXXI do art. 21") vira indeterminado; os outros itens ("e o inc. XIV do art. 71" com "e" inicial) são lidos',
  igual(res(45422), ['revoke_node:§ 8º do art. 3º-a', 'indeterminado:revogacao_intervalo_sem_lei_base', 'revoke_node:inc. xiv do art. 71']));
ok('id 41342 (real): item "o art. 1º da Lei 1.516/1955, na parte relativa a…" é revogação parcial: indeterminado (nunca revoke_node do art. 1º)', art(41342)[0].operacao === 'indeterminado' && art(41342)[0].codigoMotivo === 'revogacao_condicionada');
ok('id 51486 (real): item de lei inteira vira revoke_lei e o decreto, indeterminado (ato fora do acervo)', igual(res(51486), ['revoke_lei:l 3698/1972', 'indeterminado:revogacao_de_ato_fora_do_acervo']));
const n35 = art(35288);
ok('negativo (real, id 35288 art. 15): "Fica revogada, a partir de 1º de julho de 2007, a LC 207/1989 … que:" — os incisos são CONDIÇÕES, não objetos: segue o ramo antigo (revoke_lei da LC 207)', n35.length === 1 && n35[0].operacao === 'revoke_lei' && n35[0].leiAlvo.chave === 'lc 207/1989' && !n35[0].itemDaLista);
const s = (txt) => cmds(`LEI Nº 1\nEmenta.\nO PREFEITO MUNICIPAL\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:\nArt. 1º ${txt}\nArt. 2º Esta Lei entra em vigor na data de sua publicação.\nPREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de março de 2020.\nFulano,\nPrefeito.`).filter((k) => k.artigoOrigem === 1);
ok('(sintético) lista sem lei no caput nem no item: indeterminado, nunca revoke_node', s('Ficam revogados:\nI – o art. 3º;\nII – o art. 5º.').every((k) => k.operacao === 'indeterminado'));
ok('(sintético) item com subitens: indeterminado só naquele item', (() => { const r = s('Ficam revogados, na Lei Complementar nº 7, de 7 de dezembro de 1973:\nI – o art. 3º;\nII – os seguintes artigos:\na) o art. 8º;\nb) o art. 9º.'); return r[0].operacao === 'revoke_node' && r[0].dispositivoAlvo === 'art. 3º' && r.slice(1).every((k) => k.operacao !== 'revoke_node'); })());
ok('(sintético) item "VETADO." é pulado sem comando', s('Ficam revogados, na Lei Complementar nº 7, de 7 de dezembro de 1973:\nI – o art. 3º;\nII – VETADO.').length === 1);
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
