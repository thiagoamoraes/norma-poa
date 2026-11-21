// ingestao/revisao.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F1): regras das DECISÕES humanas.
// Puro e sem dependências — a mesma cópia roda no navegador (docs/js/ingestao/).
//
// Princípios: a decisão é uma camada à parte (dados/revisao/decisoes.jsonl); nunca
// altera a saída do estruturador. Cada decisão guarda a versão do texto e do leitor
// a que se refere; se qualquer uma mudar, a decisão fica DESATUALIZADA e a norma
// volta à fila — nunca vale em silêncio.

/** Acima disto, "aceitar" pede confirmação de que os pontos foram conferidos (decisão de 20/11/2026). */
export const LIMITE_PONTOS_CONFIRMACAO = 20;
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
  if (d.pontosNaHora != null && !Number.isInteger(d.pontosNaHora)) erros.push('pontosNaHora deve ser inteiro');
  if (d.decisao === 'aceitar' && d.pontosNaHora > LIMITE_PONTOS_CONFIRMACAO && d.confirmouPontos !== d.pontosNaHora) erros.push(`aceitar uma norma com ${d.pontosNaHora} pontos (mais de ${LIMITE_PONTOS_CONFIRMACAO}) exige confirmar que todos foram conferidos`);
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
export function roteiroDeConferencia(motivos, texto, dispositivos = [], contexto = {}) {
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
  if (ms.has('data_diverge_do_catalogo') && contexto.datas) {
    const q = quadroDeDatas(contexto.datas);
    out.push({ chave: 'datas', titulo: 'Confira as datas', instrucao: q.instrucao, trecho: q.quadro });
  }
  if (['sem_artigos', 'cabecalho_nao_reconhecido', 'tipo_sem_suporte'].some((m) => ms.has(m)) && contexto.arquivo) {
    const f = fichaDoArquivo(contexto.arquivo);
    out.push({ chave: 'arquivo', titulo: 'O que o arquivo parece ser', instrucao: f.instrucao, trecho: f.ficha });
  }
  if (ms.has('fecho_com_texto_demais')) {
    out.push({ chave: 'fecho_longo', titulo: 'Confira o que vem depois da assinatura',
      instrucao: 'O fecho (local, data e assinaturas) tem em regra uns 200 caracteres; este tem mais de 600 fora do carimbo de assinatura eletrônica. Pode ser texto de outro ato, tabela ou quadro sem cabeçalho de anexo, ou lixo da extração. Se for parte da lei, aceitar significa "o articulado está certo"; se for outro texto, marque "defeito de fonte".',
      trecho: L.slice(-24).join('\n') });
  }
  if (ms.has('tabela_no_corpo') && contexto.tabela) {
    out.push({ chave: 'tabela', titulo: 'Tabela no meio do ato',
      instrucao: `Foram achadas ${contexto.tabela.linhas} ou mais linhas com colunas (tabela de PDF) no articulado. O motor não lê tabelas: o texto da tabela ficou colado ao dispositivo anterior. Confira no original a tabela e o dispositivo que a introduz; aceitar significa que o articulado e a tabela estão preservados na ordem certa.`,
      trecho: contexto.tabela.trecho || '' });
  }
  if (ms.has('rotulo_nao_confere_com_a_origem')) {
    const grupos = agruparDeslocamentos(dispositivos);
    if (grupos.length) {
      out.push({ chave: 'rotulos', titulo: 'Confira a numeração da lei', instrucao: grupos.map(fraseDoDeslocamento).join(' '), trecho: trechoAoRedorDoDeslocamento(texto, grupos[0], dispositivos) });
    }
  }
  return out;
}

// ── Rótulos que não conferem: a cascata de deslocamento vira UMA frase (21/11/2026) ───────────────────────────

const ROMANOS = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
/** Valor numérico de um rótulo ("IV –", "Art. 12.", "§ 3º", "c)") ou null. Só para comparar deslocamento. */
export function valorDoRotulo(rotulo) {
  const t = String(rotulo || '').replace(/[–—-]\s*$/, '').replace(/^\s*(?:Art\.?|§)\s*/i, '').replace(/[º°ª.)\s]+$/g, '').trim();
  if (/^\d+/.test(t)) return parseInt(t, 10);
  if (/^[IVXLCDM]+$/.test(t)) { let v = 0; for (let i = 0; i < t.length; i++) { const a = ROMANOS[t[i]], b = ROMANOS[t[i + 1]]; v += b && b > a ? -a : a; } return v; }
  if (/^[a-z]$/.test(t)) return t.charCodeAt(0) - 96;
  return null;
}

