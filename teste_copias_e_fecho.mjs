// teste_copias_e_fecho.mjs — duas leituras do PREPARO (decisões 28 e 29, 21/11/2026), com textos REAIS do SAPL da PGM:
//  (28) o PDF traz a mesma lei 2 ou 3 vezes (timbre + texto + fecho); só a 1ª cópia é lida, se as cópias forem
//       IGUAIS em letras e algarismos. Qualquer diferença: não mexe e a norma continua acusada.
//  (29) fecho com o espaçamento estragado pela extração ("PREFEITURAMUNICIPAL", "M UN ICIPA L", "6 d e ju lho de" +
//       "201 1.") ou colado ao fim da linha do último artigo (DOCX); fecho de OCR com mês ilegível NÃO é recuperado.
// Fixtures em fixtures/textos/copia_fecho_*. Sem rede. Uso: node teste_copias_e_fecho.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/copia_fecho_registros.json', 'utf8'));
const bruto = (id) => fs.readFileSync(`./fixtures/textos/copia_fecho_${id}.txt`, 'utf8');
const roda = (id, texto = bruto(id)) => estruturarNorma(prepararTextoExtraido(texto), regs.find((r) => r.idSapl === id)).verificacao;
const cont = (t, re) => (t.match(re) || []).length;

// (28) cópias
for (const id of [39259, 38800, 36907].filter((i) => fs.existsSync(`./fixtures/textos/copia_fecho_${i}.txt`))) {
  ok(`id ${id} (real): o arquivo traz "Art. 1º" 3 vezes e o texto lido, uma`, cont(bruto(id), /^\s*Art\. *1[º°o]/gm) === 3 && cont(prepararTextoExtraido(bruto(id)), /^\s*Art\. *1[º°o]/gm) === 1);
  ok(`id ${id} (real): sem "bloco_de_alteracao_sem_dono"`, !roda(id).motivos.includes('bloco_de_alteracao_sem_dono'));
}
ok('id 39600 (real): a cópia repetida deixa de ser lida (o "Art. 1º" aparece uma vez no texto lido)', cont(prepararTextoExtraido(bruto(39600)), /^\s*Art\. *1[º°o]/gm) === 1);
// negativo: cópia com UMA palavra trocada não é removida
{
  const t = bruto(39259);
  const i2 = t.indexOf('Art. 1', t.indexOf('Art. 1') + 10);
  const alterado = t.slice(0, i2) + t.slice(i2).replace(/\bMunicípio\b/, 'Município de Teste');
  ok('(sintético) negativo: uma das cópias com palavra acrescentada NÃO é removida (continua tudo no texto lido)', cont(prepararTextoExtraido(alterado), /^\s*Art\. *1[º°o]/gm) === 3);
}
// (29) fecho
for (const id of [37172, 36824, 37562, 37403]) ok(`id ${id} (real): fecho com espaçamento estragado é reconhecido (sem "sem_fecho")`, !roda(id).motivos.includes('sem_fecho'));
ok('id 37172 (real): o "º" do dia é preservado', /PREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de fevereiro de 2011\./.test(prepararTextoExtraido(bruto(37172))));
ok('id 48855 (real, DOCX): fecho colado ao fim da linha do último artigo é separado', !roda(48855).motivos.includes('sem_fecho') && /\nPREFEITURA MUNICIPAL DE PORTO ALEGRE, 8 de julho de 2024\.$/m.test(prepararTextoExtraido(bruto(48855))));
ok('ids 44305 e 41347 (reais, OCR com mês ilegível): continuam "sem_fecho" (não se corrige OCR)', roda(44305).motivos.includes('sem_fecho') && roda(41347).motivos.includes('sem_fecho'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
