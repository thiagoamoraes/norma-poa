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

import { parseLeiPublicada, atribuirDesFixoOriginal, detectNRCandidates } from '../norma-core.js';

/** Mudar este número faz o estruturar.mjs reprocessar tudo. */
export const VERSAO_ESTRUTURADOR = 5;

const alnum = (s) => (s || '').normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
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
  for (const item of trechos) {
    // item: string, ou { texto, rotulo } — com `rotulo`, o que vem logo ANTES do
    // trecho na origem tem de terminar com o número/letra do rótulo. É a prova
    // de que o endereço dado ao dispositivo é o que está escrito, não o da posição.
    const t = typeof item === 'string' ? item : item.texto;
    const a = alnum(t);
    const rotulo = typeof item === 'string' ? null : item.rotulo;
    const pos = a ? origem.indexOf(a, cursor) : cursor;
    if (pos < 0) { naoLocalizados.push(String(t).slice(0, 80)); continue; }
    if (rotulo) {
      const marca = fichaDoRotulo(rotulo);
      const antes = origem.slice(Math.max(cursor, pos - 30), pos).toLowerCase().replace(/[º°ª]/gu, '');
      // "Art. 5o" (letra "o" no lugar de "º") também vale
      if (marca && !antes.endsWith(marca) && !antes.replace(/o$/, '').endsWith(marca)) rotulosDivergentes.push({ rotulo, naOrigem: origem.slice(Math.max(cursor, pos - 20), pos) });
    }
    if (!a) continue;
    if (pos - cursor > limiteLacuna) lacunas.push({ tamanho: pos - cursor, amostra: origem.slice(cursor, cursor + 80) });
    coberto += a.length;
    cursor = pos + a.length;
  }
  if (origem.length - cursor > limiteLacuna) lacunas.push({ tamanho: origem.length - cursor, amostra: origem.slice(cursor, cursor + 80), noFim: true });
  return { total: origem.length, coberto, cobertura: origem.length ? coberto / origem.length : 0, lacunas, naoLocalizados, rotulosDivergentes };
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
    const reTipo = registro.tipoSapl === 6 ? /^LEI\s+COMPLEMENTAR\b/i : /^LEI\b(?!\s+COMPLEMENTAR)/i;
    const ate = texto.search(/^\s*Art\.\s*1\s*[º°o]?\b/m);
    const cabeca = (ate > 0 ? texto.slice(0, ate) : texto.slice(0, 3000)).split(/\r?\n/).map((l) => l.trim());
    cabecalhoDoCatalogo = cabeca.some((l) => reTipo.test(l) && soDigitos((/\d[\d.]*/.exec(l.replace(reTipo, '')) || [''])[0]) === soDigitos(registro.numero));
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
      },
    },
  };
}
