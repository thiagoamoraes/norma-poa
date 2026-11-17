// teste_historico.mjs
//
// Histórico por dispositivo (ingestao/historico.mjs) com dado REAL: a LC 320/1994
// e as dez leis que a alteraram (mesmos textos de teste_versionamento.mjs),
// com a identidade de cada norma vinda de registros reais do catálogo
// (fixtures/sapl/registros_lc320.json). Sem rede. Uso: node teste_historico.mjs

import fs from 'node:fs';
import { apurarHistorico, chaveParaId } from './ingestao/historico.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

const regs = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_lc320.json', 'utf8'));
const reg = (numero) => regs.find((r) => r.numero === numero);
const arq = { 384: './lc384.txt', 412: './lc412.txt' };
const alteradoras = ['958', '384', '412', '449', '474', '514', '525', '692', '761', '849'] // fora de ordem de propósito
  .map((n) => ({ registro: reg(n), texto: fs.readFileSync(arq[n] || `./fixtures/lc320/lc${n}.txt`, 'utf8') }));
const h = apurarHistorico({ registro: reg('320'), texto: fs.readFileSync('./lc320.txt', 'utf8') }, alteradoras);
const d = (id) => h.dispositivos.find((x) => x.id === id);
const em = (id, k) => { let e = null; for (const s of d(id)?.estados || []) if (s.desde <= k) e = s; return e; };

ok('10 versões, em ordem de data mesmo com as alteradoras fora de ordem', h.versoes.length === 10 && h.versoes.map((v) => v.data).join() === [...h.versoes.map((v) => v.data)].sort().join());
ok('a versão 0 é o texto original; a última vem da LC 958/2022', h.versoes[0].fonte === null && /nº 958/.test(h.versoes[9].fonte.rotulo) && h.versoes[9].comandosAplicados === 50);
ok('79 endereços únicos (78 vigentes + o "parágrafo único" do art. 2º, que existiu de 1996 a 2004)', h.dispositivos.length === 79 && new Set(h.dispositivos.map((x) => x.id)).size === 79);
ok('art. 4º tem três redações: 1994, LC 384/1996 e LC 525/2005', d('art-4').estados.length === 3 && d('art-4').estados.map((e) => e.origem.lei || 'original').join(' | ') === 'original | Lei Complementar nº 384/1996 | Lei Complementar nº 525/2005');
ok('art. 4º como estava em 1998 (versão 2) é o texto da LC 384', /inclusive quando estes pertencerem/.test(em('art-4', 2).texto));
ok('art. 12-B não existe antes de 2022 e existe depois', em('art-12-B', 8) === null && em('art-12-B', 9).origem.operacao === 'insert_node');
ok('art. 7º: vigente até 2019, revogado em 2022 pela LC 958', em('art-7', 8).situacao === 'vigente' && em('art-7', 9).situacao === 'revogado' && em('art-7', 9).origem.lei === 'Lei Complementar nº 958/2022');
ok('dispositivo nunca alterado tem um estado só (art. 1º)', d('art-1').estados.length === 1 && d('art-1').estados[0].origem.operacao === 'promulgacao_original');
// --- art. 2º: o caso da LC 514/2004 (renumeração e texto novo em rótulo de vetado) ---
{
  const k514 = h.versoes.findIndex((v) => v.fonte && /nº 514/.test(v.fonte.rotulo));
  ok('a LC 514/2004 gera a sua versão (28/12/2004)', k514 === 4 && h.versoes[4].data === '2004-12-28');
  ok('parágrafo único do art. 2º: nasce em 1996 (LC 384) e deixa de existir em 2004, por renumeração',
    em('art-2/par-unico', 0) === null && em('art-2/par-unico', 1).origem.lei === 'Lei Complementar nº 384/1996' && em('art-2/par-unico', 3).situacao === 'vigente' && em('art-2/par-unico', 4).situacao === 'renumerado');
  ok('§ 3º do art. 2º: aparece em 2004 com o MESMO texto e a nota da renumeração; em 2005 ganha nova redação (LC 525)',
    em('art-2/par-3', 3) === null && em('art-2/par-3', 4).texto === em('art-2/par-unico', 3).texto && em('art-2/par-3', 4).renumerado.de === 'Parágrafo único' && em('art-2/par-3', 4).renumerado.lei === 'Lei Complementar nº 514/2004'
    && em('art-2/par-3', 5).origem.lei === 'Lei Complementar nº 525/2005' && em('art-2/par-3', 5).origem.operacao === 'replace_text');
  ok('§ 1º do art. 2º: vetado de 1994 a 2004; desde a LC 514, texto novo, com a exceção registrada',
    em('art-2/par-1', 3).situacao === 'vetado' && em('art-2/par-1', 4).situacao === 'vigente' && /30%/.test(em('art-2/par-1', 4).texto) && em('art-2/par-1', 4).ocupouPosicaoDeVetado === true);
  const ids = h.dispositivos.map((x) => x.id);
  ok('ordem de exibição: o parágrafo único antigo fica junto dos parágrafos do art. 2º', ids.indexOf('art-2/par-unico') > ids.indexOf('art-2/par-2') && ids.indexOf('art-2/par-unico') < ids.indexOf('art-3'));
}
ok('só resta UMA alteradora não aplicada: LC 449/2000 (endereço não reconhecido no arquivo da fonte)', h.naoAplicadas.length === 1 && h.naoAplicadas[0].motivo === 'comando_recusado' && /nº 449/.test(h.naoAplicadas[0].alteradora.rotulo));
ok('LC 692 (documento repetido no arquivo) NÃO conta como pendência', !h.naoAplicadas.some((x) => /nº 692/.test(x.alteradora.rotulo)));
{
  const c = Object.fromEntries(h.aConferir.map((x) => [x.id, x.desde]));
  ok('a conferir: só o art. 5º e subordinados, desde 19/06/2000 (LC 449); o art. 2º não está mais em dúvida',
    c['art-5'] === '2000-06-19' && c['art-5/inc-I'] === '2000-06-19' && !Object.keys(c).some((id) => id.startsWith('art-2')) && h.aConferir.length === 4);
}
ok('chaveParaId: chave do motor → endereço', chaveParaId('§ 3º do art. 2º') === 'art-2/par-3' && chaveParaId('inc. iii do art. 12-b') === 'art-12-B/inc-III' && chaveParaId('parágrafo único do art. 10') === 'art-10/par-unico' && chaveParaId('coisa nenhuma') === null);

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
