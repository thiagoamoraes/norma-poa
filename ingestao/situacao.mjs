#!/usr/bin/env node
// ingestao/situacao.mjs
//
// Painel de situação do acervo, gerado toda noite SEM rede e SEM IA:
//   dados/SITUACAO.md    para quem for retomar o trabalho (pessoa ou assistente)
//   dados/situacao.json  o mesmo, em forma de dado
//
// Serve a dois cenários (ver ROTEIRO.md, seções 10-A e 10-B):
//   - ficar um tempo sem análise: o painel diz o que acumulou, se algo deu
//     errado e o que fazer primeiro ao voltar;
//   - o acervo estar em dia: o painel diz quando a carga terminou e passa a
//     vigiar o regime permanente (execução parada, fila que não anda, etc.).
//
// A decisão ("em carga" × "em dia", alertas, próximas ações) está em
// avaliarSituacao(), função pura testada em teste_situacao.mjs.
// Uso: node ingestao/situacao.mjs

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { filaDeDownload } from './sapl-comum.mjs';

export const LIMITE_MB_AVISO = 800;
const DIA = 86_400_000;

const soma = (xs) => xs.reduce((a, b) => a + b, 0);

/**
 * entrada = {
 *   agoraIso,
 *   catalogo:   { <tipo>: { concluido, proximaPagina, totalPaginas, totalRegistros } },
 *   vinculos:   { concluido, proximaPagina, totalPaginas } | null,
 *   textos:     { fila, porSituacao: { <situação>: n }, porDia: { 'AAAA-MM-DD': n } },
 *   estruturacao: { aceitas, revisar, motivos: { <motivo>: n } } | null,
 *   historico:  { leis, completas, incompletas, semTextoDaBase, erro } | null,
 *   dopa:       { ausentesAtrasadas, soDopa } | null,
 *   execucoes:  [{ em, falhas, minutos, etapas }]   (em ordem de data),
 *   tamanhoMB
 * }
 */
