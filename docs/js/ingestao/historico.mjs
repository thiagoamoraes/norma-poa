// ingestao/historico.mjs
//
// Histórico de uma lei: a versão original e uma versão por lei alteradora,
// com o texto de cada dispositivo em cada momento. Função pura (sem rede, sem
// disco); usa o norma-core.js e não altera nada nele.
//
// Saída de apurarHistorico():
//   { versoes:  [{ indice, id, data, fonte: { idSapl, rotulo } | null }],
//     dispositivos: [{ id, pai, tipo, rotulo, agrupadores?,
//                      estados: [{ desde, texto, situacao, origem }] }],
//     naoAplicadas: [{ alteradora, motivo, detalhe, enderecos[] }],
//     aConferir:    [{ id, desde }] }   desde = data da alteradora não aplicada: antes dela o texto está certo
//
// `estados` só guarda mudança: o estado de um dispositivo na versão k é o
// último com `desde` ≤ k; se não houver nenhum, o dispositivo ainda não existia.
// situacao: 'vigente' | 'vetado' | 'revogado' | 'renumerado' (o endereço deixou de
// existir porque a lei trocou o rótulo; o texto segue no endereço novo, cujo
// estado traz `renumerado: { de, lei }`).
//
// NADA é dado como certo em silêncio: toda alteradora que não foi aplicada por
// inteiro aparece em `naoAplicadas`, e os dispositivos que ela cita entram em
// `aConferir`.

import {
  parseMinuta, detectNRCandidates, limparMarkdownLinks, extrairComandosLei, extrairCitacoesExternas,
  criarVersaoOriginal, indexarVersao, apurarTextoVigente, visText, extrairReferenciasLei, chaveLei,
} from '../norma-core.js';
import { slugDoRotulo } from './estrutura.mjs';

const TIPO_ATO = { 5: 'LEI', 6: 'LEI COMPLEMENTAR' };
const fonteDoRegistro = (r) => ({ tipoAto: TIPO_ATO[r.tipoSapl], numero: r.numero, ano: String(r.ano), dataPublicacao: r.data });

/** "art. 2º" / "§ 3º do art. 2º" (chave do core) → "art-2" / "art-2/par-3". */
export function chaveParaId(chave) {
  const partes = String(chave).split(' do ').reverse();
  const out = [];
  for (const p of partes) {
    let m;
    if ((m = /^art\.\s*(\d+)\s*º?(?:-([a-z]))?$/i.exec(p))) out.push(`art-${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`);
    else if (/^parágrafo único$/i.test(p)) out.push('par-unico');
    else if ((m = /^§\s*(\d+)\s*º?(?:-([a-z]))?$/i.exec(p))) out.push(`par-${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`);
    else if ((m = /^inc\.\s*([ivxlcdm]+)(?:-([a-z]))?$/i.exec(p))) out.push(`inc-${m[1].toUpperCase()}${m[2] ? '-' + m[2].toUpperCase() : ''}`);
    else if ((m = /^al\.\s*([a-z]{1,2})\)?$/i.exec(p))) out.push(`ali-${m[1]}`);
    else return null;
  }
  return out.join('/');
}

/**
 * base: { registro, texto } · alteradoras: [{ registro, texto }] — `registro` é o do
 * catálogo (identidade); a ordem de aplicação é a da data da norma.
 */
