#!/usr/bin/env node
// dopa-discovery.mjs
//
// Etapa 1 do pipeline Norma: descoberta de edições novas do DOPA e extração
// dos links de norma dentro do caderno-índice, filtrando por tipo de ato
// relevante por poder.
//
// NÃO grava em banco, NÃO roda o norma-core. Só descobre e reporta —
// é o script de teste antes de plugar o parser de verdade.
//
// Dependência externa (fora da convenção zero-deps do norma-core, porque
// esta é a camada de coleta, não o motor): npm install pdfjs-dist
// Requer Node 18+ (fetch global).
//
// Uso:
//   node dopa-discovery.mjs          # rodada normal
//   DEBUG=1 node dopa-discovery.mjs  # imprime, linha a linha, o texto bruto
//                                    # de cada página, antes de aplicar
//                                    # qualquer filtro.
//
// As funções de extração são exportadas (extrairEntradasIndice,
// interpretarCabecalho) pra poderem ser testadas isoladamente, sem rede.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { agruparPorLinha } from './ingestao/coletor-comum.mjs';

const API_BASE =
  'https://apigateway.procempa.com.br/apiman-gateway/administracao-planejamento/dopa/1.1';
const STATE_FILE = './dopa-state.json';
const PDF_DIR = './cadernos-baixados';

// Identifica o script nas requisições — prática comum e educada em coleta
// automatizada contra serviço público; ajuste o contato se quiser.
const USER_AGENT = 'norma-experimento/0.3 (projeto experimental de dados legislativos abertos; leitura do indice dos cadernos)';

// Intervalo mínimo entre requisições HTTP sucessivas, pra não martelar o
// servidor mesmo em execuções com muitas edições novas de uma vez (ex.:
// primeira carga de um backfill). O script já é sequencial (nunca dispara
// requisições em paralelo), isso só adiciona uma pausa deliberada.
const INTERVALO_ENTRE_REQUISICOES_MS = 400;
const aguardar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tipos de ato relevantes por poder, confirmados na conversa.
// Decreto do Executivo fica de fora nesta fase inicial (alto volume, não é
// foco agora) — não é esquecimento, é escopo deliberado.
const TIPOS_ALVO = {
  executivo: ['Lei Complementar', 'Lei'],
  legislativo: [
    'Lei Complementar',
    'Lei',
    'Resolução de Mesa',
    'Resolução',
    'Decreto Legislativo',
    'Emenda à Lei Orgânica',
    'Ordem de Serviço',
  ],
};

// ─── Requisições ─────────────────────────────────────────────────────────────

async function loadState() {
  if (!existsSync(STATE_FILE)) return { processadas: {} };
  return JSON.parse(await readFile(STATE_FILE, 'utf8'));
}

