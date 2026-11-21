/**
 * norma-core.js — Motor de parsing legislativo standalone
 *
 * Extraído do STL Editor (originalmente construído para edição de MINUTAS —
 * projetos de lei em elaboração) e desacoplado de qualquer dependência de UI,
 * estado global ou banco de dados. Funciona em Node.js (ESM), Deno ou browser.
 *
 * Em expansão para o projeto Norma (motor de apuração de texto vigente e
 * versionamento legislativo). Duas frentes coexistem no arquivo, com
 * premissas diferentes:
 *
 *   1) MINUTA/PROJETO — parseMinuta(), normalizar(), detectNRCandidates(),
 *      extrairRedacaoAlterada(): assumem um texto de passagem única (uma
 *      minuta ou uma lei tal como promulgada), sem repetição de dispositivo.
 *
 *   2) LEI-ALVO COMPILADA — parseLeiAlvoIndex(), parseLeiAlvoAnotacoes():
 *      assumem um texto no formato "compilado" de portais como o leis.org —
 *      onde o MESMO endereço (ex. "art. 4º") pode aparecer várias vezes em
 *      sequência, uma por versão histórica, cada uma com uma anotação
 *      marginal ("Redação dada pela Lei X"). A convenção observada nesse
 *      formato é: a ocorrência mais recente de um endereço no texto é a
 *      vigente. As funções desta frente devolvem o TEXTO VIGENTE a partir do
 *      "compilado" (todo o histórico empilhado). Essa é uma premissa do
 *      formato leis.org, não uma regra universal de técnica legislativa —
 *      documentado onde relevante.
 *
 * NOTA DE TERMINOLOGIA (LC 611/2009, art. 19): "Compilação" (reunião em um
 * só texto, sem processo legislativo, sem revogação formal) é exatamente o
 * formato leis.org acima. "Consolidação" tem definição própria e mais
 * restrita na lei — um ato legislativo formal que reúne VÁRIAS leis
 * conexas num diploma novo, com revogação formal das antigas (LC 611, art.
 * 19, §3º; art. 22-25). O que este módulo produz — o texto vigente de UMA
 * lei a partir do histórico de alterações dela mesma — não é "Consolidação"
 * nesse sentido técnico, por isso o módulo usa "texto vigente" e evita o
 * termo "consolidado"/"consolidação" para esse conceito a partir desta
 * revisão. (Rodadas anteriores do projeto usaram "consolidado" informalmente
 * — ver CHANGELOG para o histórico da correção.)
 *
 * Texto copiado de leis.org como HTML/markdown costuma trazer os números de
 * lei como links — "Lei Complementar nº[320](url)" — o que quebra qualquer
 * extração por regex. Rode limparMarkdownLinks() (ou prepararTextoOrigem(),
 * que também remove ruído de navegação do site) antes de qualquer outra
 * função deste módulo.
 *
 * USO BÁSICO (minuta/projeto):
 *   import { parseMinuta, normalizar, detectNRCandidates,
 *            extrairRedacaoAlterada, parseLeiAlvoIndex,
 *            extrairCitacoesExternas } from './norma-core.js';
 *
 *   const doc = parseMinuta(textoLei);
 *   normalizar(doc);
 *   // doc.artigos é a árvore estruturada da lei
 *
 * USO BÁSICO (lei-alvo compilada, ex. exportação do leis.org):
 *   import { prepararTextoOrigem, extrairCabecalhoLeiPublicada,
 *            parseLeiAlvoIndex, parseLeiAlvoAnotacoes } from './norma-core.js';
 *
 *   const raw = prepararTextoOrigem(textoCopiadoDoLeisOrg);
 *   const cabecalho = extrairCabecalhoLeiPublicada(raw); // {tipoAto, numero, ano, dataPublicacao}
 *   const vigente = parseLeiAlvoIndex(raw);   // { "art. 4º": "texto vigente…", … }
 *   const anot = parseLeiAlvoAnotacoes(raw);  // { "art. 4º": "Redação dada pela Lei X", … }
 *
 * ESTRUTURA DO NÓ:
 *   { id, tipo, texto, children[], conj, desFixo?, gruposAntes?,
 *     omitido?, vetado?, revogado?, nrBloco? }
 *
 * TIPOS: "artigo" | "paragrafo" | "inciso" | "alinea" | "item"
 *        "ementa" | "em" | "omissao" | "texto"
 */

// ─── ID generator ────────────────────────────────────────────────────────────

let _id = 1;
export const nid = () => "n" + (_id++);
export const resetIdCounter = () => { _id = 1; };

// ─── Roman numerals ──────────────────────────────────────────────────────────

export const ROM = ["","I","II","III","IV","V","VI","VII","VIII","IX","X",
  "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
  "XXI","XXII","XXIII","XXIV","XXV"];
