import fs from 'node:fs';
import { extrairCabecalhoLeiPublicada, urnLei, criarVersaoOriginal, parseMinuta, limparMarkdownLinks } from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

linha('urnLei() contra os 4 documentos reais (LC 320, 384, 412, 611)');

const lc320 = extrairCabecalhoLeiPublicada(fs.readFileSync('./lc320.txt', 'utf8').trim());
const lc384 = extrairCabecalhoLeiPublicada(limparMarkdownLinks(fs.readFileSync('./lc384.txt', 'utf8').trim()));
const lc412 = extrairCabecalhoLeiPublicada(limparMarkdownLinks(fs.readFileSync('./lc412.txt', 'utf8').trim()));

const urn320 = urnLei(lc320.tipoAto, lc320.numero, lc320.dataPublicacao);
const urn384 = urnLei(lc384.tipoAto, lc384.numero, lc384.dataPublicacao);
const urn412 = urnLei(lc412.tipoAto, lc412.numero, lc412.dataPublicacao);

console.log('  LC 320:', urn320);
console.log('  LC 384:', urn384);
console.log('  LC 412:', urn412);

ok('LC 320: urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1994-05-02;320',
  urn320 === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1994-05-02;320');
ok('LC 384: data e número corretos', urn384 === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1996-09-04;384');
ok('LC 412: data e número corretos', urn412 === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1998-03-24;412');

const lc611cabecalho = extrairCabecalhoLeiPublicada('LEI COMPLEMENTAR Nº 611, de 3 de fevereiro de 2009\n\nDISPÕE SOBRE A ELABORAÇÃO...');
ok('LC 611: cabeçalho extraído (dia sem zero à esquerda: "3 de fevereiro", sem ponto final)', lc611cabecalho?.dataPublicacao === '2009-02-03');
const urn611 = lc611cabecalho ? urnLei(lc611cabecalho.tipoAto, lc611cabecalho.numero, lc611cabecalho.dataPublicacao) : null;
console.log('  LC 611:', urn611);
ok('LC 611: urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:2009-02-03;611',
  urn611 === 'urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:2009-02-03;611');

linha('criarVersaoOriginal() carrega urn junto com id (aditivo, não substitui)');
{
  const raw = fs.readFileSync('./lc320.txt', 'utf8').trim();
  const doc = parseMinuta(raw);
  const v0 = criarVersaoOriginal(doc, lc320);
  ok('v0.urn presente e correto', v0.urn === urn320);
  ok('v0.id continua no formato interno (chaveLei), não substituído', v0.id === 'lc 320/1994@1994-05-02');
}

linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