async function saveState(state) {
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function chaveEdicao(idEdicao, poder) {
  // poder = "legislativo"/"executivo" (não é o tipo de ato) — um idEdicao de
  // extra pode existir nos dois poderes com conteúdo/assinatura diferentes.
  return `${idEdicao}:${poder}`;
}

async function buscarUltimos(poder) {
  await aguardar(INTERVALO_ENTRE_REQUISICOES_MS);
  const res = await fetch(`${API_BASE}/api/diarios/${poder}/ultimos`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Falha ao buscar ${poder}: HTTP ${res.status}`);
  return res.json();
}

async function baixarCaderno(idEdicao, poder) {
  await aguardar(INTERVALO_ENTRE_REQUISICOES_MS);
  const url = `${API_BASE}/api/diarios/edicao/${idEdicao}/download?tipo=${poder}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok)
    throw new Error(`Falha ao baixar edição ${idEdicao}/${poder}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // O nome real vem no Content-Disposition (ex.: 6182_cl_20260925_legislativo.pdf).
  const nomeOriginal = extrairNomeContentDisposition(res.headers.get('content-disposition'));
  const nomeArquivo = `${idEdicao}_${poder}.pdf`;
  const caminho = path.join(PDF_DIR, nomeArquivo);
  await mkdir(PDF_DIR, { recursive: true });
  await writeFile(caminho, buf);
  return { caminho, nomeOriginal };
}

function extrairNomeContentDisposition(header) {
  if (!header) return null;
  const match = header.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}

// ─── Reconhecimento do cabeçalho de norma no índice ──────────────────────────

// Rótulo de tipo como aparece no cabeçalho (maiúsculas) → nome canônico.
// DECRETO está aqui só pra ser RECONHECIDO (e o link que vem depois não cair
// em "sem cabeçalho" como se fosse um problema) — não está em TIPOS_ALVO.
const MAPA_TIPO_CABECALHO = {
  'LEI COMPLEMENTAR': 'Lei Complementar',
  LEI: 'Lei',
  'RESOLUÇÃO DE MESA': 'Resolução de Mesa',
  RESOLUÇÃO: 'Resolução',
  'DECRETO LEGISLATIVO': 'Decreto Legislativo',
  'EMENDA À LEI ORGÂNICA': 'Emenda à Lei Orgânica',
  'ORDEM DE SERVIÇO': 'Ordem de Serviço',
  DECRETO: 'Decreto',
};

// Ordem importa: os rótulos mais longos primeiro ("LEI COMPLEMENTAR" antes
// de "LEI", "RESOLUÇÃO DE MESA" antes de "RESOLUÇÃO", "DECRETO LEGISLATIVO"
// antes de "DECRETO"), senão o genérico casa primeiro e trunca errado.
const TIPOS_CABECALHO_ORDENADOS = Object.keys(MAPA_TIPO_CABECALHO).sort(
  (a, b) => b.length - a.length
);

// Cobre as variantes reais vistas nos cadernos:
//   "LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026"      (padrão Executivo)
//   "LEI COMPLEMENTAR Nº 1.080, DE 18 DE AGOSTO DE 2026."   (ponto final)
//   "ORDEM DE SERVIÇO Nº 13/2026"                    (número/ano, sem data)
//   "ORDEM DE SERVIÇO Nº 12 - 2026"                  (idem, com hífen — visto no caderno 6158)
//   "RESOLUÇÃO Nº 3.021 DE 25 DE AGOSTO DE 2026."   (sem vírgula após o número)
//   "RESOLUÇÃO Nº DE 3.025, DE 01 DE SETEMBRO..."   (grafia variante "Nº DE")
// A linha inteira tem que ser só isso — âncoras ^ e $ — pra não casar com
// citações embutidas no meio de frases.
const RE_CABECALHO = new RegExp(
  `^(${TIPOS_CABECALHO_ORDENADOS.join('|')})\\s*Nº\\s*(?:DE\\s+)?([\\d.]+)` +
    `(?:\\s*[\\/\\-–—]\\s*(\\d{2,4}))?` +
    `\\s*(?:,?\\s*DE\\s+(.+?))?\\s*\\.?$`,
  'i'
);

// "21 DE SETEMBRO DE 2026", "1º DE MARÇO DE 2026" (tolera grafia variante
// no nome do mês, como "AGOTO" visto num caderno real).
const RE_DATA_EXTENSO = /^\d{1,2}\s*[º°]?\s+DE\s+\S+\s+DE\s+\d{4}$/i;

const RE_REPUBLICACAO = /REPUBLICA[ÇC][ÃA]O/i;
// Remove o marcador (e pontuação/parênteses colados nele) pra o cabeçalho
// limpo ainda casar: "LEI Nº X, DE DATA – REPUBLICAÇÃO", "(REPUBLICAÇÃO)", etc.
const RE_MARCADOR_REPUBLICACAO = /\s*[(\[]?\s*[-–—:]?\s*REPUBLICA[ÇC][ÃA]O\s*[)\]]?/gi;

const RE_URL_NORMA =
  /https?:\/\/dopaonlineupload\.procempa\.com\.br\/dopaonlineupload\/\S+?\.pdf/i;

// Rótulo de link que NÃO é norma: anexo de edital ou de decreto, lista,
// cronograma, resultado. Visto em cadernos reais ("Anexo I - Notas...",
// "EDITAL COMPLETO", "ANEXOS I e II do DECRETO Nº ...", "Cronograma do
// Edital - Retificado"). Existe pra o aviso de "link sem cabeçalho" continuar
// significando algo: se ele disparasse pra todo anexo (dezenas por caderno),
// ninguém mais olharia — e ele perderia a função de pegar formato novo.
const RE_ROTULO_NAO_NORMA = /^(ANEXOS?|EDITAL|CRONOGRAMA|RESULTADO|LISTA)\b/i;

/**
 * ehRotuloNaoNorma(contexto[]) → boolean
 * Olha as 2 últimas linhas antes da URL (rótulos longos quebram em 2 linhas:
 * "ANEXO VI: DECLARAÇÃO ... OU" / "PRODUÇÃO").
 */
export function ehRotuloNaoNorma(contexto) {
  return contexto.slice(-2).some((l) => RE_ROTULO_NAO_NORMA.test(l.trim()));
}

// Máximo de linhas não-vazias entre o cabeçalho e a URL pra considerar que
// pertencem à mesma entrada. Nos formatos vistos é 0 (cabeçalho curto
// imediatamente antes da URL); a folga evita perder entradas com uma linha
// intermediária, sem deixar um cabeçalho velho grudar em URL de outra coisa.
const MAX_LINHAS_ENTRE_CABECALHO_E_URL = 3;

/**
 * interpretarCabecalho(textoDaLinha) → { tipoRotulo, tipoAto, numero, ano,
 * dataExtenso, republicacaoNoCabecalho, textoIndice } | null
 *
 * Reconhece a linha CURTA que identifica uma norma (não a ementa longa).
 * Devolve null se a linha não for esse cabeçalho.
 */
export function interpretarCabecalho(textoBruto) {
  const republicacaoNoCabecalho = RE_REPUBLICACAO.test(textoBruto);
  const texto = textoBruto
    .replace(RE_MARCADOR_REPUBLICACAO, ' ')
    .replace(/^[\s\-–—:]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const m = texto.match(RE_CABECALHO);
  if (!m) return null;

  const resto = m[4] ?? '';
  // Primeira linha da ementa ("..., DE DATA, que dispõe...") também casa a
  // regex; ementa não é o cabeçalho curto que queremos.
  if (/,\s*que\b/i.test(resto) || resto.length > 45) return null;
  // Quando há data, tem que ser POR EXTENSO ("21 DE SETEMBRO DE 2026"). Isso
  // deixa de fora citações soltas com data numérica ("Lei nº 6.309, de
  // 28/12/1988"). Se um formato novo aparecer, o link cai em semCabecalho
  // (reportado), não some.
  if (resto && !RE_DATA_EXTENSO.test(resto.trim())) return null;

  const tipoRotulo = m[1].toUpperCase();
  const dataExtenso = resto ? resto.trim() : null;
  let ano = null;
  if (m[3] && m[3].length === 4) ano = m[3];
  if (!ano && dataExtenso) {
    const ma = dataExtenso.match(/(\d{4})\s*$/);
    if (ma) ano = ma[1];
  }

  return {
    tipoRotulo,
    tipoAto: MAPA_TIPO_CABECALHO[tipoRotulo],
    numero: m[2],
    ano,
    dataExtenso,
    republicacaoNoCabecalho,
    textoIndice: texto,
  };
}

/**
 * extrairEntradasIndice(caminhoPdf, tiposAlvo) →
 *   { entradas[], foraDeEscopo{tipo:contagem}, anexosEditais:n, semCabecalho[] }
 *
 * Padrão real do índice (confirmado com PDFs do Executivo e do Legislativo):
 * ementa longa → [linha "Para visualizar, na íntegra..."] → cabeçalho curto
 * → URL da norma como TEXTO VISÍVEL (não anotação de link).
 *
 * Nada some em silêncio: toda URL da hospedagem de normas encontrada cai em
 * uma de quatro categorias —
 *   - entradas:      cabeçalho reconhecido, tipo dentro do escopo;
 *   - foraDeEscopo:  cabeçalho reconhecido, mas tipo fora do escopo (contagem);
 *   - anexosEditais: contagem de links cujo rótulo é anexo/edital/lista/etc.
 *                    (não é norma — ver RE_ROTULO_NAO_NORMA);
 *                    - semCabecalho:  URL sem cabeçalho E sem rótulo conhecido — aí sim
 *                    pode ser um formato novo que a regex não pega. Guarda as
 *                    últimas linhas antes da URL pra você conferir.
 */
export async function extrairEntradasIndice(caminhoPdf, tiposAlvo) {
  const dados = new Uint8Array(await readFile(caminhoPdf));
  const doc = await pdfjsLib.getDocument({ data: dados }).promise;

  const entradas = [];
  const foraDeEscopo = {};
  const semCabecalho = [];
  let anexosEditais = 0;

  let pendente = null;
  let linhasDesdeCabecalho = 0;
  let blocoTemRepublicacao = false;
  let contexto = []; // últimas linhas não-vazias, pra diagnóstico

  // Sem limite de páginas: não tentamos adivinhar onde a seção de normas
  // acaba (o nome da seção seguinte varia). O padrão exige a linha INTEIRA
  // ser o cabeçalho + URL logo depois, o que não ocorre no corpo de
  // Portarias/Editais/Despachos. Escanear páginas extras é custo local
  // (CPU), não gera requisição nova.
  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const conteudoTexto = await pagina.getTextContent();
    // y de PDF cresce de baixo pra cima — ordena decrescente pra ler na
    // ordem visual (topo → base da página).
    const linhas = agruparPorLinha(conteudoTexto.items).sort((a, b) => b.y - a.y);

    if (process.env.DEBUG) {
      console.log(`\n--- ${path.basename(caminhoPdf)} · página ${i} ---`);
      console.log(linhas.map((l) => `  y=${l.y.toFixed(1)}  ${l.texto}`).join('\n'));
    }

    for (const linha of linhas) {
      const texto = linha.texto.trim();
      if (!texto) continue;

      if (RE_REPUBLICACAO.test(texto)) blocoTemRepublicacao = true;

      const cab = interpretarCabecalho(texto);
      if (cab) {
        pendente = cab;
        linhasDesdeCabecalho = 0;
        contexto = [...contexto, texto].slice(-3);
        continue;
      }

      const mUrl = texto.match(RE_URL_NORMA);
      if (mUrl) {
        const link = mUrl[0];
        if (pendente && linhasDesdeCabecalho <= MAX_LINHAS_ENTRE_CABECALHO_E_URL) {
          if (tiposAlvo.includes(pendente.tipoAto)) {
            const sinal = pendente.republicacaoNoCabecalho
              ? 'cabecalho'
              : blocoTemRepublicacao
                ? 'bloco'
                : null;
            entradas.push({
              tipoAto: pendente.tipoAto,
              numero: pendente.numero,
              ano: pendente.ano,
              dataExtenso: pendente.dataExtenso,
              isRepublicacao: sinal !== null,
              sinalRepublicacao: sinal,
              textoIndice: pendente.textoIndice,
              linkNorma: link,
            });
          } else {
            foraDeEscopo[pendente.tipoAto] = (foraDeEscopo[pendente.tipoAto] || 0) + 1;
          }
        } else if (ehRotuloNaoNorma(contexto)) {
          anexosEditais++;
        } else {
          semCabecalho.push({ linkNorma: link, contexto: contexto.slice(-3) });
        }
        pendente = null;
        linhasDesdeCabecalho = 0;
        blocoTemRepublicacao = false;
        contexto = [];
        continue;
      }

      linhasDesdeCabecalho++;
      contexto = [...contexto, texto].slice(-3);
    }
  }

  return { entradas, foraDeEscopo, anexosEditais, semCabecalho };
}

// agruparPorLinha() mudou de casa (rodada 11, Tarefa C): agora mora em
// ingestao/coletor-comum.mjs, compartilhada com pdf-normas.mjs (extrator de
// texto de norma individual), pra não duplicar a lógica de ordenação por x/y
// e reconstrução de espaço. Importada acima (precisa do binding local — usada
// dentro de extrairEntradasIndice()) e reexportada aqui, pra não quebrar quem
// já importa agruparPorLinha deste módulo (ex.: teste_dopa_discovery.mjs).
export { agruparPorLinha };

// ─── Orquestração ────────────────────────────────────────────────────────────

async function main() {
  const state = await loadState();
  const poderes = ['legislativo', 'executivo'];
  const novasDescobertas = [];

  for (const poder of poderes) {
    const dias = await buscarUltimos(poder);

    for (const dia of dias) {
      for (const pub of dia.publicacoes) {
        const chave = chaveEdicao(pub.idEdicao, poder);
        if (state.processadas[chave]) continue; // já visto nesta janela

        console.log(`Nova edição: ${pub.tituloPublicacao} · ${poder} · id ${pub.idEdicao}`);

        const { caminho, nomeOriginal } = await baixarCaderno(pub.idEdicao, poder);
        const { entradas, foraDeEscopo, anexosEditais, semCabecalho } = await extrairEntradasIndice(
          caminho,
          TIPOS_ALVO[poder]
        );

        novasDescobertas.push({
          idEdicao: pub.idEdicao,
          poder,
          tipoPublicacao: pub.tipo,
          numeroEdicao: pub.numeroEdicao,
          isExtra: pub.isExtra,
          data: dia.data,
          assinadoEm: pub.assinatura?.assinadoEm ?? null,
          nomeArquivoOriginal: nomeOriginal,
          entradas,
          linksForaDeEscopo: foraDeEscopo,
          linksAnexosEditais: anexosEditais,
          linksSemCabecalho: semCabecalho,
        });

        state.processadas[chave] = {
          baixadoEm: new Date().toISOString(),
          caminho,
        };
      }
    }
  }

  await saveState(state);
  await writeFile('./descobertas.json', JSON.stringify(novasDescobertas, null, 2));

  const totalNormas = novasDescobertas.reduce((acc, d) => acc + d.entradas.length, 0);
  const totalSemCab = novasDescobertas.reduce((acc, d) => acc + d.linksSemCabecalho.length, 0);
  console.log(
    `\n${novasDescobertas.length} edição(ões) nova(s), ${totalNormas} entrada(s) de norma encontrada(s).`
  );
  if (totalSemCab > 0)
    console.log(
      `Atenção: ${totalSemCab} link(s) de norma sem cabeçalho reconhecido — ver "linksSemCabecalho" no JSON.`
    );
  console.log('Detalhes em ./descobertas.json');
}

// Só roda main() quando executado direto (node dopa-discovery.mjs), não
// quando importado por um teste.
const executadoDireto =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executadoDireto) {
  main().catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
}
