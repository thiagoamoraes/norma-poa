#!/usr/bin/env node
// ingestao/catalogo-sapl.mjs
//
// Coletor do CATÁLOGO a partir da API pública do SAPL da PGM. Só metadados
// (texto de norma é com o baixar-textos.mjs). Grava em dados/catalogo/sapl/:
//   tipo-<N>.jsonl   um registro por linha; a ÚLTIMA ocorrência de um idSapl vale
//   vinculos.jsonl   relações entre normas (altera, revoga…)
//   tipos-vinculo.json
//   _estado.json     permite retomar de onde parou
//
// A etiqueta de coleta (60 s entre requisições etc.) está em sapl-io.mjs.
//
// Modos (a partir da raiz do repositório):
//   node ingestao/catalogo-sapl.mjs                # carga completa do escopo (retoma)
//   node ingestao/catalogo-sapl.mjs --novidades    # só o que é novo/alterado no topo de cada tipo
//   node ingestao/catalogo-sapl.mjs --vinculos     # carga completa dos vínculos (retoma)
//   node ingestao/catalogo-sapl.mjs --marcar-recarga   # sem rede: marca os tipos já concluídos para
//                                                  # nova carga completa (pega alteração em norma antiga)
// Opções: --tipos 6,5   --max-paginas N
// Prazo: variável de ambiente PRAZO_EPOCH (segundos) — para limpo antes dele.
//
// Atrás de proxy, o fetch do Node precisa de NODE_USE_ENV_PROXY=1.

import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { normalizarRegistroSapl, normalizarVinculoSapl } from './sapl-comum.mjs';
import { BASE_SAPL, requisitar, prazoEsgotado, lerJsonl, agora } from './sapl-io.mjs';

const DIR = './dados/catalogo/sapl';
const ARQ_ESTADO = path.join(DIR, '_estado.json');
const POR_PAGINA = 100;
// ordem deliberada: menores primeiro (LOM, emendas, LC), leis ordinárias por último
const TIPOS_PADRAO = [1, 2, 6, 5];

function lerArgs(argv) {
  const args = { modo: 'completo', tipos: TIPOS_PADRAO, maxPaginas: Infinity };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--tipos') args.tipos = argv[++i].split(',').map(Number);
    else if (argv[i] === '--max-paginas') args.maxPaginas = Number(argv[++i]);
    else if (argv[i] === '--novidades') args.modo = 'novidades';
    else if (argv[i] === '--vinculos') args.modo = 'vinculos';
    else if (argv[i] === '--marcar-recarga') args.modo = 'marcar-recarga';
    else throw new Error(`argumento desconhecido: ${argv[i]}`);
  }
  return args;
}

let estado;
let paginasFeitas = 0;
const salvarEstado = () => writeFile(ARQ_ESTADO, JSON.stringify(estado, null, 2) + '\n');

/** Pode fazer mais uma requisição? (limite de páginas e prazo) */
function podeContinuar(args) {
  if (paginasFeitas >= args.maxPaginas) { console.log(`${agora()} limite de ${args.maxPaginas} páginas atingido; estado salvo.`); return false; }
  if (prazoEsgotado()) { console.log(`${agora()} prazo esgotado; estado salvo.`); return false; }
  return true;
}

/** Carga paginada e retomável de um recurso. Devolve false se parou antes do fim. */
async function cargaCompleta(args, chave, urlBase, arquivo, normalizar) {
  const et = (estado.tipos[chave] ??= { proximaPagina: 1, totalPaginas: null, totalRegistros: null, concluido: false });
  while (!et.concluido) {
    if (!podeContinuar(args)) return false;
    const corpo = await requisitar(`${urlBase}page=${et.proximaPagina}&page_size=${POR_PAGINA}`, 'json');
    if (!corpo.pagination || !Array.isArray(corpo.results)) throw new Error('resposta sem pagination/results');
    const pg = corpo.pagination;
    const linhas = corpo.results.map((r) => JSON.stringify(normalizar(r))).join('\n');
    if (linhas) await appendFile(arquivo, linhas + '\n');
    Object.assign(et, { totalPaginas: pg.total_pages, totalRegistros: pg.total_entries, coletadoEm: agora() });
    console.log(`${agora()} ${chave} página ${pg.page}/${pg.total_pages} (+${corpo.results.length}; total declarado ${pg.total_entries})`);
    if (pg.next_page) et.proximaPagina = pg.next_page; else { et.concluido = true; await compactar(arquivo); }
    await salvarEstado();
    paginasFeitas++;
  }
  return true;
}

/**
 * Ao concluir uma carga, regrava o JSONL sem repetições (a última ocorrência
 * de cada id vale), da norma mais recente para a mais antiga. Nenhum registro
 * é descartado por ter sumido da API — só as cópias antigas do mesmo id.
 */
