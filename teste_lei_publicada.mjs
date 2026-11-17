import fs from 'node:fs';
import { parseLeiPublicada, criarVersaoOriginalDeLeiPublicada, indexarVersao } from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const lc320raw = fs.readFileSync('./lc320.txt', 'utf8').trim();

linha('parseLeiPublicada() — ponto de entrada único, sem risco de metadado de projeto');
const doc = parseLeiPublicada(lc320raw);
ok('tipoAto = LEI COMPLEMENTAR', doc.tipoAto === 'LEI COMPLEMENTAR');
ok('numero = 320', doc.numero === '320');
ok('ano = 1994', doc.ano === '1994');
ok('dataPublicacao = 1994-05-02', doc.dataPublicacao === '1994-05-02');
ok('proveniencia.promulgadoPor = PREFEITO', doc.proveniencia?.promulgadoPor === 'PREFEITO');
ok('§ 1º do art. 2º já vem marcado vetado=true (sem precisar chamar mais nada)', doc.artigos[1].children[0].vetado === true);
ok('34 artigos NÃO — LC 320 tem 14 artigos (confirma que não confundiu com outro documento)', doc.artigos.length === 14);

linha('criarVersaoOriginalDeLeiPublicada() — pipeline completo numa chamada só');
const v0 = criarVersaoOriginalDeLeiPublicada(lc320raw);
ok('v0.id correto', v0.id === 'lc 320/1994@1994-05-02');
ok('v0.urn correto', v0.urn === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1994-05-02;320');
ok('Todo artigo tem desFixo (atribuído por criarVersaoOriginal internamente)', v0.artigos.every(a => !!a.desFixo));
const idx = indexarVersao(v0);
ok('indexarVersao funciona sobre o resultado normalmente', idx['art. 1º']?.includes('Fica estabelecida'));

linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