export function apurarHistorico(base, alteradoras) {
  const limpar = (t) => limparMarkdownLinks(String(t).trim());
  const v0 = criarVersaoOriginal(parseMinuta(limpar(base.texto)), fonteDoRegistro(base.registro));
  const arvores = [v0];
  const versoes = [{ indice: 0, id: v0.id, data: base.registro.data, fonte: null }];
  const naoAplicadas = [];
  const descartadas = [];
  const aConferir = new Map(); // id → data mais antiga a partir da qual há dúvida
  const duvida = (id, data) => { if (!aConferir.has(id) || data < aConferir.get(id)) aConferir.set(id, data); };
  let v = v0;

  const emOrdem = [...alteradoras].sort((a, b) => String(a.registro.data).localeCompare(String(b.registro.data)) || a.registro.idSapl - b.registro.idSapl);
  for (const alt of emOrdem) {
    const raw = limpar(alt.texto);
    const fonte = fonteDoRegistro(alt.registro);
    const quem = { idSapl: alt.registro.idSapl, rotulo: alt.registro.rotulo };
    const doc = parseMinuta(raw, detectNRCandidates(raw));
    const comandos = extrairComandosLei(doc, { leiBaseIndex: indexarVersao(v) });
    const r = apurarTextoVigente(v, [{ fonteAlteradora: fonte, comandos }]);
    const efetivos = comandos.filter((k) => ['replace_text', 'insert_node', 'revoke_node'].includes(k.operacao));
    const recusados = r.log.filter((l) => !['nao_classificado', 'clausula_generica_sem_efeito'].includes(l.comando.operacao));

    // dispositivos da lei-base que a alteradora cita nos artigos que não viraram alteração
    const citados = (artigos) => [...new Set(artigos.flatMap((a) => extrairCitacoesExternas(visText(a)).map((c) => chaveParaId(c.chave)).filter(Boolean)))];
    const chaveBase = chaveLei(fonteDoRegistro(base.registro).tipoAto, base.registro.numero, String(base.registro.ano));
    const miraEstaLei = comandos.some((k) => k.leiAlvo && (k.leiAlvo.chave === chaveBase || (k.leiAlvo.numero === base.registro.numero && (k.leiAlvo.anosCandidatos || []).includes(base.registro.ano))));
    if (r.versaoFinal === v && alt.candidataPelaEmenta && !miraEstaLei && efetivos.length) {
      // Candidata achada só pela ementa, e os comandos que ela traz miram OUTRA lei:
      // não é alteradora desta. Fica registrada, mas não como pendência.
      descartadas.push({ alteradora: quem, motivo: 'a ementa cita esta lei, mas os comandos de alteração são de outra' });
      continue;
    }
    if (r.versaoFinal === v) {
      // nada mudou: ou o comando não foi reconhecido, ou foi recusado
      const enderecos = citados(doc.artigos);
      naoAplicadas.push({ alteradora: quem, motivo: recusados.length ? 'comando_recusado' : 'comando_nao_reconhecido',
        detalhe: recusados.map((l) => l.erro).join(' | ') || 'nenhum comando de alteração foi extraído do texto desta norma', enderecos });
      enderecos.forEach((e) => duvida(e, alt.registro.data));
    } else {
      // Parte recusada. Recusa de "inserir o que já existe" com o mesmo texto é só
      // repetição (arquivo que traz o documento mais de uma vez) — não é pendência.
      const idxDepois = indexarVersao(r.versaoFinal);
      const reais = recusados.filter((l) => !(/já existe/.test(l.erro || '') && l.comando.novoTexto && Object.values(idxDepois).includes(l.comando.novoTexto)));
      if (reais.length) {
        const enderecos = [...new Set(reais.map((l) => chaveParaId(l.comando.dispositivoAlvo || '')).filter(Boolean))];
        naoAplicadas.push({ alteradora: quem, motivo: 'aplicada_em_parte', detalhe: reais.map((l) => l.erro).join(' | '), enderecos });
        enderecos.forEach((e) => duvida(e, alt.registro.data));
      }
      v = r.versaoFinal;
      arvores.push(v);
      versoes.push({ indice: versoes.length, id: v.id, data: alt.registro.data, fonte: quem, comandosAplicados: efetivos.length - recusados.filter((l) => efetivos.includes(l.comando)).length });
    }
  }

  // Linha do tempo por dispositivo. A ordem de exibição junta todas as versões:
  // um endereço que deixa de existir por renumeração (o "parágrafo único" que
  // virou "§ 3º") continua na lista, para as versões em que existia.
  const porId = new Map();
  const ordem = [];
  const nomeLei = (l) => `${l.tipoAto === 'LEI COMPLEMENTAR' ? 'Lei Complementar' : 'Lei'} nº ${Number(l.numero).toLocaleString('pt-BR')}/${l.ano}`;
  arvores.forEach((arv, k) => {
    const presentes = new Set();
    let anterior = null;
    const andar = (nos, pai) => {
      for (const n of nos || []) {
        const id = (pai ? pai + '/' : '') + (slugDoRotulo(n.tipo, n.desFixo) || `${n.tipo}-sem-rotulo`);
        presentes.add(id);
        let d = porId.get(id);
        if (!d) {
          d = { id, pai: pai || null, tipo: n.tipo, rotulo: n.desFixo || null, estados: [] };
          porId.set(id, d);
          ordem.splice(anterior === null ? 0 : ordem.indexOf(anterior) + 1, 0, id);
        }
        anterior = id;
        if (n.gruposAntes && n.gruposAntes.length && !d.agrupadores) d.agrupadores = n.gruposAntes.map((g) => ({ tipo: g.tipo, numero: g.numero, titulo: g.titulo }));
        const situacao = n.revogado ? 'revogado' : n.vetado ? 'vetado' : 'vigente';
        const o = n.origem || {};
        const origem = o.lei ? { operacao: o.operacao, lei: nomeLei(o.lei) } : { operacao: 'promulgacao_original' };
        const estado = { desde: k, texto: n.texto, situacao, origem };
        if (o.ocupouPosicaoDeVetado) estado.ocupouPosicaoDeVetado = true;
        if (n.renumerado) estado.renumerado = { de: String(n.renumerado.de).replace(/\.$/, ''), lei: nomeLei(n.renumerado.lei) };
        const ult = d.estados[d.estados.length - 1];
        if (!ult || ult.texto !== estado.texto || ult.situacao !== situacao || ult.origem.operacao !== origem.operacao || ult.origem.lei !== origem.lei) d.estados.push(estado);
        andar(n.children, id);
      }
    };
    andar(arv.artigos, null);
    // endereço que existia e não existe mais nesta versão: só acontece por renumeração
    for (const [id, d] of porId) {
      const ult = d.estados[d.estados.length - 1];
      if (!presentes.has(id) && ult && ult.situacao !== 'renumerado') d.estados.push({ desde: k, texto: '', situacao: 'renumerado', origem: { operacao: 'renumber_node', lei: versoes[k].fonte ? nomeLei(fonteDoRegistro(emOrdem.find((a) => a.registro.idSapl === versoes[k].fonte.idSapl).registro)) : null } });
    }
  });
  // quem está em aConferir leva junto os subordinados
  const conferir = [];
  for (const id of porId.keys()) {
    const datas = [...aConferir].filter(([e]) => id === e || id.startsWith(e + '/')).map(([, d]) => d);
    if (datas.length) conferir.push({ id, desde: datas.sort()[0] });
  }
  return { versoes, dispositivos: ordem.map((id) => porId.get(id)), naoAplicadas, aConferir: conferir, ...(descartadas.length ? { descartadas } : {}) };
}