async function compactar(arquivo) {
  const linhas = await lerJsonl(arquivo);
  const campoId = linhas.length && 'idVinculo' in linhas[0] ? 'idVinculo' : 'idSapl';
  const ultimo = new Map();
  for (const r of linhas) ultimo.set(r[campoId], r);
  const ordenado = [...ultimo.values()].sort((a, b) => String(b.data ?? '').localeCompare(String(a.data ?? '')) || b[campoId] - a[campoId]);
  await writeFile(arquivo, ordenado.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`${agora()} ${arquivo}: ${linhas.length} linha(s) → ${ordenado.length} registro(s) único(s).`);
}

/**
 * Novidades de um tipo: a listagem vem da mais recente para a mais antiga
 * (medido em 16/11/2026). Lê do topo e para na primeira página que não traz
 * nenhum registro novo nem alterado. Registro alterado é regravado no fim do
 * JSONL (a última ocorrência vale).
 */
async function novidades(args, tipo) {
  const et = estado.tipos[tipo];
  if (!et || !et.concluido) { console.log(`${agora()} tipo ${tipo}: carga completa ainda não concluída — novidades adiadas.`); return; }
  const arquivo = path.join(DIR, `tipo-${tipo}.jsonl`);
  const conhecidos = new Map((await lerJsonl(arquivo)).map((r) => [r.idSapl, r.atualizadoEm]));
  for (let pagina = 1; ; pagina++) {
    if (!podeContinuar(args)) return;
    const corpo = await requisitar(`${BASE_SAPL}/api/norma/normajuridica/?tipo=${tipo}&page=${pagina}&page_size=${POR_PAGINA}`, 'json');
    paginasFeitas++;
    const regs = corpo.results.map(normalizarRegistroSapl);
    const mudou = regs.filter((r) => conhecidos.get(r.idSapl) !== r.atualizadoEm);
    const novos = mudou.filter((r) => !conhecidos.has(r.idSapl));
    if (mudou.length) await appendFile(arquivo, mudou.map((r) => JSON.stringify(r)).join('\n') + '\n');
    for (const r of mudou) conhecidos.set(r.idSapl, r.atualizadoEm);
    et.totalRegistros = corpo.pagination.total_entries;
    et.novidadesEm = agora();
    await salvarEstado();
    console.log(`${agora()} tipo ${tipo} novidades página ${pagina}: ${novos.length} nova(s), ${mudou.length - novos.length} alterada(s)`);
    for (const r of novos) console.log(`    + ${r.rotulo}`);
    if (!mudou.length || !corpo.pagination.next_page) return;
  }
}

async function main() {
  const args = lerArgs(process.argv);
  await mkdir(DIR, { recursive: true });
  estado = existsSync(ARQ_ESTADO) ? JSON.parse(await readFile(ARQ_ESTADO, 'utf8')) : { tipos: {} };

  if (args.modo === 'marcar-recarga') {
    for (const tipo of args.tipos) {
      const et = estado.tipos[tipo];
      if (et && et.concluido) { Object.assign(et, { proximaPagina: 1, concluido: false, recargaDesde: agora() }); console.log(`tipo ${tipo}: marcado para recarga completa.`); }
    }
    await salvarEstado();
    return;
  }
  if (args.modo === 'novidades') {
    for (const tipo of args.tipos) await novidades(args, tipo);
    return;
  }
  if (args.modo === 'vinculos') {
    if (!existsSync(path.join(DIR, 'tipos-vinculo.json'))) {
      if (!podeContinuar(args)) return;
      const tv = await requisitar(`${BASE_SAPL}/api/norma/tipovinculonormajuridica/?page_size=100`, 'json');
      await writeFile(path.join(DIR, 'tipos-vinculo.json'), JSON.stringify(tv.results.map((t) => ({ id: t.id, sigla: t.sigla, ativa: t.descricao_ativa, passiva: t.descricao_passiva })), null, 1) + '\n');
    }
    const fim = await cargaCompleta(args, 'vinculos', `${BASE_SAPL}/api/norma/normarelacionada/?`, path.join(DIR, 'vinculos.jsonl'), normalizarVinculoSapl);
    if (fim) console.log(`${agora()} vínculos: carga concluída.`);
    return;
  }
  for (const tipo of args.tipos) {
    const fim = await cargaCompleta(args, tipo, `${BASE_SAPL}/api/norma/normajuridica/?tipo=${tipo}&`, path.join(DIR, `tipo-${tipo}.jsonl`), normalizarRegistroSapl);
    if (!fim) return;
  }
  console.log(`${agora()} catálogo concluído para os tipos ${args.tipos.join(', ')}.`);
}

main().catch((e) => {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
});
