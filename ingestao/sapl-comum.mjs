// ingestao/sapl-comum.mjs
//
// Funções PURAS (sem rede, sem disco) para tratar registros da API do SAPL da
// PGM (https://legislacao.portoalegre.rs.gov.br/api/). Usadas pelo coletor de
// catálogo (catalogo-sapl.mjs) e pelo relatório de cobertura
// (relatorio-cobertura.mjs). Testadas em teste_catalogo_sapl.mjs contra
// registros reais (fixtures/sapl/normas_amostra.json).
//
// Nada aqui toca no norma-core.js nem é importado por ele.

/** Tipos de norma do SAPL (campo `tipo`) no escopo da fase inicial. */
export const ESCOPO_INICIAL = {
  1: 'lei_organica',
  2: 'emenda_lei_organica',
  6: 'lei_complementar',
  5: 'lei',
};

/**
 * O acervo migrado do SIREL não usa `texto_integral`: o link do texto vem
 * como HTML dentro de `observacao` (<a href="...">). Devolve a URL ou null.
 */
export function linkDaObservacao(observacao) {
  const m = /href\s*=\s*"([^"]+)"/i.exec(observacao || '');
  return m ? m[1].trim() : null;
}

const paraHttps = (url) => url.replace(/^http:\/\//i, 'https://');

function formatoDaUrl(url) {
  const m = /\.([a-z0-9]{2,5})(?:[?#].*)?$/i.exec(url);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Onde está (se está) o texto da norma.
 *   arquivo          → `texto_integral` preenchido
 *   link_observacao  → link dentro de `observacao` (legado SIREL)
 *   sem_texto        → o SAPL só tem ementa e metadados
 */
export function situacaoTexto(registro) {
  if (registro.texto_integral) {
    const url = paraHttps(registro.texto_integral);
    return { situacao: 'arquivo', url, formato: formatoDaUrl(url) };
  }
  const link = linkDaObservacao(registro.observacao);
  if (link) {
    const url = paraHttps(link);
    return { situacao: 'link_observacao', url, formato: formatoDaUrl(url) };
  }
  return { situacao: 'sem_texto', url: null, formato: null };
}

/**
 * Registro de catálogo a partir do registro cru da API.
 * - NÃO altera ementa/indexação/observação (texto de fonte não se "arruma").
 * - Descarta campos operacionais do SAPL que não são dado da norma
 *   (`ip`, `user`, `metadata`).
 * - Acrescenta `texto` (ver situacaoTexto) e `fonte`.
 */
export function normalizarRegistroSapl(r) {
  return {
    fonte: 'sapl-pgm',
    idSapl: r.id,
    tipoSapl: r.tipo,
    rotulo: r.__str__,
    numero: r.numero,
    ano: r.ano,
    data: r.data,
    dataPublicacao: r.data_publicacao,
    veiculoPublicacao: r.veiculo_publicacao,
    paginaInicio: r.pagina_inicio_publicacao,
    paginaFim: r.pagina_fim_publicacao,
    dataVigencia: r.data_vigencia,
    complemento: r.complemento,
    ementa: r.ementa,
    indexacao: r.indexacao,
    observacao: r.observacao,
    assuntos: r.assuntos,
    materia: r.materia,
    orgao: r.orgao,
    atualizadoEm: r.data_ultima_atualizacao,
    texto: situacaoTexto(r),
  };
}

/**
 * Números inteiros ausentes entre o menor e o maior da lista.
 * Números não inteiros ("123-A", "") são devolvidos à parte, nunca descartados.
 */
export function lacunasDeSequencia(numeros) {
  const inteiros = new Set();
  const naoNumericos = [];
  for (const n of numeros) {
    const s = String(n ?? '').trim();
    if (/^\d+$/.test(s)) inteiros.add(Number(s));
    else naoNumericos.push(s);
  }
  if (inteiros.size === 0) return { minimo: null, maximo: null, faltantes: [], naoNumericos };
  const minimo = Math.min(...inteiros);
  const maximo = Math.max(...inteiros);
  const faltantes = [];
  for (let i = minimo; i <= maximo; i++) if (!inteiros.has(i)) faltantes.push(i);
  return { minimo, maximo, faltantes, naoNumericos };
}

/** Compacta [1,2,3,7,9,10] em "1–3, 7, 9–10" (para relatório). */
export function compactarFaixas(numeros) {
  const out = [];
  let ini = null;
  let ant = null;
  for (const n of [...numeros].sort((a, b) => a - b)) {
    if (ini === null) { ini = ant = n; continue; }
    if (n === ant + 1) { ant = n; continue; }
    out.push(ini === ant ? `${ini}` : `${ini}–${ant}`);
    ini = ant = n;
  }
  if (ini !== null) out.push(ini === ant ? `${ini}` : `${ini}–${ant}`);
  return out.join(', ');
}

/** Vínculo entre normas (API `normarelacionada`): quem age é a `principal`. */
export function normalizarVinculoSapl(v) {
  return {
    idVinculo: v.id,
    principal: v.norma_principal,
    relacionada: v.norma_relacionada,
    tipoVinculo: v.tipo_vinculo,
    resumo: v.resumo,
    rotulo: v.__str__,
  };
}

/**
 * Fila de download: normas do catálogo que têm URL de texto e ainda não foram
 * resolvidas. Ordem: Lei Orgânica, emendas, LCs, leis; dentro do tipo, da mais
 * recente para a mais antiga. `resolvidos`: Set de idSapl já baixados (ou com
 * erro definitivo).
 */
export function filaDeDownload(registros, resolvidos) {
  const ORDEM = { 1: 0, 2: 1, 6: 2, 5: 3 };
  const ultimo = new Map();
  for (const r of registros) ultimo.set(r.idSapl, r);
  return [...ultimo.values()]
    .filter((r) => r.texto && r.texto.url && !resolvidos.has(r.idSapl))
    .sort((a, b) => (ORDEM[a.tipoSapl] ?? 9) - (ORDEM[b.tipoSapl] ?? 9) || String(b.data).localeCompare(String(a.data)) || b.idSapl - a.idSapl);
}

// ─── Conferência DOPA × catálogo ──────────────────────────────────────────────

/** Tipo de ato do índice do DOPA → `tipoSapl` do catálogo (só o que o SAPL cataloga no escopo). */
export const TIPO_DOPA_PARA_SAPL = { 'Lei': 5, 'Lei Complementar': 6, 'Emenda à Lei Orgânica': 2 };

const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');

/** "16/11/2026" → "2026-11-16" (null se não casar). */
export function dataBrParaIso(d) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(d || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/**
 * Cruza as entradas de norma achadas nos cadernos do DOPA com o catálogo.
 *   edicoes:  [{ data: "DD/MM/AAAA", poder, numeroEdicao, entradas: [{ tipoAto, numero, ano, textoIndice, linkNorma, … }] }]
 *   catalogo: registros normalizados (normalizarRegistroSapl)
 *   hojeIso:  "AAAA-MM-DD"
 * Devolve { noCatalogo, ausentes, foraDoSapl }:
 *   ausentes   → tipo que o SAPL cataloga, mas a norma (ainda) não está lá; leva `dias` desde a publicação
 *   foraDoSapl → atos que o SAPL não cataloga no escopo (Resolução de Mesa, Ordem de Serviço…): o DOPA é a fonte
 * Uma mesma norma publicada em mais de um caderno aparece uma vez (a 1ª publicação).
 */
export function conferirDopa(edicoes, catalogo, hojeIso) {
  const chave = (tipoSapl, numero, ano) => `${tipoSapl}|${soDigitos(numero)}|${ano}`;
  const noCat = new Set(catalogo.map((r) => chave(r.tipoSapl, r.numero, r.ano)));
  const vistos = new Set();
  const res = { noCatalogo: [], ausentes: [], foraDoSapl: [] };
  const ordenadas = [...edicoes].sort((a, b) => String(dataBrParaIso(a.data)).localeCompare(String(dataBrParaIso(b.data))));
  for (const ed of ordenadas) {
    const publicadoEm = dataBrParaIso(ed.data);
    for (const e of ed.entradas || []) {
      const id = `${e.tipoAto}|${soDigitos(e.numero)}|${e.ano}`;
      if (vistos.has(id)) continue;
      vistos.add(id);
      const item = { ...e, publicadoEm, poder: ed.poder, numeroEdicao: ed.numeroEdicao };
      const tipoSapl = TIPO_DOPA_PARA_SAPL[e.tipoAto];
      if (!tipoSapl) { res.foraDoSapl.push(item); continue; }
      if (noCat.has(chave(tipoSapl, e.numero, Number(e.ano)))) { res.noCatalogo.push(item); continue; }
      const dias = publicadoEm ? Math.round((Date.parse(hojeIso) - Date.parse(publicadoEm)) / 86_400_000) : null;
      res.ausentes.push({ ...item, dias });
    }
  }
  return res;
}
