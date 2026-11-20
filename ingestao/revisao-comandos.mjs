// ingestao/revisao-comandos.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F2): para uma lei ALTERADORA, mostra o
// que o extrator de comando entendeu (operação, lei-alvo, dispositivo-alvo, texto
// novo) e, quando a lei-alvo está na base, o antes e o depois do dispositivo.
//
// Função pura, sem I/O: quem chama entrega `resolverBase(chave)`, que devolve a
// lei-alvo ({ registro, texto }) se ela estiver na base, ou null.
//
// ATENÇÃO sobre o "antes/depois": cada comando é aplicado, SEPARADAMENTE, sobre a
// versão ORIGINAL da lei-alvo (sem as alterações intermediárias). Serve para o
// revisor ver o que o comando entendeu, não é o texto vigente na data da alteradora.

import * as c from '../norma-core.js';

export const TIPO_ATO_DO_CATALOGO = { 1: 'LEI ORGÂNICA', 2: 'EMENDA À LEI ORGÂNICA', 5: 'LEI', 6: 'LEI COMPLEMENTAR' };
/** Data da Lei Orgânica nº 1/1990, a única vigente: o alvo presumido "Lei Orgânica do Município" não vale antes dela. */
export const DATA_LEI_ORGANICA_VIGENTE = '1990-04-03';
const OPERACOES_COM_EFEITO = ['replace_text', 'insert_node', 'revoke_node', 'renumber_node'];
const SEM_EFEITO = ['nao_classificado', 'clausula_generica_sem_efeito'];
const CORTE = 500;
const corta = (t) => { const s = String(t ?? ''); return s.length > CORTE ? { texto: s.slice(0, CORTE), truncado: true } : { texto: s, truncado: false }; };

/** Fonte (identidade) de uma lei a partir do registro do catálogo — a identidade vem do catálogo, não do arquivo. */
export function fonteDoRegistroCatalogo(registro) {
  return { tipoAto: TIPO_ATO_DO_CATALOGO[registro.tipoSapl] || '', numero: String(registro.numero), ano: String(registro.ano), dataPublicacao: registro.data };
}

const textoDe = (versao, dispositivo) => {
  const caminho = dispositivo ? c.localizarCaminho(versao, dispositivo) : null;
  if (!caminho) return null;
  const no = caminho[caminho.length - 1].node;
  return { texto: no.texto ?? '', revogado: !!no.revogado, vetado: !!no.vetado };
};

/**
 * descreverComandos(textoAlteradora, fonteAlteradora, resolverBase) →
 *   { comandos: [...], semEfeito: n, indeterminados: n, classificacaoConfiavel, erro? }
 *
 * `situacao` de cada comando:
 *   'alvo_nao_identificado'   o extrator não resolveu a lei-alvo
 *   'alvo_fora_da_base'       lei-alvo identificada, mas o texto dela não está na base
 *   'dispositivo_nao_encontrado' lei-alvo na base, mas o endereço citado não existe nela (citação incorreta, ou o dispositivo veio de alteração anterior)
 *   'aplicavel'               lei-alvo e dispositivo na base: tem antes/depois
 *   'recusado'                o motor recusou o comando (motivo em `erro`)
 *   'sem_aplicacao'           operação sem aplicação automática (indeterminado, revoga a lei toda…)
 */