// além de XXV (rótulo "XXVI –" … "XXXVIII –" existe em lei real): completa a tabela até 399, sem lacuna
for (let n = ROM.length; n < 400; n++) {
  let r = "", k = n;
  for (const [v, t] of [[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]) while (k >= v) { r += t; k -= v; }
  ROM.push(r);
}
export const roman       = n => ROM[n] || String(n);
export const romanToInt  = r => { const i = ROM.indexOf((r||"").toUpperCase()); return i > 0 ? i : null; };
export const romVal      = r => { const i = ROM.indexOf(r.toUpperCase()); return i > 0 ? i : null; };

/** Letras de alínea além de 'z': aa, bb, cc… (art. 13, XII, da LC 611/2009) */
export const alphaLabel  = i => i < 26
  ? String.fromCharCode(97 + i)
  : (s => s + s)(String.fromCharCode(97 + ((i - 26) % 26)));

// ─── Texto dos nós ───────────────────────────────────────────────────────────
// Suporta tanto nós com `.texto` (string, modo Norma) quanto `.toks` (modo editor)

export const visText = n =>
  n.texto !== undefined
    ? n.texto
    : (n.toks || []).filter(t => t.st !== "del").map(t => t.v).join("");

/** Remove terminador final (ponto, vírgula, dois-pontos, ponto-e-vírgula) */
export const stripTerm = s =>
  s.replace(/\s*[;,:]+\s*(e|ou)?\s*$/i, "").replace(/\s*\.+\s*$/, "").trim();

/** Enumera filhos de enumeração (incisos, alíneas, itens) */
export const enumKids = n =>
  (n.children || []).filter(c => ["inciso","alinea","item"].includes(c.tipo));

// ─── Traversal ───────────────────────────────────────────────────────────────

export function walkNodes(nodes, fn, parent, depth, externo, introId) {
  nodes.forEach(n => {
    fn(n, nodes, parent, depth || 0, externo || false, introId || null);
    if (n.children && n.children.length)
      walkNodes(n.children, fn, n, (depth||0)+1, externo, introId);
    if (n.nrBloco && n.nrBloco.artigos && n.nrBloco.artigos.length)
      walkNodes(n.nrBloco.artigos, fn, null, 0, true, n.id);
  });
}

/** Retorna lista plana de { n, sib, par, d, externo, introId } */
export function flat(doc) {
  const out = [];
  walkNodes(doc.artigos, (n, sib, par, d, externo, introId) =>
    out.push({ n, sib, par, d, externo, introId }));
  return out;
}

// ─── Números por extenso ──────────────────────────────────────────────────────

export function numeroPorExtenso(n) {
  n = parseInt(n); if (isNaN(n)) return null;
  if (n === 0) return "zero";
  const un = ["","um","dois","três","quatro","cinco","seis","sete","oito","nove"];
  const dez = ["dez","onze","doze","treze","catorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  const dezenas = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  const centenas = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
  function ate999(n) {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let s = ""; const c = Math.floor(n/100), r = n%100;
    if (c) s += centenas[c];
    if (r) {
      if (s) s += " e ";
      if (r < 10) s += un[r];
      else if (r < 20) s += dez[r-10];
      else { const d = Math.floor(r/10), u = r%10; s += dezenas[d]; if (u) s += " e "+un[u]; }
    }
    return s;
  }
  const milhoes = Math.floor(n/1000000), milhares = Math.floor((n%1000000)/1000), resto = n%1000;
  let s = "";
  if (milhoes) s += ate999(milhoes) + (milhoes===1?" milhão":" milhões");
  if (milhares) { if (s) s += " "; s += milhares===1?"mil":ate999(milhares)+" mil"; }
  if (resto) { if (s) s += (resto<100?" e ":" "); s += ate999(resto); }
  else if (!s) s = "zero";
  return s;
}

// ─── PREPARAÇÃO DO TEXTO DE ORIGEM ────────────────────────────────────────────
/**
 * limparMarkdownLinks(raw) → string
 *
 * Remove links em formato markdown "[texto](url)", devolvendo só o texto.
 * Necessário porque texto copiado do leis.org traz números de lei como link —
 * "Lei Complementar nº[320](https://leis.org/…)" — sem espaço antes do
 * colchete, o que quebra qualquer regex de extração de número/data de lei
 * (extrairCitacoesExternas, extrairCabecalhoLeiPublicada, etc). Rode isto (ou
 * prepararTextoOrigem) antes de qualquer outra função deste módulo, sempre
 * que o texto vier de uma cópia web em vez de PDF/Diário Oficial puro.
 */
export function limparMarkdownLinks(raw) {
  return raw.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1");
}

/**
 * limparRuidoLeisOrg(raw) → string
 *
 * Remove linhas de ruído de navegação típicas de exportação do leis.org que
 * não fazem parte do texto legal: o rótulo "NORMA EM VIGOR" no topo e o
 * rodapé de rodapé de proveniência ("Nota: Este texto não substitui…",
 * "Data de Publicação no Leis.org: …").
 */
export function limparRuidoLeisOrg(raw) {
  const RUIDO = [
    /^NORMA\s+EM\s+VIGOR$/i,
    /^Nota:\s*Este\s+texto\s+n[ãa]o\s+substitui\s+o\s+original.*$/i,
    /^Data\s+de\s+Publica[çc][ãa]o\s+no\s+Leis\.org\s*:.*$/i,
  ];
  return raw.split(/\r?\n/).filter(l => !RUIDO.some(re => re.test(l.trim()))).join("\n");
}

/**
 * prepararTextoOrigem(raw) → string
 *
 * Composição de limparMarkdownLinks + limparRuidoLeisOrg. Passo de
 * pré-processamento recomendado para qualquer texto copiado do leis.org
 * (compilado ou não) antes de alimentá-lo às demais funções do módulo.
 */
export function prepararTextoOrigem(raw) {
  return limparRuidoLeisOrg(limparMarkdownLinks(raw));
}

// ─── CABEÇALHO DE LEI PUBLICADA ───────────────────────────────────────────────
/**
 * extrairCabecalhoLeiPublicada(raw) → { tipoAto, numero, ano, dataPublicacao, dataExtenso } | null
 *
 * parseMinuta() reconhece o cabeçalho de MINUTA/PROJETO ("PROJETO DE LEI
 * COMPLEMENTAR Nº 12/2024"). Uma lei já promulgada tem outro formato —
 * "LEI COMPLEMENTAR Nº 320, DE 2 DE MAIO DE 1994." — que parseMinuta não
 * tenta reconhecer (o texto cai em doc.epigrafe como string bruta, sem
 * popular tipoAto/numero/ano). Esta função é o extrator dedicado para esse
 * segundo formato. Uso: rode em paralelo a parseMinuta() e mescle o
 * resultado em doc — mantém as duas frentes (minuta vs. lei publicada)
 * desacopladas, sem arriscar quebrar o reconhecimento de epígrafe de minuta
 * que já funciona.
 *
 *   const doc = parseMinuta(raw);
 *   const cabecalho = extrairCabecalhoLeiPublicada(raw);
 *   if (cabecalho) Object.assign(doc, { tipoAto: cabecalho.tipoAto, numero: cabecalho.numero, ano: cabecalho.ano });
 *
 * dataPublicacao vem em ISO (AAAA-MM-DD). Devolve null se nenhum cabeçalho
 * de lei publicada for reconhecido nas primeiras linhas do texto.
 */
const MESES_PT = {
  "janeiro":1, "fevereiro":2, "marco":3, "abril":4, "maio":5, "junho":6,
  "julho":7, "agosto":8, "setembro":9, "outubro":10, "novembro":11, "dezembro":12
};
const semAcento = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * extrairCabecalhoLeiPublicada(raw) → { tipoAto, numero, ano, dataPublicacao, dataExtenso? }
 *                                    | { tipoAto: null, tipoNaoSuportado: string }
 *                                    | null
 *
 * Rodada de extensão (Limite 2): reconhece, além de Lei/Lei Complementar,
 * **Resolução** e **Ordem de Serviço** — os dois únicos tipos com PDF de
 * norma real disponível (Resolução 3.006/2026, Ordem de Serviço 12/2026).
 * A busca atravessa linhas de processo (`PROC. Nº …`, `PR Nº …`) que vêm
 * antes do cabeçalho nesses PDFs — confirmado nos dois fixtures reais.
 *
 * Ordem de Serviço não traz data no cabeçalho (achado real: "ORDEM DE
 * SERVIÇO Nº 12/2026", sem "DE DD DE MÊS..."). `dataPublicacao` fica `null`
 * aqui — quem a preenche, a partir da data do FECHO, é `parseLeiPublicada`
 * (decisão do usuário: pra esse tipo, data do ato = data do fecho).
 *
 * Resolução de Mesa, Decreto Legislativo e Emenda à Lei Orgânica são tipos
 * em escopo (ver CLAUDE.md) mas SEM PDF de norma real ainda — não dá pra
 * confirmar o formato exato do cabeçalho deles. Em vez de devolver `null`
 * como se não houvesse cabeçalho nenhum (o que esconderia o achado), uma
 * linha que comece com o nome de um desses tipos (ou de "Precedente
 * Legislativo", tipo raro citado pelo usuário) devolve
 * `{ tipoAto: null, tipoNaoSuportado: "<NOME DO TIPO>" }` — rede de
 * proteção pra revisão humana, não descarte silencioso. `numero`/`ano`
 * NÃO são extraídos aqui: sem exemplo real, arriscaria inventar formato.
 */
export function extrairCabecalhoLeiPublicada(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 8);
  const reCab = /^LEI\s+(?:N[º°O]\s*)?(COMPLEMENTAR\s+)?N[º°O]\s*([\d.]+)\s*,?\s*DE\s+(\d{1,2})\s*(?:[ºO°]?)\s+DE\s+([A-ZÇÃÕÁÉÍÓÚÂÊÔ]+)\s+DE\s+(\d{4})\s*\.?\s*$/i;
  for (const line of lines) {
    const m = line.match(reCab);
    if (!m) continue;
    const tipoAto = m[1] ? "LEI COMPLEMENTAR" : "LEI";
    const numero = m[2].replace(/\./g, "");
    const dia = m[3].padStart(2, "0");
    const mesNome = semAcento(m[4].toLowerCase());
    const mesNum = MESES_PT[mesNome];
    const ano = m[5];
    if (!mesNum) continue; // mês não reconhecido — não arrisca devolver data errada
    return {
      tipoAto, numero, ano,
      dataPublicacao: `${ano}-${String(mesNum).padStart(2,"0")}-${dia}`,
      dataExtenso: `${m[3]} de ${m[4].toLowerCase()} de ${ano}`
    };
  }
  const reCabResolucao = /^RESOLU[ÇC][ÃA]O\s+N[º°O]\s*([\d.]+)\s*,?\s*DE\s+(\d{1,2})\s*(?:[ºO°]?)\s+DE\s+([A-ZÇÃÕÁÉÍÓÚÂÊÔ]+)\s+DE\s+(\d{4})\s*\.?\s*$/i;
  for (const line of lines) {
    const m = line.match(reCabResolucao);
    if (!m) continue;
    const numero = m[1].replace(/\./g, "");
    const dia = m[2].padStart(2, "0");
    const mesNome = semAcento(m[3].toLowerCase());
    const mesNum = MESES_PT[mesNome];
    const ano = m[4];
    if (!mesNum) continue;
    return {
      tipoAto: "RESOLUÇÃO", numero, ano,
      dataPublicacao: `${ano}-${String(mesNum).padStart(2,"0")}-${dia}`,
      dataExtenso: `${m[2]} de ${m[3].toLowerCase()} de ${ano}`
    };
  }
  // Sem data no cabeçalho — só "ORDEM DE SERVIÇO Nº 12/2026" (confirmado no PDF real).
  const reCabOS = /^ORDEM\s+DE\s+SERVI[ÇC]O\s+N[º°O]\s*([\d.]+)\s*\/\s*(\d{4})\s*\.?\s*$/i;
  for (const line of lines) {
    const m = line.match(reCabOS);
    if (!m) continue;
    return { tipoAto: "ORDEM DE SERVIÇO", numero: m[1].replace(/\./g, ""), ano: m[2], dataPublicacao: null };
  }
  // Emenda à Lei Orgânica — formatos vistos em textos reais da fonte (EC 17–51):
  // "Nº 37, DE 16 DE DEZEMBRO DE 2015." · "N° 18" · "N.º 23" · sem "Nº" ("LEI ORGÂNICA 28, de 20…")
  // · "Nº 22 , DE" · "DE2006" (espaço perdido na extração). Em alguns arquivos o
  // ano some da linha ("…DE 4 DE DEZEMBRO DE"): número e tipo valem, a data NÃO
  // é inventada (`dataPublicacao: null`, ano null) — quem chama usa o catálogo.
  const reCabEmenda = /^EMENDA\s+[ÀA]\s+LEI\s+ORG[ÂA]NICA\s*(?:N\.?\s*[º°O]\.?\s*)?(\d+)(?:\s*,?\s*DE\s*(\d{1,2})\s*[º°O]?\s*DE\s*([A-ZÇÃÕÁÉÍÓÚÂÊÔ]+)\s*(?:DE\s*(\d{4})?)?)?\s*\.?\s*$/i;
  for (const line of lines) {
    const m = line.match(reCabEmenda);
    if (!m) continue;
    // arquivos dos anos 1990 trazem só "EMENDA À LEI ORGÂNICA Nº 04" (a data vem no fecho): número sem zeros à esquerda
    const numeroEmenda = String(parseInt(m[1], 10));
    if (!m[3]) return { tipoAto: "EMENDA À LEI ORGÂNICA", numero: numeroEmenda, ano: null, dataPublicacao: null };
    const mesNum = MESES_PT[semAcento(m[3].toLowerCase())];
    if (!mesNum) continue;
    if (!m[4]) return { tipoAto: "EMENDA À LEI ORGÂNICA", numero: numeroEmenda, ano: null, dataPublicacao: null };
    return {
      tipoAto: "EMENDA À LEI ORGÂNICA", numero: numeroEmenda, ano: m[4],
      dataPublicacao: `${m[4]}-${String(mesNum).padStart(2,"0")}-${m[2].padStart(2,"0")}`,
      dataExtenso: `${m[2]} de ${m[3].toLowerCase()} de ${m[4]}`
    };
  }
  const reTipoNaoSuportado = /^(RESOLU[ÇC][ÃA]O\s+DE\s+MESA|DECRETO\s+LEGISLATIVO|EMENDA\s+(?:N[º°]\s*\d+\s*)?[ÀA]\s+LEI\s+ORG[ÂA]NICA|PRECEDENTE\s+LEGISLATIVO)\b/i;
  for (const line of lines) {
    const m = line.match(reTipoNaoSuportado);
    if (!m) continue;
    return { tipoAto: null, tipoNaoSuportado: m[1].toUpperCase().replace(/\s+/g, " ") };
  }
  return null;
}

/**
 * localizarPreambulo(linhas) → { linhas, ancorado }
 *
 * Isola o preâmbulo (quem promulga/sanciona) SEM depender de contar linhas
 * a partir do topo. Achado com dado real (rodada 11): a Lei 14.504/2026 tem
 * ementa de 27 linhas, e o "eu promulgo" está na linha 32 — uma janela fixa
 * de 15 linhas nunca o alcança. Ementas longas são comuns.
 *
 * Âncora: a linha "Faço saber" (presente em todos os textos reais vistos:
 * LC 320, 384, 412, 611, 1.075, Lei 14.504 e Resolução 3.006). O preâmbulo
 * começa UMA linha antes dela (onde costuma estar "O PREFEITO MUNICIPAL…" /
 * "O PRESIDENTE DA CÂMARA…") e vai até o 1º artigo. "Art." é procurado só com
 * A MAIÚSCULO: linha quebrada que começa com "art. 77 da Lei Orgânica…" é
 * citação, não artigo, e cortaria o preâmbulo antes do "promulgo".
 *
 * Sem âncora (ex.: Ordem de Serviço, que usa "RESOLVE:"): `ancorado = false`
 * e `linhas` = tudo antes do 1º "Art." (máx. 60) — cada chamador decide se
 * usa isso ou o comportamento antigo.
 */
export function localizarPreambulo(linhas) {
  const idxFaco = linhas.findIndex(l => /\bFaço\s+saber\b/i.test(l));
  let fim = linhas.findIndex(l => /^(?:Art|ART)(?:igo|IGO)?\.?\s*\d/.test(l));
  if (idxFaco === -1) {
    return { linhas: linhas.slice(0, fim === -1 ? 60 : Math.min(fim, 60)), ancorado: false };
  }
  const ini = Math.max(0, idxFaco - 1);
  if (fim === -1 || fim <= ini) fim = Math.min(linhas.length, ini + 15);
  return { linhas: linhas.slice(ini, Math.min(fim, ini + 40)), ancorado: true };
}

/**
 * extrairProvenienciaPromulgacao(raw) → { promulgadoPor, motivoProvavel, baseLegal? }
 *
 * O preâmbulo de uma lei diz quem a promulgou, e isso carrega informação
 * jurídica relevante. Três padrões distintos:
 *
 *   - "sancao_normal": "O PREFEITO MUNICIPAL... Faço saber que a Câmara
 *     Municipal aprovou e eu sanciono...". O caso comum.
 *
 *   - "veto_derrubado": "O PRESIDENTE DA CÂMARA MUNICIPAL... no uso das
 *     atribuições que me obriga o parágrafo Nº do art. NN da Lei Orgânica...
 *     que a Câmara Municipal MANTEVE e eu promulgo...". Sinaliza que o
 *     Executivo vetou (total ou parcialmente) o projeto, a Câmara derrubou o
 *     veto, e como o Executivo não promulgou no prazo, quem promulgou foi a
 *     própria Câmara. Achado com dado real: a LC 412/1998 é exatamente esse
 *     caso — preâmbulo mostra "O PRESIDENTE DA CÂMARA MUNICIPAL... que a
 *     Câmara Municipal manteve e eu promulgo", contra "O PREFEITO
 *     MUNICIPAL... eu sanciono" de LC 320/1994 e LC 384/1996.
 *
 *   - "emenda_lei_organica": Emenda à Lei Orgânica é promulgada pela própria
 *     Câmara SEMPRE — não passa por sanção do Executivo, com ou sem veto
 *     envolvido (é o equivalente municipal de emenda constitucional,
 *     promulgada pelas Mesas do Congresso, não pelo Presidente da
 *     República). Uma promulgação pela Câmara aqui NÃO é evidência de veto
 *     derrubado — é o procedimento normal desse tipo de instrumento.
 *     Detectado pelo título ("EMENDA (Nº X) À LEI ORGÂNICA"), que tem
 *     prioridade sobre a inferência de veto_derrubado mesmo que o preâmbulo
 *     também contenha "manteve"/"promulgo".
 *     ATENÇÃO: esta terceira categoria ainda não foi testada contra um
 *     texto real de emenda à Lei Orgânica — heurística construída só a
 *     partir da regra que o usuário descreveu, não de um exemplo. Validar
 *     assim que houver um.
 *
 *   - "promulgacao_parcial": mesmo achado da rodada 11 que alimenta
 *     `detectarPromulgacaoParcial` — só o(s) dispositivo(s) de um veto
 *     derrubado foi(ram) promulgado(s), não a lei inteira. Aqui é só
 *     metadado (quem promulgou); quem decide a guarda continua sendo
 *     `detectarPromulgacaoParcial`. Confirmado em texto real dos dois
 *     lados: Prefeito (LC 1.075/2026, "promulgo dispositivo da Lei
 *     Complementar") e Câmara (Lei 14.504/2026, "aprovou e eu promulgo
 *     dispositivo da Lei", sem "manteve" — por isso não cai em
 *     veto_derrubado).
 *
 *   - "promulgacao_propria": ato do próprio Legislativo promulgado na
 *     ÍNTEGRA, sem veto envolvido (ex.: Resolução — "que a Câmara Municipal
 *     aprovou e eu promulgo a seguinte Resolução"). Diferente de
 *     veto_derrubado (não tem "manteve") e de promulgacao_parcial (o
 *     objeto do "promulgo" é o ato inteiro, "a seguinte X", não um
 *     dispositivo). Confirmado em texto real: Resolução 3.006/2026.
 *
 * Ordem de Serviço ("RESOLVE:"/"DETERMINA:", sem "Faço saber" nem
 * "promulgo"/"sanciono") continua "indeterminado" — não é promulgação no
 * sentido que esta função modela. Não criar categoria a partir de 1
 * exemplo só.
 *
 * A reconstrução do texto específico de um dispositivo cujo VETO (não o
 * projeto inteiro) foi derrubado depois da publicação original — isso a
 * função não resolve, é tarefa de modelagem da peça 4 (ver pendência no
 * CHANGELOG).
 */
export function extrairProvenienciaPromulgacao(raw) {
  const linhas = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const titulo = linhas.slice(0, 4).join(" ");         // epígrafe + ementa, pra detectar "emenda à Lei Orgânica"
  const pre = localizarPreambulo(linhas);
  // Ancorado em "Faço saber" → preâmbulo real (ementa longa não empurra pra fora da janela).
  // Sem âncora → mantém o comportamento antigo (15 primeiras linhas).
  const texto = (pre.ancorado ? pre.linhas : linhas.slice(0, 15)).join(" ");   // preâmbulo, pra detectar quem promulgou

  const reEmendaOrganica = /EMENDA\s+(?:N[º°]\s*\d+\s*)?[ÀA]\s+LEI\s+ORG[ÂA]NICA/i;
  const rePresidenteCamara = /(PRESIDENTE\s+DA\s+C[ÂA]MARA\s+MUNICIPAL|MESA\s+DA\s+C[ÂA]MARA\s+MUNICIPAL)/i;
  const reManteve = /C[âa]mara\s+Municipal\s+manteve/i;
  const rePromulgo = /\bpromulg(o|a|amos|ou)\b/i; // "eu promulgo" (1ª pessoa) ou "a Mesa promulga" (3ª pessoa) — variação plausível não confirmada com texto real de emenda
  const rePrefeito = /PREFEITO\s+MUNICIPAL/i;
  const reSanciono = /\bsanciono\b/i;
  const reBaseLegal = /par[áa]grafo\s+(\d+)\s*[º°]?\s*,?\s*do\s+art(?:igo)?\.?\s*(\d+)\s*[º°]?\s*,?\s*da\s*Lei\s+Org[âa]nica/i;
  // Dois formatos novos de baseLegal, achados nas promulgações parciais reais — usam "§"/"§§"
  // em vez da palavra "parágrafo" (formato de LC 412, acima). Plural primeiro: "§§ N e M do
  // art. X" não deve casar parcialmente com o regex singular (ele exige "do art" logo após o
  // 1º número, o que não acontece no plural — mas checar a ordem certa evita qualquer ambiguidade).
  const reBaseLegalPlural = /§§\s*(\d+)\s*[º°]?\s*e\s*(\d+)\s*[º°]?\s*do\s+art(?:igo)?\.?\s*(\d+)\s*[º°]?\s*da\s*Lei\s+Org[âa]nica/i;
  const reBaseLegalSimbolo = /§\s*(\d+)\s*[º°]?\s*do\s+art(?:igo)?\.?\s*(\d+)\s*[º°]?\s*da\s*Lei\s+Org[âa]nica/i;
  const extrairBaseLegalParcial = t => {
    const mp = t.match(reBaseLegalPlural);
    if (mp) return `art. ${mp[3]}, §§ ${mp[1]}º e ${mp[2]}º, da Lei Orgânica`;
    const ms = t.match(reBaseLegalSimbolo);
    if (ms) return `art. ${ms[2]}, § ${ms[1]}º, da Lei Orgânica`;
    return null;
  };

  if (reEmendaOrganica.test(titulo) && rePresidenteCamara.test(texto) && rePromulgo.test(texto)) {
    return { promulgadoPor: "PRESIDENTE_CAMARA", motivoProvavel: "emenda_lei_organica" };
  }
  if (rePresidenteCamara.test(texto) && reManteve.test(texto) && rePromulgo.test(texto)) {
    const bl = texto.match(reBaseLegal);
    return {
      promulgadoPor: "PRESIDENTE_CAMARA",
      motivoProvavel: "veto_derrubado",
      baseLegal: bl ? `art. ${bl[2]}, § ${bl[1]}º, da Lei Orgânica` : null
    };
  }
  if (detectarPromulgacaoParcial(raw).parcial) {
    if (rePrefeito.test(texto)) {
      return { promulgadoPor: "PREFEITO", motivoProvavel: "promulgacao_parcial", baseLegal: extrairBaseLegalParcial(texto) };
    }
    if (rePresidenteCamara.test(texto)) {
      return { promulgadoPor: "PRESIDENTE_CAMARA", motivoProvavel: "promulgacao_parcial", baseLegal: extrairBaseLegalParcial(texto) };
    }
  }
  if (rePrefeito.test(texto) && reSanciono.test(texto)) {
    return { promulgadoPor: "PREFEITO", motivoProvavel: "sancao_normal" };
  }
  if (rePresidenteCamara.test(texto) && rePromulgo.test(texto)) {
    return { promulgadoPor: "PRESIDENTE_CAMARA", motivoProvavel: "promulgacao_propria" };
  }
  return { promulgadoPor: null, motivoProvavel: "indeterminado" };
}

/**
 * detectarPromulgacaoParcial(raw) → { parcial, suspeita, sinais }
 *
 * Algumas publicações NÃO trazem o texto integral da lei: promulgam só o(s)
 * dispositivo(s) cujo veto foi derrubado. O texto vem com cabeçalho e ementa
 * da lei INTEIRA, mas o corpo tem só o trecho promulgado.
 *
 * Achado com dado real (rodada 11): LC 1.075/2026 (Plano Diretor), DOPA de
 * 23/09/2026 — promulgação de um único dispositivo (art. 185, § 3º) pelo
 * PREFEITO, caso excepcional segundo o usuário (o usual é a Câmara). No
 * índice do caderno essa publicação é IDÊNTICA à de uma lei integral — o
 * único sinal está no PDF da própria norma, por isso a detecção mora aqui e
 * não no coletor do DOPA.
 *
 * O QUE DECIDE (`parcial`) — o OBJETO do verbo "promulgo" no preâmbulo:
 *   - ato INTEIRO e novo:            "promulgo a seguinte Lei Complementar"
 *     (LC 412/1998 — veto derrubado, Câmara promulga a lei inteira);
 *   - PARTE de ato já numerado:      "promulgo dispositivo da Lei
 *     Complementar nº 1.075, de 14 de julho de 2026, como segue:"
 *     (LC 1.075/2026).
 * A palavra "promulgo" sozinha NÃO decide: a Câmara promulga TODOS os seus
 * atos (Resolução, Decreto Legislativo, Emenda à Lei Orgânica, Resolução de
 * Mesa — não há sanção do Executivo) e também as leis de veto derrubado
 * integral. Por isso a regra olha o que vem depois do verbo: qualquer coisa
 * que não seja "a/o seguinte|presente" seguida de "da/do <tipo de ato> nº N"
 * é promulgação de parte de um ato já existente. Isso cobre também o artigo
 * inteiro cujo veto foi derrubado (sem pontinhos), sem listar substantivos.
 *
 * O QUE NÃO DECIDE: linhas só de pontos. São o marcador normal de trecho não
 * alterado dentro de lei ALTERADORA (blocos NR), então não provam fragmento
 * — e o fragmento de um artigo inteiro nem as tem. Ficam em `linhasDePontos`
 * só como informação. (Correção de rodada: a 1ª versão desta função tratava
 * pontos como sinal; as 4 leis reais de teste não têm nenhuma linha de
 * pontos, então nunca poderiam ter revelado o erro.)
 *
 * SUSPEITA (`suspeita`, NÃO bloqueia): a data do cabeçalho da lei difere da
 * data do fecho. Nas 4 leis integrais reais (LC 320, 384, 412, 611) as duas
 * são iguais; no fragmento da LC 1.075 são 14/07/2026 × 23/09/2026. Mas
 * republicação (mesma norma, texto ajustado) pode divergir por motivo
 * legítimo e ainda não temos exemplo — por isso só sinaliza pra revisão
 * humana, não recusa.
 *
 * Confirmado em texto real: só "dispositivo" e só o Prefeito. A redação da
 * Câmara e a de resoluções e demais atos do Legislativo ("promulga a
 * seguinte Resolução") NÃO foram vistas em texto real — validar quando
 * houver.
 */
export function detectarPromulgacaoParcial(raw) {
  const linhas = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Preâmbulo ancorado em "Faço saber" (ver localizarPreambulo), espaços normalizados.
  const preambulo = localizarPreambulo(linhas).linhas.join(" ").replace(/\s+/g, " ");

  const rePromulgaParte = new RegExp(
    "\\bpromulg(?:o|a|am|amos)\\b\\s+" +
    "(?!(?:a|o|as|os)\\s+(?:seguintes?|presentes?)\\b)" +          // "a seguinte …" = ato inteiro
    "(.{1,140}?)\\s+d[aoe]s?\\s+" +                                 // <objeto> da/do …
    "(?:Lei(?:\\s+Complementar)?|Emenda\\s+[àa]\\s+Lei\\s+Org[âa]nica|Resolu[çc][ãa]o(?:\\s+de\\s+Mesa)?|Decreto\\s+Legislativo|Ordem\\s+de\\s+Servi[çc]o)" +
    "\\s+n[º°]\\s*[\\d.]+",                                          // … <tipo de ato> nº N
    "i"
  );
  const m = preambulo.match(rePromulgaParte);
  const objetoPromulgado = m ? m[1].trim() : null;

  // Datas: da lei (cabeçalho) × do fecho.
  const cab = extrairCabecalhoLeiPublicada(raw);
  const dataDaLei = cab ? cab.dataPublicacao : null;
  const reFecho = /^(?:PREFEITURA\s+MUNIC\s?IPAL\s+DE\s+PORTO\s+ALEGRE|GABINETE\s+DA\s+PRESID[ÊE]NCIA\s+DA\s+C[ÂA]MARA\s+MUNICIPAL|C[ÂA]MARA\s+MUNICIPAL\s+DE\s+PORTO\s+ALEGRE)\b.*?(\d{1,2})\s*[º°]?\s+de\s+([A-Za-zÀ-ú]+)\s+de\s+(\d{4})\s*\.?\s*$/i;
  let dataDoFecho = null;
  for (const l of linhas) {
    const mf = l.match(reFecho);
    if (!mf) continue;
    const mes = MESES_PT[semAcento(mf[2].toLowerCase())];
    if (mes) dataDoFecho = `${mf[3]}-${String(mes).padStart(2, "0")}-${mf[1].padStart(2, "0")}`;
    break;
  }
  const datasDivergem = dataDaLei && dataDoFecho ? dataDaLei !== dataDoFecho : null;

  const linhasDePontos = linhas.filter(l => /^\.{10,}$/.test(l.replace(/\s+/g, ""))).length;
  const parcial = objetoPromulgado !== null;
  return {
    parcial,
    suspeita: !parcial && datasDivergem === true,
    sinais: { objetoPromulgado, datasDivergem, dataDaLei, dataDoFecho, linhasDePontos }
  };
}

// ─── PARSER PRINCIPAL ─────────────────────────────────────────────────────────
/**
 * parseMinuta(raw, nrRanges?)
 *
 * Parseia o texto bruto de uma lei ou projeto e devolve um objeto `doc`:
 *   {
 *     em[], emExtraida, epigrafe, tipoAto, numero, ano,
 *     dataSessao, assinatura, sigla, ementa, preambulo, artigos[]
 *   }
 *
 * `nrRanges` é a saída de detectNRCandidates() — opcional.
 * Os nós ainda têm `.texto` (string). Chamar normalizar(doc) depois limpa a grafia.
 */
export function parseMinuta(raw, nrRanges) {
  nrRanges = nrRanges || [];
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  const doc = {
    em: [], emExtraida: false, epigrafe: "", tipoAto: "", numero: "", ano: "",
    dataSessao: "", assinatura: "", sigla: "PLL", ementa: null, preambulo: null, artigos: [],
    fecho: ""
  };
  let stage = "epigrafe", last = { a:null, p:null, i:null, al:null, it:null }, emMode = false;
  let fechoBuf = [];
  // Fecho de lei já publicada (local/data de promulgação + bloco de assinaturas).
  // Sem isso, essas linhas caem no fallback genérico (linha 453-ish) e grudam
  // no texto do ÚLTIMO dispositivo tocado — normalmente o último artigo, que
  // passa a carregar "PREFEITURA MUNICIPAL DE..., TARSO GENRO, Prefeito
  // Municipal..." como se fosse parte do seu próprio texto normativo. Achado
  // com dado real: art. 14 da LC 320/1994. Cobre os dois padrões confirmados
  // nos documentos reais testados até agora — sanção do Executivo
  // ("PREFEITURA MUNICIPAL DE PORTO ALEGRE, <data>.") e promulgação da Mesa
  // por derrubada de veto ou emenda à Lei Orgânica ("GABINETE DA PRESIDÊNCIA
  // DA CÂMARA MUNICIPAL..."). Outros padrões de fecho (Resolução de Mesa,
  // Decreto Legislativo etc.) ainda não têm exemplo real — não adicionar por
  // suposição.
  // 3ª forma de fecho, achada com dado real (rodada 11): atos do Legislativo trazem só
  // "CÂMARA MUNICIPAL DE PORTO ALEGRE, 26 DE JUNHO DE 2026." (Lei 14.504 parcial,
  // Resolução 3.006, Ordem de Serviço 12/2026 — os 3 idênticos). Regex ESTRITA: a linha
  // inteira tem que ser só isso, pra uma linha de texto que apenas COMECE com "Câmara
  // Municipal de Porto Alegre, …" não seja tomada como fecho e engula o resto do corpo.
  // "MUNIC IPAL", com um espaço no meio da palavra: é assim que o fecho vem nos
  // PDFs do Diário Oficial de 2012 a 2015 (visto em 3 arquivos reais: Lei nº
  // 11.229/2012, Lei nº 11.575/2014 e LC 761/2015; os dois leitores de PDF dão
  // o mesmo resultado, logo o defeito é do arquivo). Sem aceitar essa grafia, o
  // fecho e as assinaturas grudavam no último artigo.
  // 4ª forma de fecho (rodada 30, decisão do mantenedor em 20/11/2026): "Porto Alegre, 19 de março de
  // 2009." — só local e data, sem nome da instituição (LC 613/2009 e EC 28/2009, as duas de março de
  // 2009). Regex ESTRITA como as outras: a linha inteira.
  const reFecho = /^(?:(?:PREFEITURA\s+MUNIC\s?IPAL\s+DE\s+PORTO\s+ALEGRE|GABINETE\s+DA\s+PRESID[ÊE]NCIA\s+DA\s+C[ÂA]MARA\s+MUNICIPAL)\b|C[ÂA]MARA\s+MUNICIPAL\s+DE\s+PORTO\s+ALEGRE\s*,\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de\s+\d{4}\s*\.?\s*$|PORTO\s+ALEGRE\s*,\s*\d{1,2}\s*[º°]?\s+de\s+[A-Za-zÀ-ú]+\s+de\s+\d{4}\s*\.?\s*$)/i;
  // Suporta sufixo de letra (Art. 5º-A, § 2º-A, II-A, a-a)) — inserção intermediária
  // (art. 17 da LC 611/2009). Sem isso, uma lei-base que já contenha dispositivos
  // inseridos (comum após algumas rodadas de alteração) tem a letra do sufixo
  // vazando para o corpo do texto do dispositivo seguinte.
  const reArt = /^(?:Art|ART)(?:igo|IGO)?\.?\s*(\d+\s*[º°]?(?:-[A-Za-z])?)\s*[.\-–—:]*\s*(.*)$/;
  const rePar = /^§\s*(\d+\s*[º°]?(?:-[A-Z])?)\s*[.\-–—:]*\s*(.*)$/;
  // Só com P maiúsculo (mesma regra do "Art."): linha que começa com "parágrafo
  // único" em minúscula é continuação de frase quebrada — caso real: LC 514/2004,
  // "…renumerando o atual / parágrafo único para § 3º, com o seguinte teor:".
  const rePUn = /^P(?:ar[áa]grafo|AR[ÁA]GRAFO)\s+[úuÚU](?:nico|NICO)\s*[.\-–—:]*\s*(.*)$/;
  const reInc = /^([IVXLCDM]{1,9}(?:-[A-Z])?)\s*[-–—]\s*(.*)$/;
  const reAli = /^([a-z]{1,2}(?:-[a-z]{1,2})?)\)\s*(.*)$/;
  const reIte = /^(\d{1,2}(?:-[A-Z])?)\.\s+(.*)$/;
  // Preâmbulo = nunca ementa. Além de "A CÂMARA MUNICIPAL … DECRETA" e "O PREFEITO MUNICIPAL": "… PROMULGA" (Câmara/Mesa promulgando) e a Mesa
  // que abre em maiúsculas ("A MESA DIRETORA DA CÂMARA MUNICIPAL…, no uso das atribuições…, promulga a seguinte Emenda…"; Emendas à LO, ids 49145, 27350).
  // A forma "A MESA" só vale em MAIÚSCULAS (ementa é frase em caixa mista) e só antes de existir preâmbulo.
  const rePre = /(C[ÂA]MARA\s+MUNICIPAL.*(?:DECRETA|PROMULGA)|(?:DECRETA|PROMULGA)\s*:?\s*$|O\s+PREFEITO\s+MUNICIPAL)/i;
  const rePreMesa = /^\s*A\s+MESA(?:\s+DIRETORA)?\b(?:\s+DA\s+C[ÂA]MARA|\s+(?:DECRETA|PROMULGA)|,)/;
  const reEmentaVerbo = /^(institui|disp[õo]e\s+sobre|altera|estabelece|autoriza|cria|fixa|regulamenta|revoga|extingue|denomina|concede|declara|reconhece|d[áa]|acrescenta|inclui|suspende|pro[íi]be|veda|permite|assegura|garante|institucionaliza|reorganiza|transforma|desafeta|regula|torna|obriga|determina)\b/i;
  const reEM  = /^(EXPOSI[ÇC][ÃA]O\s+DE\s+MOTIVOS|JUSTIFICATIVA|JUSTIFICA[ÇC][ÃA]O)\s*:?$/i;
  const reEpig = /^(MINUTA\s+DE\s+)?PROJETO\s+DE\s+(LEI|RESOLU[ÇC][ÃA]O)(\s+COMPLEMENTAR)?\b\s*:?\s*(.*)$/i;
  const reGrupo = /^(T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O|PARTE|LIVRO)\s+([IVXLCDM]+|[ÚU]NICO)\b\s*[-–—:]?\s*(.*)$/i;
  const GRUPO_TIPO = {
    "título":"titulo","titulo":"titulo","capítulo":"capitulo","capitulo":"capitulo",
    "seção":"secao","secao":"secao","subseção":"subsecao","subsecao":"subsecao",
    "parte":"parte","livro":"livro"
  };
  let pendGrupos = [];
  const mk = (tipo, texto, raw2) => ({ id:nid(), tipo, texto, rawL:raw2||null, children:[], conj:null });
  let li = -1, skipUntil = -1;
  for (const line of lines) {
    li++;
    if (li <= skipUntil) continue;
    if (stage === "fecho") { if (line) fechoBuf.push(line); continue; }
    if (stage === "corpo" && line && reFecho.test(line)) { stage = "fecho"; fechoBuf.push(line); continue; }
    const nrHit = nrRanges.find(r => r.startIdx === li);
    if (nrHit) {
      const alvoNode = last.al||last.i||last.p||last.a;
      if (alvoNode) alvoNode.nrBloco = extrairRedacaoAlterada(lines.slice(nrHit.startIdx, nrHit.endIdx+1));
      skipUntil = nrHit.endIdx; continue;
    }
    if (!line) continue;
    if (reEM.test(line)) { emMode = true; if (/JUSTIFICA/i.test(line)) doc.emExtraida = true; continue; }
    {
      const me = line.match(reEpig);
      if (me) {
        const resto = (me[4]||"").trim();
        if (resto.length <= 30) {
          emMode = false;
          if (!doc.tipoAto) {
            doc.tipoAto = /RESOLU/i.test(me[2]) ? "RESOLUÇÃO" : (me[3] ? "LEI COMPLEMENTAR" : "LEI");
            doc.sigla   = doc.tipoAto==="RESOLUÇÃO" ? "PR" : (me[3] ? "PLCL" : "PLL");
          }
          const sg = resto.match(/\b(PLCL|PLCE|PLL|PLE|PELO|PR)\b/i);
          if (sg) doc.sigla = sg[1].toUpperCase();
          const num = resto.match(/(\d+)\s*\/\s*(\d+)/);
          if (num) { doc.numero = num[1]; doc.ano = num[2]; }
          doc.epigrafe = `PROJETO DE ${doc.tipoAto} Nº ${doc.numero||"___"}/${doc.ano||"__"}`;
          stage = "epigrafe"; continue;
        }
      }
    }
    if (emMode) {
      if (/^Vereadora?\s+\S/.test(line)) { doc.assinatura = line; continue; }
      doc.em.push(mk("em", line)); continue;
    }
    let m;
    // agrupador: só depois do preâmbulo e com título que não começa por minúscula/pontuação
    // (linha de frase "Seção IV do Capítulo II; e revoga…" não é agrupador — decisão 23, 20/11/2026)
    if ((m = line.match(reGrupo)) && (stage === "corpo" || doc.preambulo) && !/^[a-zà-ÿ,;.)]/.test((m[3]||"").trim())) {
      const tipo = GRUPO_TIPO[m[1].toLowerCase()] || "capitulo";
      let titulo = (m[3] || "").trim();
      if (!titulo) {
        // Título do agrupador na linha SEGUINTE — formatação em duas linhas
        // ("TÍTULO I" numa linha, "DAS DISPOSIÇÕES PRELIMINARES" na próxima).
        // Achado testando dado real (LC 611/2009) — nenhuma das leis
        // testadas antes tinha Título/Capítulo/Seção, esse caminho nunca
        // tinha rodado contra formatação real.
        const prox = (lines[li + 1] || "").trim();
        if (prox && !reGrupo.test(prox) && !reArt.test(prox)) { titulo = prox; skipUntil = li + 1; }
      }
      {
        // Título em até 3 linhas a mais (e/ou separado por linha em branco ou quebra de página):
        // vale tudo até o próximo Art. ou agrupador, até 200 caracteres, sem "Art. N"/"§ N" dentro;
        // se não terminar em Art. ou agrupador, fica como estava (decisão 23, 20/11/2026).
        const ini = skipUntil >= li ? skipUntil + 1 : li + 1;
        const extra = []; let k = ini;
        while (k < lines.length && extra.length <= 3 && k - ini < 40) {
          const t = (lines[k] || "").trim();
          if (!t) { k++; continue; }
          if (reArt.test(t) || reGrupo.test(t)) break;
          extra.push([k, t]); k++;
        }
        const partes = [titulo, ...extra.map(e => e[1])];
        const fim = (lines[k] || "").trim();
        if (extra.length && extra.length <= 3 && partes.join(" ").length <= 200 &&
            !partes.some(t => /\bAr?t?\.?\s*\d|§\s*\d/.test(t)) && (reArt.test(fim) || reGrupo.test(fim))) {
          titulo = partes.join(" ").trim(); skipUntil = extra[extra.length - 1][0];
        }
      }
      pendGrupos.push({ id:nid(), tipo, numero:m[2].toUpperCase(), titulo }); continue;
    }
    if (m = line.match(reArt)) {
      const n = mk("artigo", m[2], line.slice(0, line.length-m[2].length).trim());
      if (pendGrupos.length) { n.gruposAntes = pendGrupos; pendGrupos = []; }
      doc.artigos.push(n); last = { a:n, p:null, i:null, al:null, it:null }; stage = "corpo"; continue;
    }
    if (stage !== "corpo") {
      // Preâmbulo em mais de uma linha ("O PREFEITO MUNICIPAL DE PORTO ALEGRE." /
      // "Faço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:").
      // Achado com dado real (Lei nº 9.113/2003, arquivo do SIREL): sem isto, a
      // 2ª linha caía na ementa, que passava a terminar com "Faço saber…".
      // Depois que o preâmbulo começou, o que vier antes do 1º artigo é preâmbulo.
      if (doc.preambulo) { doc.preambulo = doc.preambulo + " " + line; continue; }
      if (rePre.test(line) || rePreMesa.test(line)) { doc.preambulo = line; continue; }
      if (!doc.epigrafe && /PROJETO|REDA[ÇC][ÃA]O\s+FINAL|\bPLL\b|\bPLCL\b|\bPLE\b|\bPLCE\b|\bPELO\b|\bPR\b/i.test(line)) {
        doc.epigrafe = line;
        const sg = line.match(/\b(PLCL|PLCE|PLL|PLE|PELO|PR)\b/i); if (sg) doc.sigla = sg[1].toUpperCase();
        continue;
      }
      if (!doc.epigrafe && !doc.ementa && !reEmentaVerbo.test(line)) {
        doc.epigrafe = line;
        // Cabeçalho de LEI JÁ PUBLICADA ("LEI COMPLEMENTAR Nº 320, DE 2 DE
        // MAIO DE 1994.") — extrairCabecalhoLeiPublicada() continua sendo a
        // fonte de verdade pra numero/ano/dataPublicacao (decisão da rodada
        // 1, mantida: não arriscar o reconhecimento de epígrafe de MINUTA
        // que já funciona). Mas tipoAto/sigla PRECISAM ser populados aqui
        // também — sem isso, normalizar() nunca sabe que é uma Lei
        // Complementar (só reconhece o estilo "PROJETO DE..."), e a correção
        // de autorreferência ("nesta Lei Complementar" → "nesta Lei X")
        // silenciosamente APAGA a palavra "Complementar" do texto de toda
        // lei complementar já publicada. Achado com dado real (LC 611/2009).
        if (!doc.tipoAto) {
          const mLP = line.match(/^LEI\s+(COMPLEMENTAR\s+)?N[º°O]/i);
          if (mLP) {
            doc.tipoAto = mLP[1] ? "LEI COMPLEMENTAR" : "LEI";
            doc.sigla = mLP[1] ? "PLCL" : "PLL";
          }
        }
        continue;
      }
      doc.ementa = doc.ementa ? { ...doc.ementa, texto: doc.ementa.texto+" "+line } : mk("ementa", line);
      continue;
    }
    if (m = line.match(rePUn)) { const n=mk("paragrafo",m[1],"Parágrafo único"); last.a&&last.a.children.push(n); last.p=n; last.i=null; last.al=null; last.it=null; continue; }
    // "§ N" no INÍCIO DE LINHA que é só citação: a linha anterior termina em artigo/preposição/conjunção
    // ("…e do" / "§ 1º deste artigo.") e o que vem depois do número começa em minúscula. Rótulo de
    // parágrafo vem depois de frase completa e seguido de maiúscula.
    const citacaoDeParagrafo = (mm) => {
      if (!mm || !/^[a-zà-ÿ]/.test(mm[2] || "")) return false;
      let q = li - 1; while (q >= 0 && !lines[q]) q--;
      return q >= 0 && /(?:^|[\s,])(?:o|a|os|as|do|da|dos|das|no|na|nos|nas|ao|aos|à|às|e|ou|pelo|pela|pelos|pelas)\s*$/i.test(lines[q]);
    };
    if ((m = line.match(rePar)) && !citacaoDeParagrafo(m)) { const n=mk("paragrafo",m[2],line.slice(0,line.length-m[2].length).trim()); last.a&&last.a.children.push(n); last.p=n; last.i=null; last.al=null; last.it=null; continue; }
    if (m = line.match(reInc)) { const n=mk("inciso",m[2]); (last.p||last.a)&&(last.p||last.a).children.push(n); last.i=n; last.al=null; last.it=null; continue; }
    if ((m = line.match(reAli)) && last.i) { const n=mk("alinea",m[2],m[1]); last.i.children.push(n); last.al=n; last.it=null; continue; }
    if ((m = line.match(reIte)) && last.al) { const n=mk("item",m[2]); last.al.children.push(n); last.it=n; continue; }
    const t = last.it||last.al||last.i||last.p||last.a; if (t) t.texto = (t.texto+" "+line).trim();
  }
  if (!doc.ementa) doc.ementa = mk("ementa","");
  if (fechoBuf.length) doc.fecho = fechoBuf.join("\n");
  return doc;
}

/**
 * parseLeiPublicada(raw) → doc
 *
 * Ponto de entrada RECOMENDADO pra processar o texto de uma lei já
 * publicada — feito pra reduzir o risco de "usar o parser errado" que
 * `parseMinuta()` sozinho carrega: `parseMinuta()` tenta reconhecer tanto o
 * cabeçalho de PROJETO ("PROJETO DE LEI Nº X/AAAA") quanto deixa o
 * cabeçalho de lei publicada cair como epígrafe crua, sem popular
 * tipoAto/numero/ano — quem chama tem que lembrar de rodar
 * `extrairCabecalhoLeiPublicada()` por fora e mesclar o resultado, e nada
 * impede de esquecer.
 *
 * Esta função faz isso por você, numa chamada só, e SOBRESCREVE qualquer
 * tipoAto/numero/ano que `parseMinuta()` tenha inferido do ramo de PROJETO
 * (que não deveria disparar pra texto de lei publicada, mas se disparar por
 * algum motivo, o resultado desta função prevalece) — não há caminho pelo
 * qual o `doc` devolvido aqui fique com metadado de projeto/minuta.
 *
 * NÃO atribui `desFixo` nem marca `origem` — isso é responsabilidade de
 * `criarVersaoOriginal()` (peça 4), que é quem sabe a data de vigência.
 * Para o pipeline completo numa chamada só, use
 * `criarVersaoOriginalDeLeiPublicada(raw)`, logo abaixo.
 *
 *   const doc = parseLeiPublicada(raw);
 *   // doc.tipoAto, doc.numero, doc.ano, doc.dataPublicacao já populados
 *   // doc.proveniencia: { promulgadoPor, motivoProvavel, baseLegal? }
 *   // doc.promulgacaoParcial: { parcial, suspeita, sinais } — parcial=true: texto NÃO é a lei integral
 *   // vetado/revogado já marcados nos nós (marcarEstadosEspeciais)
 */
// `nrRanges` (opcional): saída de detectNRCandidates(raw), repassada a parseMinuta()
// para que os blocos de redação alterada de uma lei ALTERADORA fiquem em
// `nrBloco`, e não misturados aos dispositivos da própria alteradora.
export function parseLeiPublicada(raw, nrRanges) {
  const doc = parseMinuta(raw, nrRanges);
  const cabecalho = extrairCabecalhoLeiPublicada(raw);
  if (cabecalho) {
    doc.tipoAto = cabecalho.tipoAto;
    doc.numero = cabecalho.numero;
    doc.ano = cabecalho.ano;
    doc.dataPublicacao = cabecalho.dataPublicacao;
    if (cabecalho.tipoNaoSuportado) doc.tipoNaoSuportado = cabecalho.tipoNaoSuportado;
    // Ordem de Serviço não traz data no cabeçalho — usa a data do FECHO (decisão do usuário).
    if (cabecalho.tipoAto === "ORDEM DE SERVIÇO" && !cabecalho.dataPublicacao && doc.fecho) {
      const md = doc.fecho.split(/\r?\n/)[0].match(/(\d{1,2})\s*[º°]?\s+de\s+([A-Za-zÀ-ú]+)\s+de\s+(\d{4})/i);
      const mesNum = md && MESES_PT[semAcento(md[2].toLowerCase())];
      if (mesNum) doc.dataPublicacao = `${md[3]}-${String(mesNum).padStart(2,"0")}-${md[1].padStart(2,"0")}`;
    }
  }
  doc.proveniencia = extrairProvenienciaPromulgacao(raw);
  doc.promulgacaoParcial = detectarPromulgacaoParcial(raw);
  marcarEstadosEspeciais(doc);
  return doc;
}

// ─── DETECTOR DE BLOCOS NR ────────────────────────────────────────────────────
/**
 * detectNRCandidates(raw) → [{ startIdx, endIdx, semNR, preview }]
 *
 * Identifica blocos de redação alterada (texto entre aspas com "(NR)")
 * em uma lei alteradora. Os índices são relativos às linhas de `raw`.
 *
 * Use os índices como `nrRanges` no segundo argumento de parseMinuta()
 * para isolar os blocos da numeração da lei alteradora.
 */
/**
 * detectNRCandidates(raw) → [{ startIdx, endIdx, semNR, sem_fecho, confianca?, preview }]
 *
 * Acha os blocos de redação alterada (trecho entre aspas que a alteradora dá a outra lei).
 * Rodada 30 (plano PLANO-ALTERADORA-SEM-ASPAS.md; decisões do mantenedor de 20/11/2026):
 *  - FECHAMENTO PAREADO com a abertura: abertura dupla só fecha com aspas duplas (ou o par de simples
 *    "''"/"’’" que a extração faz de aspas duplas); abertura simples só fecha com simples. Fechar na
 *    própria linha de abertura exige mais de 25 caracteres (aspa simples de palavra — 'jetton'. — não
 *    fecha bloco). Sem o pareamento, a aspa simples no fim de uma linha cortava o bloco (LC 293/1993).
 *  - Aberturas ‘ ’ „ ‚ (glifos que a digitalização produz) e `$` no lugar de `§`.
 *  - Cue no plural ("seguintes redações").
 *  - SEM fechamento: se há introdução de alteração, o bloco termina antes do "Art. (n+1)" da alteradora
 *    (n = artigo que contém a introdução). É fronteira INFERIDA: `sem_fecho: true` e `confianca`
 *    ('media' se o fim da linha traz algum glifo de aspas; 'baixa' se nenhum). O estruturador
 *    reprova a norma com o motivo `bloco_sem_fechamento_de_aspas`: nunca fica "aceita limpa".
 */
export function detectNRCandidates(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  const out = []; let prev = "", prev2 = "";
  const CMD_CUE = /(passa\s+a\s+vigorar|passa\s+a\s+ter\s+a\s+seguinte\s+reda[çc][ãa]o|fica\s+acrescid[oa]|nova\s+reda[çc][ãa]o|seguintes?\s+reda[çc][ãa]o|altera\w*\s+a\s+reda[çc][ãa]o|conforme\s*segue)/i;
  // R41 (P2): introdução do PRÓXIMO artigo da alteradora dentro de um bloco ainda aberto ("Art. (n+1) … conforme segue:"
  // seguida de abertura de aspas). Se o fecho do bloco sumiu (veto, truncamento, ruído), o bloco não pode engolir esse artigo.
  const introDoProximoArtigo = (j, n) => {
    if (!n) return false;
    const rePro = new RegExp('^Art(?:igo)?\\.?\\s*' + (n + 1) + '(?![0-9])\\s*(?:[º°®]|\\.|[-–—])');
    if (!rePro.test(lines[j])) return false;
    let junto = '', k = j, vistas = 0;
    for (; k < lines.length && vistas < 4; k++) { if (!lines[k]) continue; junto += ' ' + lines[k]; vistas++; if (/^["“”'‘’„‚]/.test(lines[k]) && k > j) break; }
    const ultima = lines[k] || '';
    return CMD_CUE.test(junto.replace(/\s+/g, ' ')) && /^["“”'‘’„‚]\s*(?:Art(?:igo)?\.?\s*\d|[§$]|Par[áa]grafo\s+[úu]nico|[IVXLCDM]{1,9}\s*[-–—])/i.test(ultima);
  };
  const artigoDaIntro = (i) => { for (let q = i - 1; q >= 0 && q > i - 40; q--) { const mm = /^Art(?:igo)?\.?\s*(\d+)/.exec(lines[q]); if (mm) return +mm[1]; } return 0; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) { continue; }
    const isQuoteStart = /^["“”'‘’„‚]/.test(line);
    const introCue = CMD_CUE.test(prev) || CMD_CUE.test(line.replace(/^["“”']+/,"").slice(0,80)) || (!!prev2 && (/conforme\s*segue/i.test(prev2 + " " + prev) || /conforme\s*segue/i.test(prev2 + prev)));
    const looksLikeDispositivo = /^["“”']\s*(Art(?:igo)?\.?\s*\d|[§$]|Par[áa]grafo\s+[úu]nico|[IVXLCDM]{1,9}\s*[-–—])/i.test(line);
    // Bloco SEM aspas de abertura, que começa pelo cabeçalho do artigo-alvo com reticências ("Art. 4º ......"),
    // técnica recente (LC 897/2022, LC 1.011/2024, LC 1.074/2026). Delimita só com TRÊS sinais juntos (decisão do
    // mantenedor, 20/11/2026): (1) 3+ pontos no cabeçalho; (2) logo depois de uma introdução de alteração que
    // CITA esse mesmo artigo e cujo número não é o do próximo artigo da alteradora; (3) fecha em "(NR)" ou aspa
    // final. Sem fechamento, não infere nada. Sai com `sem_abertura: true` e confiança média (a norma fica "a
    // revisar" com o motivo `aspa_de_abertura_ausente`). Cabeçalho SEM pontos ("Art. N.") nunca delimita.
    const mCab = !isQuoteStart ? /^Art(?:igo)?\.?\s*(\d+)\s*[º°o]?(?:-[A-Za-z])?\s*\.?\s*\.{3,}/.exec(line) : null;
    if (mCab) {
      let q = i - 1, n = 0; const introLinhas = [];
      for (; q >= 0 && q > i - 8; q--) { if (!lines[q]) continue; introLinhas.unshift(lines[q]); const ma = /^Art(?:igo)?\.?\s*(\d+)/.exec(lines[q]); if (ma) { n = +ma[1]; break; } }
      const intro = introLinhas.join(" ");
      const N = +mCab[1];
      const citaN = new RegExp("\\bart(?:igo|\\.)?\\s*" + N + "\\b", "i").test(intro.replace(/^Art(?:igo)?\.?\s*\d+\S*/i, ""));
      if (n && CMD_CUE.test(intro) && citaN && N !== n + 1) {
        let fim = -1, cortou = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 300); j++) {
          if (introDoProximoArtigo(j, n)) { fim = j - 1; while (fim > i && !lines[fim]) fim--; cortou = true; break; }
          if (/\(\s*N\s*R\s*\)\s*["“”'‘’]*\s*\.?\s*$/.test(lines[j]) || /(?:["“”]|['‘’]{2})\s*\.?\s*$/.test(lines[j])) { fim = j; break; }
        }
        if (fim >= 0) {
          out.push({ startIdx:i, endIdx:fim, semNR:cortou, sem_fecho:cortou, sem_abertura:true, confianca:cortou?"baixa":"media", preview: line.slice(0,64)+(fim>i?"… "+lines[fim].slice(-50):"") });
          i = fim; continue;
        }
      }
    }
    if (isQuoteStart && (introCue || looksLikeDispositivo)) {
      let end = -1, semNR = false, sem_fecho = false;
      const abre = line.replace(/^[\s]*/, '')[0];
      const duplo = /["“”„]/.test(abre);
      // fechamento PAREADO com a abertura: abertura dupla só fecha com aspas duplas (ou par de simples,
      // "''"/"’’", que a extração faz de aspas duplas); abertura simples só fecha com simples.
      const reFechaNR = /\(\s*N\s*R\s*\)\s*["“”'‘’]*\s*\.?\s*$/;
      const reFechaDup = /(?:["“”]|['‘’]{2})\s*\.?\s*$/;
      const reFechaSim = /['‘’]\s*\.?\s*$/;
      const nIntro = introCue ? artigoDaIntro(i) : 0;
      let cortou = false;
      for (let j = i; j < Math.min(lines.length, i+300); j++) {
        if (j > i && nIntro && introDoProximoArtigo(j, nIntro)) { end = j - 1; while (end > i && !lines[end]) end--; semNR = true; sem_fecho = true; cortou = true; break; }
        if (reFechaNR.test(lines[j])) { end=j; semNR=false; break; }
        if ((duplo ? reFechaDup : reFechaSim).test(lines[j]) && (j > i || lines[j].length > 25)) {
          // aspas EQUILIBRADAS na própria linha (“contact centers” no fim da linha de um inciso): o ” fecha a citação da linha, não o bloco
          if (duplo && j > i && (lines[j].match(/[“„]/g) || []).length >= (lines[j].match(/”/g) || []).length && /”\s*\.?\s*$/.test(lines[j])) continue;
          end=j; semNR=true; break; }
      }
      // "(NR)" sozinho na linha SEGUINTE ao fecha-aspas (visto em LCs reais de 2017 em diante,
      // ex. LC 804/2017): o bloco acaba nele; senão o "(NR)" sobra e gruda no dispositivo que introduz.
      if (end >= 0 && semNR && !cortou) {
        let k = end + 1;
        while (k < lines.length && k <= end + 3 && !lines[k]) k++;
        if (k < lines.length && /^\(\s*N\s*R\s*\)\s*["“”']?\s*\.?\s*$/.test(lines[k])) { end = k; semNR = false; }
      }
      if (end < 0 && introCue) {
        let n = 0;
        for (let q = i - 1; q >= 0 && q > i - 40; q--) { const mm = /^Art(?:igo)?\.?\s*(\d+)/.exec(lines[q]); if (mm) { n = +mm[1]; break; } }
        if (n) for (let j = i + 1; j < Math.min(lines.length, i + 120); j++) { if (new RegExp('^Art(?:igo)?\\.?\\s*' + (n + 1) + '\\s*[º°®o2]?\\s*[-–—.]').test(lines[j]) || new RegExp('^Art(?:igo)?\\.?\\s*' + (n + 1) + '\\s*[º°]\\s+(?=[A-ZÀ-Ú])').test(lines[j])) { end = j - 1; semNR = true; sem_fecho = true; break; } }
      }
      if (end >= 0) {
        const bloco = { startIdx:i, endIdx:end, semNR, sem_fecho, preview: line.replace(/^["“”']/,"").slice(0,64)+(end>i?"… "+lines[end].slice(-50):"") };
        if (sem_fecho) bloco.confianca = /["“”'‘’*]\s*\.?\s*$/.test(lines[end]) ? "media" : "baixa";
        out.push(bloco);
        i = end; continue;
      }
    }
    prev2 = prev; prev = line;
  }
  return out;
}

// ─── PARSER DE BLOCO NR ───────────────────────────────────────────────────────
/**
 * extrairRedacaoAlterada(blockLines) → { artigos[], temNR }
 *
 * Parseia o interior de um bloco de redação alterada (já fatiado de `raw`).
 * Os nós têm `.desFixo` (designador fixo, nunca recalculado) em vez do
 * designador derivado do parser principal.
 * Nós com corpo de pontos viram `{ omitido: true }` (art. 16, IV, LC 611).
 */
export function extrairRedacaoAlterada(blockLines) {
  const lns = blockLines.slice();
  lns[0] = lns[0].replace(/^["“”']+\s*/,"");
  let temNR = false; const last2idx = lns.length-1; let lastLine = lns[last2idx];
  const mNR = lastLine.match(/\(\s*N\s*R\s*\)\s*["“”']?\s*\.?\s*$/);
  if (mNR) { temNR=true; lastLine=lastLine.slice(0,mNR.index).trim(); }
  // Tira só as aspas de fechamento (e o ponto que às vezes vem DEPOIS delas:
  // 'comunidade”. (NR)' — LC 525/2005). O ponto final do próprio dispositivo,
  // ANTES das aspas, é texto da lei e fica: até a rodada 16 ele era comido, e o
  // último dispositivo de todo bloco ficava sem ponto final (achado ao conferir
  // a minuta gerada contra o que o motor lia de volta). Reticências antes das
  // aspas ('§ 3º ...”') também ficam, e são reconhecidas como omissão adiante.
  lastLine = lastLine.replace(/\s*["“”'][.\s]*$/,"").trim();
  lns[last2idx] = lastLine;
  // NOTA: os separadores após o designador (ponto, hífen, travessão, dois-pontos)
  // são capturados em ".*" e limpos por limparSeparadorX() em código, e não numa
  // classe de regex gulosa — porque uma classe [.\-–—:]{0,2} comeria parte de uma
  // reticência de omissão ("Art. 2º ...") antes de o corpo ser avaliado, deixando
  // sobrar só 1 ou 2 pontos e escondendo a marcação de "caput inalterado" do
  // reOmissaoBody abaixo. Achado com dado real (LC 384/1996, art. 1º).
  const reArtX = /^Art(?:igo)?\.?\s*(\d+\s*[º°]?(?:-[A-Z])?)\s*(.*)$/i;
  const rePUnX = /^Par[áa]grafo\s+[úu]nico\s*(.*)$/i;
  const rePX   = /^§\s*(\d+\s*[º°]?(?:-[A-Z])?)\s*(.*)$/;
  const reIncX = /^([IVXLCDM]{1,9}(?:-[A-Z])?)\s*[-–—]\s*(.*)$/;
  const reAliX = /^([a-z]{1,2}(?:-[a-z]{1,2})?)\)\s*(.*)$/;
  const reIteX = /^(\d{1,2}(?:-[A-Z])?)\.\s+(.*)$/;
  const reOmissao     = /^[.…]{3,}$|^\(\s*\.{3}\s*\)$|^\[\s*\.{3}\s*\]$/;
  const reOmissaoBody = /^[.…]{3,}$/;
  const limparSeparadorX = s => {
    const t = (s||"").trim();
    if (reOmissaoBody.test(t)) return t; // reticência de omissão — preserva intacta
    return t.replace(/^[.\-–—:]{1,2}\s*/, "");
  };
  const root = []; let last3 = { a:null, p:null, i:null, al:null };
  const mkX = (tipo, texto, desFixo) => {
    const n = { id:nid(), tipo, texto: limparSeparadorX(texto), desFixo, children:[], conj:null };
    if (reOmissaoBody.test((n.texto||"").trim())) { n.omitido=true; n.texto=""; }
    return n;
  };
  lns.forEach(raw => {
    const line = raw.trim(); if (!line) return;
    if (reOmissao.test(line)) {
      const n = { id:nid(), tipo:"omissao", texto:"", desFixo:null, children:[], conj:null, omitido:true };
      const t = last3.al||last3.i||last3.p||last3.a;
      if (t) t.children.push(n); else root.push(n); return;
    }
    let m;
    if (m = line.match(reArtX)) { const n=mkX("artigo",m[2],"Art. "+m[1].trim()); root.push(n); last3={a:n,p:null,i:null,al:null}; return; }
    if (m = line.match(rePUnX)) { const n=mkX("paragrafo",m[1],"Parágrafo único."); if(last3.a)last3.a.children.push(n);else root.push(n); last3.p=n;last3.i=null;last3.al=null; return; }
    if (m = line.match(rePX))   { const n=mkX("paragrafo",m[2],"§ "+m[1].trim()); if(last3.a)last3.a.children.push(n);else root.push(n); last3.p=n;last3.i=null;last3.al=null; return; }
    if (m = line.match(reIncX)) { const n=mkX("inciso",m[2],m[1]+" –"); const tgt=last3.p||last3.a; if(tgt)tgt.children.push(n);else root.push(n); last3.i=n;last3.al=null; return; }
    if (m = line.match(reAliX)) { const n=mkX("alinea",m[2],m[1]+")"); if(last3.i)last3.i.children.push(n);else root.push(n); last3.al=n; return; }
    if (m = line.match(reIteX)) { const n=mkX("item",m[2],m[1]+"."); if(last3.al)last3.al.children.push(n);else root.push(n); return; }
    const t = last3.al||last3.i||last3.p||last3.a;
    if (t) { t.texto=(t.texto+" "+line).trim(); return; }
    if (root.length && root[root.length-1].tipo==="texto")
      { root[root.length-1].texto=(root[root.length-1].texto+" "+line).trim(); return; }
    root.push({ id:nid(), tipo:"texto", texto:line, desFixo:null, children:[], conj:null });
  });
  return { artigos:root, temNR };
}

/** Sugere designador com sufixo de letra para inserção intermediária (art. 17 da LC 611/2009) */
export function suggestDesFixo(refDesFixo, siblingArr) {
  const parse = s => { const m=s.match(/^(.*?)-([A-Z])([.):]*)$/); return m ? {base:m[1],tail:m[3]} : {base:s.replace(/[.):]*$/,""),tail:(s.match(/[.):]*$/)||[""])[0]}; };
  const { base, tail } = parse(refDesFixo);
  const used = siblingArr.filter(s=>s.desFixo&&s.desFixo.startsWith(base)).map(s=>{ const mm=s.desFixo.match(/-([A-Z])[.):]*$/); return mm?mm[1]:null; }).filter(Boolean);
  let letter = "A"; while (used.includes(letter)) letter=String.fromCharCode(letter.charCodeAt(0)+1);
  return base+"-"+letter+tail;
}

// ─── ESTADOS ESPECIAIS DE DISPOSITIVO (vetado / revogado) ─────────────────────
/**
 * marcarEstadosEspeciais(doc) → void (muta doc.artigos in-place)
 *
 * Detecta dispositivos cujo texto é só um placeholder — "VETADO." ou
 * "(Revogado)" — e marca `vetado`/`revogado` no nó. Extraída de dentro de
 * normalizar() de propósito: isto é uma preocupação de CONTEÚDO relevante
 * pro consolidador (Norma), não de grafia/nomenclatura de MINUTA (que é o
 * que normalizar() faz, herdado do editor de projetos de lei). Ter as duas
 * coisas misturadas na mesma função criava uma dependência escondida — se
 * algum dia o pipeline da peça 4 decidisse não chamar normalizar() (o que
 * faz sentido: não existe "correção de grafia" de uma lei já promulgada,
 * isso seria revisionismo, não consolidação), a detecção de vetado/revogado
 * sumiria junto, sem aviso.
 *
 * `criarVersaoOriginal()` (peça 4) chama esta função diretamente — não
 * depende de `normalizar()` ter sido chamado antes. `normalizar()` também a
 * chama internamente, por compatibilidade com quem já dependia desse efeito
 * colateral — chamar as duas em sequência é seguro e idempotente.
 */
export function marcarEstadosEspeciais(doc) {
  walkNodes(doc.artigos, (n) => {
    if (/^VETADO\.?$/i.test((n.texto||"").trim())) n.vetado = true;
    if (/^\(?\s*REVOGADO\.?\s*\)?\.?$/i.test((n.texto||"").trim())) n.revogado = true;
  });
}

// ─── NORMALIZAÇÃO ─────────────────────────────────────────────────────────────
/**
 * normalizar(doc, [log], [nomen])
 *
 * ⚠️ MUTA `n.texto`: corrige terminador, reescreve autorreferência ("desta
 * lei" → sigla correta), força minúscula no início de inciso/alínea/item.
 * NUNCA rode isto sobre o texto de uma lei JÁ PUBLICADA — mutaria
 * silenciosamente o registro oficial pra bater com uma convenção derivada,
 * mesmo que o texto realmente publicado tenha ficado diferente por algum
 * motivo legítimo (ou nem legítimo — mas não é papel desta função julgar
 * isso post-facto). O pipeline da peça 4 (Norma) NUNCA chama esta função —
 * `criarVersaoOriginal()` usa só `marcarEstadosEspeciais()`, que não muta
 * texto algum, só lê e marca.
 *
 * ESCOPO: grafia de designadores, terminadores e nomenclatura — preocupações
 * de revisão de MINUTA (herdadas do editor de projetos de lei original).
 * Faz sentido rodar isto ao revisar um projeto de lei antes de ir a
 * plenário, onde mutar o texto É o objetivo (corrigir antes da promulgação).
 * Não use isto em nenhum contexto de ingestão de texto já promulgado.
 *
 * Normaliza a grafia de designadores, terminadores e nomenclatura em `doc`
 * (in-place). O `doc` deve ter saído de parseMinuta(). Chama
 * `marcarEstadosEspeciais(doc)` internamente — vetado/revogado sempre são
 * detectados, com ou sem o restante da normalização de grafia.
 *
 * @param doc    — objeto retornado por parseMinuta()
 * @param log    — função opcional (regra, alvo, antes, depois) => void para auditoria
 * @param nomen  — substituições terminológicas [/regex/, "novo", "descrição"][]
 *                 Omitir ou passar [] para sem substituições automáticas.
 */
export function normalizar(doc, log, nomen) {
  log   = log   || (() => {});
  nomen = nomen || [];
  const auto = (doc.sigla==="PLCL"||doc.sigla==="PLCE"||doc.tipoAto==="LEI COMPLEMENTAR") ? "Lei Complementar"
             : (doc.sigla==="PR"||doc.tipoAto==="RESOLUÇÃO") ? "Resolução"
             : "Lei";
  const fixText = (txt, alvo) => {
    let out = txt;
    for (const [re, novo, regra] of nomen) {
      re.lastIndex = 0;
      if (re.test(out)) { const a=out; out=out.replace(re, novo); re.lastIndex=0; log(regra, alvo, a, out); }
    }
    let t = out.replace(/(\d)°/g,"$1º");
    if (t !== out) { log("Símbolo de grau (°) → ordinal (º)", alvo, out, t); out=t; }
    t = out.replace(/\b([dn]?est)a\s+(lei|resolu[çc][ãa]o)(\s+complementar)?\b/gi, (m,p1)=>p1+"a "+auto);
    if (t !== out) { log("Autorreferência conferida pela sigla da epígrafe", alvo, out, t); out=t; }
    return out;
  };
  // Designadores — normaliza grafia (arts. 13 e 14 da LC 611/2009)
  const allNodes = []; walkNodes(doc.artigos, (n,sib) => allNodes.push([n,sib]));
  allNodes.forEach(([n,sib]) => {
    // Designadores com sufixo de letra (Art. 5º-A) são inserções intermediárias:
    // não seguem numeração posicional sequencial, então a checagem de grafia
    // canônica abaixo (baseada no índice no array) não se aplica a eles.
    const temSufixoLetra = n.rawL && /-[A-Z]\b/.test(n.rawL);
    if (n.rawL && !temSufixoLetra && ["artigo","paragrafo"].includes(n.tipo)) {
      const canon = (n.tipo==="artigo")
        ? (() => { const k=doc.artigos.indexOf(n)+1; return k<=9?`Art. ${k}º`:`Art. ${k}.`; })()
        : (() => { const ps=sib.filter(s=>s.tipo==="paragrafo"); if(ps.length===1)return"Parágrafo único."; const k=ps.indexOf(n)+1; return k<=9?`§ ${k}º`:`§ ${k}.`; })();
      const raw2 = n.rawL.replace(/\s+/g," ");
      if (raw2!==canon && raw2!==canon.replace(/\.$/,""))
        log("Grafia do designador padronizada (arts. 13 e 14 da LC 611/2009)", canon, raw2, canon);
    }
    n.rawL = null;
  });
  // Textos: terminadores e nomenclatura
  marcarEstadosEspeciais(doc); // vetado/revogado — ver função abaixo (extraída de normalizar() por não ser preocupação de grafia/nomenclatura)
  const procNode = (n, sib, parent) => {
    let t = fixText(n.texto, n.tipo);
    const en = enumKids(n);
    if (["inciso","alinea","item"].includes(n.tipo) && parent) {
      const eAll = enumKids(parent); const i = eAll.indexOf(n);
      const conjM = t.match(/[;,.]?\s*(e|ou)\s*$/i);
      if (i===eAll.length-2 && conjM && /[;,.]\s*(e|ou)\s*$/i.test(t)) parent.conj=conjM[1].toLowerCase();
      const stripped = stripTerm(t);
      const derived = (i===eAll.length-1) ? "." : (i===eAll.length-2&&parent.conj) ? ("; "+parent.conj) : ";";
      const orig = t.slice(stripped.length).trim();
      if (orig && orig!==derived && !(en.length && orig===":"))
        log("Terminador derivado da posição na enumeração (art. 14, §5º, VII, da LC 611/2009)", n.tipo, "…"+orig, "…"+(en.length?":":derived));
      t = stripped;
      if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(t) && !/^(Município|Porto|Executivo|Câmara|Programa|Rede|Anexo|Lei|Secretaria|Guarda|União|Estado)/.test(t)) {
        const nv = t[0].toLowerCase()+t.slice(1);
        log("Texto de inciso/alínea/item inicia com minúscula", n.tipo, t, nv); t=nv;
      }
    } else if (n.tipo !== "em") {
      const stripped = stripTerm(t); const orig = t.slice(stripped.length).trim();
      const derived = en.length ? ":" : ".";
      if (orig && orig!==derived)
        log("Terminador derivado ("+(en.length?"dois-pontos no introdutor de enumeração":"ponto final")+")", n.tipo, "…"+orig, "…"+derived);
      t = stripped;
    }
    n.texto = t;
  };
  walkNodes(doc.artigos, (n,sib,par) => procNode(n,sib,par));
  doc.ementa.texto = fixText(stripTerm(doc.ementa.texto), "Ementa");
  doc.em.forEach(p => { p.texto = fixText(p.texto, "Exposição de Motivos"); });
}

// ─── MAPA DE NUMERAÇÃO ORIGINAL ───────────────────────────────────────────────
/**
 * construirMapaNumeracaoOriginal(artigos) → { "art:N": id, "art:N|par:M": id, … }
 *
 * Constrói um mapa imutável de endereço → id de nó, capturado antes de qualquer
 * alteração deslocar a numeração. Essencial para resolver alvos de leis alteradoras.
 */
export function construirMapaNumeracaoOriginal(artigos) {
  const mapa = {};
  const walkAlineas = (nodes, parentKey) => {
    (nodes||[]).filter(n=>n.tipo==="alinea").forEach((al,ai) => { mapa[parentKey+"|ali:"+alphaLabel(ai)]=al.id; });
  };
  const walkIncisos = (nodes, parentKey) => {
    (nodes||[]).filter(n=>n.tipo==="inciso").forEach((inc,ii) => {
      const key = parentKey+"|inc:"+roman(ii+1); mapa[key]=inc.id; walkAlineas(inc.children, key);
    });
  };
  (artigos||[]).forEach((a,ai) => {
    const artKey = "art:"+(ai+1); mapa[artKey]=a.id;
    (a.children||[]).filter(n=>n.tipo==="paragrafo").forEach((p,pi) => {
      const parKey = artKey+"|par:"+(pi+1); mapa[parKey]=p.id; walkIncisos(p.children, parKey);
    });
    walkIncisos(a.children, artKey);
  });
  return mapa;
}

// ─── PEÇA 4: MOTOR DE CONSOLIDAÇÃO — ENDEREÇAMENTO UNIFICADO ──────────────────
/**
 * atribuirDesFixoOriginal(doc) → void (muta doc.artigos in-place)
 *
 * `desFixo` até aqui só existia em nós nascidos de um bloco NR
 * (extrairRedacaoAlterada) — nós da árvore original de parseMinuta não
 * tinham, e seu "endereço" era calculado por POSIÇÃO no array sempre que
 * precisava (construirMapaNumeracaoOriginal, a checagem de grafia em
 * normalizar()). Isso quebra assim que a árvore acumula uma inserção: um
 * artigo nunca tocado por nenhuma alteração pode ter sua posição no array
 * deslocada por uma inserção em QUALQUER lugar anterior da lei, mudando o
 * resultado de `array.indexOf(n)+1` mesmo sem o dispositivo ter sido
 * renumerado de verdade (ele não é — mantém a designação original pra
 * sempre, mesma regra do dispositivo revogado).
 *
 * Rode esta função UMA VEZ, no momento em que a v0 (promulgação original) de
 * uma lei-base é criada — antes de qualquer versionamento começar. A partir
 * daí, todo endereçamento (peça 4) usa `desFixo`, nunca mais posição no
 * array. `construirMapaNumeracaoOriginal` continua existindo com sua chave
 * própria — é do uso original do editor de minutas, não confundir com o
 * endereçamento por `desFixo` usado por peça 3/4.
 */
export function atribuirDesFixoOriginal(doc) {
  (doc.artigos || []).forEach((a, ai) => {
    a.desFixo = (ai+1) <= 9 ? `Art. ${ai+1}º` : `Art. ${ai+1}.`;
    const paragrafos = (a.children || []).filter(n => n.tipo === "paragrafo");
    (a.children || []).forEach(p => {
      if (p.tipo === "paragrafo") {
        p.desFixo = paragrafos.length === 1 ? "Parágrafo único."
          : (paragrafos.indexOf(p)+1 <= 9 ? `§ ${paragrafos.indexOf(p)+1}º` : `§ ${paragrafos.indexOf(p)+1}.`);
        // "§ 1º" escrito SOZINHO na lei (sem "§ 2º"): o motor segue o que a lei fez (decisão do mantenedor,
        // 20/11/2026) — o endereço é o rótulo escrito, não "Parágrafo único."; fica marcado para o aviso
        // "irregularidade da fonte". Nada é renumerado: é o rótulo que a lei pôs.
        if (paragrafos.length === 1) {
          const mEscrito = /^§\s*(\d+)\s*[º°o]?\s*$/.exec(String(p.rawL || "").trim());
          if (mEscrito) { const n = parseInt(mEscrito[1], 10); p.desFixo = n <= 9 ? `§ ${n}º` : `§ ${n}.`; p.numeradoSemIrmao = true; }
        }
      }
      const incisos = (p.children || []).filter(n => n.tipo === "inciso");
      (p.tipo === "paragrafo" ? p.children : []).forEach(inc => { if (inc.tipo==="inciso") inc.desFixo = roman(incisos.indexOf(inc)+1) + " –"; });
    });
    const incisosDireto = (a.children || []).filter(n => n.tipo === "inciso");
    (a.children || []).forEach(inc => {
      if (inc.tipo === "inciso") {
        inc.desFixo = roman(incisosDireto.indexOf(inc)+1) + " –";
      }
    });
    // alíneas e itens: filhas de inciso/alínea, em qualquer nível (art. direto ou via parágrafo)
    const walkEnum = (nodes) => {
      (nodes || []).forEach(n => {
        if (n.tipo === "inciso" && !n.desFixo) { /* já tratado acima nos dois ramos */ }
        if (n.tipo === "alinea") {
          const irmaos = (n._paiChildren || []).filter(x => x.tipo === "alinea");
        }
        if (n.children && n.children.length) {
          const alineas = n.children.filter(c => c.tipo === "alinea");
          n.children.forEach(c => {
            if (c.tipo === "alinea") {
              // depois do "z" a lei de Porto Alegre usa duas práticas ("aa, bb, cc" e "aa, ab, ac"): o motor segue o
              // rótulo ESCRITO quando são duas letras (decisão 26, 20/11/2026); antes do "z" continua a posição.
              const idxAl = alineas.indexOf(c);
              c.desFixo = (idxAl >= 26 && /^[a-z]{2}$/.test(c.rawL || "") ? c.rawL : alphaLabel(idxAl)) + ")";
            }
            const itens = c.children ? c.children.filter(x => x.tipo === "item") : [];
            (c.children || []).forEach(it => { if (it.tipo === "item") it.desFixo = String(itens.indexOf(it)+1) + "."; });
          });
          walkEnum(n.children);
        }
      });
    };
    walkEnum(a.children);
  });
}

/**
 * Converte um desFixo de nó-raiz de artigo ("Art. 8º", "Art. 9º-A") na
 * chave canônica ("art. 8º", "art. 9º-a") — mesmo formato usado em
 * parseLeiAlvoIndex/extrairCitacoesExternas/enderecarNrBloco.
 */
function desFixoParaChaveArtigo(desFixo) {
  const m = (desFixo || "").trim().match(/^Art(?:igo)?\.?\s*(\d+\s*[º°]?(?:-[A-Z])?)\.?$/i);
  return m ? "art. " + m[1].trim().toLowerCase() : null;
}

function chaveDoNo(node, chavePai) {
  if (chavePai == null) return desFixoParaChaveArtigo(node.desFixo);
  const seg = desFixoParaSegmento(node.desFixo);
  return seg ? `${seg} do ${chavePai}` : null;
}

/**
 * localizarCaminho(versao, chave) → [{ nodes, index, node }] | null
 *
 * Acha o caminho da raiz até o nó com aquela chave, computando o
 * endereçamento a partir de `desFixo` a cada nível (nunca por posição).
 * O caminho devolvido é o que reconstruirComSubstituicao() usa pra produzir
 * uma nova árvore com compartilhamento estrutural — só os arrays no caminho
 * viram objetos novos, o resto da árvore é a mesma referência.
 */
export function localizarCaminho(versao, chave) {
  let achado = null;
  const walk = (nodes, chavePai, trilha) => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const chaveAtual = chaveDoNo(n, chavePai);
      const novaTrilha = trilha.concat([{ nodes, index: i, node: n }]);
      if (chaveAtual === chave) { achado = novaTrilha; return true; }
      if (n.children && n.children.length && walk(n.children, chaveAtual, novaTrilha)) return true;
    }
    return false;
  };
  walk(versao.artigos, null, []);
  return achado;
}

function reconstruirComSubstituicao(versao, caminho, noSubstituto) {
  let atual = noSubstituto;
  for (let i = caminho.length - 1; i >= 0; i--) {
    const { nodes, index } = caminho[i];
    const novosIrmaos = nodes.slice();
    novosIrmaos[index] = atual;
    if (i === 0) return { ...versao, artigos: novosIrmaos };
    atual = { ...caminho[i-1].node, children: novosIrmaos };
  }
  return versao; // caminho vazio — não deveria acontecer
}

/**
 * indexarVersao(versao) → { "art. 8º": "texto vigente…", … }
 *
 * Equivalente a parseLeiAlvoIndex(), mas a partir de uma VersaoLei (árvore
 * já estruturada) em vez de texto compilado. Serve como `opts.leiBaseIndex`
 * de extrairComandosLei() quando a lei-alvo já foi processada pela peça 4
 * em vez de lida direto de texto — mesmo formato de chave, intercambiável.
 */
export function indexarVersao(versao) {
  const idx = {};
  const walk = (nodes, chavePai) => {
    (nodes || []).forEach(n => {
      const chave = chaveDoNo(n, chavePai);
      if (chave) idx[chave] = visText(n);
      if (n.children && n.children.length) walk(n.children, chave);
    });
  };
  walk(versao.artigos, null);
  return idx;
}

/**
 * criarVersaoOriginal(doc, fonte) → VersaoLei
 *
 * Cria a v0 (promulgação original) a partir do `doc` de parseMinuta/normalizar.
 * Atribui desFixo (se ainda não tiver sido atribuído) e marca a proveniência
 * de cada nó como a própria promulgação original.
 *
 * `fonte`: { tipoAto, numero, ano, dataPublicacao } — tipicamente a saída de
 * extrairCabecalhoLeiPublicada() sobre o mesmo texto que gerou `doc`.
 */
export function criarVersaoOriginal(doc, fonte) {
  atribuirDesFixoOriginal(doc);
  marcarEstadosEspeciais(doc); // não depende de normalizar() ter sido chamado antes — ver JSDoc da função
  const marcarOrigem = (nodes) => (nodes || []).forEach(n => {
    n.origem = { tipo: "promulgacao_original", dataPublicacao: fonte.dataPublicacao };
    if (n.children && n.children.length) marcarOrigem(n.children);
  });
  marcarOrigem(doc.artigos);
  return {
    id: `${chaveLei(fonte.tipoAto, fonte.numero, fonte.ano)}@${fonte.dataPublicacao}`,
    urn: urnLei(fonte.tipoAto, fonte.numero, fonte.dataPublicacao), // identidade canônica LexML — complementar a `id`, não substitui
    leiBase: { tipoAto: fonte.tipoAto, numero: fonte.numero, ano: fonte.ano },
    versaoAnterior: null,
    fonte: { tipo: "promulgacao_original", dataPublicacao: fonte.dataPublicacao },
    dataVigencia: fonte.dataPublicacao,
    artigos: doc.artigos
  };
}

/**
 * criarVersaoOriginalDeLeiPublicada(raw) → VersaoLei
 *
 * `parseLeiPublicada(raw)` + `criarVersaoOriginal(doc, doc)` numa chamada
 * só — funciona porque `parseLeiPublicada()` já popula tipoAto/numero/ano/
 * dataPublicacao direto no `doc`, no mesmo formato que `criarVersaoOriginal`
 * espera como `fonte`. É o ponto de entrada de MENOR RISCO pra criar a v0
 * de uma lei publicada: uma chamada, sem objeto intermediário pra montar
 * errado, sem passo de ordem pra esquecer.
 */
export function criarVersaoOriginalDeLeiPublicada(raw) {
  const doc = parseLeiPublicada(raw);
  // Falha alto: um fragmento (promulgação parcial de dispositivo) NÃO é a v0
  // da lei. Criar a versão a partir dele numeraria o trecho como "Art. 1º" /
  // "Parágrafo único" no lugar do dispositivo real (ex.: art. 185, § 3º) —
  // um erro silencioso que contaminaria toda alteração posterior.
  if (doc.promulgacaoParcial.parcial) {
    const { objetoPromulgado } = doc.promulgacaoParcial.sinais;
    throw new Error(
      `criarVersaoOriginalDeLeiPublicada: o texto parece ser PROMULGAÇÃO PARCIAL — ` +
      `o preâmbulo promulga "${objetoPromulgado}" de ${doc.tipoAto} ${doc.numero}/${doc.ano}, ` +
      `não a lei inteira. Trate como derrubada de veto (evento de Visão), não como versão original.`
    );
  }
  return criarVersaoOriginal(doc, doc);
}

/**
 * aplicarComandoLei(versaoAtual, comando, fonteAlteradora) → { versao } | { erro, comando, naoImplementado?, ignorado? }
 *
 * Aplica UM comando (saída de extrairComandosLei) sobre uma VersaoLei,
 * devolvendo a PRÓXIMA versão (imutável — versaoAtual não é modificada) ou
 * um erro. Nunca lança exceção: erro sempre vem como valor de retorno, pra
 * quem orquestra várias leis alteradoras (apurarTextoVigente) poder acumular um
 * log de comandos não aplicados sem interromper o processamento dos demais.
 *
 * `fonteAlteradora`: { tipoAto, numero, ano, dataPublicacao } — identidade
 * da PRÓPRIA lei alteradora que emitiu o comando (distinta de
 * `comando.leiAlvo`, que é a lei sendo alterada). Usada em `origem`.
 *
 * Operações com efeito na árvore: "replace_text", "insert_node".
 * Operações com stub que falha alto (NUNCA aplicam suposição não validada):
 * "revoke_node", "veto_derrubado".
 * Operações sem efeito nesta árvore (registradas, nunca aplicadas aqui):
 * "revoke_lei", "clausula_generica_sem_efeito", "indeterminado", "nao_classificado".
 */
function leiAlvoBateComVersao(comando, versaoAtual) {
  if (comando.leiAlvo && comando.leiAlvo.presumida) return true; // alvo presumido (ex. "Lei Orgânica do Município") nunca recusa comando
  if (!comando.leiAlvo) return true; // comando sem citação de lei-alvo reconhecida — não há o que checar, confia no chamador
  const chaveVersao = chaveLei(versaoAtual.leiBase.tipoAto, versaoAtual.leiBase.numero, versaoAtual.leiBase.ano);
  if (comando.leiAlvo.chave) return comando.leiAlvo.chave === chaveVersao;
  if (comando.leiAlvo.anosCandidatos) {
    return comando.leiAlvo.numero === versaoAtual.leiBase.numero &&
           comando.leiAlvo.anosCandidatos.includes(parseInt(versaoAtual.leiBase.ano, 10));
  }
  return true;
}

export function aplicarComandoLei(versaoAtual, comando, fonteAlteradora) {
  const origemComando = {
    tipo: "lei_alteradora",
    lei: { tipoAto: fonteAlteradora.tipoAto, numero: fonteAlteradora.numero, ano: fonteAlteradora.ano },
    dataPublicacao: fonteAlteradora.dataPublicacao,
    operacao: comando.operacao
  };

  if ((comando.operacao === "replace_text" || comando.operacao === "insert_node" || comando.operacao === "renumber_node") && !leiAlvoBateComVersao(comando, versaoAtual)) {
    return { erro: `comando aponta pra lei-alvo diferente da versão recebendo o patch (comando: ${JSON.stringify(comando.leiAlvo)}, versão: ${chaveLei(versaoAtual.leiBase.tipoAto, versaoAtual.leiBase.numero, versaoAtual.leiBase.ano)})`, comando };
  }

  if (comando.operacao === "replace_text") {
    const caminho = localizarCaminho(versaoAtual, comando.dispositivoAlvo);
    if (!caminho) return { erro: `endereço "${comando.dispositivoAlvo}" não encontrado na versão atual — possível citação incorreta na lei alteradora ou dispositivo já renumerado/removido`, comando };
    const alvo = caminho[caminho.length-1].node;
    if (alvo.revogado) return { erro: `endereço "${comando.dispositivoAlvo}" está revogado — não pode ser alvo de replace_text`, comando };
    if (alvo.vetado) {
      // Texto novo dado por lei alteradora a um rótulo cujo dispositivo original
      // foi vetado — caso real: LC 514/2004 inclui §§ 1º e 2º no art. 2º da LC
      // 320/1994, onde os §§ 1º e 2º originais eram VETADO. Não é derrubada de
      // veto (essa chega por promulgação própria, não por bloco de alteração): é
      // dispositivo NOVO, com identidade nova, que a lei pôs naquela posição. A
      // regra de não reaproveitar posição de vetado (LC 611/2009, art. 17, II) é
      // posterior e vale para o que se redige hoje; o motor segue o que a lei fez
      // e registra a exceção (decisão do mantenedor, 17/11/2026).
      const novo = { ...alvo, id: nid(), texto: comando.novoTexto, origem: { ...origemComando, operacao: "insert_node", ocupouPosicaoDeVetado: true } };
      delete novo.vetado;
      return { versao: reconstruirComSubstituicao(versaoAtual, caminho, novo) };
    }
    const novoNo = { ...alvo, texto: comando.novoTexto, origem: origemComando };
    return { versao: reconstruirComSubstituicao(versaoAtual, caminho, novoNo) };
  }

  if (comando.operacao === "insert_node") {
    const m = comando.dispositivoAlvo.match(/^(.+?) do (.+)$/); // "§ 1º do art. 8º" → filho de "art. 8º"
    if (m) {
      const chavePai = m[2];
      const caminhoPai = localizarCaminho(versaoAtual, chavePai);
      if (!caminhoPai) return { erro: `endereço-pai "${chavePai}" não encontrado — não é possível inserir "${comando.dispositivoAlvo}"`, comando };
      const pai = caminhoPai[caminhoPai.length-1].node;
      const jaExiste = (pai.children || []).some(c => chaveDoNo(c, chavePai) === comando.dispositivoAlvo);
      if (jaExiste) return { erro: `endereço "${comando.dispositivoAlvo}" já existe — insert_node não pode sobrescrever (use replace_text)`, comando };
      const filhoOrigemNode = comando._noOrigemNrBloco; // ver extrairComandosLei — carrega tipo/desFixo do nó do bloco NR
      const novoFilho = {
        id: nid(), tipo: filhoOrigemNode?.tipo || "paragrafo", texto: comando.novoTexto,
        desFixo: filhoOrigemNode?.desFixo || null, children: [], conj: null, origem: origemComando
      };
      const novoPai = { ...pai, children: [...(pai.children || []), novoFilho] };
      return { versao: reconstruirComSubstituicao(versaoAtual, caminhoPai, novoPai) };
    }
    // sem "do" → inserção de artigo novo no nível raiz (ex. "art. 9º-a" entre "art. 9º" e "art. 10")
    const baseMatch = comando.dispositivoAlvo.match(/^art\.\s*(\d+)\s*[º°]?(?:-[a-z])?$/i);
    if (!baseMatch) return { erro: `não foi possível determinar onde inserir o artigo novo "${comando.dispositivoAlvo}"`, comando };
    const numeroBase = baseMatch[1];
    let posInsercao = versaoAtual.artigos.findIndex(a => {
      const cm = (a.desFixo||"").match(/^Art(?:igo)?\.?\s*(\d+)/i);
      return cm && cm[1] === numeroBase;
    });
    if (posInsercao === -1) return { erro: `artigo-base "art. ${numeroBase}º" não encontrado — não é possível posicionar "${comando.dispositivoAlvo}"`, comando };
    // Guarda: artigo novo na raiz só entra se AINDA não existir artigo com o mesmo
    // número e a mesma letra. Sem isto, um endereço mal lido na alteradora (caso
    // real: LC 449/2000, cujo arquivo traz "art. 5®" no lugar de "art. 5º") virava
    // um segundo "art. 5" inserido ao lado do verdadeiro, em silêncio.
    {
      const rotuloNovo = s => { const x = String(s||"").match(/(\d+)\s*[º°]?(?:-([A-Za-z]))?/); return x ? x[1]+"-"+(x[2]||"").toUpperCase() : null; };
      const alvoNovo = rotuloNovo(comando.dispositivoAlvo.replace(/^art\.\s*/i, ""));
      if (versaoAtual.artigos.some(a => rotuloNovo((a.desFixo||"").replace(/^Art(?:igo)?\.?\s*/i, "")) === alvoNovo)) {
        return { erro: `já existe artigo com o rótulo de "${comando.dispositivoAlvo}" — insert_node não pode criar um segundo; se a intenção era dar nova redação, o endereço na alteradora não foi reconhecido como o do artigo existente`, comando };
      }
    }
    // avança além de outros sufixos de letra já inseridos pro mesmo artigo-base
    while (posInsercao+1 < versaoAtual.artigos.length &&
           new RegExp(`^Art\\.?\\s*${numeroBase}\\s*[º°]?-[A-Z]`, "i").test(versaoAtual.artigos[posInsercao+1].desFixo||"") &&
           versaoAtual.artigos[posInsercao+1].desFixo < (comando._noOrigemNrBloco?.desFixo || "")) {
      posInsercao++;
    }
    const filhoOrigemNode = comando._noOrigemNrBloco;
    const novoArtigo = {
      id: nid(), tipo: "artigo", texto: comando.novoTexto,
      // Filhos NÃO vêm junto: cada um tem o seu próprio comando insert_node
      // (extrairComandosLei emite um por dispositivo do bloco). Trazê-los aqui
      // fazia os comandos dos filhos falharem com "já existe" e os deixava sem
      // `origem` — achado com dado real (LC 958/2022, art. 12-B e seus 21 incisos).
      desFixo: filhoOrigemNode?.desFixo || null, children: [], conj: null, origem: origemComando
    };
    const novosArtigos = versaoAtual.artigos.slice();
    novosArtigos.splice(posInsercao+1, 0, novoArtigo);
    return { versao: { ...versaoAtual, artigos: novosArtigos } };
  }

  if (comando.operacao === "renumber_node") {
    // Ver extrairComandosLei: só existe quando a alteradora manda renumerar.
    // O nó é o MESMO (mesmo id, mesmo texto, mesma origem do texto); muda o
    // rótulo, e a troca fica registrada em `renumerado`.
    const caminho = localizarCaminho(versaoAtual, comando.dispositivoAlvo);
    if (!caminho) return { erro: `endereço "${comando.dispositivoAlvo}" não encontrado — não há o que renumerar`, comando };
    const alvo = caminho[caminho.length-1].node;
    const irmaos = caminho[caminho.length-1].nodes || [];
    const segNovo = desFixoParaSegmento(comando.novoRotulo);
    if (irmaos.some(n => n !== alvo && !n.vetado && desFixoParaSegmento(n.desFixo) === segNovo)) {
      return { erro: `não é possível renumerar "${comando.dispositivoAlvo}" para "${comando.novoRotulo}": já existe dispositivo com esse rótulo`, comando };
    }
    const novoNo = { ...alvo, desFixo: comando.novoRotulo, renumerado: { de: alvo.desFixo, lei: origemComando.lei, dataPublicacao: origemComando.dataPublicacao } };
    return { versao: reconstruirComSubstituicao(versaoAtual, caminho, novoNo) };
  }

  if (comando.operacao === "revoke_node") {
    // Exemplo real: LC 958/2022, art. 6º — "Fica revogado o art. 7º da Lei
    // Complementar nº 320, de 2 de maio de 1994." Conforme PECA4-MODELO-DE-DADOS.md,
    // seção 3: o nó NÃO sai da árvore; mantém id e desFixo, o texto vira
    // "(Revogado)" e `revogado: true`. Os dispositivos subordinados seguem o
    // principal (revogado o artigo, revogados seus parágrafos e incisos). O texto
    // anterior continua disponível na versão anterior (versaoAnterior).
    if (!leiAlvoBateComVersao(comando, versaoAtual)) {
      return { erro: `comando de revogação aponta pra lei-alvo diferente da versão recebendo o patch`, comando };
    }
    const caminho = localizarCaminho(versaoAtual, comando.dispositivoAlvo);
    if (!caminho) return { erro: `endereço "${comando.dispositivoAlvo}" não encontrado na versão atual — não há o que revogar`, comando };
    const alvo = caminho[caminho.length-1].node;
    if (alvo.revogado) return { erro: `endereço "${comando.dispositivoAlvo}" já está revogado`, comando };
    const revogar = n => ({ ...n, texto: "(Revogado)", revogado: true, origem: origemComando, children: (n.children || []).map(revogar) });
    return { versao: reconstruirComSubstituicao(versaoAtual, caminho, revogar(alvo)) };
  }

  if (comando.operacao === "veto_derrubado") {
    return { erro: `operação "${comando.operacao}" ainda não implementada — pendente de validação com dado real (ver CHANGELOG)`, comando, naoImplementado: true };
  }

  return { erro: `operação "${comando.operacao}" não gera alteração na árvore desta lei`, comando, ignorado: true };
}

/**
 * apurarTextoVigente(versaoInicial, lotesComandos) → { versaoFinal, log[] }
 *
 * (Nome anterior: consolidarLei — renomeado porque "consolidação" tem
 * definição legal própria e mais restrita na LC 611/2009, art. 19, §3º, que
 * não é o que esta função faz. Ver nota de terminologia no topo do arquivo.)
 *
 * Aplica sequências de comandos (uma por lei alteradora, na ordem
 * cronológica de vocês) sobre uma versão inicial, produzindo o texto
 * vigente final. `lotesComandos`: [{ fonteAlteradora, comandos }].
 * `log` acumula TODO comando não aplicado (erro, stub não implementado, ou
 * operação sem efeito nesta árvore) — nunca falha silenciosamente nem
 * interrompe o processamento dos demais lotes.
 */
export function apurarTextoVigente(versaoInicial, lotesComandos) {
  let versao = versaoInicial;
  const log = [];
  // Cadeia de versões (PECA4-MODELO-DE-DADOS.md, seção 2: uma versão por lei
  // alteradora). Até a rodada 13 só a árvore final era devolvida, com o `id` e
  // a `fonte` da v0 e `versaoAnterior` sempre null — o histórico se perdia.
  // Achado ao encadear as 10 alteradoras reais da LC 320/1994. Agora cada lote
  // que altera a árvore gera uma versão com identidade própria, ligada à
  // anterior; lote que não altera nada não gera versão.
  const versoes = [versaoInicial];
  lotesComandos.forEach(({ fonteAlteradora, comandos }) => {
    const antes = versao;
    comandos.forEach(comando => {
      const resultado = aplicarComandoLei(versao, comando, fonteAlteradora);
      if (resultado.versao) versao = resultado.versao;
      else log.push({ fonteAlteradora, ...resultado });
    });
    if (versao !== antes) {
      versao = {
        ...versao,
        id: `${chaveLei(versao.leiBase.tipoAto, versao.leiBase.numero, versao.leiBase.ano)}@${fonteAlteradora.dataPublicacao}`,
        versaoAnterior: antes.id,
        fonte: {
          tipo: "lei_alteradora",
          lei: { tipoAto: fonteAlteradora.tipoAto, numero: fonteAlteradora.numero, ano: fonteAlteradora.ano },
          dataPublicacao: fonteAlteradora.dataPublicacao
        },
        dataVigencia: fonteAlteradora.dataPublicacao
      };
      versoes.push(versao);
    }
  });
  return { versaoFinal: versao, log, versoes };
}

// ─── LEI-ALVO: índice e anotações ────────────────────────────────────────────
/**
 * Varredura compartilhada do texto de uma lei-alvo, em qualquer dos dois
 * formatos possíveis:
 *   - passagem única (lei tal como promulgada, sem histórico de alteração), ou
 *   - COMPILADO (formato leis.org "NORMA EM VIGOR": o mesmo endereço pode
 *     repetir várias vezes em sequência, uma por versão histórica).
 *
 * `put(chave, texto, éCabecalho)` é chamado para cada linha de dispositivo.
 * `éCabecalho=true` quando a linha é a linha que DEFINE o endereço (o "Art. 4º"
 * ou "§ 2º" em si) — é nesse ponto que uma repetição de endereço já visto
 * antes sinaliza o início de uma NOVA versão daquele dispositivo, não uma
 * continuação da anterior. `éCabecalho=false` para linhas de continuação
 * (quebra de linha dentro do mesmo dispositivo).
 *
 * Chaves no formato: "art. 5º", "§ 2º do art. 5º", "inc. iii do art. 5º", etc.
 * (o "º"/"°" do designador é preservado tal como aparece na origem — não é
 * removido nem inserido; ver extrairCitacoesExternas quanto à normalização
 * do lado da citação).
 */
function walkLeiAlvo(raw, put) {
  const lines = raw.split(/\r?\n/).map(l => l.trim());
  let a=null, p=null, i=null;
  const reArt = /^(?:Art|ART)(?:igo|IGO)?\.?\s*(\d+\s*[º°]?(?:-[A-Za-z])?)\s*[.\-–—:]*\s*(.*)$/;
  // Só com P maiúsculo (mesma regra do "Art."): linha que começa com "parágrafo
  // único" em minúscula é continuação de frase quebrada — caso real: LC 514/2004,
  // "…renumerando o atual / parágrafo único para § 3º, com o seguinte teor:".
  const rePUn = /^P(?:ar[áa]grafo|AR[ÁA]GRAFO)\s+[úuÚU](?:nico|NICO)\s*[.\-–—:]*\s*(.*)$/;
  const rePar = /^§\s*(\d+\s*[º°]?(?:-[A-Z])?)\s*[.\-–—:]*\s*(.*)$/;
  const reInc = /^([IVXLCDM]{1,9}(?:-[A-Z])?)\s*[-–—]\s*(.*)$/;
  const reAli = /^([a-z]{1,2}(?:-[a-z]{1,2})?)\)\s*(.*)$/;
  lines.forEach(raw2 => {
    const line = raw2.trim(); if (!line) return;
    let m;
    if (m=line.match(reArt))             { a="art. "+m[1].trim().toLowerCase(); p=i=null; put(a,m[2],true); return; }
    if (!a) return;
    if (m=line.match(rePUn))             { p="parágrafo único do "+a; i=null; put(p,m[1],true); return; }
    if (m=line.match(rePar))             { p="§ "+m[1].trim()+" do "+a; i=null; put(p,m[2],true); return; }
    if (m=line.match(reInc))             { i="inc. "+m[1].toLowerCase()+" do "+(p||a); put(i,m[2],true); return; }
    if ((m=line.match(reAli)) && i)      { put("al. "+m[1].toLowerCase()+") do "+i, m[2],true); return; }
    const cur=i||p||a; if (cur) put(cur, line, false);
  });
}

/**
 * parseLeiAlvoIndex(raw) → { "art. 5º": "texto vigente…", "§ 1º do art. 5º": "texto…", … }
 *
 * Indexa o texto de uma lei-alvo por chave de dispositivo, devolvendo o
 * TEXTO VIGENTE — mesmo que `raw` seja um COMPILADO com
 * histórico empilhado (formato leis.org). Funciona porque, nesse formato, a
 * ocorrência mais recente de um endereço no texto é sempre a vigente; cada
 * vez que o endereço reaparece (uma nova linha de cabeçalho para a mesma
 * chave), a acumulação anterior é descartada e recomeça — só linhas de
 * continuação dentro da MESMA versão são concatenadas. Isso é uma premissa
 * do formato leis.org (histórico em ordem cronológica crescente), não uma
 * regra universal — se `raw` vier de outra fonte com ordem diferente, o
 * resultado pode não refletir o vigente. Para uma lei de passagem única
 * (sem repetição de endereço), o comportamento é idêntico a antes.
 * Útil para conferir se um dispositivo citado existe antes de aplicar um patch.
 */
export function parseLeiAlvoIndex(raw) {
  const idx = {};
  walkLeiAlvo(raw, (key, text, éCabecalho) => {
    idx[key] = éCabecalho ? text : (idx[key] ? idx[key]+" " : "")+text;
  });
  return idx;
}

/**
 * parseLeiAlvoAnotacoes(raw) → { "art. 5º": "Redação dada pela Lei nº X, de DATA", … }
 *
 * Extrai a anotação marginal VIGENTE de cada dispositivo — "(Redação dada
 * pela Lei nº X)", "(Redação acrescida pela Lei nº X)", "(Incluído pela Lei
 * nº X)", "(Suprimido por força da Lei nº X)", etc — a partir de um texto
 * COMPILADO (formato leis.org). Mesma semântica de "última ocorrência
 * vence" de parseLeiAlvoIndex: quando o endereço reaparece, a anotação
 * pendente é descartada e só é restabelecida se a nova versão também trouxer
 * uma anotação própria — não herda a anotação da versão anterior.
 *
 * LIMITAÇÃO CONHECIDA: quando uma lei altera um artigo inteiro em bloco
 * (caput + vários parágrafos), o leis.org às vezes anota só o ÚLTIMO
 * dispositivo do bloco (ex.: LC 412/1998 deu nova redação ao art. 8º inteiro,
 * mas a tag "(Redação dada pela Lei Complementar nº 412/1998)" aparece só
 * depois do § 3º — caput, § 1º e § 2º ficam sem anotação própria no texto).
 * Esta função não tenta propagar a anotação para os dispositivos-irmãos sem
 * tag própria — isso exigiria inferir os limites do bloco alterado, o que é
 * arriscado de acertar por heurística de texto. Fica como lacuna documentada
 * até o motor de texto vigente (peça 4) ter uma modelagem própria de "patch
 * por bloco" que resolva isso de forma estrutural, não textual.
 *
 * Útil para bootstrapping: reaproveitar compilações já existentes como
 * histórico de patches.
 */
export function parseLeiAlvoAnotacoes(raw) {
  const REANOT = /\(((?:Reda[çc][ãa]o\s+dada|Reda[çc][ãa]o\s+acrescid[oa]|Inclu[íi]d[oa]|Acrescid[oa]|Suprimid[oa]|Revogad[oa])[^()]{0,160})\)\s*\.?\s*$/i;
  const anot = {}; const acc = {};
  walkLeiAlvo(raw, (key, text, éCabecalho) => {
    if (éCabecalho) { acc[key] = text; delete anot[key]; }
    else            { acc[key] = (acc[key] ? acc[key]+" " : "")+text; }
    const m = acc[key].match(REANOT);
    if (m) anot[key] = m[1].trim();
  });
  return anot;
}

/**
 * extrairCitacoesExternas(texto) → [{ raw, chave }]
 *
 * Extrai citações a dispositivos dentro de texto corrido e normaliza para a
 * chave canônica usada pelo índice acima.
 * Ex: "o inciso III do § 2º do art. 5º" → { raw: "…", chave: "inc. iii do § 2 do art. 5" }
 */
export function extrairCitacoesExternas(texto) {
  const out = [];
  const re = /(?:(al[íi]nea)\s+([a-z]{1,2})\)?\s+do\s+)?(?:(inciso|inc\.)\s+([IVXLCDM]{1,6})\s+do\s+)?(?:(par[áa]grafo\s+[úu]nico)\s+do\s+|(?:§|par[áa]grafo)\s+(\d+\s*[º°]?)\s+do\s+)?art(?:igo)?\.?\s*(\d+\s*(?:[º°]|o(?=\s))?(?:-[A-Z])?)/gi;
  let m;
  while ((m = re.exec(texto))) {
    // "art. 5°" (sinal de grau, comum em arquivo digitado) é o mesmo "art. 5º" —
    // caso real: LC 449/2000. A chave sai sempre com o ordinal "º".
    // Também "art. 2o" (letra "o" no lugar do ordinal — caso real: LC 525/2005).
    let chave = "art. "+m[7].trim().toLowerCase().replace(/°/g, "º").replace(/^(\d+)\s*o$/, "$1º");
    if (m[5])      chave = "parágrafo único do "+chave;
    else if (m[6]) chave = "§ "+m[6].trim().replace(/°/g, "º")+" do "+chave;
    if (m[3]&&m[4]) chave = "inc. "+m[4].toLowerCase()+" do "+chave;
    if (m[1]&&m[2]) chave = "al. "+m[2].toLowerCase()+") do "+chave;
    // Endereço PARCIALMENTE lido: logo antes do trecho reconhecido sobra um pedaço de endereço que a
    // expressão não entendeu ("inc. IV do $ 1º do art. 82", com o OCR trocando "§" por "$"). A chave
    // sairia só "art. 82" — o artigo inteiro. Marca `incompleta` (só quando for o caso) para quem
    // consome falhar alto em vez de agir sobre o endereço errado.
    const antes = texto.slice(Math.max(0, m.index - 24), m.index);
    const item = { raw:m[0], chave };
    if (/(?:[§$]\s*\d+\s*[º°o]?|\b(?:inc\.?|inciso|al[íi]nea)\s+\S+|par[áa]grafo\s+[úu]nico)\s+d[oa]s?\s+$/i.test(antes)) item.incompleta = true;
    out.push(item);
  }
  return out;
}

// ─── REVOGAÇÃO NO PLURAL: gramática dos objetos (decisões 43, 45–48) ──────────
/**
 * interpretarObjetosRevogados(frase) → { ok, chaves[], intervalos[] } | { ok:false, codigo, motivo }
 *
 * `frase` = o trecho entre o verbo ("Ficam revogados") e a primeira lei citada, SEM a lei: "os arts. 59, 60, 61 e 62",
 * "os §§ 1º e 2º do art. 165", "o § 4º do art. 45 e o art. 47", "o inc. VIII e o § 8º do art. 1º".
 * Gramática fechada, tudo ou nada: cada objeto é uma cadeia "nível [do nível]*" (alínea < inciso < § < artigo); só o nível
 * mais interno pode ser plural; "caput" só vale como passagem ("inc. IV do caput do art. 21"); objeto sem artigo herda o
 * artigo do objeto seguinte. Qualquer sobra (item, Capítulo, Anexo, Tabela, "com seus", "todos"…) → falha com motivo, e o
 * extrator emite `indeterminado`: o motor nunca chuta o dispositivo revogado. Intervalo ("arts. 43 a 61") devolve em
 * `intervalos` ({ nivel, de, ate, pai }) para quem tiver a lei-alvo expandir; sem ela, é motivo de falha do chamador.
 * As chaves saem no formato do motor ("art. 59", "§ 1º do art. 165", "inc. viii do art. 1º", "al. i) do inc. v do art. 13").
 */
export function interpretarObjetosRevogados(frase) {
  const falha = (codigo, motivo) => ({ ok: false, codigo, motivo });
  const f = String(frase || "").replace(/[“”"]/g, "").replace(/\s+/g, " ").trim().replace(/[,;:.]+$/, "").replace(/\s+d[oa]s?$/i, "").replace(/,?\s*todos?$|,?\s*todas?$/i, "").trim();
  if (!f) return falha("revogacao_lista_nao_interpretada", "não há objeto de revogação reconhecível na frase");
  if (/\b(?:anexos?|tabelas?|quadros?|planilhas?|mapas?)\b/i.test(f)) return falha("revogacao_de_anexo_ou_tabela", "revogação de anexo, tabela ou quadro: o motor não interpreta");
  if (/\bdecretos?\b/i.test(f)) return falha("revogacao_de_ato_fora_do_acervo", "revogação de decreto ou outro ato fora do acervo de leis");
  if (/\b(?:cap[íi]tulos?|se[çc][ãa]o|se[çc][õo]es|subse[çc][ãa]o|t[íi]tulos?|todos|todas|inteiro\s+teor|na\s+parte|naquilo|e\s+seguintes|com\s+seus|com\s+suas|e\s+seus|e\s+suas)\b/i.test(f))
    return falha("revogacao_caput_ou_agrupador", "revogação de caput isolado, capítulo, seção, título ou \"com seus…\": decisão humana");
  const partes = f.split(/\s*(?:,|\se)\s+(?=(?:o|a|os|as)\s+(?:arts?\b|artigos?\b|§|incs?\b|incisos?\b|als?\b|al[íi]neas?\b|par[áa]grafos?\b|caput\b|itens?\b|item\b))/i);
  const objetos = [];
  const lab = {
    art: /^\d+\s*[º°o]?(?:\s*-\s*[A-Za-z])?$/, par: /^\d+\s*[º°o]?(?:\s*-\s*[A-Za-z])?$/,
    inc: /^[IVXLCDM]{1,7}(?:\s*-\s*[A-Za-z])?$/i, al: /^[a-z]{1,2}\)?$/i
  };
  const norma = (k, s) => { let x = s.trim().replace(/\s+/g, "").replace(/°/g, "º").toLowerCase(); if (k === "art" || k === "par") x = x.replace(/^(\d+)o$/, "$1º"); if (k === "al" && !x.endsWith(")")) x += ")"; return x; };
  for (const parte of partes) {
    const segs = parte.replace(/^(?:o|a|os|as)\s+/i, "").split(/\s+d[oa]s?\s+/i);
    const cadeia = [];
    for (let k = 0; k < segs.length; k++) {
      const m = /^(artigos?|arts?|§§|§|incisos?|incs?|al[íi]neas?|als?|par[áa]grafos?\s+[úu]nico|par[áa]grafos?|caput|itens?)\.?\s*(.*)$/i.exec(segs[k].trim());
      if (!m) return falha("revogacao_lista_nao_interpretada", `trecho de endereço não reconhecido: "${segs[k].trim().slice(0, 60)}"`);
      const w = m[1].toLowerCase().replace(/\s+/g, " ");
      let nivel = /^art/.test(w) ? "art" : /^(§|par)/.test(w) ? (/único|unico/.test(w) ? "parunico" : "par") : /^inc/.test(w) ? "inc" : /^al/.test(w) ? "al" : w === "caput" ? "caput" : "item";
      const plural = /^(arts|artigos|§§|incs|incisos|als|al[íi]neas|par[áa]grafos)$/.test(w.replace(/\s.*/, ""));
      if (nivel === "item") return falha("revogacao_lista_nao_interpretada", "revogação de item: o motor não interpreta");
      if (nivel === "caput" || nivel === "parunico") {
        if (m[2].trim()) return falha("revogacao_lista_nao_interpretada", `sobra após "${w}": "${m[2].trim().slice(0, 40)}"`);
        cadeia.push({ nivel, rotulos: [] }); continue;
      }
      const L = m[2].trim();
      if (!L) return falha("revogacao_lista_nao_interpretada", `"${w}" sem rótulo`);
      const mr = /^(.+?)\s+(?:a|ao|at[ée])\s+(?:o\s+)?(.+)$/i.exec(L);
      if (mr && !/[,]/.test(L) && !/\se\s/i.test(L)) {
        if (!plural || k > 0) return falha("revogacao_lista_nao_interpretada", "intervalo fora do nível mais interno");
        if (!lab[nivel].test(mr[1].trim()) || !lab[nivel].test(mr[2].trim())) return falha("revogacao_lista_nao_interpretada", `intervalo ilegível: "${L}"`);
        cadeia.push({ nivel, intervalo: [norma(nivel, mr[1]), norma(nivel, mr[2])] }); continue;
      }
      const rot = L.split(/\s*,\s*e\s+|\s*,\s*|\s+e\s+/i).filter(Boolean);
      if (!rot.length || rot.some((r) => !lab[nivel].test(r.trim()))) return falha("revogacao_lista_nao_interpretada", `rótulo ilegível em "${segs[k].trim().slice(0, 60)}"`);
      if (rot.length > 1 && (!plural || k > 0)) return falha("revogacao_lista_nao_interpretada", "lista de rótulos fora do nível mais interno");
      cadeia.push({ nivel, rotulos: rot.map((r) => norma(nivel, r)) });
    }
    if (cadeia[0].nivel === "caput") return falha("revogacao_caput_ou_agrupador", "revogação de caput isolado: decisão humana");
    const RANK = { al: 1, inc: 2, par: 3, parunico: 3, art: 4 };
    const util = [];
    for (let k = 0; k < cadeia.length; k++) {
      if (cadeia[k].nivel === "caput") { if (!(k > 0 && ["inc", "al"].includes(cadeia[k - 1].nivel))) return falha("revogacao_caput_ou_agrupador", "\"caput\" fora de lugar"); continue; }
      util.push(cadeia[k]);
    }
    for (let k = 1; k < util.length; k++) if (RANK[util[k].nivel] <= RANK[util[k - 1].nivel]) return falha("revogacao_lista_nao_interpretada", "ordem de níveis do endereço inesperada");
    objetos.push(util);
  }
  // âncora herdada: objeto sem artigo usa o artigo do objeto seguinte ("o inc. VIII e o § 8º do art. 1º")
  for (let i = objetos.length - 1; i >= 0; i--) {
    const o = objetos[i];
    if (o[o.length - 1].nivel === "art") continue;
    const prox = objetos[i + 1];
    const art = prox && prox[prox.length - 1].nivel === "art" ? prox[prox.length - 1] : null;
    if (!art || art.rotulos.length !== 1) return falha("revogacao_lista_nao_interpretada", "objeto sem artigo e sem artigo do objeto seguinte para herdar");
    o.push(art);
  }
  const chaves = [], intervalos = [];
  for (const o of objetos) {
    for (let k = 0; k < o.length; k++) {
      const seg = o[k], seguinte = o[k + 1];
      if (seg.nivel === "al" && !(seguinte && seguinte.nivel === "inc")) return falha("revogacao_lista_nao_interpretada", "alínea sem o inciso a que pertence");
      if (seg.nivel === "inc" && !(seguinte && ["par", "parunico", "art"].includes(seguinte.nivel))) return falha("revogacao_lista_nao_interpretada", "inciso sem o artigo ou parágrafo a que pertence");
      if (k > 0 && (seg.rotulos || []).length > 1) return falha("revogacao_lista_nao_interpretada", "lista de rótulos fora do nível mais interno");
    }
    const txt = (s, r) => ({ art: `art. ${r}`, par: `§ ${r}`, parunico: "parágrafo único", inc: `inc. ${r}`, al: `al. ${r}` })[s.nivel];
    const pai = o.slice(1).map((s) => txt(s, (s.rotulos || [])[0])).join(" do ");
    const ini = o[0];
    if (ini.intervalo) { intervalos.push({ nivel: ini.nivel, de: ini.intervalo[0], ate: ini.intervalo[1], pai }); continue; }
    const rots = ini.nivel === "parunico" ? [null] : ini.rotulos;
    for (const r of rots) chaves.push([txt(ini, r), pai].filter(Boolean).join(" do "));
  }
  // um ancestral basta: o filho dele daria "já revogado"
  const unicas = [...new Set(chaves)].filter((k) => !chaves.some((a) => a !== k && k.endsWith(" do " + a)));
  return { ok: true, chaves: unicas, intervalos };
}

/**
 * expandirIntervaloNaBase(intervalo, leiBaseIndex) → chaves[] | null   (decisão 47)
 * `intervalo` = { nivel, de, ate, pai } (saída de interpretarObjetosRevogados). Devolve as chaves da lei-base, na ordem do texto,
 * do mesmo nível e do mesmo pai, entre os dois extremos (inclusive; inclui "-A"). Extremo que não existe na base → null
 * (o chamador emite `indeterminado`): o motor nunca inventa o intervalo.
 */
export function expandirIntervaloNaBase(intervalo, leiBaseIndex) {
  const nl = (k) => String(k).toLowerCase().replace(/[º°]/g, "").replace(/\s+/g, " ").trim();
  const pref = { art: "art. ", par: "§ ", inc: "inc. ", al: "al. " }[intervalo.nivel];
  if (!pref || !leiBaseIndex) return null;
  const pai = nl(intervalo.pai || "");
  const cand = [];
  for (const k of Object.keys(leiBaseIndex)) {
    const n = nl(k);
    if (!n.startsWith(pref)) continue;
    let rot;
    if (pai) { if (!n.endsWith(" do " + pai)) continue; rot = n.slice(pref.length, n.length - (" do " + pai).length); }
    else { if (n.includes(" do ")) continue; rot = n.slice(pref.length); }
    if (!rot || rot.includes(" do ")) continue;
    cand.push({ k, rot: rot.replace(/\)$/, "") });
  }
  const norm = (r) => nl(r).replace(/\)$/, "");
  const i = cand.findIndex((x) => x.rot === norm(intervalo.de)), j = cand.findIndex((x) => x.rot === norm(intervalo.ate));
  if (i < 0 || j < 0 || j < i) return null;
  return cand.slice(i, j + 1).map((x) => x.k);
}

// ─── PEÇA 2: RESOLVEDOR DE REFERÊNCIA INTERLEGISLATIVA ────────────────────────
/**
 * chaveLei(tipoAto, numero, ano) → "lc 320/1994"
 *
 * Chave canônica pra indexar uma coleção de leis em memória. Mesma família de
 * normalização das chaves de dispositivo (minúsculas, espaço único) — sempre
 * comparar chaves entre si, nunca string bruta do cabeçalho.
 */
// "os" pra Ordem de Serviço é convenção interna (chave de citação), não do LexML —
// ele não tem tipoDocumento oficial pra esse ato (ver urnLei() abaixo).
const SIGLA_TIPO_ATO = { "LEI COMPLEMENTAR": "lc", "LEI": "l", "RESOLUÇÃO": "r", "ORDEM DE SERVIÇO": "os", "LEI ORGÂNICA": "lo" };

export function chaveLei(tipoAto, numero, ano) {
  const sigla = SIGLA_TIPO_ATO[(tipoAto || "").toUpperCase()] || (tipoAto || "").toLowerCase();
  const num = String(numero).replace(/\./g, "").replace(/^0+(?=\d)/, "");
  return `${sigla} ${num}/${ano}`;
}

/**
 * urnLei(tipoAto, numero, dataPublicacao) → "urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:1994-05-02;320"
 *
 * URN Canônica no padrão LexML Brasil (Parte 2 — LexML URN, gramática oficial:
 * projeto.lexml.gov.br/documentacao/Parte-2-LexML-URN.pdf), construída a
 * partir da especificação lida integralmente, não aproximada:
 *
 *   - <local>: "br;<estado por extenso>;<município por extenso>" — exemplo
 *     confirmado na própria especificação: "São Paulo-SP → br;sao.paulo;sao.paulo".
 *     "rio.grande.sul" aplica a regra 4.3.3 da mesma especificação (eliminar
 *     conectivos linguísticos — artigos, preposições simples e com artigo —
 *     na formação do nome-específico): "Rio Grande DO Sul" perde o "do".
 *     NÃO há, na especificação, um exemplo literal pra este estado
 *     especificamente — é aplicação da regra geral, não uma forma
 *     confirmada por exemplo direto. Vale checar se aparecer uma URN oficial
 *     de outra norma gaúcha pra confirmar.
 *   - <autoridade>: para lei/lei complementar/resolução, a convenção (seção
 *     8.3.3 da especificação) é usar só "municipal" — nunca "camara.municipal"
 *     ou "prefeitura". Exemplo literal da própria especificação:
 *     "urn:lex:br;sao.paulo;campinas:municipal:lei" (não "...:prefeitura:lei").
 *   - <tipo-documento>: "lei.complementar" | "lei" | "resolucao".
 *   - <descritor>: "<data ISO>;<número>", SEM o ano repetido no número
 *     (regra 10.2.3: quando a autoridade já usa a convenção
 *     federal/estadual/municipal, o ano da norma NÃO é codificado no
 *     elemento de número, porque já está na data).
 *
 * Devolvida como URN CANÔNICA (documento individual, sem elemento <versao>
 * nem <fragmento>) — identifica a NORMA, não uma versão nem um dispositivo
 * específico dela. Fragmentos de dispositivo (ex. "art12-2_inc3" pra
 * "inciso III do art. 12-B") usam uma sintaxe própria, com conversão de
 * letra pra número ordinal e romano pra arábico — diferente do formato de
 * chave usado internamente por este módulo (chaveLei, extrairCitacoesExternas
 * etc.) — não implementada aqui; seria um esforço à parte se algum dia
 * fizer sentido gerar fragmentos LexML-compatíveis.
 *
 * Uso pretendido: identidade alternativa/complementar a chaveLei() — mais
 * verbosa, mas alinhada ao padrão nacional. Não substitui chaveLei() como
 * chave de indexação interna (que continua mais simples e suficiente pro
 * uso atual); serve para eventual interoperabilidade futura com outros
 * publicadores LexML ou com o resolvedor oficial (lexml.gov.br/urn).
 *
 * ORDEM DE SERVIÇO: conferido o vocabulário controlado "tipoDocumento" do
 * LexML (lexml/lexml-vocabulary, Parte 6) — "resolucao" existe como termo
 * oficial (por isso "RESOLUÇÃO" já mapeia acima), mas **não há termo
 * nenhum pra "ordem de serviço"** nesse vocabulário. Não inventa slug:
 * devolve `null` pra esse tipo (e pra qualquer tipo não mapeado), em vez do
 * fallback antigo de tratar todo tipo desconhecido como "lei" (que
 * produziria uma URN LexML falsa em silêncio).
 */
export function urnLei(tipoAto, numero, dataPublicacao) {
  const tipoDoc = { "LEI COMPLEMENTAR": "lei.complementar", "LEI": "lei", "RESOLUÇÃO": "resolucao" }[(tipoAto || "").toUpperCase()];
  if (!tipoDoc) return null; // tipo sem termo confirmado no vocabulário LexML — ex.: Ordem de Serviço
  // NÃO remove zero à esquerda: regra 10.2.2 da especificação — "o número de
  // identificação do ato é representado exatamente na forma que foi atribuída
  // pela autoridade emitente". Diferente de chaveLei(), que normaliza pra
  // facilitar casamento de citação — urnLei() é identidade canônica, preserva
  // a forma exata.
  const num = String(numero).replace(/\./g, "");
  return `urn:lex:br;rio.grande.sul;porto.alegre:municipal:${tipoDoc}:${dataPublicacao};${num}`;
}

/**
 * extrairReferenciasLei(texto) → [{ raw, tipoAto, numero, ano?, anosCandidatos?, chave? }]
 *
 * Extrai referências a OUTRAS leis dentro de texto corrido — não a
 * dispositivos (isso é extrairCitacoesExternas), a leis inteiras: "Lei
 * Complementar nº 320, de 2 de maio de 1994" ou a forma abreviada
 * "Lei Complementar nº 320/94". Rode limparMarkdownLinks() antes, se o texto
 * vier de cópia web — "nº[320](url)" não casa com nenhum dos dois regexes.
 *
 * Ano de 2 dígitos (forma abreviada "/94") é ambíguo — devolve
 * `anosCandidatos: [1994, 2094]`-style (século 19XX e 20XX) em vez de
 * adivinhar; resolverReferenciaLei() tenta os dois contra a coleção.
 * "Lei Orgânica do Município" e citações semelhantes sem "Nº" não casam —
 * o regex exige "Lei (Complementar)? Nº" imediatamente seguido de número.
 */
export function extrairReferenciasLei(texto) {
  const achados = []; const faixas = []; // achados: [posição no texto, referência]
  const reExtensa = /\b(Lei\s+Complementar|Lei)\s+N[º°oO]\.?\s*([\d.]+)\s*,?\s*de\s+(\d{1,2})\s*[º°]?\s*de\s+([A-Za-zÀ-ÿç]+)\s+de\s+(\d{4})/gi;
  let m;
  while ((m = reExtensa.exec(texto))) {
    const mesNum = MESES_PT[semAcento(m[4].toLowerCase())];
    if (!mesNum) continue; // mês não reconhecido — não arrisca
    faixas.push([m.index, m.index + m[0].length]);
    achados.push([m.index, {
      raw: m[0],
      tipoAto: /complementar/i.test(m[1]) ? "LEI COMPLEMENTAR" : "LEI",
      numero: m[2].replace(/\./g, ""),
      ano: m[5],
      chave: chaveLei(/complementar/i.test(m[1]) ? "LEI COMPLEMENTAR" : "LEI", m[2].replace(/\./g,""), m[5])
    }]);
  }
  const reAbrev = /\b(Lei\s+Complementar|Lei)\s+N[º°oO]\.?\s*([\d.]+)\s*\/\s*(\d{2,4})\b/gi;
  while ((m = reAbrev.exec(texto))) {
    if (faixas.some(([ini, fim]) => m.index >= ini && m.index < fim)) continue; // já capturado pela forma extensa
    const tipoAto = /complementar/i.test(m[1]) ? "LEI COMPLEMENTAR" : "LEI";
    const numero = m[2].replace(/\./g, "");
    if (m[3].length === 4) {
      achados.push([m.index, { raw: m[0], tipoAto, numero, ano: m[3], chave: chaveLei(tipoAto, numero, m[3]) }]);
    } else {
      const n = parseInt(m[3], 10);
      achados.push([m.index, { raw: m[0], tipoAto, numero, anosCandidatos: [1900 + n, 2000 + n] }]);
    }
  }
  // Forma só com o ANO, sem dia e mês — "Lei Complementar nº 12, de 1975" (rodada 30; ~1.100 ocorrências
  // no acervo, a forma mais comum nas leis recentes). No município, o número de cada tipo de ato é
  // único por ano (decisão do mantenedor, 20/11/2026): tipo + número + ano identifica a lei.
  const reAno = /\b(Lei\s+Complementar|Lei)\s+N[º°oO]\.?\s*([\d.]+)\s*,?\s*de\s*(\d{4})\b/gi;
  while ((m = reAno.exec(texto))) {
    if (faixas.some(([ini, fim]) => m.index >= ini && m.index < fim)) continue;
    const tipoAto = /complementar/i.test(m[1]) ? "LEI COMPLEMENTAR" : "LEI";
    const numero = m[2].replace(/\./g, "");
    achados.push([m.index, { raw: m[0], tipoAto, numero, ano: m[3], chave: chaveLei(tipoAto, numero, m[3]) }]);
  }
  // A 1ª lei citada é a lei-alvo (convenção de extrairComandosLei): a ordem é a do TEXTO, não a da forma.
  achados.sort((a, b) => a[0] - b[0]);
  const out = achados.map(a => a[1]);
  return out;
}

/**
 * extrairReferenciaLeiOrganica(texto) → { raw, tipoAto, numero, ano, chave, presumida: true } | null
 *
 * "Lei Orgânica do Município (de Porto Alegre)" — sem número na frase — é resolvida PRESUMIDAMENTE
 * para a Lei Orgânica nº 1, de 03/04/1990, a única vigente (decisão do mantenedor, 20/11/2026).
 * Função À PARTE de extrairReferenciasLei de propósito: citar a Lei Orgânica de passagem não é
 * referência a outra lei (preâmbulos citam o art. 94 etc.). Só extrairComandosLei a usa, como
 * último recurso para o alvo de um comando, quando o artigo não cita nenhuma lei numerada.
 * `presumida: true` avisa quem consome: nunca serve para recusar comando (leiAlvoBateComVersao) e
 * não vale para ato anterior a 1990 (quem conhece a data da alteradora é que confere).
 */
export function extrairReferenciaLeiOrganica(texto) {
  const m = /\bLei\s+Org[âa]nica\s+do\s+Munic[íi]pio(?:\s+de\s+Porto\s+Alegre)?/i.exec(String(texto || ""));
  return m ? { raw: m[0], tipoAto: "LEI ORGÂNICA", numero: "1", ano: "1990", chave: chaveLei("LEI ORGÂNICA", "1", "1990"), presumida: true } : null;
}

/**
 * construirIndiceColecao(colecao) → { "lc 320/1994": item, … }
 *
 * `colecao` é um array de objetos com pelo menos {tipoAto, numero, ano} — o
 * formato que extrairCabecalhoLeiPublicada() devolve, então tipicamente:
 * `colecao.map(raw => ({ ...extrairCabecalhoLeiPublicada(raw), raw }))`.
 */
export function construirIndiceColecao(colecao) {
  const idx = {};
  (colecao || []).forEach(item => {
    if (!item || !item.tipoAto || !item.numero || !item.ano) return;
    idx[chaveLei(item.tipoAto, item.numero, item.ano)] = item;
  });
  return idx;
}

/**
 * resolverReferenciaLei(ref, indiceColecao) → item da coleção | null
 *
 * `ref` é um item devolvido por extrairReferenciasLei(). Se `ref.ano` for
 * conhecido, resolve direto; se só houver `anosCandidatos` (ano de 2
 * dígitos), tenta cada candidato contra a coleção.
 */
export function resolverReferenciaLei(ref, indiceColecao) {
  if (!ref || !indiceColecao) return null;
  if (ref.chave && indiceColecao[ref.chave]) return indiceColecao[ref.chave];
  if (ref.ano) {
    const direto = indiceColecao[chaveLei(ref.tipoAto, ref.numero, ref.ano)];
    if (direto) return direto;
  }
  if (ref.anosCandidatos) {
    for (const ano of ref.anosCandidatos) {
      const achado = indiceColecao[chaveLei(ref.tipoAto, ref.numero, ano)];
      if (achado) return achado;
    }
  }
  return null;
}

// ─── PEÇA 3: EXTRATOR DE COMANDO ──────────────────────────────────────────────
/**
 * Converte um desFixo de nrBloco ("§ 1º", "Parágrafo Único.", "I –", "a)",
 * "1.") no segmento de chave equivalente ao formato de parseLeiAlvoIndex —
 * sem o "do <pai>", que é acrescentado por enderecarNrBloco().
 */
function desFixoParaSegmento(desFixo) {
  const d = (desFixo || "").trim();
  if (/^Art(?:igo)?\.?/i.test(d)) return null; // o nó-raiz do bloco é o próprio endereço-base, não um segmento
  let m;
  if (/^Par[áa]grafo\s+[úu]nico/i.test(d)) return "parágrafo único";
  if (m = d.match(/^§\s*(.+)$/)) return "§ " + m[1].replace(/[.:]+$/, "").trim();
  if (m = d.match(/^([IVXLCDM]+(?:-[A-Z])?)\s*[–-]?$/i)) return "inc. " + m[1].toLowerCase();
  if (m = d.match(/^([a-z]{1,2}(?:-[a-z]{1,2})?)\)$/i)) return "al. " + m[1].toLowerCase() + ")";
  if (m = d.match(/^(\d+(?:-[A-Z])?)\.$/)) return m[1];
  return null;
}

/**
 * enderecarNrBloco(nrBloco, enderecoBase) → [{ chave, node }]
 *
 * Percorre a subárvore de um bloco de redação alterada (saída de
 * extrairRedacaoAlterada) e devolve o endereço completo de cada nó, no
 * mesmo formato de chave usado por parseLeiAlvoIndex/extrairCitacoesExternas
 * — combinando o desFixo (fixo, nunca recalculado) de cada nó com
 * `enderecoBase`, que é o endereço do nó-raiz do bloco, tipicamente extraído
 * por citação do texto de introdução do artigo alterador (ver
 * extrairComandosLei).
 */
export function enderecarNrBloco(nrBloco, enderecoBase) {
  const out = [];
  const walk = (nodes, enderecoPai) => {
    (nodes || []).forEach(n => {
      const endereco = /^Art(?:igo)?\.?/i.test(n.desFixo || "")
        ? enderecoBase
        : (() => {
            const seg = desFixoParaSegmento(n.desFixo);
            if (!seg) return enderecoPai;
            // Bloco que começa direto no dispositivo citado na introdução, sem repetir
            // o "Art. N" (casos reais: LC 474/2002 — "Dá nova redação ao parágrafo único
            // do art. 10 … 'Parágrafo único. …'"; LC 525/2005 — "§ 3º do art. 2º"). O
            // endereço-base JÁ é esse dispositivo: não aninhar ("parágrafo único do
            // parágrafo único do art. 10"). Se for um irmão do citado (mesmo tipo,
            // outro número), troca só o 1º segmento.
            if (enderecoPai === enderecoBase && / do /.test(enderecoBase)) {
              const [primeiro, ...resto] = enderecoBase.split(" do ");
              if (primeiro === seg) return enderecoBase;
              const tipoSeg = s => /^parágrafo único$|^§ /.test(s) ? "par" : /^inc\. /.test(s) ? "inc" : /^al\. /.test(s) ? "al" : "item";
              if (tipoSeg(primeiro) === tipoSeg(seg)) return `${seg} do ${resto.join(" do ")}`;
            }
            return `${seg} do ${enderecoPai}`;
          })();
      out.push({ chave: endereco, node: n });
      if (n.children && n.children.length) walk(n.children, endereco);
    });
  };
  walk(nrBloco.artigos, enderecoBase);
  return out;
}

// Só o VERBO: em JS o "ç" não é caractere de palavra, então `\b` depois de "revoga" casava o substantivo
// "revogação" ("Ocorrendo a revogação do parcelamento…") e emitia revoke_node falso (rodada 30).
const RE_GATILHO_REVOGACAO   = /\brevoga(m|da|do|-se)?(?![A-Za-zÀ-ÿ])/i;
// Verbo NO INÍCIO do artigo (plural "revogados/revogadas" incluído): só estas formas entram na gramática de revogação plural.
const RE_REVOGACAO_ANCORADA = /^\s*(?:Ficam?\s+(?:ainda\s+|expressamente\s+)?revogad(?:os|as|o|a)|Revogam?[\s\-–—]*se)(?![A-Za-zÀ-ÿ])/i;
const RE_GATILHO_INSERCAO    = /\bacrescent\w*|\bfica(m)?\s+acrescid\w*|\binclu(i|em|ído|ída)\w*/i;
const RE_GATILHO_SUBSTITUICAO = /passa\s+a\s+(ter\s+a\s+seguinte\s+reda[çc][ãa]o|vigorar)|d[áa]\s+nova\s+reda[çc][ãa]o|nova\s+reda[çc][ãa]o/i;

/**
 * extrairComandosLei(docAlteradora, opts?) → [{ artigoOrigem, operacao, … }]
 *
 * Peça 3: dado o `doc` de uma lei alteradora (saída de parseMinuta com
 * detectNRCandidates já aplicado), classifica cada artigo em um ou mais
 * comandos. Operações possíveis:
 *
 *   - "replace_text"   — bloco NR substitui texto de um dispositivo existente
 *   - "insert_node"    — bloco NR insere dispositivo novo
 *   - "revoke_node"    — revogação de dispositivo específico ("fica revogado
 *                         o § 3º do art. 5º da Lei X")
 *   - "revoke_lei"     — revogação de lei inteira, citada por número
 *                         (ex.: "revogam-se… especialmente a Lei nº 172/1948")
 *   - "clausula_generica_sem_efeito" — gatilho de revogação presente mas SEM
 *                         nenhuma citação específica de dispositivo ou lei —
 *                         o clássico "revogam-se as disposições em
 *                         contrário" de leis antigas. Não é um comando
 *                         executável: não há nada no texto que permita
 *                         determinar computacionalmente o que está "em
 *                         contrário". Fica registrado como não-acionável em
 *                         vez de descartado silenciosamente, para que o
 *                         motor de texto vigente não tente aplicá-lo nem
 *                         precise adivinhar um alvo.
 *   - "indeterminado"  — bloco NR presente mas sem citação de dispositivo-
 *                         alvo reconhecível no texto de introdução
 *   - "nao_classificado" — artigo de vigência, cláusula de estilo, ou outro
 *                         conteúdo que não é comando de alteração
 *
 * opts.indiceColecao — saída de construirIndiceColecao(), pra resolver a
 *   lei-alvo de cada comando (opcional; sem isso, `leiAlvoResolvida` fica null).
 * opts.leiBaseIndex  — saída de parseLeiAlvoIndex() sobre o texto vigente da
 *   lei-alvo, pra decidir replace_text vs. insert_node por EXISTÊNCIA do
 *   endereço em vez de adivinhar pelo verbo da frase de introdução. Muito
 *   mais confiável que a heurística textual — recomendado sempre que a
 *   lei-base estiver disponível. Sem isso, cai no fallback por palavra-gatilho
 *   (RE_GATILHO_INSERCAO / RE_GATILHO_SUBSTITUICAO), que erra em blocos
 *   mistos (um artigo que dá nova redação ao caput E inclui parágrafos novos
 *   no mesmo comando — caso real: LC 412/1998, art. 1º).
 */
export function extrairComandosLei(docAlteradora, opts) {
  opts = opts || {};
  const indiceColecao = opts.indiceColecao || null;
  const leiBaseIndex = opts.leiBaseIndex || null;
  const comandos = [];

  docAlteradora.artigos.forEach((art, i) => {
    const textoIntro = visText(art);
    const refsLei = extrairReferenciasLei(textoIntro);
    const leiAlvoRef = refsLei[0] || extrairReferenciaLeiOrganica(textoIntro); // convenção: a 1ª lei citada no artigo é a lei-alvo do comando; sem nenhuma numerada, a Lei Orgânica presumida
    const leiAlvoResolvida = leiAlvoRef ? resolverReferenciaLei(leiAlvoRef, indiceColecao) : null;

    if (art.nrBloco) {
      const citsIntro = extrairCitacoesExternas(textoIntro);
      const enderecoBase = citsIntro[0] ? citsIntro[0].chave : null;
      if (!enderecoBase) {
        comandos.push({ artigoOrigem: i+1, operacao: "indeterminado",
          motivo: "bloco de redação alterada sem citação de dispositivo-alvo reconhecível no texto de introdução",
          raw: textoIntro });
        return;
      }
      // Renumeração ordenada pela própria alteradora — caso real: LC 514/2004,
      // art. 1º: "…renumerando o atual parágrafo único para § 3º…". O projeto
      // não renumera por conta própria (LC 611/2009, art. 17), mas quando a LEI
      // manda, o motor segue a lei e registra (decisão do mantenedor, 17/11/2026).
      // Sai ANTES dos comandos do bloco: os dispositivos novos entram depois de
      // o antigo já ter mudado de rótulo.
      {
        const mRen = textoIntro.match(/renumerand[oa](?:-se)?\s+[oa]s?\s+(?:atua(?:l|is)\s+)?(par[áa]grafo\s+[úu]nico|§\s*\d+\s*[º°]?)\s+para\s+(?:[oa]\s+)?(§\s*\d+\s*[º°]?|par[áa]grafo\s+[úu]nico)/i);
        if (mRen) {
          const artigoBase = enderecoBase.split(" do ").pop();
          const seg = s => /único/i.test(s) ? "parágrafo único" : "§ " + s.replace(/[§\s]/g, "").replace(/°/g, "º").replace(/^(\d+)$/, "$1º");
          comandos.push({
            artigoOrigem: i+1, operacao: "renumber_node", leiAlvo: leiAlvoRef, leiAlvoResolvida,
            dispositivoAlvo: `${seg(mRen[1])} do ${artigoBase}`,
            novoRotulo: /único/i.test(mRen[2]) ? "Parágrafo único." : seg(mRen[2]),
            raw: textoIntro
          });
        }
      }
      enderecarNrBloco(art.nrBloco, enderecoBase).forEach(({ chave, node }) => {
        if (node.omitido) return; // "..." — caput/trecho inalterado, não é comando
        // Dispositivo do bloco que ficou SEM texto também é omissão: acontece quando
        // a linha de pontos é a última do bloco e as reticências saem junto com as
        // aspas de fechamento — caso real: LC 514/2004, '§ 3º ...”'. Um comando com
        // texto vazio nunca é alteração; sem esta guarda nascia um "§ 3º" vazio.
        if (!String(visText(node) || "").trim()) return;
        let operacao;
        if (leiBaseIndex) {
          operacao = leiBaseIndex[chave] !== undefined ? "replace_text" : "insert_node";
        } else if (RE_GATILHO_INSERCAO.test(textoIntro) && !RE_GATILHO_SUBSTITUICAO.test(textoIntro)) {
          operacao = "insert_node";
        } else {
          operacao = "replace_text";
        }
        comandos.push({
          artigoOrigem: i+1, operacao, leiAlvo: leiAlvoRef, leiAlvoResolvida,
          dispositivoAlvo: chave, novoTexto: visText(node), temNR: art.nrBloco.temNR, raw: textoIntro,
          _noOrigemNrBloco: node // uso interno da peça 4 (aplicarComandoLei) — desFixo/tipo/children do nó pra montar o novo nó em insert_node
        });
      });
      return;
    }


    // Revogação NO PLURAL ou em lista, com verbo no início do artigo ("Ficam revogados os arts. 59 e 60 da Lei X", "Revogam-se os §§ 1º e 2º…",
    // "Ficam revogados, na Lei X:" + incisos): gramática fechada (decisões 43 e 45–48). O gatilho antigo não é alargado; singular simples segue no ramo abaixo.
    // Lista em incisos (decisão 46): cada item é lido sozinho, com a lei do item (senão a do caput); o que não se lê vira `indeterminado` só naquele item.
    // Frase única: tudo ou nada.
    {
      const filhos = (art.children || []).filter(f => String(visText(f) || "").trim());
      const mV = RE_REVOGACAO_ANCORADA.exec(textoIntro);
      const iLei = refsLei.length ? textoIntro.indexOf(refsLei[0].raw) : textoIntro.length;
      const frase = mV && iLei > mV[0].length ? textoIntro.slice(mV[0].length, iLei) : "";
      // lista = o caput só diz ONDE ("Ficam revogados, na Lei X:" / "Ficam revogados:") e os incisos trazem os objetos. Se o caput já traz o objeto
      // ("Fica revogada a Lei X, … que:"), os incisos são condições, não objetos (caso real: id 35288, art. 15).
      const lista = filhos.length > 0 && /:\s*$/.test(textoIntro.trim()) && /^[\s,:]*(?:(?:n[ao]s?|os\s+seguintes\s+(?:dispositivos|artigos|itens|trechos)\s+d[oa]s?)\s*)?[\s,:]*$/i.test(frase);
      if (mV && !/disposi[çc][õo]es\s+em\s+contr[aá]rio/i.test(textoIntro) && (refsLei.length || lista)) {
        const plural = /^\s*Ficam\s+(?:ainda\s+|expressamente\s+)?revogad(?:os|as)(?![A-Za-zÀ-ÿ])/i.test(textoIntro)
          || /\b(?:arts|incs|als|artigos|incisos|al[íi]neas|par[áa]grafos)\b|§§|(?:,|\se)\s+(?:o|a|os|as)\s+(?:art|§|inc|al\b|par[áa]grafo)/i.test(frase);
        const RE_ENDERECO = /\b(?:arts?|artigos?|§|incs?|incisos?|als?|al[íi]neas?|caput|itens?|anexos?|tabelas?|quadros?|par[áa]grafos?)\b|§/i;
        if ((plural || lista) && iLei >= 0) {
          // lê UMA frase de revogação (caput ou item): devolve os comandos dela; `ref0` = lei do caput para itens sem lei própria
          const lerFrase = (T, ref0, itemDaLista) => {
            const out = [];
            const extra = itemDaLista ? { itemDaLista } : {};
            const refs = extrairReferenciasLei(T);
            const leiDoItem = refs[0] || ref0 || null;
            const indet = (codigo, motivo) => out.push({ artigoOrigem: i+1, operacao: "indeterminado", motivo, codigoMotivo: codigo,
              leiAlvoDaCitacao: leiDoItem, dispositivosCitados: [...new Set(extrairCitacoesExternas(T).map(c => c.chave))], raw: T, ...extra });
            const iR = refs.length ? T.indexOf(refs[0].raw) : T.length;
            let fr = (itemDaLista ? T : T.slice(mV[0].length)).slice(0, itemDaLista ? iR : Math.max(iR - mV[0].length, 0)).replace(/;\s*e\s*$/i, "");
            const resto = refs.length ? T.slice(iR + refs[0].raw.length) : "";
            const soLeis = refs.reduce((s2, r) => s2.replace(r.raw, " "), resto).replace(/[“"”][^“"”]*[“"”]/g, " ");
            // revogação parcial ou condicionada ("na parte relativa a…", "a partir de…", "exceto…", "até…"): o motor não modela eficácia parcial ou diferida
            if (/\b(?:na\s+parte|na\s+medida|naquilo|no\s+que|apenas|somente|exclusivamente|salvo|exceto|ressalvad[oa]s?|a\s+partir|permanecendo|enquanto|desde|quando|caso|at[ée]|ap[óo]s|depois)\b/i.test(soLeis) || /\b(?:na\s+parte|naquilo|exceto|salvo|ressalvad[oa]s?|a\s+partir|permanecendo)\b/i.test(fr))
              { indet("revogacao_condicionada", "revogação parcial ou condicionada (parte, prazo ou ressalva): o motor não modela"); return out; }
            if (RE_ENDERECO.test(soLeis)) { indet("revogacao_lista_nao_interpretada", "revogação em mais de uma lei, ou com texto de endereço depois da lei citada: o motor não interpreta"); return out; }
            if (!fr.replace(/\b(?:a|as|o|os)\b/gi, "").replace(/[\s,;e.]/g, "") && refs.length) {
              // só leis inteiras ("Ficam revogadas a Lei X e a Lei Y")
              if (/^[\s,;.]*(?:(?:e|a|as|o|os)\s*)*(?:e\s+altera[çc][õo]es\s+posteriores)?[\s,;.]*$/i.test(soLeis)) {
                refs.forEach(r => out.push({ artigoOrigem: i+1, operacao: "revoke_lei", leiAlvo: r, leiAlvoResolvida: resolverReferenciaLei(r, indiceColecao), raw: T, origemFormaPlural: true, ...extra }));
                return out;
              }
              indet("revogacao_lista_nao_interpretada", "revogação de leis com texto que o motor não interpreta depois da citação"); return out;
            }
            const g = interpretarObjetosRevogados(fr);
            if (!g.ok) { indet(g.codigo, g.motivo); return out; }
            if (!leiDoItem) { indet("revogacao_lista_nao_interpretada", "revogação de dispositivo sem lei-alvo numerada no caput nem no item"); return out; }
            const leiRes = resolverReferenciaLei(leiDoItem, indiceColecao);
            let chavesFinais = g.chaves;
            if (g.intervalos.length) {
              // intervalo ("arts. 43 a 61"): só se expande contra a lei-alvo, e só quando o índice entregue é DESTA lei (decisão 47)
              if (!leiBaseIndex || !opts.leiBaseConfere || !opts.leiBaseConfere(leiDoItem)) { indet("revogacao_intervalo_sem_lei_base", "intervalo de dispositivos: só se expande contra a lei-alvo, que não está disponível"); return out; }
              const extras = [];
              for (const iv of g.intervalos) {
                const ex = expandirIntervaloNaBase(iv, leiBaseIndex);
                if (!ex || !ex.length) { indet("revogacao_intervalo_sem_lei_base", `extremo do intervalo (${iv.de} a ${iv.ate}) não existe na lei-alvo`); return out; }
                extras.push(...ex);
              }
              chavesFinais = [...new Set([...g.chaves, ...extras])];
              chavesFinais = chavesFinais.filter(k => !chavesFinais.some(a => a !== k && k.endsWith(" do " + a)));
            }
            chavesFinais.forEach(chave => out.push({ artigoOrigem: i+1, operacao: "revoke_node", leiAlvo: leiDoItem, leiAlvoResolvida: leiRes, dispositivoAlvo: chave, raw: T, origemFormaPlural: true, ...extra }));
            return out;
          };
          if (lista) {
            if (RE_ENDERECO.test(frase.replace(/\bna\b/gi, ""))) {
              comandos.push({ artigoOrigem: i+1, operacao: "indeterminado", motivo: "caput com objetos de revogação e lista de itens ao mesmo tempo: o motor não interpreta", codigoMotivo: "revogacao_lista_nao_interpretada",
                leiAlvoDaCitacao: leiAlvoRef, dispositivosCitados: [...new Set(extrairCitacoesExternas(textoIntro).map(c => c.chave))], raw: textoIntro });
              return;
            }
            const ref0 = refsLei[0] || null;
            filhos.forEach((f, k) => {
              const T = String(visText(f) || "").trim().replace(/^e\s+(?=(?:o|a|os|as)\s)/i, "");
              if (/^VETADO\.?$/i.test(T)) return; // item vetado: nada a revogar (fica registrado no CHANGELOG)
              if ((f.children || []).length) {
                comandos.push({ artigoOrigem: i+1, operacao: "indeterminado", motivo: "item da lista de revogação com subitens: o motor não interpreta", codigoMotivo: "revogacao_lista_nao_interpretada",
                  leiAlvoDaCitacao: extrairReferenciasLei(T)[0] || ref0, dispositivosCitados: [...new Set(extrairCitacoesExternas(T).map(c => c.chave))], raw: T, itemDaLista: { k: k+1, n: filhos.length } });
                return;
              }
              comandos.push(...lerFrase(T, ref0, { k: k+1, n: filhos.length }));
            });
            return;
          }
          comandos.push(...lerFrase(textoIntro, null, null));
          return;
        }
      }
    }

    if (RE_GATILHO_REVOGACAO.test(textoIntro)) {
      const citsDispositivo = extrairCitacoesExternas(textoIntro);
      // Decisão 45: endereço com nível que o motor não entende ("al.", "incs.", "§§", "arts.", "caput", "item", Capítulo/Seção…)
      // nunca vira revogação do artigo/inciso inteiro. Tira do texto o que as citações reconhecidas consumiram; se do verbo até a
      // primeira lei citada sobrar palavra de endereço, a citação é incompleta. (ids 44276, 38944, 51556, 50842, 38695, 46833)
      {
        let resto = textoIntro.slice(Math.max(0, textoIntro.search(RE_GATILHO_REVOGACAO)));
        citsDispositivo.forEach(c => { resto = resto.replace(c.raw, " "); });
        const iLei = resto.search(/\b(?:Lei|Decreto|Emenda|Resolu[çc][ãa]o)\b/);
        if (iLei >= 0) resto = resto.slice(0, iLei);
        if (/(?:\b(?:arts|incs|als?|caput|itens?|cap[íi]tulos?|se[çc][ãa]o|se[çc][õo]es|subse[çc][ãa]o|t[íi]tulos?)\b|§§)/i.test(resto)) citsDispositivo.forEach(c => { c.incompleta = true; });
        if (!citsDispositivo.length && /\b(?:cap[íi]tulos?|se[çc][ãa]o|se[çc][õo]es|subse[çc][ãa]o|t[íi]tulos?)\b/i.test(resto)) citsDispositivo.push({ raw: resto.trim(), chave: "", incompleta: true });
      }
      if (citsDispositivo.some(c => c.incompleta)) {
        // não age sobre endereço parcialmente ilegível: o motor nunca chuta o dispositivo revogado
        comandos.push({ artigoOrigem: i+1, operacao: "indeterminado",
          motivo: "revogação com citação de dispositivo incompleta (parte do endereço ilegível no texto)", raw: textoIntro });
        return;
      }
      if (citsDispositivo.length && leiAlvoRef) {
        citsDispositivo.forEach(c => comandos.push({
          artigoOrigem: i+1, operacao: "revoke_node", leiAlvo: leiAlvoRef, leiAlvoResolvida,
          dispositivoAlvo: c.chave, raw: textoIntro
        }));
        return;
      }
      // "Revogam-se as disposições em contrário, mantidas as condições … na Lei nº N": a lei só aparece numa RESSALVA —
      // não é revogação dela (LC 27976, Lei 6.309/1988). Cláusula genérica, sem efeito.
      if (/^\s*Revogam[\s-–—]*se\s+as\s+disposi[çc][õo]es\s+em\s+contr[aá]rio\b[^.]*\b(?:mantid[oa]s?|ressalvad[oa]s?|exceto|salvo)\b/i.test(textoIntro)) {
        comandos.push({ artigoOrigem: i+1, operacao: "clausula_generica_sem_efeito", raw: textoIntro });
        return;
      }
      // revogação de PARTE da lei sem endereço de dispositivo ("o item 4 do Anexo I da Lei Complementar nº 942"): nunca é
      // revoke_lei (revogaria a lei inteira). Falha alto: indeterminado, para o humano (id 47547).
      if (refsLei.length && /\b(?:itens?|anexos?|tabelas?|quadros?|planilhas?|mapas?|linhas?)\b[^.;]{0,80}\b(?:da|do|das|dos)\s+(?:Lei|Decreto|Emenda|Resolu[çc][ãa]o)/i.test(textoIntro)) {
        comandos.push({ artigoOrigem: i+1, operacao: "indeterminado",
          motivo: "revogação de parte da lei (item, anexo ou tabela) sem endereço de dispositivo reconhecido: não age sobre a lei inteira", raw: textoIntro });
        return;
      }
      if (refsLei.length) {
        refsLei.forEach(r => comandos.push({
          artigoOrigem: i+1, operacao: "revoke_lei", leiAlvo: r,
          leiAlvoResolvida: resolverReferenciaLei(r, indiceColecao), raw: textoIntro
        }));
        return;
      }
      comandos.push({ artigoOrigem: i+1, operacao: "clausula_generica_sem_efeito", raw: textoIntro });
      return;
    }

    comandos.push({ artigoOrigem: i+1, operacao: "nao_classificado", raw: textoIntro });
  });

  return comandos;
}

// ─── UTILITÁRIO: serializar árvore como texto simples ─────────────────────────
/**
 * serializarArvore(doc) → string
 *
 * Produz o texto plano da lei a partir da árvore parseada.
 * Útil para inspecionar o resultado do parsing ou comparar antes/depois.
 */
export function serializarArvore(doc) {
  const lines = [];
  if (doc.epigrafe) lines.push(doc.epigrafe, "");
  if (doc.ementa) lines.push(visText(doc.ementa), "");
  doc.artigos.forEach((a, ai) => {
    const num = ai+1; const des = num<=9?`Art. ${num}º`:`Art. ${num}.`;
    lines.push(`${des} ${visText(a)}`);
    a.children.forEach((p, pi) => {
      const ps = a.children.filter(c=>c.tipo==="paragrafo");
      const pdes = p.tipo==="paragrafo"
        ? (ps.length===1?"Parágrafo único.":(ps.indexOf(p)+1<=9?`§ ${ps.indexOf(p)+1}º`:`§ ${ps.indexOf(p)+1}.`))
        : `${roman(a.children.filter(c=>c.tipo==="inciso").indexOf(p)+1)} –`;
      lines.push(`  ${pdes} ${visText(p)}`);
      (p.children||[]).forEach((c, ci) => {
        const cdes = c.tipo==="inciso"
          ? `${roman((p.children||[]).filter(x=>x.tipo==="inciso").indexOf(c)+1)} –`
          : `${alphaLabel((p.children||[]).filter(x=>x.tipo==="alinea").indexOf(c))})`;
        lines.push(`    ${cdes} ${visText(c)}`);
      });
    });
  });
  return lines.join("\n");
}
