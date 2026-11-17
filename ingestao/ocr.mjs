// ingestao/ocr.mjs
//
// Reconhecimento óptico (OCR) de PDF digitalizado — norma que é só imagem, ou
// cuja camada de texto não presta. Roda localmente, sem rede e sem IA:
// `pdftoppm` (poppler-utils) transforma cada página em imagem e o `tesseract`
// (pacotes tesseract-ocr e tesseract-ocr-por) lê em português.
//
// O texto de OCR é PIOR que o original: troca "º" por "o", "§" por "S", "1"
// por "l". Nada aqui tenta corrigir — o texto sai como o OCR leu, marcado como
// tal, e a verificação da estruturação decide se dá para aceitar.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Acima disto o arquivo fica para depois (uma noite de coleta não pode parar num só PDF). */
export const MAXIMO_DE_PAGINAS_OCR = 60;

/** O OCR está instalado nesta máquina? */
export function ocrDisponivel() {
  try {
    const linguas = execFileSync('tesseract', ['--list-langs'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    return /^por$/m.test(linguas);
  } catch (e) { return false; }
}

/** Número de páginas do PDF (0 se não der para ler). */
export function paginasDoPdf(caminhoPdf) {
  try {
    const m = /^Pages:\s+(\d+)/m.exec(execFileSync('pdfinfo', [caminhoPdf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    return m ? Number(m[1]) : 0;
  } catch (e) { return 0; }
}

/**
 * ocrDoPdf(caminhoPdf) → { texto, paginas } | { texto: null, motivo }
 * Uma página por vez, 300 dpi, tons de cinza, modo de segmentação 4 (coluna
 * única de texto de tamanho variável — o caso de uma lei datilografada).
 * As páginas saem separadas por quebra de página (\f), como no `pdftotext`.
 */
export function ocrDoPdf(caminhoPdf) {
  const paginas = paginasDoPdf(caminhoPdf);
  if (!paginas) return { texto: null, motivo: 'pdf_ilegivel' };
  if (paginas > MAXIMO_DE_PAGINAS_OCR) return { texto: null, motivo: 'ocr_adiado_arquivo_grande', paginas };
  const dir = mkdtempSync(path.join(tmpdir(), 'ocr-'));
  try {
    execFileSync('pdftoppm', ['-r', '300', '-gray', '-png', caminhoPdf, path.join(dir, 'p')], { stdio: 'ignore', timeout: 20 * 60 * 1000 });
    const imagens = readdirSync(dir).filter((f) => f.endsWith('.png')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const partes = imagens.map((f) => execFileSync('tesseract', [path.join(dir, f), '-', '-l', 'por', '--psm', '4'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 }));
    return { texto: partes.join('\f'), paginas };
  } catch (e) {
    return { texto: null, motivo: 'falha_no_ocr', paginas };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * O PDF é digitalização? Critério: em quase todas as páginas (≥ 80%) há uma
 * imagem que cobre mais de um terço da folha — a foto do papel (página de mapa
 * ou figura digitalizada ocupa menos que a folha inteira: LC 193/1988). Só "ter
 * imagem" não serve: PDFs gerados pelo sistema trazem brasão ou selo de
 * assinatura em toda página (medido: Resolução 3.006/2026 e Lei 14.504/2026).
 * Importa porque muita digitalização JÁ traz uma camada de texto, só que ruim
 * e incompleta (LC 51/1980: 839 caracteres em 2 páginas; o OCR daqui lê 2,8 mil).
 */
export function pdfDigitalizado(caminhoPdf) {
  try {
    const info = execFileSync('pdfinfo', [caminhoPdf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const paginas = Number((/^Pages:\s+(\d+)/m.exec(info) || [])[1] || 0);
    const tam = /^Page size:\s+([\d.]+) x ([\d.]+) pts/m.exec(info);
    if (!paginas || !tam) return false;
    const areaDaFolha = (Number(tam[1]) / 72) * (Number(tam[2]) / 72); // polegadas quadradas
    const linhas = execFileSync('pdfimages', ['-list', caminhoPdf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').slice(2).filter((l) => l.trim());
    const cobertas = new Set();
    for (const l of linhas) {
      const c = l.trim().split(/\s+/); // page num type width height color comp bpc enc interp object ID x-ppi y-ppi size ratio
      const [pagina, largura, altura, ppiX, ppiY] = [c[0], Number(c[3]), Number(c[4]), Number(c[12]), Number(c[13])];
      if (ppiX > 0 && ppiY > 0 && (largura / ppiX) * (altura / ppiY) >= 0.35 * areaDaFolha) cobertas.add(pagina);
    }
    return cobertas.size >= 0.8 * paginas;
  } catch (e) { return false; }
}
