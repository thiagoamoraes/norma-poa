#!/usr/bin/env node
// ingestao/estruturar.mjs
//
// Estrutura cada texto já extraído (dados/textos/sapl/<id>.txt) e grava
// dados/estruturado/sapl/<id>.json, com a verificação junto. Sem rede.
// Só reprocessa o que mudou (hash do arquivo de origem ou versão do estruturador).
//
// Também escreve:
//   dados/estruturado/_situacao.json   { idSapl: 'aceita' | 'revisar' }
//   dados/estruturado/RELATORIO.md     taxa de aceitação, motivos e fila de revisão
//
// Uso: node ingestao/estruturar.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { estruturarNorma, epocaDaNorma, VERSAO_ESTRUTURADOR } from './estrutura.mjs';
import { lerJsonl, agora } from './sapl-io.mjs';
import { prepararTextoExtraido } from './extracao-texto.mjs';

const DIR_TEXTO = './dados/textos/sapl';
const DIR_SAIDA = './dados/estruturado/sapl';
await mkdir(DIR_SAIDA, { recursive: true });

const catalogo = new Map();
for (const f of (await readdir('./dados/catalogo/sapl')).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
  for (const r of await lerJsonl(path.join('./dados/catalogo/sapl', f))) catalogo.set(r.idSapl, r);
}
const baixados = new Map();
for (const l of await lerJsonl(path.join(DIR_TEXTO, '_indice.jsonl'))) if (l.situacao === 'baixado') baixados.set(l.idSapl, l);

const situacao = {};
const contagem = { aceita: 0, revisar: 0 };
const motivos = {};
const avisos = {};
const fila = [];
const porEpoca = { recente: { aceita: 0, revisar: 0, motivos: {} }, antiga: { aceita: 0, revisar: 0, motivos: {} }, indefinida: { aceita: 0, revisar: 0, motivos: {} } };
let refeitos = 0;
let comErro = 0;

for (const [id, ind] of baixados) {
  const arqTexto = path.join(DIR_TEXTO, `${id}.txt`);
  if (!existsSync(arqTexto)) continue; // formato sem extração / sem camada de texto: fica para a fase de extração
  const arqSaida = path.join(DIR_SAIDA, `${id}.json`);
  let reg = null;
  if (existsSync(arqSaida)) {
    const anterior = JSON.parse(await readFile(arqSaida, 'utf8'));
    if (anterior.sha256Origem === ind.sha256 && anterior.versaoEstruturador === VERSAO_ESTRUTURADOR) reg = anterior;
  }
  if (!reg) {
    const texto = prepararTextoExtraido(await readFile(arqTexto, 'utf8'));
    const r = catalogo.get(id) || null;
    try {
      reg = { idSapl: id, rotulo: r?.rotulo ?? ind.rotulo, sha256Origem: ind.sha256, estruturadoEm: agora(), ...estruturarNorma(texto, r, { ocr: ind.extracao?.metodo === 'ocr' }) };
    } catch (e) {
      comErro++;
      reg = { idSapl: id, rotulo: r?.rotulo ?? ind.rotulo, sha256Origem: ind.sha256, estruturadoEm: agora(), versaoEstruturador: VERSAO_ESTRUTURADOR, dispositivos: [],
        verificacao: { situacao: 'revisar', motivos: ['erro_do_leitor'], avisos: [], metricas: { erro: String(e.message).slice(0, 200) } } };
    }
    await writeFile(arqSaida, JSON.stringify(reg, null, 1) + '\n');
    refeitos++;
  }
  const v = reg.verificacao;
  situacao[id] = v.situacao;
  contagem[v.situacao]++;
  for (const m of v.motivos) motivos[m] = (motivos[m] || 0) + 1;
  for (const a of v.avisos) avisos[a] = (avisos[a] || 0) + 1;
  const epoca = epocaDaNorma(catalogo.get(id));
  porEpoca[epoca][v.situacao]++;
  for (const m of v.motivos) porEpoca[epoca].motivos[m] = (porEpoca[epoca].motivos[m] || 0) + 1;
  if (v.situacao === 'revisar') fila.push({ id, rotulo: reg.rotulo, motivos: v.motivos, epoca });
}

