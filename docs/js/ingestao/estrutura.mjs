// ingestao/estrutura.mjs
//
// Do texto extraído de uma norma para dados estruturados, com VERIFICAÇÃO.
// Funções puras (sem rede, sem disco). Usa o norma-core.js como leitor e não
// altera nada nele.
//
// Saída de estruturarNorma():
//   { versaoEstruturador, cabecalho, ementa, preambulo, fecho,
//     dispositivos: [{ id, pai, tipo, rotulo, texto, agrupadores?, vetado?, revogado? }],
//     verificacao: { situacao: 'aceita' | 'revisar', motivos: [], avisos: [], metricas: {} } }
//
// `id` de dispositivo = caminho estável feito dos rótulos (desFixo), nunca da
// posição: "art-5", "art-5-A/par-2", "art-13/inc-XXIV/ali-b". É o endereço que
// a busca e a redação de alteradoras vão usar.
//
// Uma norma só é 'aceita' quando passa em TODAS as conferências. O resto vai
// para 'revisar' com o motivo — nada é aceito em silêncio.

import { parseLeiPublicada, atribuirDesFixoOriginal, detectNRCandidates, extrairReferenciasLei, extrairReferenciaLeiOrganica } from '../norma-core.js';

/**
 * Corte de época (orientação do mantenedor, 20/11/2026): a LC 611/2009, sancionada
 * em 03/02/2009, fixa a técnica legislativa de hoje. Antes dela a redação era
 * diferente e falhas de compilação são esperadas (não são, por si, defeito do motor).
 */
export const DATA_CORTE_EPOCA = '2009-02-03';

/** 'antiga' (antes da sanção da LC 611) | 'recente' | 'indefinida' (sem data nem ano que decida). */
export function epocaDaNorma(registro) {
  const data = String(registro?.data ?? '');
  if (/^\d{4}-\d{2}-\d{2}/.test(data)) return data.slice(0, 10) < DATA_CORTE_EPOCA ? 'antiga' : 'recente';
  const ano = Number(registro?.ano);
  if (!Number.isInteger(ano) || ano < 1000) return 'indefinida';
  return ano < 2009 ? 'antiga' : ano > 2009 ? 'recente' : 'indefinida'; // só o ano 2009 não decide
}

// Introdução FORTE de alteração: verbo de alteração + lei citada + fecha com "conforme segue:" e afins.
const RE_INTRO_VERBO = /\b(?:fic(?:a|am)\s+(?:alterad|acrescid|inclu[ií]d|criad|modificad)\w*|altera-se|(?:passa|passam)\s+a\s+(?:vigorar|ter)|d[aá]-se\s+nova\s+reda[çc][ãa]o|nova\s+reda[çc][ãa]o)/i;
const RE_INTRO_CUE = /(?:conforme\s+segue|seguintes?\s+reda[çc][ãa](?:o|es|ões)|com\s+a\s+seguinte\s+reda[çc][ãa]o|seguinte\s+teor)\s*:?\s*$/i;

/**
 * Artigos da alteradora com introdução forte ("Fica alterado o art. X da Lei Y, conforme segue:") em que
 * NENHUM bloco de redação alterada foi lido (`nrBloco`). Se a norma fosse aceita assim, a lei-alvo teria sido
 * lida como dispositivo da alteradora e ninguém saberia (falso aceite silencioso). Decisão do mantenedor,
 * 20/11/2026: a norma é reprovada com o motivo `alteracao_sem_aspas_nao_delimitada`.
 */
export function introsDeAlteracaoSemBloco(artigos) {
  const achados = [];
  for (const a of artigos || []) {
    if (a.nrBloco) continue;
    const t = String(a.texto || '').replace(/\s+/g, ' ').trim();
    if (RE_INTRO_VERBO.test(t) && RE_INTRO_CUE.test(t) && (extrairReferenciasLei(t).length || extrairReferenciaLeiOrganica(t))) achados.push(t.slice(0, 160));
  }
  return achados;
}

/** Mudar este número faz o estruturar.mjs reprocessar tudo. */
export const VERSAO_ESTRUTURADOR = 19;

export const alnum = (s) => (s || '').normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');

