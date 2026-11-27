// teste_historico_compilacao.mjs — rodada 61 (decisão 57, itens 2 e 3), histórico de versões (ingestao/historico.mjs). Sem rede.
//  (2) base que JÁ É compilação da fonte: `marcoDeCompilacao` lê o marcador do cabeçalho (3 formas REAIS: LO 1/1990 id 25277,
//      LC 12/1975 id 17878, LC 434/1999 id 30209; a LC 170/1987 e a LC 10/1974 não têm marcador → null) e as alteradoras até o marco
//      NÃO são reaplicadas;
//  (3) alteradora aplicada cuja estruturação está "a revisar": os dispositivos que ela mexeu ficam "a conferir".
// Os textos das 11 leis são REAIS (LC 320/1994 e as 10 que a alteraram); o marcador e a situação da estruturação usados nos casos
// de integração são SINTÉTICOS (inseridos pelo teste).
import fs from 'node:fs';
import { apurarHistorico, marcoDeCompilacao } from './ingestao/historico.mjs';
let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };

console.log('marcoDeCompilacao (cabeçalhos reais)');
const m1 = marcoDeCompilacao('LEI ORGÂNICA DO MUNICÍPIO DE PORTO ALEGRE\n   Atualizada até Emenda n.º 48, de 05.05.2022\n\nPREÂMBULO');
ok('LO 1/1990: "Atualizada até Emenda n.º 48, de 05.05.2022" → emenda 48, 05/05/2022', m1 && m1.tipo === 'EMENDA' && m1.numero === '48' && m1.data === '2022-05-05');
const m2 = marcoDeCompilacao('LEI COMPLEMENTAR Nº 12\n(ALTERAÇÕESINSERIDAS NO TEXTO ATÉ A LC 702/12)\nInstitui posturas');
ok('LC 12/1975: "(ALTERAÇÕESINSERIDAS NO TEXTO ATÉ A LC 702/12)" (palavras coladas pela extração) → LC 702 de 2012', m2 && m2.tipo === 'LC' && m2.numero === '702' && m2.ano === 2012);
const m3 = marcoDeCompilacao('Lei Complementar nº 434, de 1º de dezembro de 1999,\n   atualizada e compilada até a\nLei Complementar nº 667, de 3 de janeiro de 2011, incluindo a\n Lei Complementar 646, de 22 de julho de 2010.');
ok('LC 434/1999 (marcador em várias linhas) → LC 667, 03/01/2011', m3 && m3.numero === '667' && m3.data === '2011-01-03');
ok('texto sem marcador (LC 170/1987, LC 10/1974, lei comum) → null, nunca adivinha', marcoDeCompilacao('LEI COMPLEMENTAR Nº 170\nInstitui o código\nArt. 1º Texto.') === null && marcoDeCompilacao('') === null && marcoDeCompilacao(null) === null);
for (const id of [25277, 17878, 30209, 24099]) {
  const arq = `./dados/textos/sapl/${id}.txt`;
  if (!fs.existsSync(arq)) continue;
  const r = marcoDeCompilacao(fs.readFileSync(arq, 'utf8'));
  ok(`id ${id} (arquivo real): ${id === 24099 ? 'sem marcador → null' : 'marcador reconhecido (' + (r && r.rotulo) + ')'}`, id === 24099 ? r === null : !!r);
}

console.log('\nIntegração (LC 320/1994 real + 10 alteradoras reais; marcador e situação sintéticos)');
const regs = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_lc320.json', 'utf8'));
const reg = (n) => regs.find((r) => r.numero === n);
const arq = { 384: './lc384.txt', 412: './lc412.txt' };
const alt = (n, extra = {}) => ({ registro: reg(n), texto: fs.readFileSync(arq[n] || `./fixtures/lc320/lc${n}.txt`, 'utf8'), ...extra });
const todas = ['958', '384', '412', '449', '474', '514', '525', '692', '761', '849'];
const baseTxt = fs.readFileSync('./lc320.txt', 'utf8');
const sem = apurarHistorico({ registro: reg('320'), texto: baseTxt }, todas.map((n) => alt(n)));
ok('sem marcador: 10 versões, sem compilacaoDaFonte (comportamento de sempre)', sem.versoes.length === 10 && !sem.compilacaoDaFonte);
// (sintético) a base declara estar compilada até a LC 449 (data da LC 449 no catálogo real)
const dataLC449 = reg('449').data;
const compilada = apurarHistorico({ registro: reg('320'), texto: `(ALTERAÇÕES INSERIDAS NO TEXTO ATÉ A LC 449/${String(reg('449').ano).slice(2)})\n` + baseTxt }, todas.map((n) => alt(n)));
const anteriores = todas.filter((n) => reg(n).data <= dataLC449).sort();
ok(`(sintético) marcador "até a LC 449": as ${anteriores.length} alteradoras até essa data (${anteriores.join(', ')}) são incorporadas, não reaplicadas`,
  !!compilada.compilacaoDaFonte && compilada.compilacaoDaFonte.incorporadas.map((x) => reg(String(Number(x.rotulo.match(/nº ([\d.]+)/)[1].replace('.', '')))) ? String(Number(x.rotulo.match(/nº ([\d.]+)/)[1].replace('.', ''))) : '').sort().join() === anteriores.join());
ok('só as alteradoras POSTERIORES ao marco geram versão (1 + as posteriores)', compilada.versoes.length === 1 + (todas.length - anteriores.length));
ok('a versão 0 diz "compilada até" o marco, com a data da LC 449', compilada.versoes[0].compiladoAte && compilada.versoes[0].compiladoAte.data === dataLC449);
const semData = apurarHistorico({ registro: reg('320'), texto: '(ALTERAÇÕES INSERIDAS NO TEXTO ATÉ A LC 999/99)\n' + baseTxt }, todas.map((n) => alt(n)));
ok('marco que não se consegue situar (LC 999/99 fora da lista): NADA é pulado e o histórico avisa (semData)', semData.versoes.length === 10 && semData.compilacaoDaFonte.semData === true && semData.compilacaoDaFonte.incorporadas.length === 0);

console.log('\nAlteradora "a revisar" (situação sintética sobre texto real)');
const rev = apurarHistorico({ registro: reg('320'), texto: baseTxt }, todas.map((n) => alt(n, n === '514' ? { situacaoEstruturacao: 'revisar' } : { situacaoEstruturacao: 'aceita' })));
const ids514 = (rev.aConferir || []).filter((x) => x.desde === reg('514').data).map((x) => x.id);
ok('a LC 514 (aplicada, mas "a revisar") marca os dispositivos que mexeu como "a conferir" desde a data dela', ids514.length > 0);
ok('...e vem listada em aplicadasARevisar; as "aceitas" não geram nada', rev.aplicadasARevisar && rev.aplicadasARevisar.length === 1 && /nº 514/.test(rev.aplicadasARevisar[0].rotulo));
ok('sem situacaoEstruturacao "revisar", nada é marcado (LC 320 real: aConferir como antes)', !sem.aplicadasARevisar);
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
