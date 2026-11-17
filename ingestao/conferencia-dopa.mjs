#!/usr/bin/env node
// ingestao/conferencia-dopa.mjs
//
// Conferência diária com o Diário Oficial (DOPA):
//   1. roda o coletor de cadernos que já existe (dopa-discovery.mjs) sobre a
//      janela de 5 dias da API;
//   2. acumula o ÍNDICE de normas de cada edição em dados/dopa/edicoes.jsonl
//      (só cabeçalho e link de cada norma — os cadernos NÃO são guardados);
//   3. cruza com o catálogo do SAPL e escreve dados/dopa/CONFERENCIA.md:
//      normas publicadas e ainda ausentes do catálogo, atos que só o DOPA
//      traz (Resolução de Mesa, Ordem de Serviço…) e links sem cabeçalho
//      reconhecido (alarme de formato novo).
//
// Não falha a rotina por haver ausência: ausência é informação, não erro.
// Uso: node ingestao/conferencia-dopa.mjs      (requer `npm ci`: pdfjs-dist)

import { writeFile, appendFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { conferirDopa } from './sapl-comum.mjs';
import { lerJsonl, agora } from './sapl-io.mjs';

const DIR = './dados/dopa';
const ARQ_EDICOES = path.join(DIR, 'edicoes.jsonl');
const ARQ_RELATORIO = path.join(DIR, 'CONFERENCIA.md');
const ESTADO_COLETOR = './dopa-state.json';
const DIAS_ALERTA = 7;

await mkdir(DIR, { recursive: true });
const jaVistas = await lerJsonl(ARQ_EDICOES);

// O estado do coletor não é versionado; reconstrói a partir do que já foi
// acumulado, para não baixar de novo um caderno já lido.
if (!existsSync(ESTADO_COLETOR)) {
  const processadas = Object.fromEntries(jaVistas.map((e) => [`${e.idEdicao}:${e.poder}`, { baixadoEm: e.lidoEm, caminho: null }]));
  await writeFile(ESTADO_COLETOR, JSON.stringify({ processadas }, null, 2));
}

const r = spawnSync(process.execPath, ['dopa-discovery.mjs'], { stdio: 'inherit' });
if (r.status !== 0) { console.error('ERRO: o coletor de cadernos do DOPA falhou.'); process.exit(1); }

const novas = JSON.parse(await readFile('./descobertas.json', 'utf8'));
const chaves = new Set(jaVistas.map((e) => `${e.idEdicao}:${e.poder}`));
const acrescentar = novas.filter((e) => !chaves.has(`${e.idEdicao}:${e.poder}`)).map((e) => ({
  ...e,
  // Só o link: o "contexto" traz linhas do caderno, que podem conter dados pessoais de terceiros.
  linksSemCabecalho: (Array.isArray(e.linksSemCabecalho) ? e.linksSemCabecalho : []).map((s) => s.linkNorma),
  lidoEm: agora(),
}));
if (acrescentar.length) await appendFile(ARQ_EDICOES, acrescentar.map((e) => JSON.stringify(e)).join('\n') + '\n');
const edicoes = jaVistas.concat(acrescentar);

const catalogo = [];
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  catalogo.push(...(await lerJsonl(path.join('./dados/catalogo/sapl', f))));
}
const hoje = agora().slice(0, 10);
const c = conferirDopa(edicoes, catalogo, hoje);

const linha = (e) => `| ${e.textoIndice} | ${e.publicadoEm} (${e.poder}) | ${e.isRepublicacao ? 'sim' : ''} | ${e.linkNorma} |`;
const L = ['# Conferência DOPA × catálogo', '', `Gerado em ${agora()} por \`ingestao/conferencia-dopa.mjs\`. Não editar à mão.`, '',
  `Edições lidas: ${edicoes.length} · normas no catálogo: ${c.noCatalogo.length} · ausentes: ${c.ausentes.length} · atos que só o DOPA traz: ${c.foraDoSapl.length}`, ''];
const atrasadas = c.ausentes.filter((e) => e.dias !== null && e.dias > DIAS_ALERTA);
L.push(`## Publicadas há mais de ${DIAS_ALERTA} dias e ausentes do catálogo`, '');
if (atrasadas.length) L.push('| Norma | Publicada em | Republicação | Link |', '|---|---|---|---|', ...atrasadas.map(linha), '');
else L.push('Nenhuma.', '');
const recentes = c.ausentes.filter((e) => !(e.dias !== null && e.dias > DIAS_ALERTA));
L.push('## Publicadas há pouco e ainda não catalogadas', '');
if (recentes.length) L.push('| Norma | Publicada em | Republicação | Link |', '|---|---|---|---|', ...recentes.map(linha), '');
else L.push('Nenhuma.', '');
L.push('## Atos que só o DOPA traz (fora do catálogo do SAPL)', '');
if (c.foraDoSapl.length) L.push('| Norma | Publicada em | Republicação | Link |', '|---|---|---|---|', ...c.foraDoSapl.slice().reverse().map(linha), '');
else L.push('Nenhum até agora.', '');
const semCab = edicoes.flatMap((e) => (e.linksSemCabecalho || []).map((s) => ({ ed: e, s })));
L.push('## Links de norma sem cabeçalho reconhecido (possível formato novo)', '');
if (semCab.length) L.push(...semCab.map(({ ed, s }) => `- Edição ${ed.numeroEdicao} (${ed.poder}, ${ed.data}): ${s}`), '');
else L.push('Nenhum.', '');
await writeFile(ARQ_RELATORIO, L.join('\n'));
console.log(`${agora()} conferência: ${c.noCatalogo.length} no catálogo, ${c.ausentes.length} ausente(s) (${atrasadas.length} há mais de ${DIAS_ALERTA} dias), ${c.foraDoSapl.length} só no DOPA.`);