/** Rótulo (desFixo) → pedaço de caminho. Devolve null se não reconhecer. */
export function slugDoRotulo(tipo, rotulo) {
  const r = String(rotulo || '').trim();
  let m;
  if (tipo === 'artigo' && (m = /^Art\.?\s*(\d+)\s*[º°]?(?:-([A-Za-z]))?/.exec(r))) return `art-${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`;
  if (tipo === 'paragrafo') {
    if (/^Par[áa]grafo\s+[úu]nico/i.test(r)) return 'par-unico';
    if ((m = /^§\s*(\d+)\s*[º°]?(?:-([A-Za-z]))?/.exec(r))) return `par-${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`;
  }
  if (tipo === 'inciso' && (m = /^([IVXLCDM]+)(?:-([A-Z]))?/.exec(r))) return `inc-${m[1]}${m[2] ? '-' + m[2] : ''}`;
  if (tipo === 'alinea' && (m = /^([a-z]{1,2})(?:-([a-z]{1,2}))?\)?/.exec(r))) return `ali-${m[1]}${m[2] ? '-' + m[2] : ''}`;
  if (tipo === 'item' && (m = /^(\d+)(?:-([A-Z]))?/.exec(r))) return `item-${m[1]}${m[2] ? '-' + m[2] : ''}`;
  return null;
}

/** Número do artigo a partir do rótulo: "Art. 5º-A" → { n: 5, letra: 'A' }. */
function numeroDoArtigo(rotulo) {
  const m = /(\d+)\s*[º°]?(?:-([A-Za-z]))?/.exec(String(rotulo || ''));
  return m ? { n: Number(m[1]), letra: (m[2] || '').toUpperCase() } : null;
}

const TIPO_ATO_ESPERADO = { 2: 'EMENDA À LEI ORGÂNICA', 5: 'LEI', 6: 'LEI COMPLEMENTAR' };

/**
 * Conservação do texto: cada trecho que a árvore guarda tem de aparecer no
 * texto de origem, na ordem. O que sobra entre um trecho e outro (lacuna) só
 * pode ser rótulo de dispositivo/agrupador; lacuna grande = texto que o leitor
 * deixou cair. Compara só letras e algarismos (espaço e pontuação variam com a
 * quebra de linha do arquivo).
 */
export function conferirConservacao(textoOrigem, trechos, limiteLacuna = 40) {
  const origem = alnum(textoOrigem);
  let cursor = 0;
  let coberto = 0;
  const lacunas = [];
  const naoLocalizados = [];
  const rotulosDivergentes = [];
  // Posições (aditivo, para o dashboard de revisão): em coordenadas do texto só com letras e algarismos.
  const ancoras = []; // uma por trecho, na ordem: { i, pos, len, situacao: 'ok' | 'rotulo_diverge' | 'nao_localizado' }
  const posLacunas = []; // paralela a `lacunas`: { ini, fim, noFim? }
  // Fronteira do rótulo (decisão 25, 20/11/2026): "endsWith" sozinho aceitava "I" onde está escrito "XXXI" e "5" onde
  // está "15". Depois que o sufixo confere, o caractere ANTES do rótulo, no texto original, não pode ser letra nem
  // algarismo (salvo a palavra "Art"/"Artigo"/"Parágrafo" colada ao número, comum em extração ruim). Só restringe:
  // nunca aceita o que antes recusava.
  let mapaRaw = null;
  const rawNFC = String(textoOrigem).normalize('NFC');
  const fronteiraDoRotuloNoTexto = (marca, pos) => {
    if (!mapaRaw) { mapaRaw = []; const re = /[\p{L}\p{N}]/gu; let m; while ((m = re.exec(rawNFC)) !== null) for (let k = 0; k < m[0].length; k++) mapaRaw.push(m.index + k); }
    let j = pos - 1; // fim do rótulo em `origem`
    if (j >= 0 && origem[j].toLowerCase() === 'o' && !marca.endsWith('o')) j--; // "5o" no lugar de "5º"
    while (j >= 0 && /[º°ª]/u.test(origem[j])) j--;
    let k = marca.length - 1;
    for (; k >= 0 && j >= 0; j--) { if (/[º°ª]/u.test(origem[j])) continue; if (origem[j].toLowerCase() !== marca[k]) return true; k--; }
    if (k >= 0) return true; // não deu para localizar: não restringe
    const iraw = mapaRaw[j + 1];
    if (iraw === undefined || iraw === 0) return true;
    const c = rawNFC[iraw - 1];
    if (!/[\p{L}\p{N}]/u.test(c)) return true;
    return /(?:art|artigo|par[áa]grafo)$/i.test(rawNFC.slice(Math.max(0, iraw - 10), iraw));
  };
  let indice = -1;
  for (const item of trechos) {
    indice++;
    // item: string, ou { texto, rotulo } — com `rotulo`, o que vem logo ANTES do
    // trecho na origem tem de terminar com o número/letra do rótulo. É a prova
    // de que o endereço dado ao dispositivo é o que está escrito, não o da posição.
    const t = typeof item === 'string' ? item : item.texto;
    const a = alnum(t);
    const rotulo = typeof item === 'string' ? null : item.rotulo;
    const pos = a ? origem.indexOf(a, cursor) : cursor;
    if (pos < 0) { naoLocalizados.push(String(t).slice(0, 80)); ancoras.push({ i: indice, pos: -1, len: a.length, situacao: 'nao_localizado' }); continue; }
    let situacaoDoTrecho = 'ok';
    if (rotulo) {
      const marca = fichaDoRotulo(rotulo);
      const antes = origem.slice(Math.max(cursor, pos - 30), pos).toLowerCase().replace(/[º°ª]/gu, '');
      // "Art. 5o" (letra "o" no lugar de "º") também vale
      if (marca && ((!antes.endsWith(marca) && !antes.replace(/o$/, '').endsWith(marca)) || !fronteiraDoRotuloNoTexto(marca, pos))) { rotulosDivergentes.push({ rotulo, naOrigem: origem.slice(Math.max(cursor, pos - 20), pos) }); situacaoDoTrecho = 'rotulo_diverge'; }
    }
    ancoras.push({ i: indice, pos, len: a.length, situacao: situacaoDoTrecho });
    if (!a) continue;
    if (pos - cursor > limiteLacuna) { lacunas.push({ tamanho: pos - cursor, amostra: origem.slice(cursor, cursor + 80) }); posLacunas.push({ ini: cursor, fim: pos }); }
    coberto += a.length;
    cursor = pos + a.length;
  }
  if (origem.length - cursor > limiteLacuna) { lacunas.push({ tamanho: origem.length - cursor, amostra: origem.slice(cursor, cursor + 80), noFim: true }); posLacunas.push({ ini: cursor, fim: origem.length, noFim: true }); }
  return { total: origem.length, coberto, cobertura: origem.length ? coberto / origem.length : 0, lacunas, naoLocalizados, rotulosDivergentes, ancoras, posLacunas };
}

