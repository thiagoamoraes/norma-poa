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
 *  'pendente' (sem decisão) · 'revisada' · 'desatualizada' (volta à fila).
 *
 * Regra (decisão do mantenedor, 20/11/2026): a decisão só fica DESATUALIZADA se o TEXTO mudou
 * (sha256Origem) ou se o VEREDITO do motor mudou. Subir a versão do leitor sem mudar o veredito
 * (os motivos de revisão da norma) NÃO desfaz o trabalho de revisão. Sem como comparar o veredito
 * (decisão sem `motivosNaHora` ou norma sem `motivos`), vale a regra rígida: versão diferente =
 * desatualizada — nunca vale em silêncio.
 */
export function situacaoDaDecisao(decisao, norma) {
  if (!decisao) return 'pendente';
  if (decisao.sha256Origem !== norma.sha256Origem) return 'desatualizada';
  if (decisao.versaoEstruturador !== norma.versaoEstruturador) {
    const antes = decisao.motivosNaHora, agora = norma.motivos;
    if (!Array.isArray(antes) || !Array.isArray(agora)) return 'desatualizada';
    const a = [...new Set(antes)].sort().join('|'), b = [...new Set(agora)].sort().join('|');
    if (a !== b) return 'desatualizada';
  }
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

// ── F4: efeito das decisões nos relatórios ────────────────────────────────────

/** Categorias da situação humana, na ordem em que o relatório as mostra. */
export const CATEGORIAS_HUMANAS = ['aceita_motor', 'aceita_humano', 'corrigida', 'defeito_de_fonte', 'encaminhada', 'pendente', 'desatualizada'];

/**
 * Situação de uma norma somando o que o motor concluiu e o que o revisor decidiu.
 *  - `norma`: { situacao: 'aceita'|'revisar', sha256Origem, versaoEstruturador }
 *  - decisão da MESMA versão vale; de versão diferente → 'desatualizada' (a norma volta à fila).
 *  - "aceitar" sobre norma que o motor já aceitou só a confirma (continua `aceita_motor`).
 */
export function situacaoHumana(norma, decisao) {
  const s = situacaoDaDecisao(decisao, norma);
  if (s === 'desatualizada') return norma.situacao === 'aceita' ? 'aceita_motor' : 'desatualizada'; // o motor passou a aceitar: a revisão deixou de ser necessária
  if (s === 'pendente') return norma.situacao === 'aceita' ? 'aceita_motor' : 'pendente';
  switch (decisao.decisao) {
    case 'aceitar': return norma.situacao === 'aceita' ? 'aceita_motor' : 'aceita_humano';
    case 'corrigir': return 'corrigida';
    case 'defeito_de_fonte': return 'defeito_de_fonte';
    default: return 'encaminhada';
  }
}

/** Contagens por época e geral. `normas`: [{ idSapl, epoca, situacao, sha256Origem, versaoEstruturador }]. */
export function resumoHumano(normas, decisoes) {
  const vazio = () => Object.fromEntries(CATEGORIAS_HUMANAS.map((c) => [c, 0]));
  const r = { geral: vazio(), recente: vazio(), antiga: vazio(), indefinida: vazio() };
  for (const n of normas) {
    const c = situacaoHumana(n, decisoes.get(n.idSapl));
    r.geral[c]++;
    (r[n.epoca] || r.indefinida)[c]++;
  }
  return r;
}

/** Markdown da lista de casos que o revisor encaminhou ao motor (forma legítima ainda desconhecida). */
export function listaParaOMotor(normas, decisoes) {
  const itens = [];
  for (const n of normas) {
    const d = decisoes.get(n.idSapl);
    if (d?.decisao === 'encaminhar_ao_motor' && situacaoDaDecisao(d, n) === 'revisada') itens.push({ n, d });
  }
  itens.sort((a, b) => a.d.idSapl - b.d.idSapl);
  const L = ['# Casos encaminhados ao motor', '',
    'Gerado a partir de `dados/revisao/decisoes.jsonl`. Não editar à mão. Cada caso é uma norma REAL que o revisor marcou como forma legítima de redação que o motor ainda não conhece: candidata a fixture e a tarefa do ROTEIRO.', '',
    `Casos: ${itens.length}`, ''];
  for (const { n, d } of itens) {
    L.push(`- **${n.rotulo}** (\`${n.idSapl}\`, ${n.epoca}) — motivos: ${(n.motivos || []).join(', ') || '—'}`);
    L.push(`  - o que o motor não conhece: ${d.nota}`);
  }
  return L.join('\n') + '\n';
}

// ── Roteiro de conferência (decisão do mantenedor, 20/11/2026) ───────────────────────────────────────
// Norma sem ponto marcado no texto (44 de 131 recentes em 20/11/2026): o revisor não deve "caçar". Em linguagem
// dele, e antes da decisão, a página diz O QUE olhar e já recorta o trecho do arquivo onde olhar.

const linhasNaoVazias = (texto) => String(texto || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/**
 * roteiroDeConferencia(motivos, texto) → [{ chave, titulo, instrucao, trecho }]
 *  - cabeçalho/artigos/tipo: início do arquivo;  - sem fecho: final do arquivo;  - promulgação parcial: o "promulgo".
 *  Sem nenhum desses motivos, devolve [] (a página usa o roteiro genérico só se a norma não tiver ponto nenhum).
 */
export function roteiroDeConferencia(motivos, texto) {
  const ms = new Set(motivos || []);
  const L = linhasNaoVazias(texto);
  const out = [];
  if (['cabecalho_nao_reconhecido', 'sem_artigos', 'tipo_sem_suporte'].some((m) => ms.has(m))) {
    out.push({ chave: 'inicio', titulo: 'Comece pelo início do arquivo',
      instrucao: 'Confirme se o arquivo começa pelo cabeçalho da norma (tipo, número e data). Se for folha de protocolo, anexo, texto de outro ato ou estiver ilegível, marque "defeito de fonte".',
      trecho: L.slice(0, 14).join('\n') });
  }
  if (ms.has('sem_fecho')) {
    out.push({ chave: 'fim', titulo: 'Confira o final do arquivo',
      instrucao: 'O texto deve terminar com local, data e assinaturas. Se o fecho existe mas tem forma diferente das quatro conhecidas, descreva-a em "encaminhar ao motor"; se está colado ao texto ou partido, é defeito do arquivo.',
      trecho: L.slice(-12).join('\n') });
  }
  if (ms.has('promulgacao_parcial')) {
    const i = L.findIndex((l) => /fa[çc]o saber|promulg/i.test(l));
    out.push({ chave: 'promulgo', titulo: 'Confira o "promulgo"',
      instrucao: 'Promulgação parcial: o "promulgo" fala de dispositivo(s) de uma lei já existente, não de uma lei inteira. Confira o objeto e se o corpo traz só esses dispositivos.',
      trecho: (i >= 0 ? L.slice(i, i + 6) : L.slice(0, 8)).join('\n') });
  }
  return out;
}

/** Roteiro genérico: norma sem nenhum ponto marcado e sem roteiro específico. */
export const ROTEIRO_GENERICO = 'O motor não apontou um ponto neste texto. Leia o início e o fim do arquivo e compare com a árvore ao lado; na dúvida, marque "encaminhar ao motor" e descreva o que viu.';
