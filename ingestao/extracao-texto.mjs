// ingestao/extracao-texto.mjs
//
// Funções PURAS de extração de texto a partir do arquivo bruto de uma norma.
// A extração é DERIVADA e refazível: o arquivo bruto é guardado à parte e
// nunca é alterado. Nada aqui "arruma" redação (palavras coladas do SIREL,
// por exemplo, ficam como estão).
//
// Formatos com exemplo real validado (teste_textos_sapl.mjs):
//   - HTML do antigo SIREL (FrontPage, windows-1252, sem declaração de charset)
// PDF é extraído pelo baixar-textos.mjs com `pdftotext -layout` (mesmo formato
// dos fixtures .txt do repositório). DOC/DOCX/ODT/PPT/imagem: sem extração por
// enquanto — ficam marcados como pendentes.

/** Quantidade de letras e algarismos — medida de "tem texto de verdade?". */
export function contarAlfanumericos(texto) {
  return (texto || '').replace(/[^\p{L}\p{N}]/gu, '').length;
}

/** Abaixo disso, um PDF é tratado como imagem digitalizada (precisa de OCR). */
export const MINIMO_ALFANUMERICOS = 200;

const ENTIDADES = { nbsp: ' ', quot: '"', amp: '&', lt: '<', gt: '>', ordm: 'º', ordf: 'ª', sect: '§', deg: '°' };

/**
 * Achado real (Lei nº 9.113/2003): o arquivo do SIREL traz o documento INTEIRO
 * repetido 3 vezes em sequência. Se as linhas são k cópias idênticas e
 * consecutivas de um mesmo bloco, devolve uma cópia e k; senão, as linhas e 1.
 * Só igualdade exata — repetição parcial não é mexida.
 */
export function removerRepeticaoIntegral(linhas) {
  for (let k = 10; k >= 2; k--) {
    if (linhas.length % k) continue;
    const n = linhas.length / k;
    if (n < 3) continue;
    let igual = true;
    for (let i = n; i < linhas.length && igual; i++) igual = linhas[i] === linhas[i % n];
    if (igual) return { linhas: linhas.slice(0, n), repeticoes: k };
  }
  return { linhas, repeticoes: 1 };
}

/**
 * HTML do SIREL (bytes) → { texto, repeticoes }: texto plano, uma linha por
 * parágrafo/linha de tabela. Decodifica como windows-1252 (o legado não
 * declara charset; UTF-8 só se o próprio arquivo declarar).
 */
export function htmlSirelParaTexto(bytes) {
  const cabeca = Buffer.from(bytes.subarray(0, 2000)).toString('latin1');
  const charset = /charset\s*=\s*["']?\s*utf-?8/i.test(cabeca) ? 'utf-8' : 'windows-1252';
  const html = new TextDecoder(charset).decode(bytes);
  const todas = html
    .replace(/<(script|style|title)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<\s*(?:p|br|tr|div|table|h[1-6]|li|center)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? m)
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean);
  const { linhas: unicas, repeticoes } = removerRepeticaoIntegral(todas);
  // A 1ª linha "Prefeitura Municipal de Porto Alegre" é o timbre da página do
  // SIREL (ao lado do brasão), não é texto da norma — e, se ficar, o leitor a
  // toma por epígrafe. Só essa linha exata, só na 1ª posição.
  const linhas = unicas[0] === 'Prefeitura Municipal de Porto Alegre' ? unicas.slice(1) : unicas;
  return { texto: linhas.join('\n') + '\n', repeticoes };
}

/** Extensão do arquivo a partir da URL (minúscula, sem ponto); 'bin' se não houver. */
export function extensaoDaUrl(url) {
  const m = /\.([a-z0-9]{2,5})$/i.exec(new URL(url).pathname);
  return m ? m[1].toLowerCase() : 'bin';
}
