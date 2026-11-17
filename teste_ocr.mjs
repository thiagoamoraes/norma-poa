// teste_ocr.mjs
//
// OCR de PDF digitalizado (ingestao/ocr.mjs). Fixture REAL:
// fixtures/ocr/lc51_1980_digitalizada.pdf — Lei Complementar nº 51, de 15 de
// dezembro de 1980, como está na base da PGM (2 páginas datilografadas,
// digitalizadas; baixada em 17/11/2026).
// Precisa de `tesseract` com o idioma português e do poppler-utils; se não
// houver, o teste PULA (sai com 0) em vez de falhar.
// Sem rede. Uso: node teste_ocr.mjs

import { execFileSync } from 'node:child_process';
import { ocrDisponivel, ocrDoPdf, pdfDigitalizado, paginasDoPdf } from './ingestao/ocr.mjs';
import { contarAlfanumericos } from './ingestao/extracao-texto.mjs';
import { extrairCabecalhoLeiPublicada } from './norma-core.js';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };
const PDF = './fixtures/ocr/lc51_1980_digitalizada.pdf';

ok('LC 51/1980: reconhecida como digitalização (imagem de página inteira em todas as páginas)', pdfDigitalizado(PDF) === true && paginasDoPdf(PDF) === 2);
ok('PDFs gerados pelo sistema (brasão/selo em toda página) NÃO são tomados por digitalização', ['lc1075', 'res3006', 'lei14504'].every((f) => pdfDigitalizado(`./fixtures/pdf/${f}.pdf`) === false));
ok('arquivo que não existe → false, sem exceção', pdfDigitalizado('./nao-existe.pdf') === false && paginasDoPdf('./nao-existe.pdf') === 0);

if (!ocrDisponivel()) {
  console.log('  ⊘ PULADO — tesseract (com o idioma "por") não está instalado nesta máquina.');
} else {
  const camada = contarAlfanumericos(execFileSync('pdftotext', ['-layout', PDF, '-'], { encoding: 'utf8' }));
  const r = ocrDoPdf(PDF);
  const lido = contarAlfanumericos(r.texto);
  console.log(`  (camada de texto do arquivo: ${camada} caracteres; OCR: ${lido})`);
  ok('LC 51/1980: o OCR lê pelo menos o dobro do que a camada de texto do arquivo traz', r.paginas === 2 && lido > 2 * camada && lido > 1500);
  ok('LC 51/1980: páginas separadas por quebra de página', r.texto.split('\f').length === 2);
  ok('LC 51/1980: o essencial é legível — epígrafe, preâmbulo, artigo e a lei alterada', /LEI COMPLEMENTAR N.? ?51/.test(r.texto) && /PRESIDENTE DA C[ÂA]MARA MUNICIPAL DE PORTO ALEGRE/.test(r.texto) && /Art\. 1º/.test(r.texto) && /Lei Complementar nº 43/.test(r.texto));
  ok('LC 51/1980: é texto de OCR, com os defeitos de OCR — o cabeçalho sai "NO 51" e o motor NÃO o reconhece (a identidade vem do catálogo)', extrairCabecalhoLeiPublicada(r.texto) === null);
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
