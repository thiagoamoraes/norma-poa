// teste_revogacao_parcial.mjs — duas revogações que o motor lia como "revoga a lei inteira" (revoke_lei) e não são:
//  (id 47547) "Fica revogado o item 4 do Anexo I da Lei Complementar nº 942, de 25 de maio de 2022." — revoga um ITEM de
//             anexo, não a lei: agora `indeterminado` (falha alto; o humano decide);
//  (id 27976) "Revogam-se as disposições em contrário, mantidas as condições … na Lei nº 6309, de 1988" — a lei só aparece
//             numa RESSALVA: agora cláusula genérica sem efeito.
// Textos REAIS do SAPL da PGM (fixtures/textos/revoga_*). Negativo: a revogação de lei inteira continua `revoke_lei`
// (Plano Diretor, id 30209, que revoga as LC 43/1979 e 182/1988, e um caso sintético). Sem rede. Uso: node teste_revogacao_parcial.mjs
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const cmds = (texto) => { const t = c.limparMarkdownLinks(texto); return c.extrairComandosLei(c.parseMinuta(t, c.detectNRCandidates(t)), {}); };
const lerFix = (id) => prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/revoga_${id}.txt`, 'utf8'));

const a = cmds(lerFix(47547)).filter((k) => /revogado o item 4/.test(k.raw || ''));
ok('id 47547 (real): "revogado o item 4 do Anexo I da LC 942/2022" NÃO é revoke_lei: é indeterminado, sem lei-alvo inteira', a.length === 1 && a[0].operacao === 'indeterminado' && !a[0].leiAlvo);
const b = cmds(lerFix(27976)).filter((k) => /disposições em contrário/.test(k.raw || ''));
ok('id 27976 (real): "disposições em contrário, mantidas … na Lei 6.309/1988" é cláusula genérica sem efeito (a lei da ressalva não é revogada)', b.length === 1 && b[0].operacao === 'clausula_generica_sem_efeito');
const pd = cmds(prepararTextoExtraido(fs.readFileSync('./dados/textos/sapl/30209.txt', 'utf8'))).filter((k) => k.operacao === 'revoke_lei').map((k) => k.leiAlvo.chave);
ok('negativo (real, Plano Diretor id 30209): a revogação de lei inteira ("Revogam-se a LC 43/1979 e a LC 182/1988") segue revoke_lei', pd.includes('lc 43/1979') && pd.includes('lc 182/1988'));
const s = cmds('LEI Nº 1\nEmenta.\nO PREFEITO MUNICIPAL\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:\nArt. 1º Fica revogada a Lei nº 5.000, de 10 de março de 1990.\nArt. 2º Esta Lei entra em vigor na data de sua publicação.');
ok('(sintético) negativo: "Fica revogada a Lei nº 5.000, de 1990" continua revoke_lei', s.some((k) => k.operacao === 'revoke_lei' && k.leiAlvo.chave === 'l 5000/1990'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
