// ingestao/revisao.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F1): regras das DECISÕES humanas.
// Puro e sem dependências — a mesma cópia roda no navegador (docs/js/ingestao/).
//
// Princípios: a decisão é uma camada à parte (dados/revisao/decisoes.jsonl); nunca
// altera a saída do estruturador. Cada decisão guarda a versão do texto e do leitor
// a que se refere; se qualquer uma mudar, a decisão fica DESATUALIZADA e a norma
// volta à fila — nunca vale em silêncio.

export const DECISOES = ['aceitar', 'defeito_de_fonte', 'corrigir', 'encaminhar_ao_motor'];
export const TIPOS_DE_DEFEITO = ['aspas_faltando', 'aspas_fechando_cedo', 'nr_truncado', 'numeracao_errada', 'ocr', 'outro'];
export const CAMPOS_CORRIGIVEIS = ['rotulo'];

const ehTexto = (v) => typeof v === 'string' && v.trim() !== '';

/** Confere uma decisão. Devolve { ok, erros[] } — nunca lança. */
export function validarDecisao(d) {
  const erros = [];
  if (!d || typeof d !== 'object') return { ok: false, erros: ['decisão não é um objeto'] };
  if (!Number.isInteger(d.idSapl)) erros.push('idSapl ausente ou não inteiro');
  if (!DECISOES.includes(d.decisao)) erros.push(`decisao inválida: ${d.decisao}`);
  if (!ehTexto(d.sha256Origem)) erros.push('sha256Origem ausente (a decisão tem de apontar para a versão do texto revisada)');
  if (!Number.isInteger(d.versaoEstruturador)) erros.push('versaoEstruturador ausente');
  if (!ehTexto(d.em) || Number.isNaN(Date.parse(d.em))) erros.push('em (data/hora) ausente ou inválida');
  if (d.nota != null && typeof d.nota !== 'string') erros.push('nota deve ser texto');
  if (d.decisao === 'defeito_de_fonte') {
    if (!d.defeito || !TIPOS_DE_DEFEITO.includes(d.defeito.tipo)) erros.push('defeito_de_fonte exige defeito.tipo conhecido');
    if (!d.defeito || !ehTexto(d.defeito.trecho)) erros.push('defeito_de_fonte exige defeito.trecho (o trecho do arquivo que está errado)');
  }
  if (d.decisao === 'corrigir') {
    if (!Array.isArray(d.correcoes) || !d.correcoes.length) erros.push('corrigir exige ao menos uma correção');
    else d.correcoes.forEach((c, i) => {
      if (!ehTexto(c?.endereco)) erros.push(`correção ${i + 1}: endereço ausente`);
      if (!CAMPOS_CORRIGIVEIS.includes(c?.campo)) erros.push(`correção ${i + 1}: campo não corrigível (${c?.campo})`);
      if (!ehTexto(c?.de) || !ehTexto(c?.para)) erros.push(`correção ${i + 1}: "de" e "para" são obrigatórios`);
      if (ehTexto(c?.de) && c.de === c.para) erros.push(`correção ${i + 1}: "de" e "para" iguais`);
    });
  }
  if (d.decisao === 'encaminhar_ao_motor' && !ehTexto(d.nota)) erros.push('encaminhar_ao_motor exige nota (o que o motor não conhece)');
  return { ok: erros.length === 0, erros };
}

/** Lê o conteúdo de um decisoes.jsonl. A ÚLTIMA linha de cada idSapl vale. { decisoes: Map, erros: [{linha, erros}] } */
export function lerDecisoesJsonl(conteudo) {
  const decisoes = new Map();
  const erros = [];
  String(conteudo || '').split(/\r?\n/).forEach((linha, i) => {
    if (!linha.trim()) return;
    let d;
    try { d = JSON.parse(linha); } catch { erros.push({ linha: i + 1, erros: ['JSON inválido'] }); return; }
    const v = validarDecisao(d);
    if (!v.ok) { erros.push({ linha: i + 1, erros: v.erros }); return; }
    decisoes.set(d.idSapl, d);
  });
  return { decisoes, erros };
}

/** Texto do arquivo a partir do mapa: uma linha por norma, em ordem de idSapl. */
export function paraJsonl(decisoes) {
  const lista = [...decisoes.values()].sort((a, b) => a.idSapl - b.idSapl);
  return lista.map((d) => JSON.stringify(d)).join('\n') + (lista.length ? '\n' : '');
}

/**
 * Situação de uma norma frente à sua decisão:
 *  'pendente' (sem decisão) · 'revisada' · 'desatualizada' (o texto ou o leitor mudou desde a decisão).
 */
export function situacaoDaDecisao(decisao, norma) {
  if (!decisao) return 'pendente';
  if (decisao.sha256Origem !== norma.sha256Origem || decisao.versaoEstruturador !== norma.versaoEstruturador) return 'desatualizada';
  return 'revisada';
}

/** Contagens do painel: total, pendentes, revisadas (por decisão) e desatualizadas. */
export function resumoDaRevisao(fila, decisoes) {
  const r = { total: fila.length, pendentes: 0, desatualizadas: 0, revisadas: 0, porDecisao: Object.fromEntries(DECISOES.map((d) => [d, 0])) };
  for (const n of fila) {
    const d = decisoes.get(n.idSapl);
    const s = situacaoDaDecisao(d, n);
    if (s === 'pendente') r.pendentes++;
    else if (s === 'desatualizada') r.desatualizadas++;
    else { r.revisadas++; r.porDecisao[d.decisao]++; }
  }
  return r;
}
