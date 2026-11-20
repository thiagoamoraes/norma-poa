// ingestao/revisao-compilacao.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F3): compara o texto vigente que o motor
// apurou para uma lei (o estado FINAL de cada dispositivo no histórico) com uma
// compilação colada pelo revisor (ex.: a do leis.org, copiada à mão).
//
// A compilação é só AUXÍLIO DE CONFERÊNCIA, nunca gabarito: onde ela diverge do
// texto da lei, vale a lei (decisão do mantenedor, 17/11/2026). Por isso a
// comparação não "corrige" nada: ela lista as diferenças para o revisor decidir.
//
// Puro, sem I/O, roda no navegador. Depende só do core e de `chaveParaId`.

import { parseLeiAlvoIndex, prepararTextoOrigem } from '../norma-core.js';
import { chaveParaId } from './historico.mjs';

/** Normalização só para comparar (espaços, travessões, aspas, anotações de redação). Nunca é gravada. */
export function normalizarParaComparar(s) {
  return String(s || '').replace(/\s+/g, ' ').replace(/[–—]/g, '-').replace(/\s*\((?:Redação|Parágrafo|Suprimid|Vide|Revogad)[^)]*\)\s*/gi, ' ').replace(/[“”]/g, '"').trim().replace(/[.;:,]+$/, '').toLowerCase();
}

// a compilação costuma colar o fecho da lei no fim do último artigo
const FECHO = /^[\s.,;:-]*(prefeitura municipal|gabinete da presid[eê]ncia da c[âa]mara municipal|c[âa]mara municipal) de porto alegre,? \d/i;

/**
 * compararComCompilacao(historico, textoCompilado) →
 *   { itens: [{ id, rotulo, estado, motor?, compilado?, situacaoMotor? }], resumo, naoMapeadas: [chave…] }
 *
 * estado: 'igual' | 'diferente' | 'so_no_motor' | 'so_na_compilacao'
 * `historico`: o JSON de dados/historico/sapl/<id>.json (campo `dispositivos[].estados`).
 */
export function compararComCompilacao(historico, textoCompilado) {
  const ref = parseLeiAlvoIndex(prepararTextoOrigem(String(textoCompilado || '')));
  const compilado = new Map();
  const naoMapeadas = [];
  for (const [chave, texto] of Object.entries(ref)) {
    const id = chaveParaId(chave);
    if (id) compilado.set(id, texto); else naoMapeadas.push(chave);
  }
  const motor = new Map();
  for (const d of historico.dispositivos || []) {
    const ultimo = d.estados[d.estados.length - 1];
    motor.set(d.id, { rotulo: d.rotulo, texto: ultimo.texto ?? '', situacao: ultimo.situacao });
  }
  const itens = [];
  const ids = [...new Set([...motor.keys(), ...compilado.keys()])];
  for (const id of ids) {
    const m = motor.get(id), c = compilado.get(id);
    const item = { id, rotulo: m?.rotulo ?? null };
    if (m) { item.motor = m.texto; item.situacaoMotor = m.situacao; }
    if (c !== undefined) item.compilado = c;
    if (!m) item.estado = 'so_na_compilacao';
    else if (c === undefined) item.estado = 'so_no_motor';
    else {
      const a = normalizarParaComparar(m.texto), b = normalizarParaComparar(c);
      item.estado = a === b || (b.startsWith(a) && FECHO.test(b.slice(a.length))) ? 'igual' : 'diferente';
    }
    itens.push(item);
  }
  const conta = (e) => itens.filter((i) => i.estado === e).length;
  return { itens, naoMapeadas, resumo: { total: itens.length, igual: conta('igual'), diferente: conta('diferente'), so_no_motor: conta('so_no_motor'), so_na_compilacao: conta('so_na_compilacao') } };
}
