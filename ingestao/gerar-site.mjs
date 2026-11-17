#!/usr/bin/env node
// ingestao/gerar-site.mjs
//
// Gera o arquivo de dados da página de consulta (docs/): um JSON compacto com
// o catálogo inteiro. Sem rede. Uso: node ingestao/gerar-site.mjs

import { readFile, writeFile, mkdir, readdir, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { lerJsonl, agora } from './sapl-io.mjs';

const NOMES = { 1: 'Lei Orgânica', 2: 'Emenda à Lei Orgânica', 6: 'Lei Complementar', 5: 'Lei' };
const ultimo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) ultimo.set(r.idSapl, r);
}
const situacao = existsSync('./dados/estruturado/_situacao.json') ? JSON.parse(await readFile('./dados/estruturado/_situacao.json', 'utf8')) : {};
const revogadas = existsSync('./dados/historico/_situacao.json') ? JSON.parse(await readFile('./dados/historico/_situacao.json', 'utf8')).revogadas || {} : {};
const baixados = new Set((await lerJsonl('./dados/textos/sapl/_indice.jsonl')).filter((l) => l.situacao === 'baixado').map((l) => l.idSapl));

// colunas: id, tipo, número, data, ementa, texto (0 sem · 1 só na fonte · 2 baixado), estrutura (0 não · 1 aceita · 2 revisar),
//          url do arquivo na fonte, palavras-chave (campo "indexação" da fonte), histórico apurado (0/1),
//          id de quem revogou a norma por inteiro (0 se ninguém)
await mkdir('./docs/dados', { recursive: true });
const normas = [...ultimo.values()]
  .sort((a, b) => String(b.data).localeCompare(String(a.data)) || b.idSapl - a.idSapl)
  .map((r) => [r.idSapl, r.tipoSapl, r.numero, r.data, (r.ementa || '').replace(/\s+/g, ' ').trim(),
    baixados.has(r.idSapl) ? 2 : r.texto?.url ? 1 : 0,
    situacao[r.idSapl] === 'aceita' ? 1 : situacao[r.idSapl] === 'revisar' ? 2 : 0,
    r.texto?.url || '',
    (r.indexacao || '').split(/[;\r\n]+/).map((s) => s.trim()).filter(Boolean).join('; '),
    existsSync(`./dados/historico/sapl/${r.idSapl}.json`) ? 1 : 0,
    revogadas[r.idSapl] || 0]);

await writeFile('./docs/dados/catalogo.json', JSON.stringify({ geradoEm: agora(), tipos: NOMES, normas }) + '\n');
// ── Texto dos dispositivos, para a busca dentro do texto ───────────────────────
// Uma linha por dispositivo VIGENTE: [idSapl, idDispositivo, texto]. De onde vem:
// do histórico da lei (última versão), quando há; senão, da estruturação ACEITA.
// Norma em revisão não entra: a busca no texto só oferece o que foi conferido.
// Em fatias de ~1,5 MB, que a página baixa só se a pessoa ligar a opção.
{
  const linhasTexto = [];
  for (const r of ultimo.values()) {
    const id = r.idSapl;
    const arqH = `./dados/historico/sapl/${id}.json`;
    const arqE = `./dados/estruturado/sapl/${id}.json`;
    if (existsSync(arqH)) {
      const h = JSON.parse(await readFile(arqH, 'utf8'));
      for (const d of h.dispositivos) {
        const e = d.estados[d.estados.length - 1];
        if (e.situacao === 'vigente' && e.texto) linhasTexto.push([id, d.id, e.texto]);
      }
    } else if (situacao[id] === 'aceita' && existsSync(arqE)) {
      const e = JSON.parse(await readFile(arqE, 'utf8'));
      for (const d of e.dispositivos) if (!d.vetado && !d.revogado && d.texto) linhasTexto.push([id, d.id, d.texto]);
    }
  }
  for (const f of (await readdir('./docs/dados')).filter((f) => /^texto-\d+\.json$/.test(f))) await unlink(`./docs/dados/${f}`);
  let fatia = [], tamanho = 0, nFatias = 0;
  const fechar = async () => { if (fatia.length) { await writeFile(`./docs/dados/texto-${String(++nFatias).padStart(3, '0')}.json`, JSON.stringify(fatia) + '\n'); fatia = []; tamanho = 0; } };
  for (const l of linhasTexto) { fatia.push(l); tamanho += l[2].length + 40; if (tamanho > 1_500_000) await fechar(); }
  await fechar();
  await writeFile('./docs/dados/texto-indice.json', JSON.stringify({ geradoEm: agora(), fatias: nFatias, dispositivos: linhasTexto.length, normas: new Set(linhasTexto.map((l) => l[0])).size }) + '\n');
  console.log(`${agora()} site: ${linhasTexto.length} dispositivos em ${nFatias} fatia(s) de texto`);
}

// A página redige e confere minutas no próprio navegador: leva uma cópia dos
// módulos puros (mesma árvore de pastas, para os imports relativos valerem).
await mkdir('./docs/js/ingestao', { recursive: true });
await copyFile('./norma-core.js', './docs/js/norma-core.js');
await copyFile('./ingestao/minuta.mjs', './docs/js/ingestao/minuta.mjs');
await copyFile('./ingestao/minuta-conferencia.mjs', './docs/js/ingestao/minuta-conferencia.mjs');
console.log(`${agora()} site: ${normas.length} normas em docs/dados/catalogo.json`);
