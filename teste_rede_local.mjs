// teste_rede_local.mjs
//
// Comportamento de ingestao/sapl-io.mjs diante de falha de rede, contra um
// servidor LOCAL (127.0.0.1) que derruba conexões, devolve 404/500 ou não
// responde — o que a base da PGM fez de verdade em 17/11/2026 ("fetch failed"
// em 1 de cada ~8 arquivos, cada tentativa falhando em ~10 s).
// Os tempos só encolhem com TESTE_RAPIDO=1 E endereço local; para servidor de
// verdade a etiqueta de 1 requisição por minuto não muda. Uso: node teste_rede_local.mjs

process.env.TESTE_RAPIDO = '1';
import http from 'node:http';
import { requisitar, ErroDefinitivo, ErroTemporario, descreverErro } from './ingestao/sapl-io.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

let comportamento = () => 'ok';
let acessos = 0;
const servidor = http.createServer((req, res) => {
  acessos++;
  const c = comportamento(acessos);
  if (c === 'derrubar') return req.socket.destroy();
  if (c === 'sumir') return; // nunca responde
  if (c === '404') { res.statusCode = 404; return res.end('não existe'); }
  if (c === '500') { res.statusCode = 500; return res.end('erro'); }
  if (req.url.endsWith('.json')) { res.setHeader('content-type', 'application/json'); return res.end('{"a":1}'); }
  res.setHeader('content-type', 'application/pdf'); res.end(Buffer.from('%PDF-1.4 conteudo'));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const url = (c) => `http://127.0.0.1:${servidor.address().port}/${c}`;
const rodar = async (fn, tipo = 'binario', nome = 'arq.pdf') => { acessos = 0; comportamento = fn; try { return { r: await requisitar(url(nome), tipo) }; } catch (e) { return { e }; } };

{
  const { r } = await rodar((n) => (n <= 2 ? 'derrubar' : 'ok'));
  ok('conexão derrubada 2 vezes e a 3ª tentativa passa: devolve o arquivo (3 acessos)', r && r.bytes.toString().startsWith('%PDF') && acessos === 3);
}
{
  const { e } = await rodar(() => 'derrubar');
  ok('conexão derrubada nas 3 tentativas: ErroTemporario (não ErroDefinitivo), depois de exatamente 3 acessos', e instanceof ErroTemporario && !(e instanceof ErroDefinitivo) && acessos === 3);
  ok('…e a mensagem traz a CAUSA real, não só "fetch failed" (era o que o log mostrava)', /fetch failed \(/.test(e.causa) && e.causa.length > 'fetch failed'.length + 5);
  ok('descreverErro: erro sem causa devolve só a mensagem', descreverErro(new Error('x')) === 'x');
}
{
  const { e } = await rodar(() => '404');
  ok('HTTP 404: ErroDefinitivo na 1ª tentativa, sem repetir (1 acesso)', e instanceof ErroDefinitivo && e.status === 404 && acessos === 1);
}
{
  const { r } = await rodar((n) => (n <= 2 ? '500' : 'ok'));
  ok('HTTP 500 duas vezes e depois 200: repete e devolve (3 acessos)', r && acessos === 3);
}
{
  const { r } = await rodar(() => 'ok', 'json', 'dados.json');
  ok('JSON: devolve o objeto', r && r.a === 1);
}
{
  const { e } = await rodar(() => 'sumir');
  ok('servidor que não responde: cada tentativa tem prazo e, esgotadas, vira ErroTemporario (não prende a rotina)', e instanceof ErroTemporario && acessos === 3);
}

servidor.closeAllConnections?.();
await new Promise((r) => servidor.close(r));
console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
