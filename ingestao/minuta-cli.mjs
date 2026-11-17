#!/usr/bin/env node
// ingestao/minuta-cli.mjs
//
// Gera a minuta de lei alteradora a partir de um arquivo de pedidos e CONFERE
// (ida e volta pelo motor) antes de mostrar. Sem rede.
//
// Uso:  node ingestao/minuta-cli.mjs pedidos.json  [> minuta.txt]
//
// pedidos.json:
//   { "idSapl": 27569,
//     "explicacao": "vedando …",
//     "pedidos": [ { "operacao": "nova_redacao", "alvo": "art-3", "texto": "…" },
//                  { "operacao": "inclusao", "pai": "art-2", "tipo": "paragrafo", "texto": "…" },
//                  { "operacao": "inclusao_artigo", "apos": "art-12-B", "texto": "…" },
//                  { "operacao": "revogacao", "alvo": "art-6" } ] }
//
// A lei precisa ter histórico apurado em dados/historico/sapl/<idSapl>.json.
// Os endereços ("art-8/par-2") são os mesmos que a página de consulta mostra.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { gerarMinuta } from './minuta.mjs';
import { conferirMinuta } from './minuta-conferencia.mjs';
import { lerJsonl } from './sapl-io.mjs';

const arq = process.argv[2];
if (!arq) { console.error('uso: node ingestao/minuta-cli.mjs pedidos.json'); process.exit(2); }
const pedido = JSON.parse(await readFile(arq, 'utf8'));
const arqHist = `./dados/historico/sapl/${pedido.idSapl}.json`;
if (!existsSync(arqHist)) { console.error(`ERRO: não há histórico apurado para idSapl ${pedido.idSapl} (${arqHist}).`); process.exit(1); }
const h = JSON.parse(await readFile(arqHist, 'utf8'));
let lei = null;
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) if (r.idSapl === pedido.idSapl) lei = r;
}
if (!lei) { console.error(`ERRO: idSapl ${pedido.idSapl} não está no catálogo.`); process.exit(1); }

const vigente = h.dispositivos.map((d) => ({ id: d.id, pai: d.pai, tipo: d.tipo, rotulo: d.rotulo, ...d.estados[d.estados.length - 1] })).filter((d) => d.situacao !== 'renumerado');
const duvidosos = new Set((h.aConferir || []).map((x) => x.id));
const m = gerarMinuta({ lei, dispositivos: vigente, pedidos: pedido.pedidos, explicacao: pedido.explicacao, temAlteracoes: h.versoes.length > 1 });
for (const a of m.avisos) console.error(`AVISO: ${a}`);
if (m.erros.length) { for (const e of m.erros) console.error(`ERRO: ${e}`); process.exit(1); }
for (const p of m.pedidosResolvidos) if ([...duvidosos].some((d) => p.id === d || p.id.startsWith(d + '/') || d.startsWith(p.id + '/'))) console.error(`AVISO: ${p.id} está marcado como "não conferido" no histórico desta lei — confira o texto vigente na fonte antes de usar a minuta.`);
const conf = conferirMinuta(m.texto, vigente, m.pedidosResolvidos, m.renumeracoes);
if (!conf.confere) {
  console.error('ERRO: a minuta gerada NÃO passou na conferência de ida e volta — o motor não leu de volta o que foi pedido. Não use este texto.');
  console.error(JSON.stringify({ faltando: conf.faltando, sobrando: conf.sobrando, divergentes: conf.divergentes }, null, 1));
  process.exit(1);
}
console.error(`conferida: o motor leu de volta os ${conf.comandosLidos} comando(s) pedidos.`);
process.stdout.write(m.texto);