/**
 * Agrupa os rótulos divergentes CONSECUTIVOS que têm o mesmo pai e o mesmo deslocamento (o número escrito menos o
 * número que o motor deu). Um inciso que a lei pulou desloca todos os seguintes pelo mesmo valor: isso é UM ponto a
 * conferir, não uma lista de N. Devolve [{ pai, primeiro, ultimo, quantidade, deslocamento|null }].
 */
export function agruparDeslocamentos(dispositivos) {
  const div = (dispositivos || []).filter((d) => d.situacao === 'rotulo_diverge');
  const grupos = [];
  for (const d of div) {
    const esc = valorDoRotulo(d.naOrigem), mot = valorDoRotulo(d.rotulo);
    const desl = esc != null && mot != null ? esc - mot : null;
    const g = grupos[grupos.length - 1];
    if (g && g.pai === d.pai && g.deslocamento === desl && desl != null) { g.ultimo = d; g.quantidade++; }
    else grupos.push({ pai: d.pai, primeiro: d, ultimo: d, quantidade: 1, deslocamento: desl });
  }
  return grupos;
}

/** Frase em português para um grupo de deslocamento, sem inventar redação da lei. */
export function fraseDoDeslocamento(g) {
  const onde = `em «${g.primeiro.id}»`;
  const dado = `O motor numerou «${String(g.primeiro.rotulo).trim()}», mas no texto está escrito «${String(g.primeiro.naOrigem).trim()}»`;
  const resto = g.quantidade > 1 ? `; os outros ${g.quantidade - 1} dispositivos seguintes (até «${g.ultimo.id}») ficam deslocados do mesmo modo.` : '.';
  if (g.deslocamento === 1) return `${dado} ${onde}: a lei parece PULAR um número (o motor não achou o dispositivo que vem antes do escrito)${resto} Confira no original se esse dispositivo existe; se a lei realmente pula, é defeito de fonte.`;
  if (g.deslocamento === -1) return `${dado} ${onde}: a lei parece REPETIR um número, ou o motor leu um dispositivo a mais${resto} Confira se há dois dispositivos com o mesmo rótulo no original.`;
  return `${dado} ${onde}${resto} Confira a sequência dos rótulos no original.`;
}

/** Trecho do texto de origem ao redor do primeiro deslocamento (para o revisor ver o contexto sem procurar). */
export function trechoAoRedorDoDeslocamento(texto, grupo, dispositivos) {
  const d = (dispositivos || []).find((x) => x.id === grupo.primeiro.id);
  if (!texto || !d || !Number.isInteger(d.ini)) return '';
  return String(texto).slice(Math.max(0, d.ini - 160), Math.min(texto.length, d.ini + 160)).trim();
}

// ── Datas lado a lado e ficha do arquivo (decisão 2 do mantenedor: decide o revisor, caso a caso) ───────────

