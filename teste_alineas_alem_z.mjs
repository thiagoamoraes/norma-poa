// teste_alineas_alem_z.mjs — alíneas depois do "z": a lei de Porto Alegre usa duas práticas, "aa, ab, ac" (sequencial)
// e "aa, bb, cc" (dobrada). O motor segue o rótulo ESCRITO quando são duas letras (decisão 26, 20/11/2026);
// antes do "z" o endereço continua sendo o da posição. Textos REAIS do SAPL da PGM: id 42407 (sequencial) e id 38217
// (dobrada), em fixtures/textos/alineas_*. Sem rede. Uso: node teste_alineas_alem_z.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/alineas_registros.json', 'utf8'));
const roda = (id) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/alineas_${id}.txt`, 'utf8')), regs.find((r) => r.idSapl === id));
const rotulosAl = (e) => e.dispositivos.filter((d) => /\/ali-/.test(d.id || d.endereco || '')).map((d) => (d.id || d.endereco).split('/').pop());

const seq = roda(42407);
ok('id 42407 (real, "aa, ab, ac"): sem "rotulo_nao_confere_com_a_origem"', !seq.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
ok('id 42407 (real): o endereço das alíneas depois do "z" é o escrito (ali-ab, ali-ac), não "bb"/"cc"', rotulosAl(seq).includes('ali-ab') && rotulosAl(seq).includes('ali-ac') && !rotulosAl(seq).includes('ali-bb'));
// a prática dobrada ("aa, bb, cc") não aparece em nenhuma norma estruturada do acervo; a conferência disso é sintética
const letras = 'abcdefghijklmnopqrstuvwxyz'.split('');
const montar = (depoisDoZ) => ['LEI COMPLEMENTAR Nº 1', 'Ementa do teste.', 'O PREFEITO MUNICIPAL DE PORTO ALEGRE', 'Faço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei Complementar:', 'Art. 1º Para os efeitos desta Lei:', 'I – os itens:',
  ...letras.map((l) => `${l}) texto ${l};`), ...depoisDoZ.map((l) => `${l}) texto ${l};`), 'Art. 2º Esta Lei entra em vigor na data de sua publicação.'].join('\n');
const regSint = { ...regs[0], idSapl: 0 };
const vDob = estruturarNorma(montar(['aa', 'bb', 'cc']), regSint);
ok('(sintético) forma dobrada "aa, bb, cc": o endereço continua sendo o escrito (ali-bb) e confere', vDob.dispositivos.some((d) => /ali-bb$/.test(d.id)) && !vDob.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
const vSeq = estruturarNorma(montar(['aa', 'ab', 'ac']), regSint);
ok('(sintético) forma sequencial "aa, ab, ac": o endereço é o escrito (ali-ab) e confere', vSeq.dispositivos.some((d) => /ali-ab$/.test(d.id)) && !vSeq.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