// ─── Quais leis têm histórico a apurar: dos vínculos da fonte ──────────────────

/** Tipos de vínculo do SAPL em que a norma PRINCIPAL muda o texto da RELACIONADA. */
export const VINCULOS_QUE_ALTERAM = new Set([1, 3]); // 1 "Altera o(a)" · 3 "Revoga parcialmente o(a)"
/** Tipos em que a principal revoga a relacionada por inteiro. */
export const VINCULOS_QUE_REVOGAM = new Set([2, 4]); // 2 "Revoga integralmente o(a)" · 4 "…por consolidação"

/**
 * montarListaDeHistoricos(vinculos, catalogo) →
 *   { leis: [{ base: idSapl, alteradoras: [idSapl…] }], revogadas: { idSapl: idSaplDeQuemRevogou },
 *     foraDoCatalogo: [{ vinculo, falta }], datasInvertidas: [vinculo…] }
 *
 *   vinculos: registros de normalizarVinculoSapl()
 *   catalogo: Map idSapl → registro (só as normas do escopo)
 *
 * Direção conferida com dado real (LC 320/1994): a PRINCIPAL é quem altera
 * ("Principal: LC 384/1996 — Relacionada: LC 320/1994", tipo "Altera o(a)").
 * Como a fonte é cadastro humano, a data confere a direção: alteradora mais
 * antiga que a alterada não é aplicada — vai para `datasInvertidas`.
 * Norma fora do catálogo do escopo (decreto, por exemplo) não some: vai para
 * `foraDoCatalogo`.
 */
export function montarListaDeHistoricos(vinculos, catalogo) {
  const porBase = new Map();
  const revogadas = {};
  const foraDoCatalogo = [];
  const datasInvertidas = [];
  const vistos = new Set();
  for (const v of vinculos) {
    const altera = VINCULOS_QUE_ALTERAM.has(v.tipoVinculo), revoga = VINCULOS_QUE_REVOGAM.has(v.tipoVinculo);
    if (!altera && !revoga) continue;
    const chave = `${v.principal}>${v.relacionada}>${v.tipoVinculo}`;
    if (vistos.has(chave)) continue; // o mesmo vínculo cadastrado duas vezes
    vistos.add(chave);
    const p = catalogo.get(v.principal), r = catalogo.get(v.relacionada);
    if (!r) continue; // a norma alterada não é do escopo: nada a apurar aqui
    if (!p) { foraDoCatalogo.push({ vinculo: v.idVinculo, falta: v.principal, base: v.relacionada }); continue; }
    if (String(p.data) < String(r.data)) { datasInvertidas.push(v.idVinculo); continue; }
    if (revoga) { revogadas[v.relacionada] = v.principal; continue; }
    if (!porBase.has(v.relacionada)) porBase.set(v.relacionada, new Set());
    porBase.get(v.relacionada).add(v.principal);
  }
  const leis = [...porBase].map(([base, alts]) => ({ base, alteradoras: [...alts].sort((a, b) => String(catalogo.get(a).data).localeCompare(String(catalogo.get(b).data)) || a - b) }))
    .sort((a, b) => a.base - b.base);
  return { leis, revogadas, foraDoCatalogo, datasInvertidas };
}