export function avaliarSituacao(e) {
  const agora = Date.parse(e.agoraIso);
  const criterios = [];
  const crit = (nome, ok, detalhe) => criterios.push({ nome, ok: !!ok, detalhe });

  const tipos = Object.entries(e.catalogo || {});
  crit('Catálogo completo (todos os tipos do escopo)', tipos.length > 0 && tipos.every(([, t]) => t.concluido),
    tipos.length ? tipos.map(([k, t]) => `tipo ${k}: ${t.concluido ? 'completo' : `página ${t.proximaPagina} de ${t.totalPaginas ?? '?'}`}`).join(' · ') : 'ainda não coletado');
  const v = e.vinculos;
  crit('Vínculos completos', v && v.concluido, v ? (v.concluido ? 'completos' : `página ${v.proximaPagina} de ${v.totalPaginas ?? '?'}`) : 'ainda não coletados');
  const fila = e.textos && Number.isFinite(e.textos.fila) ? e.textos.fila : null;
  crit('Fila de textos vazia', fila === 0, fila === null ? 'sem dados' : `${fila} arquivo(s) a baixar`);
  const execs = e.execucoes || [];
  const ult3 = execs.slice(-3);
  crit('Últimas 3 execuções sem erro', ult3.length > 0 && ult3.every((x) => !x.falhas), ult3.length ? `${ult3.filter((x) => x.falhas).length} com erro entre as últimas ${ult3.length}` : 'nenhuma execução registrada');
  const atras = e.dopa ? e.dopa.ausentesAtrasadas : 0;
  crit('Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias)', atras === 0, atras === 0 ? 'nenhuma pendente' : `${atras} ausente(s)`);
  const emDia = criterios.every((c) => c.ok);

  // ritmo e previsão
  const porDia = e.textos?.porDia || {};
  const ultimos7 = Object.entries(porDia).filter(([d]) => agora - Date.parse(d) <= 7 * DIA);
  const baixados7 = soma(ultimos7.map(([, n]) => n));
  const diasAtivos = ultimos7.filter(([, n]) => n > 0).length;
  const mediaDia = diasAtivos ? baixados7 / diasAtivos : 0;
  const previsaoDias = fila > 0 && mediaDia > 0 ? Math.ceil(fila / mediaDia) : null;

  const alertas = [];
  if (!execs.length) alertas.push('Nenhuma execução da rotina registrada ainda.');
  else {
    const dias = (agora - Date.parse(execs[execs.length - 1].em)) / DIA;
    if (dias > 2) alertas.push(`A última execução da rotina foi há ${dias.toFixed(1)} dias. Veja a aba Actions: o agendamento pode ter falhado ou sido desativado. A conferência com o Diário Oficial só enxerga 5 dias; passar disso perde o índice das publicações.`);
  }
  if (execs.length >= 2 && execs.slice(-2).every((x) => x.falhas > 0)) alertas.push('As duas últimas execuções terminaram com erro. Leia o log da etapa que falhou (a rotina registra em `dados/_execucoes.jsonl` qual foi).');
  if (fila > 0 && execs.length >= 3 && baixados7 === 0) alertas.push('A fila de textos não diminuiu nos últimos 7 dias, embora haja execuções. Suspeite de bloqueio da fonte ou de erro repetido na etapa de textos.');
  const falhasTemp = e.textos?.porSituacao?.falha_temporaria || 0;
  if (falhasTemp >= 10) alertas.push(`${falhasTemp} arquivo(s) com falha temporária de download (a fonte pode estar instável): ficam para o fim da fila e são tentados de novo nas próximas noites.`);
  if (e.tamanhoMB > LIMITE_MB_AVISO) alertas.push(`Os dados já ocupam ${Math.round(e.tamanhoMB)} MB (aviso a partir de ${LIMITE_MB_AVISO} MB). Ver ROTEIRO.md, seção 10, "Tamanho do repositório".`);
  if (atras > 0) alertas.push(`${atras} norma(s) publicada(s) no Diário Oficial há mais de 7 dias ainda não aparecem no catálogo da fonte — ver dados/dopa/CONFERENCIA.md.`);

  // o que há para fazer — nunca depende de decisão do modelo: regras fixas
  const proximas = [];
  const motivos = Object.entries(e.estruturacao?.motivos || {}).sort((a, b) => b[1] - a[1]);
  if (e.estruturacao && e.estruturacao.revisar > 0) proximas.push(`${e.estruturacao.revisar} norma(s) aguardam revisão da leitura automática${motivos.length ? ` (motivo mais frequente: \`${motivos[0][0]}\`, ${motivos[0][1]})` : ''}: ROTEIRO.md, tarefa 1.`);
  if (e.historico && (e.historico.incompletas > 0 || e.historico.erro > 0)) proximas.push(`${e.historico.incompletas} histórico(s) incompleto(s) e ${e.historico.erro} com erro: ROTEIRO.md, tarefa 4.`);
  const adiados = e.textos?.porSituacao?.ocr_adiado_arquivo_grande || 0;
  if (adiados > 0) proximas.push(`${adiados} arquivo(s) digitalizado(s) grande(s) esperam um passe de OCR próprio: ROTEIRO.md, tarefa 3 (parte que falta).`);
  if (falhasTemp > 0) proximas.push(`${falhasTemp} arquivo(s) tiveram o download adiado por falha da fonte (\`falha_temporaria\` em \`dados/textos/sapl/_indice.jsonl\`); são tentados de novo sozinhos. Só é preciso agir se o número crescer noite após noite.`);
  const semExtracao = (e.textos?.porSituacao?.formato_sem_extracao || 0) + (e.textos?.porSituacao?.falha_na_extracao || 0);
  if (semExtracao > 0) proximas.push(`${semExtracao} arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir \`dados/textos/sapl/_indice.jsonl\`.`);
  if (alertas.length) proximas.unshift('Resolver os alertas acima antes de qualquer outra coisa.');
  if (!proximas.length) proximas.push(emDia ? 'Nada a fazer além da conferência semanal (ROTEIRO.md, seção 10-B).' : 'Aguardar a coleta: a carga ainda está em andamento.');

  return { estado: emDia ? 'em_dia' : 'em_carga', criterios, alertas, proximas, ritmo: { baixados7, mediaDia: Math.round(mediaDia), previsaoDias } };
}

export function renderizarSituacao(e, r) {
  const L = [];
  const rotulo = r.estado === 'em_dia' ? 'EM DIA' : 'EM CARGA';
  L.push('# Situação do acervo', '', `Gerado em ${e.agoraIso} por \`ingestao/situacao.mjs\`. Não editar à mão.`, '');
  L.push(`**Estado: ${rotulo}**${r.alertas.length ? ` — **${r.alertas.length} alerta(s)**` : ''}`, '');
  if (r.alertas.length) L.push('## Alertas', '', ...r.alertas.map((a) => `- ${a}`), '');
  L.push('## O que fazer agora', '', ...r.proximas.map((p) => `- ${p}`), '');
  L.push('## Critérios de "em dia"', '', '| | Critério | Situação |', '|---|---|---|', ...r.criterios.map((c) => `| ${c.ok ? '✓' : '✗'} | ${c.nome} | ${c.detalhe} |`), '');
  if (r.ritmo.previsaoDias !== null) L.push(`Ritmo: ${r.ritmo.baixados7} arquivo(s) baixados nos últimos 7 dias (cerca de ${r.ritmo.mediaDia} por dia ativo); previsão de esvaziar a fila: **cerca de ${r.ritmo.previsaoDias} dia(s)**, se o ritmo se mantiver.`, '');
  L.push('## Números', '');
  const t = e.textos || {};
  L.push(`- Fila de textos: ${t.fila ?? '—'} · situações dos arquivos já tratados: ${Object.entries(t.porSituacao || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'}`);
  if (e.estruturacao) L.push(`- Estruturação: ${e.estruturacao.aceitas} aceita(s), ${e.estruturacao.revisar} em revisão (${(e.estruturacao.aceitas + e.estruturacao.revisar) ? Math.round((1000 * e.estruturacao.aceitas) / (e.estruturacao.aceitas + e.estruturacao.revisar)) / 10 : 0}% de aceitação)`);
  if (e.historico) L.push(`- Histórico: ${e.historico.leis} lei(s) com alteradoras conhecidas; ${e.historico.completas} completa(s), ${e.historico.incompletas} incompleta(s), ${e.historico.semTextoDaBase} aguardando o texto da lei-base`);
  if (e.dopa) L.push(`- Diário Oficial: ${e.dopa.ausentesAtrasadas} ausente(s) do catálogo há mais de 7 dias; ${e.dopa.soDopa} ato(s) que só o Diário traz`);
  L.push(`- Tamanho de \`dados/\` + \`docs/\`: ${Math.round(e.tamanhoMB)} MB`, '');
  const execs = (e.execucoes || []).slice(-7).reverse();
  L.push('## Últimas execuções da rotina', '');
  if (!execs.length) L.push('Nenhuma registrada.', '');
  else L.push('| Quando (UTC) | Disparo | Duração | Erros | Etapas |', '|---|---|---|---|---|', ...execs.map((x) => `| ${x.em} | ${x.evento || '—'} | ${x.minutos ?? '?'} min | ${x.falhas || 0} | ${Object.entries(x.etapas || {}).map(([k, s]) => `${k}: ${s}`).join(', ') || '—'} |`), '');
  L.push('Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.', '');
  return L.join('\n');
}

// ── leitura dos arquivos do repositório ───────────────────────────────────────
async function lerJson(caminho) { return existsSync(caminho) ? JSON.parse(await readFile(caminho, 'utf8')) : null; }
async function linhas(caminho) { return existsSync(caminho) ? (await readFile(caminho, 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []; }
async function tamanho(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    total += d.isDirectory() ? await tamanho(p) : (await stat(p)).size;
  }
  return total;
}

async function main() {
  const estado = (await lerJson('./dados/catalogo/sapl/_estado.json'))?.tipos || {};
  const { vinculos, ...catalogoEstado } = estado;
  const catalogo = new Map();
  for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) for (const r of await linhas(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);

  const indice = new Map();
  for (const l of await linhas('./dados/textos/sapl/_indice.jsonl')) indice.set(l.idSapl, l); // a última linha de um id vale
  const porSituacao = {}, porDia = {};
  for (const l of indice.values()) {
    const s = l.situacao === 'baixado' ? (l.extracao?.situacao || 'baixado') : l.situacao;
    porSituacao[s] = (porSituacao[s] || 0) + 1;
    if (l.situacao === 'baixado' && l.em) { const d = l.em.slice(0, 10); porDia[d] = (porDia[d] || 0) + 1; }
  }
  const resolvidos = new Set([...indice.values()].filter((l) => l.situacao === 'baixado' || l.situacao === 'erro_definitivo').map((l) => l.idSapl));
  const fila = filaDeDownload([...catalogo.values()], resolvidos).length;

  const e = {
    agoraIso: new Date().toISOString(),
    catalogo: catalogoEstado,
    vinculos: vinculos || null,
    textos: { fila, porSituacao, porDia },
    estruturacao: await lerJson('./dados/estruturado/_resumo.json'),
    historico: await lerJson('./dados/historico/_resumo.json'),
    dopa: await lerJson('./dados/dopa/_resumo.json'),
    execucoes: await linhas('./dados/_execucoes.jsonl'),
    tamanhoMB: (await tamanho('./dados') + await tamanho('./docs')) / 1_048_576,
  };
  const r = avaliarSituacao(e);
  await writeFile('./dados/SITUACAO.md', renderizarSituacao(e, r));
  await writeFile('./dados/situacao.json', JSON.stringify({ geradoEm: e.agoraIso, estado: r.estado, alertas: r.alertas, proximas: r.proximas, criterios: r.criterios, ritmo: r.ritmo }, null, 1) + '\n');
  console.log(`${e.agoraIso} situação: ${r.estado === 'em_dia' ? 'EM DIA' : 'EM CARGA'}; ${r.alertas.length} alerta(s); fila de textos ${fila}.`);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(`ERRO: ${err.message}`); process.exit(1); });
}
