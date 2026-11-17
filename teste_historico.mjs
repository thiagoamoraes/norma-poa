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

ok('9 versões, em ordem de data mesmo com as alteradoras fora de ordem', h.versoes.length === 9 && h.versoes.map((v) => v.data).join() === [...h.versoes.map((v) => v.data)].sort().join());
ok('a versão 0 é o texto original; a última vem da LC 958/2022', h.versoes[0].fonte === null && /nº 958/.test(h.versoes[8].fonte.rotulo) && h.versoes[8].comandosAplicados === 50);
ok('79 dispositivos, com endereços únicos', h.dispositivos.length === 79 && new Set(h.dispositivos.map((x) => x.id)).size === 79);
ok('art. 4º tem três redações: 1994, LC 384/1996 e LC 525/2005', d('art-4').estados.length === 3 && d('art-4').estados.map((e) => e.origem.lei || 'original').join(' | ') === 'original | Lei Complementar nº 384/1996 | Lei Complementar nº 525/2005');
ok('art. 4º como estava em 1998 (versão 2) é o texto da LC 384', /inclusive quando estes pertencerem/.test(em('art-4', 2).texto));
ok('art. 12-B não existe antes de 2022 e existe depois', em('art-12-B', 7) === null && em('art-12-B', 8).origem.operacao === 'insert_node');
ok('art. 7º: vigente até 2019, revogado em 2022 pela LC 958', em('art-7', 7).situacao === 'vigente' && em('art-7', 8).situacao === 'revogado' && em('art-7', 8).origem.lei === 'Lei Complementar nº 958/2022');
ok('dispositivo nunca alterado tem um estado só (art. 1º)', d('art-1').estados.length === 1 && d('art-1').estados[0].origem.operacao === 'promulgacao_original');
ok('as duas alteradoras não aplicadas são declaradas: LC 449/2000 (recusada) e LC 514/2004 (não reconhecida)',
  h.naoAplicadas.length === 2 && h.naoAplicadas.map((x) => x.motivo).join() === 'comando_recusado,comando_nao_reconhecido' && /nº 449/.test(h.naoAplicadas[0].alteradora.rotulo) && /nº 514/.test(h.naoAplicadas[1].alteradora.rotulo));
ok('LC 692 (documento repetido no arquivo) NÃO conta como pendência', !h.naoAplicadas.some((x) => /nº 692/.test(x.alteradora.rotulo)));
{
  const c = Object.fromEntries(h.aConferir.map((x) => [x.id, x.desde]));
  ok('a conferir: art. 2º e subordinados desde 28/12/2004 (LC 514); art. 5º e subordinados desde 19/06/2000 (LC 449)',
    c['art-2'] === '2004-12-28' && c['art-2/par-1'] === '2004-12-28' && c['art-2/par-3'] === '2004-12-28' && c['art-5'] === '2000-06-19' && c['art-5/inc-I'] === '2000-06-19');
  ok('o que nenhuma alteradora pendente cita não é posto em dúvida (art. 4º, art. 8º)', !('art-4' in c) && !('art-8' in c) && h.aConferir.length === 10);
}
ok('chaveParaId: chave do motor → endereço', chaveParaId('§ 3º do art. 2º') === 'art-2/par-3' && chaveParaId('inc. iii do art. 12-b') === 'art-12-B/inc-III' && chaveParaId('parágrafo único do art. 10') === 'art-10/par-unico' && chaveParaId('coisa nenhuma') === null);

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
