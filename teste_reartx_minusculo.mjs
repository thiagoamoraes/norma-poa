// teste_reartx_minusculo.mjs — rodada 61 (decisão 57, item 1): linha de bloco de alteração que COMEÇA por "art. N"
// em minúscula é continuação de frase (citação), não início de artigo. O `reArtX` de `extrairRedacaoAlterada`
// tinha a flag /i e abria um falso artigo, partindo o texto. Real: Emenda à Lei Orgânica 46/2019 (id 44301),
// art. 116-A, § 2º ("…inc. III do § 2º do" / "art. 198 da Constituição Federal de 1988, …").
import { extrairRedacaoAlterada } from './norma-core.js';
let ok = 0, ko = 0;
const t = (desc, cond) => { if (cond) { ok++; console.log(`  ✓ ${desc}`); } else { ko++; console.log(`  ✗ ${desc}`); } };

// trecho real do arquivo da fonte (linhas 26–39 de dados/textos/sapl/44301.txt), sem as linhas em branco
const bloco = [
  '“Art. 116-A. Fica obrigatória a execução orçamentária e financeira da',
  'programação incluída por emendas individuais do Legislativo Municipal a Projeto de Lei',
  'Orçamentária Anual (LOA).',
  '§ 1º A programação incluída por emendas de vereadores a Projeto de Lei',
  'Orçamentária Anual será aprovada no limite de 0,65% (zero vírgula sessenta e cinco por cento)',
  'da receita corrente líquida do projeto encaminhado pelo Executivo Municipal, devendo a metade',
  'desse percentual ser destinado a ações de serviços públicos de saúde.',
  '§ 2º A execução do montante destinado a ações de serviços públicos de saúde',
  'previstos no § 1º deste artigo, inclusive custeio, será computada para os fins do inc. III do § 2º do',
  'art. 198 da Constituição Federal de 1988, vedada a destinação para pagamento de pessoal ou',
  'encargos sociais.” (NR)',
];
const r = extrairRedacaoAlterada(bloco);
const raiz = r.artigos;
const artigos = raiz;
const achatar = (ns) => ns.flatMap((n) => [n, ...achatar(n.children || [])]);
const par2 = achatar(raiz).find((n) => n.desFixo === '§ 2º');

console.log('Linha "art. 198 da Constituição…" (minúscula) dentro do § 2º');
t('o bloco tem UM só artigo (o 116-A), não dois', artigos.length === 1);
t('o § 2º termina em "…encargos sociais." (texto inteiro)', !!par2 && /encargos sociais\.?$/.test(par2.texto.trim()));
t('o § 2º contém "art. 198 da Constituição Federal de 1988"', !!par2 && /art\. 198 da Constituição Federal de 1988/.test(par2.texto));

console.log('Início de artigo de verdade continua reconhecido (com "A" maiúsculo, em caixa alta e com sufixo)');
const r2 = extrairRedacaoAlterada(['“Art. 5º-A Texto do artigo.', 'Art. 6º Outro artigo.', 'ARTIGO 7 Terceiro artigo.” (NR)']);
const a2 = r2.artigos.map((n) => n.desFixo);
t('"Art. 5º-A", "Art. 6º" e "ARTIGO 7" seguem sendo artigos', a2.length === 3);
console.log(`\nteste_reartx_minusculo: ${ok}/${ok + ko}`);
process.exit(ko ? 1 : 0);
