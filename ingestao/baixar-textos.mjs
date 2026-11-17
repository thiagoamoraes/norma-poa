#!/usr/bin/env node
// ingestao/baixar-textos.mjs
//
// Baixa o arquivo de texto de cada norma do catálogo (um por minuto — a
// etiqueta está em sapl-io.mjs) e extrai o texto quando o formato permite.
//
//   dados/_bruto/sapl/<idSapl>.<ext>   arquivo original, intocado (FORA do git;
//                                      a rotina agendada o guarda numa Release)
//   dados/textos/sapl/<idSapl>.txt     texto extraído (no git; refazível)
//   dados/textos/sapl/_indice.jsonl    uma linha por tentativa: URL, hash, tamanho,
//                                      situação da extração — nada some em silêncio
//
// Retomável: quem já está no índice (baixado ou com erro definitivo) é pulado.
// Uso: node ingestao/baixar-textos.mjs [--max-arquivos N]
// Prazo: PRAZO_EPOCH (segundos). Atrás de proxy: NODE_USE_ENV_PROXY=1.
// Requer `pdftotext` (poppler-utils) no PATH.

import { writeFile, appendFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { filaDeDownload } from './sapl-comum.mjs';
import { requisitar, prazoEsgotado, lerJsonl, agora, ErroDefinitivo } from './sapl-io.mjs';
import { htmlSirelParaTexto, contarAlfanumericos, extensaoDaUrl, MINIMO_ALFANUMERICOS } from './extracao-texto.mjs';

const DIR_CATALOGO = './dados/catalogo/sapl';
const DIR_BRUTO = './dados/_bruto/sapl';
const DIR_TEXTO = './dados/textos/sapl';
const ARQ_INDICE = path.join(DIR_TEXTO, '_indice.jsonl');

function extrair(ext, caminhoBruto, bytes) {
  if (ext === 'pdf') {
    if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') return { metodo: null, situacao: 'nao_e_pdf', texto: null };
    let texto;
    try { texto = execFileSync('pdftotext', ['-layout', caminhoBruto, '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch (e) { return { metodo: 'pdftotext', situacao: 'falha_na_extracao', texto: null }; }
    if (contarAlfanumericos(texto) < MINIMO_ALFANUMERICOS) return { metodo: 'pdftotext', situacao: 'sem_camada_de_texto', texto: null };
    return { metodo: 'pdftotext', situacao: 'ok', texto };
  }
  if (ext === 'html' || ext === 'htm') {
    const { texto, repeticoes } = htmlSirelParaTexto(bytes);
    return { metodo: 'html_sirel', situacao: contarAlfanumericos(texto) < MINIMO_ALFANUMERICOS ? 'texto_curto' : 'ok', texto, repeticoes };
  }
  return { metodo: null, situacao: 'formato_sem_extracao', texto: null };
}

async function main() {
  const iMax = process.argv.indexOf('--max-arquivos');
  const maxArquivos = iMax > 0 ? Number(process.argv[iMax + 1]) : Infinity;
  await mkdir(DIR_BRUTO, { recursive: true });
  await mkdir(DIR_TEXTO, { recursive: true });

  const catalogo = [];
  for (const f of (await readdir(DIR_CATALOGO)).filter((f) => /^tipo-\d+\.jsonl$/.test(f))) {
    catalogo.push(...(await lerJsonl(path.join(DIR_CATALOGO, f))));
  }
  const resolvidos = new Set((await lerJsonl(ARQ_INDICE)).filter((l) => l.situacao === 'baixado' || l.situacao === 'erro_definitivo').map((l) => l.idSapl));
  const fila = filaDeDownload(catalogo, resolvidos);
  console.log(`${agora()} fila: ${fila.length} arquivo(s) a baixar; ${resolvidos.size} já resolvido(s).`);

  let feitos = 0;
  for (const r of fila) {
    if (feitos >= maxArquivos) { console.log(`${agora()} limite de ${maxArquivos} arquivos atingido.`); break; }
    if (prazoEsgotado()) { console.log(`${agora()} prazo esgotado.`); break; }
    const url = new URL(r.texto.url).href; // codifica espaços de links antigos
    const base = { idSapl: r.idSapl, rotulo: r.rotulo, url, em: null };
    try {
      const { bytes, contentType } = await requisitar(url, 'binario');
      const ext = extensaoDaUrl(url);
      const caminhoBruto = path.join(DIR_BRUTO, `${r.idSapl}.${ext}`);
      await writeFile(caminhoBruto, bytes);
      const ex = extrair(ext, caminhoBruto, bytes);
      if (ex.texto) await writeFile(path.join(DIR_TEXTO, `${r.idSapl}.txt`), ex.texto);
      await appendFile(ARQ_INDICE, JSON.stringify({
        ...base, em: agora(), situacao: 'baixado', formato: ext, contentType, bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        extracao: { metodo: ex.metodo, situacao: ex.situacao, alfanumericos: ex.texto ? contarAlfanumericos(ex.texto) : 0, ...(ex.repeticoes > 1 ? { repeticoesRemovidas: ex.repeticoes } : {}) },
      }) + '\n');
      console.log(`${agora()} ${r.rotulo} → ${ext}, ${bytes.length} bytes, extração: ${ex.situacao}`);
    } catch (e) {
      if (!(e instanceof ErroDefinitivo)) throw e; // servidor/rede: para tudo, estado já salvo
      await appendFile(ARQ_INDICE, JSON.stringify({ ...base, em: agora(), situacao: 'erro_definitivo', httpStatus: e.status }) + '\n');
      console.log(`${agora()} ${r.rotulo} → ERRO DEFINITIVO HTTP ${e.status}`);
    }
    feitos++;
  }
  console.log(`${agora()} baixados nesta execução: ${feitos}; restam na fila: ${fila.length - feitos}.`);
}

main().catch((e) => {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
});
