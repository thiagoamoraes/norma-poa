// ingestao/revisao-ancoras.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F1): para uma norma estruturada, diz
// ONDE, no texto de origem, está cada trecho que a árvore guarda e como cada um
// passou na conferência do estruturador (ok | rótulo não confere | não localizado),
// mais os trechos de texto que ficaram fora da árvore (lacunas).
//
// Função pura, sem I/O. Não reimplementa a conferência: reaproveita
// `conferirConservacao` (que devolve as posições em coordenadas só de letras e
// algarismos) e converte para deslocamentos no texto de origem.

import { conferirConservacao } from './estrutura.mjs';

/** Mapa do texto só com letras/algarismos (como a conferência o vê) para o deslocamento no texto original. */
function mapaAlnum(texto) {
  const idx = [];
  const re = /[\p{L}\p{N}]/gu;
  let m;
  while ((m = re.exec(texto)) !== null) for (let k = 0; k < m[0].length; k++) idx.push(m.index + k);
  return idx;
}

/**
 * ancorarConferencia(textoPreparado, reg) → { texto, itens, lacunas, resumo }
 *
 *  - `textoPreparado`: o texto depois de `prepararTextoExtraido` (o mesmo que o estruturador leu).
 *  - `reg`: o registro estruturado (`dados/estruturado/sapl/<id>.json` ou a saída de `estruturarNorma`).
 *
 * `texto` é a base sobre a qual valem os deslocamentos `ini`/`fim` (texto sem os brancos iniciais,
 * em NFC). `itens` seguem a ordem da conferência: ementa, preâmbulo, e para cada dispositivo seus
 * agrupadores, ele mesmo e o bloco de alteração; por fim o fecho.
 */
export function ancorarConferencia(textoPreparado, reg) {
  const bruto = String(textoPreparado);
  const base = bruto.slice(Math.max(0, bruto.search(/\S/))).normalize('NFC');
  const refs = [];
  const trechos = [];
  const poe = (item, ref) => { trechos.push(item); refs.push(ref); };
  poe(reg.ementa || '', { ref: 'ementa' });
  poe(reg.preambulo || '', { ref: 'preambulo' });
  for (const d of (reg.dispositivos || []).filter((x) => x.tipo !== 'anexo')) {
    for (const g of d.agrupadores || []) poe(g.titulo || '', { ref: 'agrupador', id: d.id });
    poe({ texto: d.texto || '', rotulo: d.rotulo }, { ref: 'dispositivo', id: d.id, rotulo: d.rotulo || null });
    if (Object.prototype.hasOwnProperty.call(d, 'blocoDeAlteracao')) poe(d.blocoDeAlteracao || '', { ref: 'bloco', id: d.id });
  }
  poe(reg.fecho || '', { ref: 'fecho' });
  // anexos (nós da raiz) vêm DEPOIS do fecho no texto: mesma ordem da conferência do estruturador
  for (const d of (reg.dispositivos || []).filter((x) => x.tipo === 'anexo')) poe(d.texto || '', { ref: 'dispositivo', id: d.id, rotulo: null });

  const cons = conferirConservacao(base, trechos);
  const idx = mapaAlnum(base);
  const aoTexto = (pos, len) => {
    if (len === 0) { const p = idx[pos] ?? base.length; return [p, p]; }
    return [idx[pos], idx[pos + len - 1] + 1];
  };

  const itens = cons.ancoras.map((a) => {
    const item = { ...refs[a.i], situacao: a.situacao };
    if (a.situacao !== 'nao_localizado') { const [ini, fim] = aoTexto(a.pos, a.len); item.ini = ini; item.fim = fim; }
    return item;
  });
  // rótulo que não confere: o que está escrito logo antes do trecho, para mostrar ao revisor
  let k = 0;
  for (const it of itens) {
    if (it.situacao === 'rotulo_diverge') it.naOrigem = cons.rotulosDivergentes[k++]?.naOrigem ?? null;
  }

  // lacunas: a 1ª, se pequena (timbre/epígrafe antes da ementa), é esperada — mesma regra do estruturador
  const lacunas = cons.posLacunas.map((p, i) => {
    const esperada = i === 0 && cons.lacunas[i].tamanho < 400 && !p.noFim;
    const [ini, fim] = p.fim > p.ini ? aoTexto(p.ini, p.fim - p.ini) : [base.length, base.length];
    return { ini, fim, noFim: !!p.noFim, esperada };
  });

  const resumo = {
    rotulosDivergentes: itens.filter((i) => i.situacao === 'rotulo_diverge').length,
    naoLocalizados: itens.filter((i) => i.situacao === 'nao_localizado').length,
    lacunasReais: lacunas.filter((l) => !l.esperada).length,
  };
  return { texto: base, itens, lacunas, resumo };
}
