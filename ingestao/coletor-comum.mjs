// coletor-comum.mjs — utilidades compartilhadas entre o coletor de cadernos
// (dopa-discovery.mjs) e o extrator de texto de normas (pdf-normas.mjs).
// Só o que as duas pontas da ingestão precisam em comum — sem I/O de rede.
// ESM, sem dependências além de receber os itens já extraídos pelo pdfjs-dist.

export function agruparPorLinha(items) {
  // Agrupa itens de texto do PDF.js por proximidade vertical (mesma linha
  // de leitura). Tolerância pequena porque fonte/kerning variam um pouco
  // a coordenada y de caracteres na "mesma" linha visual.
  //
  // IMPORTANTE 1: o PDF.js entrega os itens na ordem em que aparecem no
  // fluxo interno do PDF, não necessariamente da esquerda pra direita —
  // um trecho em negrito (ex.: o número da norma) pode vir escrito DEPOIS
  // de um trecho à direita dele na página. Por isso guardamos x junto e
  // ordenamos por x DENTRO de cada linha antes de concatenar.
  //
  // IMPORTANTE 2: quando o PDF marca o espaço só como AFASTAMENTO entre dois
  // itens (sem um item " "), concatenar direto cola as palavras — visto com
  // dado real no caderno 6158: "acesse o link" (itálico) + "a seguir" virou
  // "linka seguir". Se o vão entre o fim de um item e o começo do próximo for
  // maior que ~20% do corpo da fonte e nenhum dos dois já tiver espaço na
  // fronteira, inserimos um espaço.
  // Limiar medido (409 pares consecutivos nos 5 cadernos reais): fragmentos
  // da MESMA palavra têm vão ≤ 0,031 do corpo; espaços reais, ≥ 0,278
  // (largura do espaço em Arial); zero pares entre 0,05 e 0,27. O 0,2 fica
  // no vazio entre os dois grupos.
  const grupos = [];
  const tolerancia = 2;
  for (const item of items) {
    const y = item.transform[5];
    let grupo = grupos.find((g) => Math.abs(g.y - y) < tolerancia);
    if (!grupo) {
      grupo = { y, itens: [] };
      grupos.push(grupo);
    }
    grupo.itens.push({
      x: item.transform[4],
      str: item.str,
      largura: item.width ?? 0,
      corpo: item.height ?? 0,
    });
  }
  return grupos.map((g) => {
    const ordenados = g.itens.filter((i) => i.str !== '').sort((a, b) => a.x - b.x);
    let texto = '';
    let anterior = null;
    for (const it of ordenados) {
      if (anterior) {
        const vao = it.x - (anterior.x + anterior.largura);
        const jaTemEspaco = /\s$/.test(anterior.str) || /^\s/.test(it.str);
        if (!jaTemEspaco && vao > 0.2 * (it.corpo || anterior.corpo || 10)) texto += ' ';
      }
      texto += it.str;
      anterior = it;
    }
    return { y: g.y, texto: texto.replace(/[ \t]{2,}/g, ' ') };
  });
}
