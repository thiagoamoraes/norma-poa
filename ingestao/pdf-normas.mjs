// pdf-normas.mjs — Peça 5: PDF → texto de uma norma individual (Limite 1).
// Módulo de ingestão, FORA do norma-core.js (que não importa daqui — regra
// dura do CLAUDE.md: core é ESM puro, zero I/O). Único consumidor esperado
// do texto que sai daqui é norma-core.js (parseLeiPublicada), mas por fora,
// como qualquer outro texto de entrada.
//
// Reaproveita agruparPorLinha() de coletor-comum.mjs (mesma lógica de
// ordenação por x/y e reconstrução de espaço já validada em
// dopa-discovery.mjs) em vez de duplicá-la.

import { readFile } from 'node:fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { agruparPorLinha } from './coletor-comum.mjs';

// ─── Padrões de ruído REAIS confirmados ───────────────────────────────────────
// Só estes (vistos em texto real — ver CLAUDE.md e os fixtures da rodada 11).
// Ancorados à linha inteira, pra nunca confundir um artigo real que só
// PAREÇA com o padrão. Não generalizar além do confirmado.

// Rodapé do SEI, 1 por página. Visto em Lei e Resolução (o "(CMPA)" é
// ausente na Resolução — "Resolução 1114767     SEI 368.00016/2026-55 / pg. 1"
// — mas presente na Lei — "Lei (CMPA) 1106982     SEI 034.00361/2024-16 / pg. 1"
// — por isso opcional no regex). Ordem de Serviço usa outro rodapé (abaixo).
const RE_RODAPE_SEI = /^(?:Lei\s+Complementar|Lei|Resolu[çc][ãa]o)\s*(?:\(CMPA\))?\s*\d+\s+SEI\s+[\d.\/-]+\s*\/\s*pg\.\s*\d+\s*$/i;

// Cabeçalho de impressão do navegador (OS 12/2026, 1 por página):
// "31/08/2026, 15:23 SEI/CMPA - 1133397 - Ordem de Serviço"
const RE_CABECALHO_IMPRESSAO_OS = /^\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}\s+SEI\/CMPA\s*-\s*\d+\s*-\s*.+$/i;

// Rodapé de impressão do navegador (OS 12/2026, 1 por página): URL do SEI
// terminando no contador "página atual/total" (ex.: "...documento_imprimir_web&... 1/7").
const RE_RODAPE_IMPRESSAO_OS = /^https?:\/\/sei\.camarapoa\.rs\.gov\.br\/sei\/controlador\.php\?acao=documento_imprimir_web\S*\s+\d+\/\d+\s*$/i;

// Exportada (não só interna) pra dar pra testar os padrões de ruído
// isoladamente, sem depender de ter um PDF real à mão.
export function ehLinhaDeRuido(texto) {
  return RE_RODAPE_SEI.test(texto) || RE_CABECALHO_IMPRESSAO_OS.test(texto) || RE_RODAPE_IMPRESSAO_OS.test(texto);
}

/**
 * extrairTextoNorma(caminhoPdf) → Promise<string>
 *
 * Lê o PDF de uma norma individual (não um caderno) e devolve texto plano
 * compatível com o que norma-core.js espera (o mesmo formato que
 * `pdftotext -layout` produz para os fixtures `.txt` da rodada 11).
 *
 * Ordem de leitura: por página, na ordem do documento; dentro de cada
 * página, por y decrescente (topo → base) e x crescente dentro de cada
 * linha — mesma convenção já usada em extrairEntradasIndice()
 * (dopa-discovery.mjs).
 *
 * Cabeçalho/rodapé de página são removidos linha a linha (ver padrões
 * acima), onde quer que caiam no fluxo — inclusive DENTRO do bloco de
 * assinaturas do fim, quando ele atravessa uma quebra de página (achado
 * real: o rodapé do SEI cai NO MEIO do bloco de assinatura da Lei
 * 14.504/2026, não só no topo/base da página). O bloco de assinaturas em
 * si é preservado — só a linha de ruído em volta dele é removida — porque
 * ele alimenta `doc.fecho` no core.
 *
 * Sem OCR: depende de o PDF já ter camada de texto (confirmado em todos os
 * PDFs do DOPA vistos até agora).
 */
export async function extrairTextoNorma(caminhoPdf) {
  const dados = new Uint8Array(await readFile(caminhoPdf));
  const doc = await pdfjsLib.getDocument({ data: dados }).promise;
  const paginas = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const conteudoTexto = await pagina.getTextContent();
    const linhas = agruparPorLinha(conteudoTexto.items)
      .sort((a, b) => b.y - a.y)
      .map((l) => l.texto.trim())
      .filter((texto) => texto && !ehLinhaDeRuido(texto));
    paginas.push(linhas.join('\n'));
  }

  return paginas.join('\n');
}