const MESES = { janeiro: 1, fevereiro: 2, marco: 3, 'março': 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
/** Data (AAAA-MM-DD) da primeira linha do fecho ("PREFEITURA MUNICIPAL DE PORTO ALEGRE, 22 de dezembro de 2025."), ou null. */
export function dataDoFecho(fecho) {
  const m = /(\d{1,2})\s*[º°]?\s+de\s+([A-Za-zçÇ]+)\s+de\s+(\d{4})/i.exec(String(fecho || '').split('\n')[0]);
  const mes = m && MESES[m[2].toLowerCase()];
  return mes ? `${m[3]}-${String(mes).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}` : null;
}
const br = (iso) => (iso ? iso.split('-').reverse().join('/') : '— (não há)');
/** Quadro com as datas lado a lado e a frase que diz de que lado está a divergência. O motor nunca escolhe. */
export function quadroDeDatas(d) {
  const linhas = [['Catálogo (data da norma)', d.catalogo], ['Cabeçalho do arquivo', d.cabecalho], ['Fecho do arquivo', d.fecho], ['Publicação (catálogo)', d.publicacaoCatalogo]];
  const quadro = linhas.map(([k, v]) => `${k.padEnd(26)} ${br(v)}`).join('\n');
  const arquivoCoerente = d.cabecalho && d.fecho && d.cabecalho === d.fecho;
  let instrucao;
  if (arquivoCoerente && d.catalogo && d.cabecalho !== d.catalogo) instrucao = 'O cabeçalho e o fecho do arquivo concordam entre si; só o catálogo da fonte difere. Em regra o arquivo é o que vale para o texto, mas a decisão é sua: se o catálogo estiver certo e o arquivo errado, marque "defeito de fonte".';
  else if (d.cabecalho && d.fecho && !arquivoCoerente) instrucao = 'O cabeçalho e o fecho do arquivo também divergem entre si (pode ser promulgação em data posterior). Confira no original qual é a data da norma.';
  else instrucao = 'Confira no original qual é a data da norma.';
  if (d.catalogo && d.publicacaoCatalogo && d.catalogo > d.publicacaoCatalogo) instrucao += ' Atenção: no catálogo a data da norma é POSTERIOR à data de publicação, o que é incoerente.';
  return { quadro, instrucao };
}
/** Ficha do arquivo para decidir rápido se é capa, placeholder, aviso ou anexo (nada é inventado: só o que o catálogo e o arquivo dizem). */
export function fichaDoArquivo(a) {
  const nome = a.nome || '—';
  const parecAnexo = /anexo|mapa|tabela|quadro|planta/i.test(nome);
  const ficha = [`Arquivo:    ${nome}${parecAnexo ? '   [o nome sugere ANEXO]' : ''}`, `Tamanho:    ${a.caracteres ?? '—'} caracteres, ${a.linhas ?? '—'} linhas`, `Extração:   ${a.metodo || '—'}`, `Ementa no catálogo: ${a.ementa ? a.ementa : '—'}`, ...(a.outrosLinks?.length ? ['Outros links na observação do catálogo:', ...a.outrosLinks.map((l) => '  ' + l)] : [])].join('\n');
  const instrucao = (a.caracteres != null && a.caracteres < 800 ? 'O arquivo é muito curto: provavelmente capa, placeholder ou aviso, sem corpo de lei. ' : '') + (parecAnexo ? 'O nome sugere anexo (mapa, tabela ou quadro): anexo complexo será tratado à parte. ' : '') + 'Compare a ementa do catálogo com o início do arquivo; se o arquivo não é o texto da norma, marque "defeito de fonte".';
  return { ficha, instrucao };
}

/** Roteiro genérico: norma sem nenhum ponto marcado e sem roteiro específico. */
export const ROTEIRO_GENERICO = 'O motor não apontou um ponto neste texto. Leia o início e o fim do arquivo e compare com a árvore ao lado; na dúvida, marque "encaminhar ao motor" e descreva o que viu.';

// ── Vocabulário do revisor, aceitar com muitos pontos (decisões do mantenedor, 20/11/2026) ──────────────────

/** Títulos em português dos motivos do motor; o código técnico fica em dica (tooltip) e no arquivo exportado. */
export const TITULOS_DE_MOTIVO = {
  rotulo_nao_confere_com_a_origem: 'O rótulo não confere com o texto',
  trecho_nao_localizado_na_origem: 'Trecho da árvore não encontrado no texto',
  texto_fora_da_arvore: 'Sobrou texto do arquivo fora da árvore',
  sem_fecho: 'Fecho (local, data e assinaturas) não reconhecido',
  bloco_de_alteracao_sem_dono: 'Bloco de alteração sem artigo que o introduza',
  cabecalho_nao_reconhecido: 'Cabeçalho (tipo, número e data) não reconhecido',
  sem_artigos: 'Nenhum artigo reconhecido',
  dispositivo_sem_rotulo: 'Dispositivo sem rótulo reconhecível',
  endereco_repetido: 'Dois dispositivos com o mesmo endereço',
  promulgacao_parcial: 'Promulgação parcial (só alguns dispositivos)',
  data_diverge_do_catalogo: 'A data do arquivo difere da do catálogo',
  numero_diverge_do_catalogo: 'O número do arquivo difere do do catálogo',
  tipo_diverge_do_catalogo: 'O tipo do ato difere do do catálogo',
  tipo_sem_suporte: 'Tipo de ato ainda não suportado',
  numeracao_de_artigos_com_salto: 'Numeração dos artigos com salto',
  erro_do_leitor: 'O leitor falhou neste texto',
  bloco_sem_fechamento_de_aspas: 'Fim do bloco de alteração foi inferido',
  fecho_com_texto_demais: 'Texto demais depois do fecho (assinatura)',
  tabela_no_corpo: 'Tabela no meio do ato, colada ao dispositivo anterior',
  aspa_de_abertura_ausente: 'Bloco de alteração sem aspa de abertura',
  alteracao_sem_aspas_nao_delimitada: 'Alteração anunciada, mas o bloco não foi lido',
};
export const tituloDoMotivo = (codigo) => TITULOS_DE_MOTIVO[codigo] || 'Motivo ainda sem título';

/** Quantos pontos o revisor tem a olhar numa norma (mesma soma que o painel mostra). */
export function pontosDaNorma(n) {
  const r = n?.resumo || {};
  return (r.rotulosDivergentes || 0) + (r.naoLocalizados || 0) + (r.lacunasReais || 0) + (n?.fronteiras?.length || 0);
}
