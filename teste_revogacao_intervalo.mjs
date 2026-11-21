// teste_revogacao_intervalo.mjs — decisão 47: intervalo de dispositivos revogados ("os incs. I a VIII do parágrafo único do art. 1º",
// "os incs. IV a XII … do art. 21") expande CONTRA A LEI-ALVO: todos os dispositivos que existem entre os extremos, na ordem do texto.
// Sem a lei-alvo (ou com o índice de outra lei), ou com extremo que não existe nela: `indeterminado` (revogacao_intervalo_sem_lei_base) —
// o motor nunca inventa o intervalo. Textos REAIS do SAPL da PGM (dados/textos/sapl/<id>.txt). Sem rede.
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const ler = (id) => c.limparMarkdownLinks(prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8')));
const indiceBase = (id) => c.indexarVersao(c.criarVersaoOriginal(c.parseMinuta(ler(id)), { dataPublicacao: '2000-01-01' }));
const cmds = (alt, n, opts) => c.extrairComandosLei(c.parseMinuta(ler(alt)), opts).filter((k) => k.artigoOrigem === n);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const idx906 = indiceBase(43212);
const r1 = cmds(45807, 5, { leiBaseIndex: idx906, leiBaseConfere: (r) => r.chave === 'lc 906/2021' });
ok('id 45807 (real): "os incs. I a VIII do parágrafo único do art. 1º da LC 906/2021" com a base → os 8 incisos que existem, na ordem',
  igual(r1.map((k) => k.dispositivoAlvo), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((x) => `inc. ${x.toLowerCase()} do parágrafo único do art. 1º`)) && r1.every((k) => k.operacao === 'revoke_node' && k.leiAlvo.chave === 'lc 906/2021'));
ok('id 45807 (real): os endereços expandidos existem na base (é o que a lei-alvo tem, não um palpite)', r1.every((k) => idx906[k.dispositivoAlvo] !== undefined));
const sem = cmds(45807, 5, {});
ok('id 45807 (real): sem a lei-alvo, o intervalo fica indeterminado e nada é revogado', sem.length === 1 && sem[0].operacao === 'indeterminado' && sem[0].codigoMotivo === 'revogacao_intervalo_sem_lei_base');
const outra = cmds(45807, 5, { leiBaseIndex: idx906, leiBaseConfere: () => false });
ok('id 45807 (real): com o índice de OUTRA lei (leiBaseConfere falso), o intervalo não é expandido', outra.length === 1 && outra[0].operacao === 'indeterminado');
const idx197 = indiceBase(24762);
const r2 = cmds(34067, 2, { leiBaseIndex: idx197, leiBaseConfere: (r) => r.chave === 'lc 197/1989' });
const nos2 = r2.filter((k) => k.operacao === 'revoke_node').map((k) => k.dispositivoAlvo);
ok('id 34067 (real, LC 197/1989): "os incs. IV a XII e o parágrafo único do art. 21" → incs. IV a XII do art. 21 (os que existem) e o parágrafo único', ['iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'].every((x) => nos2.includes(`inc. ${x} do art. 21`)) && nos2.includes('parágrafo único do art. 21') && nos2.filter((x) => /^inc\. \w+ do art\. 21$/.test(x)).every((x) => idx197[x] !== undefined));
const r3 = cmds(49894, 5, { leiBaseIndex: indiceBase(28386), leiBaseConfere: (r) => r.chave === 'lc 369/1996' });
ok('id 49894 (real): extremo que não existe na base ("incs. VIII ao XVIII do art. 8º" na LC 369 original) → indeterminado, nada inventado', r3.length === 1 && r3[0].operacao === 'indeterminado' && r3[0].codigoMotivo === 'revogacao_intervalo_sem_lei_base');
const base = { 'art. 43': 'a', 'art. 44': 'b', 'art. 44-a': 'c', 'art. 45': 'd', '§ 1º do art. 45': 'e' };
ok('(sintético) expansão de artigos inclui o "-A" e ignora filhos', igual(c.expandirIntervaloNaBase({ nivel: 'art', de: '43', ate: '45', pai: '' }, base), ['art. 43', 'art. 44', 'art. 44-a', 'art. 45']));
ok('(sintético) extremo ausente ou invertido → null', c.expandirIntervaloNaBase({ nivel: 'art', de: '43', ate: '99', pai: '' }, base) === null && c.expandirIntervaloNaBase({ nivel: 'art', de: '45', ate: '43', pai: '' }, base) === null);
ok('(sintético) gramática: "os arts. 43 a 45" devolve intervalo; "os incs. I a III do art. 5º" leva o pai', (() => { const g = c.interpretarObjetosRevogados('os arts. 43 a 45'); const h = c.interpretarObjetosRevogados('os incs. I a III do art. 5º'); return g.ok && g.intervalos[0].de === '43' && h.intervalos[0].pai === 'art. 5º' && h.intervalos[0].nivel === 'inc'; })());
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
