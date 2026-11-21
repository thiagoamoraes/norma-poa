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


/**
 * Documento repetido no mesmo arquivo, com diferença só de espaçamento (arquivos do SIREL de 2010 a 2014:
 * o HTML traz a lei 3 vezes, e o espaço entre palavras muda de uma cópia para outra). Devolve { texto,
 * repeticoes }: só a 1ª cópia. Regra estrita (a igualdade de removerRepeticaoIntegral continua valendo):
 *  - a epígrafe ("LEI COMPLEMENTAR Nº N, DE …") tem de aparecer 2+ vezes, igual depois de tirar tudo que
 *    não é letra nem algarismo;
 *  - cada cópia vai da epígrafe até a epígrafe seguinte (a última, até o fim), SEM as linhas finais do
 *    timbre da cópia seguinte (brasão, "Prefeitura Municipal de Porto Alegre"): só palavras do timbre;
 *  - as cópias têm de ser IGUAIS entre si (letras e algarismos), sem tolerância. Qualquer diferença: não mexe.
 */
const PALAVRAS_DE_TIMBRE = new Set(['brasao', 'g', 'brasao.g', '(2807', '2807', 'bytes)', 'bytes', 'prefeitura', 'municipal', 'de', 'porto', 'alegre']);
const soAlnum = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
export function removerCopiasDoDocumento(texto) {
  const linhas = String(texto).split('\n');
  const reEpigrafe = /^\s*(?:LEI|EMENDA|RESOLU[ÇC][ÃA]O|DECRETO|ORDEM)\b.*\d/i;
  const norm = linhas.map((l) => (reEpigrafe.test(l) ? soAlnum(l) : ''));
  const contagem = new Map();
  norm.forEach((n) => { if (n) contagem.set(n, (contagem.get(n) || 0) + 1); });
  const alvo = norm.find((n) => n && contagem.get(n) >= 2);
  if (!alvo) return { texto, repeticoes: 1 };
  const inicios = [];
  norm.forEach((n, i) => { if (n === alvo) inicios.push(i); });
  const ehTimbre = (l) => { const ps = l.trim().toLowerCase().split(/\s+/).filter(Boolean); return ps.length > 0 && ps.every((p) => PALAVRAS_DE_TIMBRE.has(p) || /^brasao\.\w+$/.test(p)); };
  const copias = inicios.map((ini, i) => {
    let fim = i + 1 < inicios.length ? inicios[i + 1] : linhas.length;
    // tira o timbre da cópia seguinte (e linhas em branco) do fim desta
    while (fim > ini + 1 && (!linhas[fim - 1].trim() || (i + 1 < inicios.length && ehTimbre(linhas[fim - 1])))) fim--;
    return { ini, fim, chave: soAlnum(linhas.slice(ini, fim).join(' ')) };
  });
  if (!copias.every((c) => c.chave === copias[0].chave)) return { texto, repeticoes: 1 };
  return { texto: linhas.slice(0, copias[0].fim).join('\n') + '\n', repeticoes: copias.length };
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
      if (!mFim || !mIni || (mIni[2] === ')' && (mIni[1].length === 1 || mIni[1][0] === mIni[1][1])) || /^\s*(?:[IVXLCDM]+\s*[-–—]|Art\.|Par[áa]grafo\s+[úu]nico)/.test(prox)) break;
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
  return removerCopiasDoDocumento(restaurarFechoComEspacamentoEstragado(juntarFechoQuebrado(juntarAberturaDeBlocoPartida(desfazerHifenizacao(removerRuidoDePagina(colarPontoDoArtigo(separarArtigoDoPreambulo(cp1252ParaUnicode(String(texto))))).replace(/\f/g, '\n')).texto)))).texto;
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

/**
 * Ruído de impressão (decisão do mantenedor, 20/11/2026): sai do texto LIDO — o .txt guardado não
 * muda — (a) a linha com apenas o número da PRÓPRIA página, uma por página (a página é contada pelos
 * `\f` do texto extraído), e (b) o carimbo de processo (`PROC. Nº …`, `PLCL|PLCE|PLL|PLE|PELO|PR Nº …`)
 * que se repete 2 ou mais vezes no documento. Regra estrita de propósito: número que não é o da página
 * (quadro numérico, como o do plano diretor) e carimbo que aparece uma vez ficam. A linha é apagada,
 * não deixada em branco; se tinha o `\f` de início de página, o `\f` passa para a linha seguinte.
 * Roda ANTES de trocar `\f` por quebra de linha.
 */
export function removerRuidoDePagina(texto) {
  const linhas = String(texto).split('\n');
  const reCarimbo = /^\s*(?:PROC\.?\s*N[º°o.]*\s*[\d./-]+\s*(?:(?:PLCL|PLCE|PLL|PLE|PELO|PR)\s*N[º°o.]*\s*[\d./-]+\s*)?|(?:PLCL|PLCE|PLL|PLE|PELO|PR)\s*N[º°o.]*\s*[\d./-]+\s*)$/i;
  const conta = new Map();
  for (const l of linhas) {
    const limpa = l.replace(/\f/g, '');
    if (reCarimbo.test(limpa)) conta.set(limpa.trim(), (conta.get(limpa.trim()) || 0) + 1);
  }
  let pagina = 1;
  const numeroJaTirado = new Set();
  const saida = [];
  let fPendente = false;
  for (const l of linhas) {
    const limpa = l.replace(/\f/g, '');
    const paginaDaLinha = pagina + (l.startsWith('\f') ? 1 : 0);
    let tira = false;
    if (/^ *\d{1,3} *$/.test(limpa) && +limpa.trim() === paginaDaLinha && !numeroJaTirado.has(paginaDaLinha)) { numeroJaTirado.add(paginaDaLinha); tira = true; }
    if (reCarimbo.test(limpa) && conta.get(limpa.trim()) >= 2) tira = true;
    pagina += (l.match(/\f/g) || []).length;
    if (tira) { if (l.startsWith('\f')) fPendente = true; }
    else { saida.push(fPendente && !l.startsWith('\f') ? '\f' + l : l); fPendente = false; }
  }
  return saida.join('\n');
}

/**
 * "Art. 1º" na MESMA linha do fim do preâmbulo ("… promulgo a seguinte Lei Complementar: Art. 1º Fica…"),
 * como o DOCX junta o parágrafo (LC 37041 do catálogo). Quebra a linha antes do "Art. 1º" — só do 1º artigo,
 * só depois de "seguinte Lei/Lei Complementar/Emenda …:" e só com "Art." de A maiúsculo.
 */
export function separarArtigoDoPreambulo(texto) {
  return String(texto).replace(/^(.*\bseguinte (?:Lei(?: Complementar)?|Emenda[^:\n]*)):[ \t]+(Art\. ?1[º°o]?\b)/gm, '$1:\n$2');
}

/**
 * Fecho com o ESPAÇAMENTO estragado pela extração do PDF (decisão 29, 21/11/2026): é um dos 4 fechos já
 * reconhecidos, só com espaços trocados ou a linha quebrada em até 3 pedaços — "PREFEITURAMUNICIPAL DE PORTO
 * ALEGRE, 5 de agosto de 2014.", "PORTOALEGRE", "M UN ICIPA L", "6 d e ju lho de" / "201 1." — e, em DOCX, o
 * fecho colado ao fim da linha do último artigo. Regra estrita: só depois do 1º "Art.", só se ainda não há fecho
 * legível, só a partir de uma das 4 cabeças institucionais e só com mês válido e ano de 4 dígitos. Devolve a
 * linha no formato canônico preservando o que a fonte escreveu (inclusive o "º" do dia). Fecho ilegível por OCR
 * (mês "MAJO") NÃO é recuperado: a norma continua "a revisar". O .txt guardado não muda.
 */
const MESES_FECHO = { janeiro: 'janeiro', fevereiro: 'fevereiro', marco: 'março', 'março': 'março', abril: 'abril', maio: 'maio', junho: 'junho', julho: 'julho', agosto: 'agosto', setembro: 'setembro', outubro: 'outubro', novembro: 'novembro', dezembro: 'dezembro' };
const CABECAS_FECHO = [
  ['PREFEITURAMUNICIPALDEPORTOALEGRE', 'PREFEITURA MUNICIPAL DE PORTO ALEGRE'],
  ['GABINETEDAPRESIDÊNCIADACÂMARAMUNICIPALDEPORTOALEGRE', 'GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL DE PORTO ALEGRE'],
  ['GABINETEDAPRESIDENCIADACAMARAMUNICIPALDEPORTOALEGRE', 'GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL DE PORTO ALEGRE'],
  ['CÂMARAMUNICIPALDEPORTOALEGRE', 'CÂMARA MUNICIPAL DE PORTO ALEGRE'],
  ['CAMARAMUNICIPALDEPORTOALEGRE', 'CÂMARA MUNICIPAL DE PORTO ALEGRE'],
  ['PORTOALEGRE', 'Porto Alegre'],
];
const RE_FECHO_LEGIVEL = /^(?:(?:PREFEITURA\s+MUNIC\s?IPAL\s+DE\s+PORTO\s+ALEGRE|GABINETE\s+DA\s+PRESID[ÊE]NCIA\s+DA\s+C[ÂA]MARA\s+MUNICIPAL)\b|C[ÂA]MARA\s+MUNICIPAL\s+DE\s+PORTO\s+ALEGRE\s*,\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de\s+\d{4}\s*\.?\s*$|PORTO\s+ALEGRE\s*,\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de\s+\d{4}\s*\.?\s*$)/i;
export function restaurarFechoComEspacamentoEstragado(texto) {
  const L = String(texto).split('\n');
  const reCompacto = /^(.+?),(\d{1,2})([º°o]?)de([A-Za-zÀ-ú]{3,9})de(\d{4})\.?$/i;
  const saida = [];
  let viuArtigo = false, fechoVisto = false;
  for (let i = 0; i < L.length; i++) {
    let linha = L[i];
    if (/^\s*Art/.test(linha)) viuArtigo = true;
    if (viuArtigo && !fechoVisto && RE_FECHO_LEGIVEL.test(linha.trim())) fechoVisto = true;
    if (!viuArtigo || fechoVisto) { saida.push(linha); continue; }
    // fecho (só das 3 cabeças institucionais em maiúsculas) colado ao fim da linha do último artigo
    const mCola = /^(.*\S)\s+((?:PREFEITURA MUNICIPAL DE PORTO ALEGRE|GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL DE PORTO ALEGRE|CÂMARA MUNICIPAL DE PORTO ALEGRE),\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de\s+\d{4}\.?)\s*$/.exec(linha);
    if (mCola && /^\s*Art/.test(linha) && RE_FECHO_LEGIVEL.test(mCola[2])) { saida.push(mCola[1], mCola[2]); fechoVisto = true; continue; }
    const c0 = linha.replace(/\s+/g, '');
    const up = c0.toUpperCase();
    if (!c0 || !CABECAS_FECHO.some(([h]) => up.startsWith(h.slice(0, Math.min(h.length, 9))) || h.startsWith(up))) { saida.push(linha); continue; }
    let acum = c0, fim = i, pecas = 1, achado = null;
    for (;;) {
      const m = reCompacto.exec(acum);
      if (m) {
        const cab = CABECAS_FECHO.find(([k]) => k === m[1].toUpperCase());
        const mes = MESES_FECHO[m[4].toLowerCase()];
        if (cab && mes) achado = { cab: cab[1], dia: m[2] + m[3].replace(/^o$/i, 'º'), mes: m[4], ano: m[5] };
        break;
      }
      if (pecas >= 3) break;
      let k = fim + 1; while (k < L.length && !L[k].trim()) k++;
      if (k >= L.length) break;
      if (/\d{4}/.test(acum) && !/de$/i.test(acum)) break;
      const prox = L[k].replace(/\s+/g, '');
      if (acum.length + prox.length > 140) break;
      acum += prox; fim = k; pecas++;
    }
    if (!achado) { saida.push(linha); continue; }
    const cabeca = achado.cab;
    const de = achado.mes === achado.mes.toUpperCase() ? 'DE' : 'de';
    saida.push(`${cabeca}, ${achado.dia} ${de} ${achado.mes} ${de} ${achado.ano}.`);
    fechoVisto = true; i = fim;
  }
  return saida.join('\n');
}

/**
 * "Art .10." (espaço ANTES do ponto e número colado depois) — grafia que a extração do PDF produziu na
 * LC 670/2011 (id 37136). Vira "Art. 10." Só quando o número vem colado ao ponto: "Art . 59 -" (espaço dos
 * dois lados, como nos escaneados antigos) fica como está. A conferência ignora espaço e pontuação.
 */
export function colarPontoDoArtigo(texto) {
  return String(texto).replace(/^([ \t]*Art) \.(?=\d)/gm, '$1. ');
}