await writeFile('./dados/estruturado/_situacao.json', JSON.stringify(situacao) + '\n');

const total = contagem.aceita + contagem.revisar;
const pct = (n) => (total ? `${Math.round((1000 * n) / total) / 10}%` : '—');
const tabela = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| \`${k}\` | ${v} | ${pct(v)} |`);
const L = ['# Estruturação — relatório', '', `Gerado em ${agora()} por \`ingestao/estruturar.mjs\` (versão do estruturador: ${VERSAO_ESTRUTURADOR}). Não editar à mão.`, '',
  'Uma norma só é **aceita** quando passa em todas as conferências: cabeçalho igual ao do catálogo (número, data, tipo), artigos numerados sem salto, rótulos iguais aos do texto de origem, nenhum texto fora da árvore, fecho presente. O resto vai para **revisar**, com o motivo.', '',
  `Textos baixados: ${baixados.size} · com texto extraído e estruturados: ${total}`, '',
  '| Situação | Normas | % |', '|---|---|---|', `| aceita | ${contagem.aceita} | ${pct(contagem.aceita)} |`, `| revisar | ${contagem.revisar} | ${pct(contagem.revisar)} |`, '',
  '## Por época (corte: sanção da LC 611, 03/02/2009)', '',
  'Antes do corte a técnica legislativa era outra: falhas de compilação são esperadas e não medem o leitor. **A taxa das recentes é a que mede o motor.**', '',
  '| Época | Aceitas | A revisar | Taxa de aceitação |', '|---|---|---|---|',
  ...Object.entries(porEpoca).filter(([, e]) => e.aceita + e.revisar).map(([k, e]) => `| ${k} | ${e.aceita} | ${e.revisar} | ${Math.round((1000 * e.aceita) / (e.aceita + e.revisar)) / 10}% |`), '',
  '### Motivos de revisão nas recentes', '', '| Motivo | Normas |', '|---|---|',
  ...Object.entries(porEpoca.recente.motivos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| \`${k}\` | ${v} |`), '',
  '## Motivos de revisão (todas as épocas)', '', '(uma norma pode ter mais de um)', '', '| Motivo | Normas | % do total |', '|---|---|---|', ...tabela(motivos), '',
  '## Avisos (não reprovam)', '', '| Aviso | Normas | % do total |', '|---|---|---|', ...tabela(avisos), '',
  '## Fila de revisão — recentes (prioridade)', '', ...fila.filter((f) => f.epoca !== 'antiga').map((f) => `- ${f.rotulo} (\`${f.id}\`): ${f.motivos.join(', ')}`), '',
  '## Fila de revisão — antigas (antes da LC 611; revisão humana esperada)', '', fila.filter((f) => f.epoca === 'antiga').length > 300 ? `Mostrando 300 de ${fila.filter((f) => f.epoca === 'antiga').length}.` : '', '',
  ...fila.filter((f) => f.epoca === 'antiga').slice(0, 300).map((f) => `- ${f.rotulo} (\`${f.id}\`): ${f.motivos.join(', ')}`), ''];
await writeFile('./dados/estruturado/RELATORIO.md', L.join('\n'));
await writeFile('./dados/estruturado/_resumo.json', JSON.stringify({ em: agora(), aceitas: contagem.aceita, revisar: contagem.revisar, motivos, avisos, porEpoca }) + '\n');
console.log(`${agora()} estruturação: ${total} normas (${contagem.aceita} aceitas, ${contagem.revisar} a revisar); ${refeitos} processadas agora; ${comErro} com erro do leitor.`);
