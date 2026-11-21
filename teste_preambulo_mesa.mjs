// teste_preambulo_mesa.mjs — o preâmbulo de ato promulgado pela Câmara/Mesa NUNCA é ementa. Antes, "A MESA DIRETORA DA CÂMARA MUNICIPAL DE PORTO
// ALEGRE, no uso das atribuições…, promulga a seguinte Emenda à Lei Orgânica:" (e "A MESA DA CÂMARA…", forma antiga) ia parar no fim da
// EMENTA das Emendas à Lei Orgânica (47 de 52 no acervo) e o preâmbulo ficava vazio; só "A CÂMARA MUNICIPAL … DECRETA" e "O PREFEITO MUNICIPAL"
// eram reconhecidos. Agora: "A MESA [DIRETORA] …" em maiúsculas e "… DECRETA/PROMULGA" abrem o preâmbulo. Textos REAIS do SAPL da PGM
// (dados/textos/sapl/<id>.txt: EC 51, EC 46, EC 4). Sem rede. Uso: node teste_preambulo_mesa.mjs
import fs from 'node:fs';
import * as c from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const ler = (id) => prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8'));
const doc = (id) => c.parseMinuta(ler(id));
const em = (d) => c.visText(d.ementa);

for (const [id, nome] of [[49145, 'EC 51/2024'], [44301, 'EC 46/2016']]) {
  const d = doc(id);
  ok(`${nome} (real, id ${id}): o preâmbulo começa em "A MESA DIRETORA DA CÂMARA MUNICIPAL…" e termina em "promulga a seguinte Emenda à Lei Orgânica:"`, /^A MESA DIRETORA DA C[ÂA]MARA MUNICIPAL/.test(d.preambulo || '') && /promulga a seguinte Emenda à Lei Org[âa]nica:\s*$/.test(d.preambulo));
  ok(`${nome} (real): a ementa não leva mais "no uso das atribuições", "MESA" nem "promulga a seguinte"`, !/no uso das atribui|MESA|promulga a seguinte/i.test(em(d)));
}
const d4 = doc(27350);
ok('EC 4/1993 (real, id 27350; forma antiga "A MESA DA CÂMARA MUNICIPAL…"): o preâmbulo começa em "A MESA DA CÂMARA" e a ementa fica só com "Acrescenta alínea ao inciso III do artigo 203…"', /^A MESA DA C[ÂA]MARA MUNICIPAL/.test(d4.preambulo || '') && /Acrescenta al[ií]nea/.test(em(d4)) && !/MESA|promulga/i.test(em(d4)));
const e = estruturarNorma(ler(49145), null);
ok('estruturação da EC 51 (real): preâmbulo preenchido, ementa sem a promulgação, norma segue aceita', /^A MESA DIRETORA/.test(e.preambulo || '') && !/promulga a seguinte/i.test(typeof e.ementa === 'string' ? e.ementa : e.ementa?.texto || '') && e.verificacao.situacao === 'aceita');
const sint = (linhas) => c.parseMinuta(`EMENDA À LEI ORGÂNICA Nº 1, DE 1º DE MARÇO DE 2020.\nAltera o art. 5º da Lei Orgânica do Município de Porto Alegre.\n${linhas}\nArt. 1º O art. 5º passa a vigorar com nova redação.\nArt. 2º Esta Emenda entra em vigor na data de sua publicação.`);
ok('(sintético) "A MESA DIRETORA DECRETA:" abre o preâmbulo', /^A MESA DIRETORA DECRETA/.test(sint('A MESA DIRETORA DECRETA:').preambulo || ''));
ok('(sintético) "A CÂMARA MUNICIPAL DE PORTO ALEGRE PROMULGA:" abre o preâmbulo', /PROMULGA/.test(sint('A CÂMARA MUNICIPAL DE PORTO ALEGRE PROMULGA:').preambulo || ''));
ok('(sintético) negativo: ementa em caixa mista que fala da Mesa não vira preâmbulo', (() => { const d = sint('Dispõe sobre a Mesa Diretora e a Câmara Municipal.'); return !d.preambulo && /Mesa Diretora/.test(c.visText(d.ementa)); })());
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