/** "Art. 5º-A" → "5a" · "§ 2º" → "2" · "Parágrafo único." → "único" · "XXIV –" → "xxiv" · "b)" → "b". */
function fichaDoRotulo(rotulo) {
  const r = String(rotulo).trim();
  if (/^Par[áa]grafo\s+[úu]nico/i.test(r)) return 'único';
  const m = /^(?:Art\.?|§)?\s*([0-9IVXLCDMa-z]+)\s*[º°]?(?:-([A-Za-z]{1,2}))?/.exec(r);
  return m ? (m[1] + (m[2] || '')).toLowerCase() : null;
}

/**
 * texto: texto extraído da norma. registro: registro do catálogo (normalizarRegistroSapl)
 * — usado como conferência independente de número, data e tipo.
 * opcoes.ocr: o texto veio de reconhecimento óptico (vira aviso, não reprova).
 */
export function estruturarNorma(texto, registro, opcoes = {}) {
  const motivos = [];
  const avisos = [];
  const blocos = detectNRCandidates(texto);
  const linhasOrigem = texto.split(/\r?\n/).map((l) => l.trim());
  const doc = parseLeiPublicada(texto, blocos);
  atribuirDesFixoOriginal(doc);
  let proximoBloco = 0;

  // ── dispositivos, em lista plana com caminho estável ───────────────────────
  const dispositivos = [];
  const vistos = new Map();
  let semRotulo = 0;
  let numeradoSemIrmao = false; // "§ 1º" escrito sozinho na lei: o endereço segue o rótulo escrito (aviso, não reprova)
  const trechos = [doc.ementa?.texto || '', doc.preambulo || ''];
  const andar = (nos, pai) => {
    for (const n of nos || []) {
      const slug = slugDoRotulo(n.tipo, n.desFixo);
      if (!slug) semRotulo++;
      let id = (pai ? pai + '/' : '') + (slug || `${n.tipo}-sem-rotulo`);
      const vezes = (vistos.get(id) || 0) + 1;
      vistos.set(id, vezes);
      if (vezes > 1) id += `~${vezes}`; // repetido: mantém, marca e reprova abaixo
      const d = { id, pai: pai || null, tipo: n.tipo, rotulo: n.desFixo || null, texto: n.texto };
      if (n.gruposAntes && n.gruposAntes.length) d.agrupadores = n.gruposAntes.map((g) => ({ tipo: g.tipo, numero: g.numero, titulo: g.titulo }));
      if (n.vetado) d.vetado = true;
      if (n.revogado) d.revogado = true;
      if (n.omitido) d.omitido = true;
      if (n.numeradoSemIrmao) numeradoSemIrmao = true;
      dispositivos.push(d);
      for (const g of n.gruposAntes || []) trechos.push(g.titulo || '');
      trechos.push({ texto: n.texto || '', rotulo: n.desFixo });
      if (n.nrBloco) {
        // Bloco de redação alterada (lei alteradora): fica guardado como texto,
        // preso ao dispositivo que o introduz — não vira dispositivo desta lei.
        const b = blocos[proximoBloco++];
        d.blocoDeAlteracao = b ? linhasOrigem.slice(b.startIdx, b.endIdx + 1).filter(Boolean).join('\n') : null;
        trechos.push(d.blocoDeAlteracao || '');
      }
      andar(n.children, id);
    }
  };
  andar(doc.artigos, null);
  trechos.push(doc.fecho || '');

  // ── conferências ───────────────────────────────────────────────────────────
  if (doc.promulgacaoParcial?.parcial) motivos.push('promulgacao_parcial');
  // Cabeçalho que o motor não reconhece, mas que É o da norma do catálogo: a
  // identidade vem do catálogo (número, data e tipo já estão lá, vindos da fonte).
  // Casos reais: "LEI COMPLEMENTAR Nº 449" (sem data), "LEI COMPLEMENTAR 474, de
  // 21 de maio de 2002." (sem "Nº"), "LEI COMPLEMENTAR Nº 692, DE 29 DEDE 2012."
  // (arquivo com palavra faltando, depois de linhas de timbre). Só vale se, antes
  // do 1º artigo, houver uma linha que comece pelo tipo do ato e traga o número
  // do registro — senão pode ser o arquivo errado anexado à norma.
  let cabecalhoDoCatalogo = false;
  if (!doc.numero && registro && (registro.tipoSapl === 5 || registro.tipoSapl === 6)) {
    // Palavras coladas pela extração (PDFs de 2011–2014): "LEICOMPLEMENTAR Nº 719",
    // "LEI COMPLEMENTAR723", "LEI COMPLEMENTARNº 741" — o tipo é aceito sem o espaço.
    const reTipo = registro.tipoSapl === 6 ? /^LEI\s*COMPLEMENTAR(?=\s|\d|N[º°o.]|[,.:;]|$)/i : /^LEI\b(?!\s+COMPLEMENTAR)/i;
    const ate = texto.search(/^\s*Art\.\s*1\s*[º°o]?\b/m);
    const cabeca = (ate > 0 ? texto.slice(0, ate) : texto.slice(0, 3000)).split(/\r?\n/).map((l) => l.trim());
    // duas leituras do número: o 1º bloco de algarismos, ou com espaço no meio ("Nº 67 4");
    // vale se QUALQUER uma for o número do registro ("Nº: 358 072" segue lido como 358)
    const numerosDaLinha = (l) => {
      const resto = l.replace(reTipo, '');
      return [/\d[\d.]*/, /\d(?:[\d.]|\s(?=\d))*/].map((re) => soDigitos((re.exec(resto) || [''])[0]));
    };
    cabecalhoDoCatalogo = cabeca.some((l) => reTipo.test(l) && numerosDaLinha(l).includes(soDigitos(registro.numero)));
    if (cabecalhoDoCatalogo) avisos.push('cabecalho_fora_do_padrao');
  }
  if (!doc.numero && !cabecalhoDoCatalogo) motivos.push('cabecalho_nao_reconhecido');
  if (doc.tipoNaoSuportado) motivos.push('tipo_sem_suporte');
  if (registro) {
    if (doc.numero && soDigitos(doc.numero) !== soDigitos(registro.numero)) motivos.push('numero_diverge_do_catalogo');
    if (doc.dataPublicacao && registro.data && doc.dataPublicacao !== registro.data) motivos.push('data_diverge_do_catalogo');
    const esperado = TIPO_ATO_ESPERADO[registro.tipoSapl];
    if (!esperado) motivos.push('tipo_sem_suporte');
    else if (doc.tipoAto && doc.tipoAto !== esperado) motivos.push('tipo_diverge_do_catalogo');
  }
  const artigos = dispositivos.filter((d) => d.tipo === 'artigo');
  if (!artigos.length) motivos.push('sem_artigos');
  if (!doc.fecho) motivos.push('sem_fecho');
  if (semRotulo) motivos.push('dispositivo_sem_rotulo');
  if ([...vistos.values()].some((v) => v > 1)) motivos.push('endereco_repetido');

  // numeração dos artigos: começa em 1 e anda de 1 em 1 (ou repete o número com letra)
  let saltos = 0;
  let ant = null;
  for (const a of artigos) {
    const nr = numeroDoArtigo(a.rotulo);
    if (!nr) { saltos++; continue; }
    if (ant === null ? nr.n !== 1 : !(nr.n === ant.n + 1 || (nr.n === ant.n && nr.letra && nr.letra !== ant.letra))) saltos++;
    ant = nr;
  }
  if (saltos) motivos.push('numeracao_de_artigos_com_salto');

  const cons = conferirConservacao(texto.slice(Math.max(0, texto.search(/\S/))), trechos);
  // o que vem antes da ementa (brasão, epígrafe) é a 1ª lacuna e é esperado
  const lacunasReais = cons.lacunas.filter((l, i) => !(i === 0 && l.tamanho < 400 && !l.noFim));
  if (lacunasReais.length) motivos.push('texto_fora_da_arvore');
  if (cons.naoLocalizados.length) motivos.push('trecho_nao_localizado_na_origem');
  if (cons.rotulosDivergentes.length) motivos.push('rotulo_nao_confere_com_a_origem');
  if (proximoBloco !== blocos.length) motivos.push('bloco_de_alteracao_sem_dono');
  // fronteira de bloco INFERIDA (decisões 9 e 11 do mantenedor): aplicada, mas a norma nunca fica "aceita limpa"
  const fronteirasInferidas = blocos.filter((b) => b.sem_fecho || b.sem_abertura).map((b) => ({ tipo: b.sem_fecho ? 'sem_fechamento_de_aspas' : 'sem_abertura_de_aspas', linhaIni: b.startIdx + 1, linhaFim: b.endIdx + 1, confianca: b.confianca }));
  if (blocos.some((b) => b.sem_fecho)) motivos.push('bloco_sem_fechamento_de_aspas');
  if (blocos.some((b) => b.sem_abertura)) motivos.push('aspa_de_abertura_ausente');
  if (introsDeAlteracaoSemBloco(doc.artigos).length) motivos.push('alteracao_sem_aspas_nao_delimitada');

  if (numeradoSemIrmao) avisos.push('paragrafo_numerado_sem_irmao');
  if (opcoes.ocr) avisos.push('texto_de_ocr'); // lido de imagem: pode ter troca de caracteres
  if (/^\s*ANEXO\b/m.test(texto)) avisos.push('tem_anexo');
  const maior = dispositivos.reduce((m, d) => Math.max(m, (d.texto || '').length), 0);
  if (maior > 4000) avisos.push('dispositivo_muito_longo');
  if (dispositivos.some((d) => /\s(?:Art\.\s*\d+\s*[º°.]|§\s*\d+\s*[º°]|Parágrafo único\s*[.\-–])\s+[A-ZÀ-Ú]/.test(d.texto || ''))) avisos.push('possivel_dispositivo_embutido');

  return {
    versaoEstruturador: VERSAO_ESTRUTURADOR,
    cabecalho: cabecalhoDoCatalogo
      ? { tipoAto: TIPO_ATO_ESPERADO[registro.tipoSapl], numero: registro.numero, ano: String(registro.ano), data: registro.data, epigrafe: doc.epigrafe || null, proveniencia: doc.proveniencia || null, fonte: 'catalogo' }
      : { tipoAto: doc.tipoAto || null, numero: doc.numero || null, ano: doc.ano || null, data: doc.dataPublicacao || null, epigrafe: doc.epigrafe || null, proveniencia: doc.proveniencia || null },
    ementa: doc.ementa?.texto || null,
    preambulo: doc.preambulo || null,
    fecho: doc.fecho || null,
    dispositivos,
    verificacao: {
      situacao: motivos.length ? 'revisar' : 'aceita',
      motivos: [...new Set(motivos)],
      avisos,
      metricas: {
        artigos: artigos.length, dispositivos: dispositivos.length,
        cobertura: Math.round(cons.cobertura * 1000) / 1000,
        blocosDeAlteracao: blocos.length,
        lacunas: lacunasReais.slice(0, 5), naoLocalizados: cons.naoLocalizados.slice(0, 5), rotulosDivergentes: cons.rotulosDivergentes.slice(0, 5),
        ...(fronteirasInferidas.length ? { fronteirasInferidas } : {}),
      },
    },
  };
}
