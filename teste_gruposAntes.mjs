import fs from 'node:fs';
import { parseMinuta, marcarEstadosEspeciais, visText, extrairCabecalhoLeiPublicada } from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const raw = fs.readFileSync('./lc611.txt', 'utf8').trim();

linha('parseMinuta() na LC 611/2009 — Título/Capítulo/Seção/Subseção (nunca testado com dado real até agora)');
const doc = parseMinuta(raw);
marcarEstadosEspeciais(doc);

ok('34 artigos parseados', doc.artigos.length === 34);

const art1 = doc.artigos[0];
ok('Art. 1º tem gruposAntes (TÍTULO I)', Array.isArray(art1.gruposAntes) && art1.gruposAntes.length === 1);
ok('TÍTULO I: tipo=titulo, numero=I', art1.gruposAntes[0].tipo === 'titulo' && art1.gruposAntes[0].numero === 'I');
ok('TÍTULO I: titulo="DAS DISPOSIÇÕES PRELIMINARES"', art1.gruposAntes[0].titulo === 'DAS DISPOSIÇÕES PRELIMINARES');

const art2 = doc.artigos[1];
ok('Art. 2º acumula TRÊS agrupadores abertos ao mesmo tempo (Título II > Capítulo I > Seção I)',
  Array.isArray(art2.gruposAntes) && art2.gruposAntes.length === 3);
ok('Art. 2º: primeiro grupo é TÍTULO II', art2.gruposAntes[0].tipo === 'titulo' && art2.gruposAntes[0].numero === 'II');
ok('Art. 2º: segundo grupo é CAPÍTULO I', art2.gruposAntes[1].tipo === 'capitulo' && art2.gruposAntes[1].numero === 'I');
ok('Art. 2º: terceiro grupo é Seção I ("Da Estruturação Das Leis")',
  art2.gruposAntes[2].tipo === 'secao' && art2.gruposAntes[2].titulo === 'Da Estruturação Das Leis');

const art10 = doc.artigos[9];
ok('Art. 10 (nova Seção II, mesmo Capítulo/Título) NÃO repete Título/Capítulo, só a nova Seção',
  art10.gruposAntes.length === 1 && art10.gruposAntes[0].tipo === 'secao' && art10.gruposAntes[0].numero === 'II');

const art19 = doc.artigos[18];
ok('Art. 19 abre CAPÍTULO II ("DA COLETÂNEA, DA COMPILAÇÃO...") + Seção I',
  art19.gruposAntes.some(g => g.tipo === 'capitulo' && g.numero === 'II') &&
  art19.gruposAntes.some(g => g.tipo === 'secao' && g.numero === 'I'));

const art21 = doc.artigos[20];
ok('Art. 21 abre Subseção I ("Da Compilação") dentro da Seção II',
  art21.gruposAntes.some(g => g.tipo === 'subsecao' && g.numero === 'I' && g.titulo === 'Da Compilação'));

const art22 = doc.artigos[21];
ok('Art. 22 abre Subseção II ("Dos Projetos de Consolidação")',
  art22.gruposAntes.some(g => g.tipo === 'subsecao' && g.numero === 'II'));

linha('Achados corretos de conteúdo (validação cruzada com o texto oficial)');

ok('Art. 13 tem 24 incisos (I a XXIV)', art1 && doc.artigos[12].children.filter(c => c.tipo === 'inciso').length === 24);
const art13 = doc.artigos[12];
const incXXIV = art13.children.filter(c => c.tipo === 'inciso').at(-1);
ok('Art. 13, inc. XXIV é sobre REVOGADO/VETADO (base legal já usada por marcarEstadosEspeciais)',
  visText(incXXIV).includes('REVOGADO') && visText(incXXIV).includes('VETADO'));

const art17 = doc.artigos[16];
ok('Art. 17, § único, tem o texto do sufixo de letra (base legal de suggestDesFixo)',
  visText(art17.children.find(c => c.tipo === 'paragrafo')).includes('hífen e letra maiúscula'));

const cab = extrairCabecalhoLeiPublicada(raw);
ok('extrairCabecalhoLeiPublicada: dia sem zero à esquerda ("3 de fevereiro")', cab?.dataPublicacao === '2009-02-03');

linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
