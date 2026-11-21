// teste_revogacao_endereco.mjs — decisão 45: revogação com endereço que o motor não entende NUNCA vira revogação do artigo/inciso/lei
// inteiros. Antes: "inc. XXVII do caput do art. 18" → revoke_node[art. 18] (o histórico gravado marcou o art. 18 inteiro como revogado),
// "al. i do inc. V" → revoke_node[inc. V], "Capítulo V, com seus arts. 29 a 34, da LC 12" → revoke_lei da LC 12 inteira.
// Textos REAIS do SAPL da PGM (fixtures/textos/revoga_end_<id>.txt: o artigo da alteradora). Sem rede. Uso: node teste_revogacao_endereco.mjs
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const cmds = (texto) => { const t = c.limparMarkdownLinks(texto); return c.extrairComandosLei(c.parseMinuta(t, c.detectNRCandidates(t)), {}); };
const rev = (id) => cmds(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/revoga_end_${id}.txt`, 'utf8'))).filter((k) => /revog/i.test(k.raw || ''));
const seguro = (id) => { const r = rev(id); return r.length >= 1 && r.every((k) => !/^revoke_/.test(k.operacao)); };

ok('id 44276 (real, LC 952/2022): "inc. XXVII do caput do art. 18 da LC 12" não revoga o art. 18 inteiro', seguro(44276));
ok('id 38944 (real): "inc. IV do caput do art. 21 da LC 7" não revoga o art. 21 inteiro', seguro(38944));
ok('id 51556 (real): "al. i do inc. V do art. 13 da LC 1.037" não revoga o inciso V inteiro', seguro(51556));
ok('id 50842 (real): "item 2 da al. b do inc. III do art. 1º da Lei 11.599" não revoga o inciso III inteiro', seguro(50842));
ok('id 38695 (real, OCR): "al. j dodo art. 20 da LC 7" não revoga o art. 20 inteiro', seguro(38695));
ok('id 46833 (real): "o Capítulo V, com seus arts. 29 a 34, da LC 12" não revoga a LC 12 inteira', seguro(46833));
ok('id 34079 (real): "a al. “e” do § 1º do art. 20" não revoga o § 1º nem o art. 20 (o bloco "e) REVOGADO" segue como alteração de texto)', seguro(34079));
ok('id 29259 (real): revogação do "caput" do art. 64 não é cláusula genérica nem revoga o artigo: indeterminado', seguro(29259));
ok('id 25133 (real): "especialmente o Capítulo I do Título III da LC 7" não revoga a LC 7 inteira', seguro(25133));
ok('id 35288 (real): "revoga a al. “c” do inc. III … art. 71" não revoga o art. 71 inteiro', rev(35288).filter((k) => /al\. .?c/.test(k.raw)).every((k) => k.operacao === 'indeterminado'));
ok('negativo (real, id 36177): "Fica revogado o § … do art. …" completo continua revoke_node com o endereço certo', rev(36177).some((k) => k.operacao === 'revoke_node' && k.dispositivoAlvo));
const pd = cmds(prepararTextoExtraido(fs.readFileSync('./dados/textos/sapl/30209.txt', 'utf8'))).filter((k) => k.operacao === 'revoke_lei').map((k) => k.leiAlvo.chave);
ok('negativo (real, Plano Diretor id 30209): revogação de lei inteira segue revoke_lei', pd.includes('lc 43/1979') && pd.includes('lc 182/1988'));
const sint = (frase) => cmds(`LEI Nº 1\nEmenta.\nO PREFEITO MUNICIPAL\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:\nArt. 1º ${frase}\nArt. 2º Esta Lei entra em vigor na data de sua publicação.\nPREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de março de 2020.\nFulano,\nPrefeito.`).filter((k) => /revog/i.test(k.raw || ''));
ok('(sintético) "Revogam-se os incs. II e III do art. 4º da LC 7" não revoga o art. 4º inteiro', sint('Revogam-se os incs. II e III do art. 4º da Lei Complementar nº 7, de 7 de dezembro de 1973.').every((k) => k.operacao === 'indeterminado'));
ok('(sintético) "Ficam revogados os §§ 1º e 2º do art. 4º da LC 7" não revoga o art. 4º inteiro', sint('Revogam-se os §§ 1º e 2º do art. 4º da Lei Complementar nº 7, de 7 de dezembro de 1973.').every((k) => k.operacao === 'indeterminado'));
ok('(sintético) negativo: "Fica revogado o § 2º do art. 4º da LC 7" continua revoke_node', sint('Fica revogado o § 2º do art. 4º da Lei Complementar nº 7, de 7 de dezembro de 1973.').some((k) => k.operacao === 'revoke_node' && k.dispositivoAlvo === '§ 2º do art. 4º'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
