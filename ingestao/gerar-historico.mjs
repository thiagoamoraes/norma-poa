#!/usr/bin/env node
// ingestao/gerar-historico.mjs
//
// Para cada lei listada em dados/historico/_piloto.json, apura o histórico
// (ingestao/historico.mjs) e grava dados/historico/sapl/<idSapl>.json.
// Sem rede. Uso: node ingestao/gerar-historico.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { apurarHistorico } from './historico.mjs';
import { lerJsonl, agora } from './sapl-io.mjs';

const catalogo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);
}
const lista = JSON.parse(await readFile('./dados/historico/_piloto.json', 'utf8')).leis;
await mkdir('./dados/historico/sapl', { recursive: true });

async function carregar(item) {
  const registro = catalogo.get(item.idSapl);
  if (!registro) throw new Error(`idSapl ${item.idSapl} não está no catálogo`);
  const arq = item.arquivo && existsSync(item.arquivo) ? item.arquivo : `./dados/textos/sapl/${item.idSapl}.txt`;
  if (!existsSync(arq)) return { registro, texto: null };
  return { registro, texto: (await readFile(arq, 'utf8')).replace(/\f/g, '\n') };
}

let falhas = 0;
for (const lei of lista) {
  try {
    const base = await carregar(lei.base);
    if (!base.texto) throw new Error('texto da lei-base ainda não disponível');
    const alts = [];
    const semTexto = [];
    for (const a of lei.alteradoras) { const x = await carregar(a); (x.texto ? alts : semTexto).push(x); }
    const h = apurarHistorico(base, alts);
    for (const x of semTexto) h.naoAplicadas.push({ alteradora: { idSapl: x.registro.idSapl, rotulo: x.registro.rotulo }, motivo: 'texto_indisponivel', detalhe: 'o texto desta alteradora ainda não foi baixado ou extraído', enderecos: [] });
    const saida = { idSapl: base.registro.idSapl, rotulo: base.registro.rotulo, geradoEm: agora(), ...h };
    await writeFile(`./dados/historico/sapl/${base.registro.idSapl}.json`, JSON.stringify(saida, null, 1) + '\n');
    console.log(`${agora()} histórico: ${base.registro.rotulo} — ${h.versoes.length} versões, ${h.dispositivos.length} dispositivos, ${h.naoAplicadas.length} alteradora(s) não aplicada(s) por inteiro, ${h.aConferir.length} dispositivo(s) a conferir`);
  } catch (e) {
    falhas++;
    console.error(`ERRO no histórico de idSapl ${lei.base.idSapl}: ${e.message}`);
  }
}
process.exit(falhas ? 1 : 0);