export function descreverComandos(textoAlteradora, fonteAlteradora, resolverBase) {
  const limpar = (t) => c.limparMarkdownLinks(String(t).trim());
  let doc;
  try { doc = c.parseMinuta(limpar(textoAlteradora), c.detectNRCandidates(limpar(textoAlteradora))); } catch (e) { return { comandos: [], semEfeito: 0, indeterminados: 0, classificacaoConfiavel: false, erro: `leitura falhou: ${e.message}` }; }

  // 1ª passagem sem a lei-base, só para saber quais leis são alvo
  let comandos;
  try { comandos = c.extrairComandosLei(doc, {}); } catch (e) { return { comandos: [], semEfeito: 0, indeterminados: 0, classificacaoConfiavel: false, erro: `extração falhou: ${e.message}` }; }
  const alvos = [...new Set(comandos.filter((k) => !SEM_EFEITO.includes(k.operacao) && k.leiAlvo?.chave).map((k) => k.leiAlvo.chave))];

  // com UMA lei-alvo na base, refaz com o índice dela: só assim replace × insert é confiável (CLAUDE.md)
  const bases = new Map();
  const base = (chave) => { if (!bases.has(chave)) { const b = resolverBase ? resolverBase(chave) : null; let v0 = null; if (b) { try { v0 = c.criarVersaoOriginal(c.parseMinuta(limpar(b.texto)), fonteDoRegistroCatalogo(b.registro)); } catch { v0 = null; } } bases.set(chave, v0 ? { v0, registro: b.registro } : null); } return bases.get(chave); };
  let confiavel = false;
  if (alvos.length === 1 && base(alvos[0])) {
    try { comandos = c.extrairComandosLei(doc, { leiBaseIndex: c.indexarVersao(base(alvos[0]).v0) }); confiavel = true; } catch { /* mantém a 1ª passagem */ }
  }

  const saida = [];
  let semEfeito = 0;
  for (const k of comandos) {
    if (SEM_EFEITO.includes(k.operacao)) { semEfeito++; continue; }
    const item = { artigoOrigem: k.artigoOrigem ?? null, operacao: k.operacao, lei: k.leiAlvo?.raw ?? null, chave: k.leiAlvo?.chave ?? null, dispositivo: k.dispositivoAlvo ?? null, temNR: !!k.temNR };
    if (k.novoTexto != null) Object.assign(item, { novo: corta(k.novoTexto).texto, novoTruncado: corta(k.novoTexto).truncado });
    if (!OPERACOES_COM_EFEITO.includes(k.operacao)) { item.situacao = k.leiAlvo ? 'sem_aplicacao' : 'alvo_nao_identificado'; saida.push(item); continue; }
    if (!k.leiAlvo?.chave) { item.situacao = 'alvo_nao_identificado'; saida.push(item); continue; }
    if (k.leiAlvo.presumida) {
      item.presumido = true; // "Lei Orgânica do Município", sem número na frase: resolvida PARA a LO de 1990 (decisão de 20/11/2026)
      if (String(fonteAlteradora.dataPublicacao || '') < DATA_LEI_ORGANICA_VIGENTE) { item.situacao = 'alvo_nao_identificado'; item.erro = 'Lei Orgânica anterior a 1990: a presunção (LO nº 1/1990) não vale para ato desta data'; saida.push(item); continue; }
    }
    const b = base(k.leiAlvo.chave);
    if (!b) { item.situacao = 'alvo_fora_da_base'; saida.push(item); continue; }
    item.alvoNaBase = { idSapl: b.registro.idSapl, rotulo: b.registro.rotulo };
    const antes = textoDe(b.v0, k.dispositivoAlvo);
    const r = c.aplicarComandoLei(b.v0, k, fonteAlteradora);
    if (r.erro) { item.situacao = antes || k.operacao === 'insert_node' ? 'recusado' : 'dispositivo_nao_encontrado'; item.erro = r.erro.replace(/\(comando: .*$/, '').trim(); if (antes) Object.assign(item, { antes: corta(antes.texto).texto }); saida.push(item); continue; }
    item.situacao = 'aplicavel';
    if (antes) Object.assign(item, { antes: corta(antes.texto).texto, antesRevogado: antes.revogado, antesVetado: antes.vetado });
    const depois = textoDe(r.versao, k.dispositivoAlvo);
    if (depois) Object.assign(item, { depois: corta(depois.texto).texto, depoisRevogado: depois.revogado });
    saida.push(item);
  }
  return { comandos: saida, semEfeito, indeterminados: saida.filter((i) => i.operacao === 'indeterminado').length, classificacaoConfiavel: confiavel };
}
