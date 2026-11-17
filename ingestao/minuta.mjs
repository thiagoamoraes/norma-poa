// ingestao/minuta.mjs
//
// Minuta de projeto de lei ALTERADORA, a partir do texto vigente apurado de uma
// lei e de uma lista de pedidos (nova redação, inclusão, revogação).
// Funções puras, sem dependências (rodam no Node e no navegador).
//
// A forma segue a LC 611/2009 (arts. 15 a 18) e a redação de leis reais do
// acervo, usadas como molde:
//   LC 958/2022 — "Fica alterado o caput e ficam incluídos incs. I e II e
//                  parágrafo único no art. 5º da Lei Complementar nº 320, de 2 de
//                  maio de 1994, e alterações posteriores, conforme segue:";
//                  artigo novo entra sem "(NR)"; revogação em artigo próprio,
//                  depois da cláusula de vigência, com a lei citada por extenso;
//   LC 761/2015 — caput inalterado: "Art. 8º ....."; sequência de dispositivos
//                  inalterados: UMA linha pontilhada; bloco termina em ” (NR);
//   LC 514/2004 — "renumerando o atual parágrafo único para § 1º".
//
// O que a minuta NÃO faz: decidir mérito, redigir o texto novo, escrever a
// justificativa. Ela só põe na forma legal o que foi pedido — e recusa, com
// motivo, o que não sabe pôr.
//
// Dispositivo, aqui, é o registro plano do histórico:
//   { id: 'art-5/par-2', pai: 'art-5' | null, tipo, rotulo, situacao }
// (situacao: 'vigente' | 'vetado' | 'revogado').

const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX', 'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const PONTOS = '.'.repeat(70);
const TIPO_NORMA = { 5: 'Lei', 6: 'Lei Complementar' };
const milhar = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Um pedaço de id ('par-2', 'inc-III-A', 'art-12-B') → { tipo, num, letra }. */
function ler(seg) {
  const m = /^(art|par|inc|ali|item)-([^-]+)(?:-(.+))?$/.exec(seg);
  return m ? { tipo: m[1], num: m[2], letra: m[3] || '' } : null;
}
const ordinal = (n) => (Number(n) <= 9 ? `${n}º` : `${n}`);

/** Rótulo como se escreve no INÍCIO do dispositivo: "Art. 5º", "Art. 12-B.", "§ 2º", "Parágrafo único.", "III –", "b)". */
export function rotuloDeAbertura(seg) {
  const s = ler(seg);
  if (!s) return null;
  const letra = s.letra ? `-${s.letra}` : '';
  if (s.tipo === 'art') return Number(s.num) <= 9 && !s.letra ? `Art. ${s.num}º` : Number(s.num) <= 9 ? `Art. ${s.num}º${letra}.` : `Art. ${s.num}${letra}.`;
  if (s.tipo === 'par') return s.num === 'unico' ? 'Parágrafo único.' : Number(s.num) <= 9 ? `§ ${s.num}º${letra}` : `§ ${s.num}${letra}.`;
  if (s.tipo === 'inc') return `${s.num}${letra} –`;
  if (s.tipo === 'ali') return `${s.num}${letra})`;
  return `${s.num}${letra}.`;
}

/** Como se CITA em frase: "art. 5º", "§ 2º", "parágrafo único", "inc. III", "al. b", "item 2". */
function citarSeg(seg) {
  const s = ler(seg);
  const letra = s.letra ? `-${s.letra}` : '';
  if (s.tipo === 'art') return `art. ${ordinal(s.num)}${letra}`;
  if (s.tipo === 'par') return s.num === 'unico' ? 'parágrafo único' : `§ ${ordinal(s.num)}${letra}`;
  if (s.tipo === 'inc') return `inc. ${s.num}${letra}`;
  if (s.tipo === 'ali') return `al. ${s.num}${letra}`;
  return `item ${s.num}${letra}`;
}
/** "art-5/par-2/inc-III" → "inc. III do § 2º do art. 5º". */
export function citar(id) { return id.split('/').reverse().map(citarSeg).join(' do '); }

