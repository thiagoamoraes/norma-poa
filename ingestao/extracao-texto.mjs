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
    .replace(/&#(\d+);/g, (_, n) => cp1252ParaUnicode(String.fromCodePoint(Number(n))))
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

// ─── DOCX ─────────────────────────────────────────────────────────────────────
import { inflateRawSync } from 'node:zlib';

/** Lê UM arquivo de dentro de um ZIP (bytes). Devolve Buffer ou null. Sem dependências. */
export function lerDoZip(bytes, nome) {
  const b = Buffer.from(bytes);
  let fim = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (b.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  if (fim < 0) return null;
  const total = b.readUInt16LE(fim + 10);
  let p = b.readUInt32LE(fim + 16);
  for (let k = 0; k < total; k++) {
    if (b.readUInt32LE(p) !== 0x02014b50) return null;
    const metodo = b.readUInt16LE(p + 10);
    const tamComp = b.readUInt32LE(p + 20);
    const tamNome = b.readUInt16LE(p + 28), tamExtra = b.readUInt16LE(p + 30), tamComent = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const n = b.toString('utf8', p + 46, p + 46 + tamNome);
    if (n === nome) {
      const ini = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
      const dados = b.subarray(ini, ini + tamComp);
      return metodo === 0 ? Buffer.from(dados) : metodo === 8 ? inflateRawSync(dados) : null;
    }
    p += 46 + tamNome + tamExtra + tamComent;
  }
  return null;
}

/**
 * DOCX (bytes) → texto plano, uma linha por parágrafo do documento. Lê só o
 * corpo (word/document.xml): cabeçalho e rodapé de página ficam de fora.
 * Devolve null se o arquivo não for um DOCX legível.
 */
export function docxParaTexto(bytes) {
  const xml = lerDoZip(bytes, 'word/document.xml');
  if (!xml) return null;
  const decod = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
  const linhas = [];
  for (const par of xml.toString('utf8').split(/<\/w:p>/)) {
    let t = '';
    const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\b[^>]*\/>|<w:(?:br|cr)\b[^>]*\/>|<w:noBreakHyphen\b[^>]*\/>/g;
    let m;
    while ((m = re.exec(par))) t += m[1] !== undefined ? decod(m[1]) : m[0].startsWith('<w:tab') ? ' ' : m[0].startsWith('<w:noBreak') ? '-' : '\n';
    for (const l of t.split('\n')) { const limpa = l.replace(/[ \t ]+/g, ' ').trim(); if (limpa) linhas.push(limpa); }
  }
  return linhas.join('\n') + '\n';
}

/**
 * Texto extraído (de PDF, por exemplo) que traz o documento inteiro repetido —
 * caso real: PDF da LC 692/2012, que é a impressão de uma página com a lei 3
 * vezes. Devolve { texto, repeticoes }: só a 1ª cópia, com a formatação dela.
 * Mesma regra de removerRepeticaoIntegral: só igualdade exata, linha a linha.
 */
export function removerRepeticaoDeTexto(texto) {
  const linhas = String(texto).replace(/\f/g, '\n').split('\n');
  const cheias = [];
  linhas.forEach((l, i) => { if (l.trim()) cheias.push(i); });
  const { repeticoes } = removerRepeticaoIntegral(cheias.map((i) => linhas[i].trim()));
  if (repeticoes === 1) return { texto, repeticoes: 1 };
  const ultima = cheias[cheias.length / repeticoes - 1];
  return { texto: linhas.slice(0, ultima + 1).join('\n') + '\n', repeticoes };
}

// ─── Hifenização de fim de linha ──────────────────────────────────────────────

// Depois do hífen, estas formas são pronome ou desinência ligados por hífen de
// verdade ("aplica-se", "constituir-se-á", "fá-lo"): o hífen fica.
const ENCLITICOS = new Set(['se', 'me', 'te', 'lhe', 'lhes', 'nos', 'vos', 'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'á', 'ão', 'ia', 'iam', 'ei', 'emos']);

/**
 * desfazerHifenizacao(texto) → { texto, juntadas, mantidas }
 *
 * O PDF justificado quebra palavras no fim da linha ("cultu-" / "rais", "pode-" /
 * "rão"). Sem tratar, o texto fica "cultu- rais" — caso real: Lei nº 11.213/2012,
 * 19 de 66 linhas. Isto NÃO é corrigir redação: é desfazer a quebra tipográfica.
 *
 * Regra, da evidência mais forte para a mais fraca:
 *   1. a palavra inteira ("culturais") aparece em outro ponto do MESMO texto,
 *      fora de quebra de linha → junta, sem hífen;
 *   2. a forma com hífen ("Bônus-Moradia") aparece em outro ponto → mantém o hífen;
 *   3. depois do hífen vem pronome/desinência ("aplica-" / "se") ou maiúscula
 *      ("Vice-" / "Prefeito") → mantém o hífen;
 *   4. senão → junta (em português, hífen de fim de linha é quase sempre
 *      separação de sílaba).
 * Em todos os casos as duas linhas viram uma só, sem o espaço espúrio.
 * Só entra linha que termina em letra + hífen, seguida de linha que começa por
 * letra minúscula ou maiúscula de palavra (não por rótulo: "a)", "I –", "§").
 */
export function desfazerHifenizacao(texto) {
  const linhas = String(texto).split('\n');
  const palavras = (s) => (s.match(/[\p{L}]+(?:-[\p{L}]+)*/gu) || []);
  // vocabulário do próprio texto, sem as pontas de linha (que podem ser pedaços)
  const inteiras = new Set(), comHifen = new Set();
  for (const l of linhas) {
    const ps = palavras(l.trim());
    ps.forEach((p, i) => {
      if (i === 0 || (i === ps.length - 1 && /-\s*$/.test(l))) return;
      if (p.includes('-')) comHifen.add(p.toLowerCase()); else inteiras.add(p.toLowerCase());
    });
  }
  const saida = [];
  let juntadas = 0, mantidas = 0;
  for (let i = 0; i < linhas.length; i++) {
    let atual = linhas[i];
    for (;;) {
      const mFim = /([\p{L}]+)-\s*$/u.exec(atual);
      const prox = linhas[i + 1];
      const mIni = prox !== undefined ? /^\s*([\p{L}]+)(.?)/u.exec(prox) : null;
      if (!mFim || !mIni || mIni[2] === ')' || /^\s*(?:[IVXLCDM]+\s*[-–—]|Art\.|Par[áa]grafo\s+[úu]nico)/.test(prox)) break;
      const a = mFim[1], b = mIni[1];
      const junta = (a + b).toLowerCase(), hifenada = (a + '-' + b).toLowerCase();
      let manter;
      if (inteiras.has(junta) && !comHifen.has(hifenada)) manter = false;
      else if (comHifen.has(hifenada)) manter = true;
      else manter = ENCLITICOS.has(b.toLowerCase()) || /^\p{Lu}/u.test(b);
      const cabeca = atual.replace(/-\s*$/, manter ? '-' : '');
      atual = cabeca + prox.replace(/^\s+/, '');
      if (manter) mantidas++; else juntadas++;
      i++;
    }
    saida.push(atual);
  }
  return { texto: saida.join('\n'), juntadas, mantidas };
}

/**
 * Preparo padrão do texto extraído antes de qualquer leitura (estruturação,
 * histórico): quebra de página vira quebra de linha e a hifenização de fim de
 * linha é desfeita. O arquivo .txt guardado NÃO é alterado.
 */
export function prepararTextoExtraido(texto) {
  return juntarFechoQuebrado(juntarAberturaDeBlocoPartida(desfazerHifenizacao(cp1252ParaUnicode(String(texto)).replace(/\f/g, '\n')).texto));
}

/**
 * Abertura de bloco de alteração partida pela extração: a linha traz só a
 * aspa de abertura e "Art." (`“Art.`) e o número do artigo alterado vem na
 * linha seguinte (`25......`). Visto em PDFs de 2013–2014 (9 textos do acervo,
 * entre eles a LC 689/2012). Junta as duas, descartando as linhas em branco do
 * meio. Só junta quando há aspa de abertura e a linha seguinte começa por
 * algarismo — "Art." sem aspa, ou seguido de texto, fica como está.
 */
export function juntarAberturaDeBlocoPartida(texto) {
  const linhas = String(texto).split('\n');
  const saida = [];
  for (let i = 0; i < linhas.length; i++) {
    if (/^\s*["“”']\s*Art(?:igo)?\.?\s*$/.test(linhas[i])) {
      let k = i + 1;
      while (k < linhas.length && !linhas[k].trim()) k++;
      if (k < linhas.length && /^\s*\d/.test(linhas[k])) {
        saida.push(linhas[i].trimEnd() + ' ' + linhas[k].trimStart());
        i = k;
        continue;
      }
    }
    saida.push(linhas[i]);
  }
  return saida.join('\n');
}

/**
 * Fecho com a data partida em duas linhas pela extração: "CÂMARA MUNICIPAL DE PORTO ALEGRE, 6 DE
 * NOVEMBRO DE" / "2017." (visto em LC 820/2017 e LC 769/2015, entre outras). Junta as duas SÓ quando a
 * primeira é um fecho conhecido que termina em "de" e a seguinte é apenas o ano (com ponto opcional) —
 * decisão do mantenedor, 20/11/2026. Nenhum fecho novo é aceito: é o mesmo fecho, quebrado pela extração.
 */
export function juntarFechoQuebrado(texto) {
  const reInicio = /^(?:C[ÂA]MARA\s+MUNICIPAL\s+DE\s+PORTO\s+ALEGRE|PREFEITURA\s+MUNIC\s?IPAL\s+DE\s+PORTO\s+ALEGRE|GABINETE\s+DA\s+PRESID[ÊE]NCIA\s+DA\s+C[ÂA]MARA\s+MUNICIPAL[^,]{0,60}|PORTO\s+ALEGRE)\s*,\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de$/i;
  const linhas = String(texto).split('\n');
  const saida = [];
  for (let i = 0; i < linhas.length; i++) {
    if (reInicio.test(linhas[i].trim())) {
      let k = i + 1;
      while (k < linhas.length && !linhas[k].trim()) k++;
      if (k < linhas.length && /^\d{4}\.?$/.test(linhas[k].trim())) {
        saida.push(linhas[i].trimEnd() + ' ' + linhas[k].trim());
        i = k;
        continue;
      }
    }
    saida.push(linhas[i]);
  }
  return saida.join('\n');
}

/**
 * Aspas, travessão e afins gravados como caracteres de CONTROLE (U+0080–U+009F). O SIREL escreve "&#147;" e
 * "&#148;" (aspas), "&#150;" (travessão) etc.: números da tabela Windows-1252, que a leitura tratava como
 * Unicode e gravava como controles invisíveis. Sem as aspas, `detectNRCandidates` não vê a abertura do bloco
 * de alteração e o texto da lei-alvo vira dispositivo da alteradora (o plano PLANO-ALTERADORA-SEM-ASPAS.md
 * mediu 16 textos assim, todos de HTML do SIREL). Controles C1 nunca são texto legítimo: o mapa é seguro.
 */
const CP1252 = { 0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž',
  0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ' };
export function cp1252ParaUnicode(texto) {
  return String(texto).replace(/[\u0080-\u009f]/g, (ch) => CP1252[ch.charCodeAt(0)] ?? ch);
}
