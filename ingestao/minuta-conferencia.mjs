// ingestao/minuta-conferencia.mjs
//
// Prova de ida e volta da minuta: o MOTOR lê o texto gerado como leria uma lei
// alteradora de verdade, e o que ele entende tem de ser exatamente o que foi
// pedido — mesma operação, mesmo dispositivo, mesmo texto. Se não for, a
// minuta não deve ser usada como está.
//
// Sem rede, sem disco. Roda no Node e no navegador (importa só o norma-core.js).

import { parseMinuta, detectNRCandidates, extrairComandosLei } from '../norma-core.js';
import { idParaChave } from './minuta.mjs';

const igual = (a, b) => String(a || '').replace(/\s+/g, ' ').trim() === String(b || '').replace(/\s+/g, ' ').trim();

/**
 * conferirMinuta(texto, dispositivos, pedidosResolvidos, renumeracoes?) → { confere, comandosLidos, faltando[], sobrando[], divergentes[] }
 *   dispositivos: estado vigente (com `texto`) — serve de índice da lei-base para o motor
 *   pedidosResolvidos / renumeracoes: como devolvidos por gerarMinuta()
 */
export function conferirMinuta(texto, dispositivos, pedidosResolvidos, renumeracoes = []) {
  const indice = {};
  for (const d of dispositivos) indice[idParaChave(d.id)] = d.texto || '';
  const doc = parseMinuta(texto, detectNRCandidates(texto));
  const lidos = extrairComandosLei(doc, { leiBaseIndex: indice })
    .filter((k) => ['replace_text', 'insert_node', 'revoke_node', 'renumber_node'].includes(k.operacao))
    .map((k) => ({ operacao: k.operacao, chave: k.dispositivoAlvo, texto: k.novoTexto || '' }));

  const OP = { nova_redacao: 'replace_text', inclusao: 'insert_node', inclusao_artigo: 'insert_node', revogacao: 'revoke_node' };
  const esperados = pedidosResolvidos.map((p) => ({ operacao: OP[p.operacao], chave: idParaChave(p.id), texto: p.operacao === 'revogacao' ? '' : p.texto }))
    .concat(renumeracoes.map((r) => ({ operacao: 'renumber_node', chave: idParaChave(r.de), texto: '' })));

  const faltando = [], divergentes = [];
  const usados = new Set();
  for (const e of esperados) {
    const i = lidos.findIndex((l, k) => !usados.has(k) && l.chave === e.chave);
    if (i < 0) { faltando.push(e); continue; }
    usados.add(i);
    const l = lidos[i];
    if (l.operacao !== e.operacao || (e.texto && !igual(l.texto, e.texto))) divergentes.push({ esperado: e, lido: l });
  }
  const sobrando = lidos.filter((_, k) => !usados.has(k));
  return { confere: !faltando.length && !sobrando.length && !divergentes.length, comandosLidos: lidos.length, faltando, sobrando, divergentes };
}