/** Chave no formato do motor: "inc. iii do § 2º do art. 5º" (minúsculas; alínea com parêntese). */
export function idParaChave(id) {
  return id.split('/').reverse().map((seg) => {
    const s = ler(seg);
    const letra = s.letra ? `-${s.letra.toLowerCase()}` : '';
    if (s.tipo === 'art') return `art. ${ordinal(s.num)}${letra}`;
    if (s.tipo === 'par') return s.num === 'unico' ? 'parágrafo único' : `§ ${ordinal(s.num)}${letra}`;
    if (s.tipo === 'inc') return `inc. ${s.num.toLowerCase()}${letra}`;
    if (s.tipo === 'ali') return `al. ${s.num}${letra})`;
    return `${s.num}${letra}`;
  }).join(' do ');
}

/** "1994-05-02" → "2 de maio de 1994" (dia 1 → "1º"). */
export function dataPorExtenso(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d === 1 ? '1º' : d} de ${MESES[m - 1]} de ${a}`;
}

/** Lista em português: ["a"] → "a"; ["a","b"] → "a e b"; ["a","b","c"] → "a, b e c". */
const lista = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/**
 * Junta dispositivos do mesmo tipo e do mesmo pai: "§§ 1º e 2º", "incs. I a XX",
 * "incs. I e II", "als. a e b". `ids` na ordem do texto. Devolve { texto, plural }.
 */
function agrupar(ids, artigoId) {
  const grupos = [];
  for (const id of ids) {
    const seg = id.split('/').pop();
    const s = ler(seg);
    const pai = id.split('/').slice(0, -1).join('/');
    const g = grupos[grupos.length - 1];
    if (g && g.tipo === s.tipo && g.pai === pai && s.num !== 'unico' && !g.unico) g.segs.push(seg);
    else grupos.push({ tipo: s.tipo, pai, segs: [seg], unico: s.num === 'unico' });
  }
  let total = 0;
  const partes = grupos.map((g) => {
    total += g.segs.length;
    const sufixoPai = g.pai && g.pai !== artigoId ? ` do ${citar(g.pai).replace(new RegExp(` do ${citar(artigoId).replace(/[.]/g, '\\.')}$`), '')}` : '';
    if (g.segs.length === 1) return citarSeg(g.segs[0]) + sufixoPai;
    const nus = g.segs.map((seg) => citarSeg(seg).replace(/^(§|inc\.|al\.|item|art\.) /, ''));
    const plural = { par: '§§', inc: 'incs.', ali: 'als.', item: 'itens', art: 'arts.' }[g.tipo];
    // três ou mais em sequência: "I a XX"
    const consecutivos = g.tipo === 'inc' && g.segs.length >= 3 && g.segs.every((seg, i) => !ler(seg).letra && ROMANOS.indexOf(ler(seg).num) === ROMANOS.indexOf(ler(g.segs[0]).num) + i);
    return `${plural} ${consecutivos ? `${nus[0]} a ${nus[nus.length - 1]}` : lista(nus)}${sufixoPai}`;
  });
  return { texto: lista(partes), plural: total > 1 };
}

/** Próximo rótulo livre entre os irmãos do mesmo tipo (conta revogados e vetados: número não se reaproveita). */
function proximoSeg(tipo, irmaos) {
  const doTipo = irmaos.map((d) => ler(d.id.split('/').pop())).filter((s) => s && s.tipo === tipo);
  if (tipo === 'par') {
    const nums = doTipo.filter((s) => s.num !== 'unico').map((s) => Number(s.num));
    if (!doTipo.length) return 'par-unico';
    return `par-${(nums.length ? Math.max(...nums) : 1) + 1}`;
  }
  if (tipo === 'inc') return `inc-${ROMANOS[Math.max(0, ...doTipo.map((s) => ROMANOS.indexOf(s.num))) + 1]}`;
  if (tipo === 'ali') return `ali-${String.fromCharCode(97 + doTipo.length)}`;
  return `item-${doTipo.length + 1}`;
}

/** Rótulo de inserção intermediária: mesmo número do anterior + letra (LC 611, art. 17, parágrafo único). */
function segComLetra(segAnterior, irmaos) {
  const s = ler(segAnterior);
  const usadas = irmaos.map((d) => ler(d.id.split('/').pop())).filter((x) => x && x.tipo === s.tipo && x.num === s.num && x.letra).map((x) => x.letra);
  let letra = 'A';
  while (usadas.includes(letra)) letra = String.fromCharCode(letra.charCodeAt(0) + 1);
  return `${s.tipo}-${s.num}-${letra}`;
}

/**
 * gerarMinuta({ lei, dispositivos, pedidos, explicacao?, temAlteracoes? }) → { texto, erros[], avisos[], pedidosResolvidos[] }
 *
 *   lei:          registro do catálogo { tipoSapl, numero, data }
 *   dispositivos: estado vigente, em ordem de texto
 *   pedidos:
 *     { operacao: 'nova_redacao', alvo: id, texto }
 *     { operacao: 'inclusao', pai: id, tipo: 'paragrafo'|'inciso'|'alinea'|'item', texto, apos?: id }
 *     { operacao: 'inclusao_artigo', apos: id, texto }
 *     { operacao: 'revogacao', alvo: id }
 *   explicacao:   "breve explicação sobre o objeto alterado" (LC 611, art. 18, III), em gerúndio
 *   temAlteracoes: a lei já foi alterada antes? (acrescenta ", e alterações posteriores"). Padrão: true.
 */
export function gerarMinuta({ lei, dispositivos, pedidos, explicacao, temAlteracoes = true }) {
  const erros = [];
  const avisos = [];
  const porId = new Map(dispositivos.map((d) => [d.id, d]));
  const filhosDe = (pai) => dispositivos.filter((d) => (d.pai || null) === (pai || null));
  const nomeTipo = TIPO_NORMA[lei.tipoSapl];
  if (!nomeTipo) return { texto: null, erros: [`tipo de norma sem suporte na minuta (tipoSapl ${lei.tipoSapl})`], avisos, pedidosResolvidos: [] };
  const posteriores = temAlteracoes ? ', e alterações posteriores' : '';
  const leiCompleta = `${nomeTipo} nº ${milhar(lei.numero)}, de ${dataPorExtenso(lei.data)}`;
  const leiAbreviada = `${nomeTipo} nº ${milhar(lei.numero)}, de ${lei.data.slice(0, 4)}`;
  const estaLei = nomeTipo === 'Lei Complementar' ? 'Esta Lei Complementar' : 'Esta Lei';

  // ── resolver cada pedido num endereço e conferir se é possível ───────────
  const TIPO_SEG = { paragrafo: 'par', inciso: 'inc', alinea: 'ali', item: 'item' };
  const resolvidos = [];
  const renumerar = new Map(); // artigo → { de, para } (parágrafo único que vira § 1º)
  const novos = []; // dispositivos criados por pedidos anteriores (para numerar em sequência)
  pedidos.forEach((p, i) => {
    const n = `pedido ${i + 1}`;
    const texto = String(p.texto || '').trim();
    if (p.operacao === 'nova_redacao' || p.operacao === 'revogacao') {
      const d = porId.get(p.alvo);
      if (!d) return erros.push(`${n}: dispositivo "${p.alvo}" não existe no texto vigente`);
      if (d.situacao === 'revogado') return erros.push(`${n}: ${citar(p.alvo)} já está revogado`);
      if (d.situacao === 'vetado') return erros.push(`${n}: ${citar(p.alvo)} é dispositivo vetado; não recebe nova redação nem revogação (LC 611/2009, art. 17, II)`);
      if (p.operacao === 'nova_redacao' && !texto) return erros.push(`${n}: falta o texto da nova redação`);
      return resolvidos.push({ ...p, id: p.alvo, texto, artigo: p.alvo.split('/')[0] });
    }
    if (p.operacao === 'inclusao') {
      const pai = porId.get(p.pai);
      const seg0 = TIPO_SEG[p.tipo];
      if (!pai) return erros.push(`${n}: dispositivo "${p.pai}" não existe no texto vigente`);
      if (!seg0) return erros.push(`${n}: tipo "${p.tipo}" desconhecido`);
      if (pai.situacao !== 'vigente') return erros.push(`${n}: ${citar(p.pai)} está ${pai.situacao}; não recebe dispositivo novo`);
      if (!texto) return erros.push(`${n}: falta o texto do dispositivo novo`);
      const irmaos = filhosDe(p.pai).concat(novos.filter((x) => x.pai === p.pai));
      let seg;
      if (p.apos) {
        const ant = porId.get(p.apos);
        if (!ant || ant.pai !== p.pai || ler(p.apos.split('/').pop()).tipo !== seg0) return erros.push(`${n}: "apos" tem de ser um ${p.tipo} do mesmo dispositivo-pai`);
        const depois = irmaos.filter((x) => ler(x.id.split('/').pop()).tipo === seg0);
        const ultimo = depois[depois.length - 1];
        seg = ultimo && ultimo.id === p.apos ? proximoSeg(seg0, irmaos) : segComLetra(p.apos.split('/').pop(), irmaos);
      } else {
        seg = proximoSeg(seg0, irmaos);
      }
      // 2º parágrafo num artigo que só tem "parágrafo único": a própria lei tem de renumerar (molde: LC 514/2004)
      if (seg0 === 'par' && irmaos.some((x) => x.id.endsWith('/par-unico'))) {
        const unico = irmaos.find((x) => x.id.endsWith('/par-unico'));
        if (unico.situacao !== 'vigente') return erros.push(`${n}: o parágrafo único de ${citar(p.pai)} está ${unico.situacao}; inclusão de novo parágrafo exige análise manual`);
        if (p.pai.includes('/')) return erros.push(`${n}: parágrafo só existe diretamente em artigo`);
        renumerar.set(p.pai, { de: unico.id, para: `${p.pai}/par-1` });
        seg = `par-${2 + novos.filter((x) => x.pai === p.pai && ler(x.id.split('/').pop()).tipo === 'par').length}`;
        avisos.push(`${n}: ${citar(p.pai)} tem parágrafo único; a minuta o renumera para § 1º e inclui o novo como ${citarSeg(seg)}`);
      }
      const id = `${p.pai}/${seg}`;
      if (porId.has(id)) return erros.push(`${n}: já existe ${citar(id)}`);
      novos.push({ id, pai: p.pai });
      return resolvidos.push({ ...p, id, texto, artigo: p.pai.split('/')[0] });
    }
    if (p.operacao === 'inclusao_artigo') {
      const ant = porId.get(p.apos);
      if (!ant || ant.tipo !== 'artigo') return erros.push(`${n}: "apos" tem de ser um artigo existente`);
      if (!texto) return erros.push(`${n}: falta o texto do artigo novo`);
      const artigos = filhosDe(null).concat(novos.filter((x) => !x.pai));
      const id = segComLetra(`art-${ler(p.apos).num}`, artigos); // mesmo número do anterior + letra (art. 17, parágrafo único)
      novos.push({ id, pai: null });
      return resolvidos.push({ ...p, id, texto, artigo: id, artigoNovo: true });
    }
    return erros.push(`${n}: operação "${p.operacao}" desconhecida`);
  });
  const vistos = new Set();
  for (const r of resolvidos) {
    if (vistos.has(r.id)) erros.push(`mais de um pedido para ${citar(r.id)}`);
    vistos.add(r.id);
    if (r.operacao !== 'revogacao' && resolvidos.some((o) => o.operacao === 'revogacao' && o !== r && (r.id === o.id || r.id.startsWith(o.id + '/')))) erros.push(`${citar(r.id)} é alterado e, ao mesmo tempo, revogado (ele ou o dispositivo que o contém)`);
  }
  if (!resolvidos.length && !erros.length) erros.push('nenhum pedido');
  if (erros.length) return { texto: null, erros, avisos, pedidosResolvidos: resolvidos };

  // ── artigos da alteradora: um por artigo alterado, na ordem da lei; revogações ao fim ───
  const ordemArtigos = [];
  const chaveOrdem = (artId) => { const s = ler(artId); return Number(s.num) * 100 + (s.letra ? s.letra.charCodeAt(0) - 64 : 0); };
  for (const r of resolvidos) if (r.operacao !== 'revogacao' && !ordemArtigos.includes(r.artigo)) ordemArtigos.push(r.artigo);
  ordemArtigos.sort((a, b) => chaveOrdem(a) - chaveOrdem(b));

  const artigosTexto = [];
  const ementaAltera = [];
  const ementaInclui = [];
  let primeiraRemissao = true;
  const citarLei = () => { const t = primeiraRemissao ? leiCompleta : leiAbreviada; primeiraRemissao = false; return t + posteriores; };

  for (const art of ordemArtigos) {
    const doArtigo = resolvidos.filter((r) => r.artigo === art && r.operacao !== 'revogacao');
    const alvoArtigo = citar(art);
    let intro;
    if (doArtigo[0].artigoNovo) {
      intro = `Fica incluído ${alvoArtigo} na ${citarLei()}, conforme segue:`;
      ementaInclui.push(alvoArtigo);
    } else {
      const rotuloNaFrase = (r) => (r.id === art ? null : r.id);
      const alterados = doArtigo.filter((r) => r.operacao === 'nova_redacao');
      const incluidos = doArtigo.filter((r) => r.operacao === 'inclusao');
      const caputAlterado = alterados.some((r) => r.id === art);
      const gAlt = agrupar(alterados.map(rotuloNaFrase).filter(Boolean), art);
      const gInc = agrupar(incluidos.map((r) => r.id), art);
      const nomesAlt = [caputAlterado ? 'caput' : null, gAlt.texto || null].filter(Boolean);
      const pluralAlt = nomesAlt.length > 1 || gAlt.plural;
      // artigo "o": "o caput", "o § 2º", "os §§ 2º e 3º", "o caput e o § 2º"
      const comArtigo = (caputAlterado ? ['o caput'] : []).concat(gAlt.texto ? [`${gAlt.plural ? 'os' : 'o'} ${gAlt.texto}`] : []).join(' e ');
      const ren = renumerar.get(art);
      const fraseRen = ren ? `, renumerando o atual parágrafo único para ${citarSeg(ren.para.split('/').pop())}` : '';
      if (alterados.length && incluidos.length) {
        intro = `${pluralAlt ? 'Ficam alterados' : 'Fica alterado'} ${comArtigo} e ${gInc.plural ? 'ficam incluídos' : 'fica incluído'} ${gInc.texto} no ${alvoArtigo} da ${citarLei()}${fraseRen}, conforme segue:`;
      } else if (alterados.length) {
        intro = `${pluralAlt ? 'Ficam alterados' : 'Fica alterado'} ${comArtigo} do ${alvoArtigo} da ${citarLei()}, conforme segue:`;
      } else {
        intro = `${gInc.plural ? 'Ficam incluídos' : 'Fica incluído'} ${gInc.texto} no ${alvoArtigo} da ${citarLei()}${fraseRen}, conforme segue:`;
      }
      if (alterados.length) ementaAltera.push(`${comArtigo} do ${alvoArtigo}`);
      if (incluidos.length) ementaInclui.push(`${gInc.texto} no ${alvoArtigo}`);
    }

    // bloco entre aspas
    const mudou = new Map(doArtigo.map((r) => [r.id, r]));
    const ren = renumerar.get(art);
    const linhas = [];
    const temMudancaAbaixo = (id) => [...mudou.keys()].some((k) => k.startsWith(id + '/'));
    const emitir = (id, eRaiz) => {
      const seg = id.split('/').pop();
      const r = mudou.get(id);
      const abre = rotuloDeAbertura(seg);
      linhas.push(r ? `${abre} ${r.texto}` : `${abre} ${PONTOS}`);
      // filhos: os existentes (com o parágrafo único já no rótulo novo, se renumerado) + os incluídos, na ordem dos rótulos
      const existentes = filhosDe(id).map((d) => (ren && d.id === ren.de ? ren.para : d.id));
      const incluidosAqui = [...mudou.values()].filter((x) => x.operacao === 'inclusao' && x.pai === id).map((x) => x.id);
      const todos = existentes.slice();
      for (const novo of incluidosAqui) {
        const ap = mudou.get(novo).apos;
        const pos = ap && todos.includes(ap) ? todos.indexOf(ap) + 1 : (() => { // depois do último irmão do mesmo tipo
          const t = ler(novo.split('/').pop()).tipo; let ult = -1; todos.forEach((x, k) => { if (ler(x.split('/').pop()).tipo === t) ult = k; }); return ult >= 0 ? ult + 1 : todos.length; })();
        todos.splice(pos, 0, novo);
      }
      let pulando = false;
      for (const f of todos) {
        const renumerado = ren && f === ren.para;
        if (mudou.has(f) || temMudancaAbaixo(f) || renumerado) {
          pulando = false;
          if (renumerado && !mudou.has(f) && !temMudancaAbaixo(f)) linhas.push(`${rotuloDeAbertura(f.split('/').pop())} ${PONTOS}`);
          else emitir(f, false);
        } else if (!pulando) { linhas.push(PONTOS); pulando = true; }
      }
      void eRaiz;
    };
    emitir(art, true);
    linhas[0] = '“' + linhas[0];
    linhas[linhas.length - 1] += doArtigo[0].artigoNovo ? '”' : '” (NR)';
    artigosTexto.push({ intro, bloco: linhas });
  }

  // ── montagem ───────────────────────────────────────────────────────────────
  const revogados = resolvidos.filter((r) => r.operacao === 'revogacao');
  const numerar = (k) => (k <= 9 ? `Art. ${k}º` : `Art. ${k}.`);
  const corpo = [];
  let k = 0;
  for (const a of artigosTexto) { corpo.push(`${numerar(++k)} ${a.intro}`, ...a.bloco); }
  corpo.push(`${numerar(++k)} ${estaLei} entra em vigor na data de sua publicação.`);
  if (revogados.length) {
    corpo.push(`${numerar(++k)} ${revogados.length > 1 ? 'Ficam revogados os' : 'Fica revogado o'} ${revogados.length === 1 ? citar(revogados[0].id) : lista(revogados.map((r) => citar(r.id)))} da ${leiCompleta}.`);
  }

  // ementa (LC 611, art. 18): dispositivo e lei alterados + breve explicação
  const partes = [];
  if (ementaAltera.length) partes.push(`altera ${lista(ementaAltera)}`);
  if (ementaInclui.length) partes.push(`inclui ${lista(ementaInclui)}`);
  if (revogados.length) partes.push(`revoga ${lista(revogados.map((r) => `o ${citar(r.id)}`))}`);
  let ementa;
  if (partes.length === 1) {
    // uma só ação: a lei vem logo depois do dispositivo ("Inclui § 4º no art. 2º da Lei…")
    ementa = `${partes[0]} da ${leiCompleta}${posteriores}`;
  } else {
    ementa = `${partes.slice(0, -1).join('; ')}; e ${partes[partes.length - 1]}, todos na ${leiCompleta}${posteriores}`;
  }
  ementa = ementa.charAt(0).toUpperCase() + ementa.slice(1) + `, ${explicacao ? String(explicacao).trim().replace(/\.$/, '') : '[breve explicação do objeto da alteração]'}.`;
  if (!explicacao) avisos.push('falta a breve explicação do objeto da alteração, exigida na ementa (LC 611/2009, art. 18, III)');

  const epigrafe = `PROJETO DE ${nomeTipo.toUpperCase()} Nº ___/____`;
  const texto = [epigrafe, '', ementa, '', ...corpo].join('\n') + '\n';
  return { texto, erros, avisos, pedidosResolvidos: resolvidos, renumeracoes: [...renumerar.values()] };
}