// ─── Alteradoras que a fonte não vinculou: pela ementa ────────────────────────

const TIPO_SAPL_DO_ATO = { 'LEI': 5, 'LEI COMPLEMENTAR': 6 };
const RE_VERBO_ALTERA = /^(?:altera|inclui|acrescenta|d[áa]\s+nova\s+reda[çc][ãa]o|modifica|insere|suprime|substitui|renumera)/i;
const RE_REVOGA_DISPOSITIVO = /^revoga\b[^.]*?(?:\bart(?:igo|s)?\.?\s*\d|§|\binc(?:iso|s)?\.?\s)/i;
// "L.C 320/94", "LC nº 320/1994" — forma abreviada que o extrator do motor não cobre (caso real: ementa da LC 474/2002)
const RE_LC_ABREVIADA = /\bL\.?\s?C\.?\s*(?:n[º°.o]*\s*)?(\d[\d.]*)\s*\/\s*(\d{2,4})\b/gi;

/**
 * alteradorasPelaEmenta(catalogo) → [{ base: idSapl, alteradora: idSapl }]
 *
 * Os vínculos da fonte são cadastro humano e têm falhas: na LC 320/1994, 3 das
 * 10 alteradoras (LC 474/2002, LC 761/2015, LC 849/2019) NÃO têm vínculo, mas a
 * ementa de cada uma diz o que altera ("Inclui § 4º no art. 2º da Lei
 * Complementar nº 320, de 2 de maio de 1994…"). Esta função lê as ementas do
 * catálogo e propõe pares (lei alterada, alteradora) — CANDIDATOS: quem decide
 * se há alteração de fato é o texto da alteradora, ao ser aplicado.
 * Só entram ementas que começam por verbo de alteração (ou "revoga" seguido de
 * dispositivo); a lei citada tem de existir no catálogo e ser mais antiga.
 */
export function alteradorasPelaEmenta(catalogo) {
  const porChave = new Map(); // "tipoSapl|numero|ano" → registro
  const porNumero = new Map(); // "tipoSapl|numero" → [registros]
  for (const r of catalogo.values()) {
    porChave.set(`${r.tipoSapl}|${r.numero}|${r.ano}`, r);
    const k = `${r.tipoSapl}|${r.numero}`;
    if (!porNumero.has(k)) porNumero.set(k, []);
    porNumero.get(k).push(r);
  }
  const pares = [];
  const vistos = new Set();
  for (const alt of catalogo.values()) {
    const ementa = String(alt.ementa || '').replace(/\s+/g, ' ').trim();
    if (!RE_VERBO_ALTERA.test(ementa) && !RE_REVOGA_DISPOSITIVO.test(ementa)) continue;
    const alvos = [];
    for (const ref of extrairReferenciasLei(ementa)) {
      const tipo = TIPO_SAPL_DO_ATO[ref.tipoAto];
      const anos = ref.ano ? [Number(ref.ano)] : ref.anosCandidatos || [];
      for (const ano of anos) { const r = porChave.get(`${tipo}|${ref.numero}|${ano}`); if (r) alvos.push(r); }
    }
    let m;
    RE_LC_ABREVIADA.lastIndex = 0;
    while ((m = RE_LC_ABREVIADA.exec(ementa))) {
      const numero = m[1].replace(/\./g, '');
      const candidatos = (porNumero.get(`6|${numero}`) || []).filter((r) => (m[2].length === 4 ? r.ano === Number(m[2]) : r.ano % 100 === Number(m[2])));
      if (candidatos.length === 1) alvos.push(candidatos[0]); // ano de 2 dígitos ambíguo: não adivinha
    }
    for (const base of alvos) {
      if (base.idSapl === alt.idSapl || String(base.data) > String(alt.data)) continue;
      const k = `${base.idSapl}<${alt.idSapl}`;
      if (!vistos.has(k)) { vistos.add(k); pares.push({ base: base.idSapl, alteradora: alt.idSapl }); }
    }
  }
  return pares;
}
