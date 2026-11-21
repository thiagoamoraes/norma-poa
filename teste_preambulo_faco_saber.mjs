// teste_preambulo_faco_saber.mjs — "Faço saber…", "O PREFEITOMUNICIPAL DE PORTO ALEGRE", "O PRESIDENTE DA CÂMARA MUNICIPAL…" NUNCA são ementa.
// Antes, a cabeça de preâmbulo só era reconhecida como "O PREFEITO MUNICIPAL" (com espaço); quando o OCR/a extração comia o espaço, ou a cabeça
// se perdia, a frase "Faço saber que a Câmara Municipal aprovou e eu sanciono/promulgo a seguinte…" ficava no fim da EMENTA (213 normas, quase
// todas leis complementares antigas) e a Resolução promulgada pela Câmara (res3006) também. Agora a cabeça em MAIÚSCULAS no início da linha
// (com o espaço que o OCR come) e a frase "Faço saber" ancoram o preâmbulo. Textos REAIS (dados/textos/sapl/<id>.txt; res3006.txt do DOPA). Sem rede.
import fs from 'node:fs';
import * as c from './norma-core.js';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const doc = (id) => c.parseMinuta(prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8')));
const limpa = (d) => !/Fa[cç]o\s*saber|sanci\s*ono|promulgo/i.test(c.visText(d.ementa));

const a = doc(17878);
ok('LC 12/1975 compilada (real, id 17878): "O PREFEITOMUNICIPAL DE PORTO ALEGRE. Faço saber… sanciono a seguinte Lei Complementar:" é preâmbulo, não ementa', /^O PREFEITOMUNICIPAL/.test(a.preambulo || '') && limpa(a) && /Institui posturas/.test(c.visText(a.ementa)));
const b = doc(21359);
ok('LC 54/1980 (real, id 21359): sem cabeça ("Faço saber, no uso das atribuições…" sozinha) → a frase abre o preâmbulo e a ementa fica só com "Altera a Lei Complementar nº 43…"', /^Fa[cç]o saber/.test(b.preambulo || '') && limpa(b) && /Altera\s+a Lei Complementar/.test(c.visText(b.ementa)));
const p = doc(22675);
ok('lei de 1980 (real, id 22675): "O PRESIDENTE DA CÂMARA MUNICIPAL DE PORTO ALEGRE. Faço saber, no uso das atribuições…" é preâmbulo', /^O PRESIDENTE DA C[ÂA]MARA/.test(p.preambulo || '') && limpa(p));
const g = doc(25559);
ok('LC 1992 (real, id 25559, veto derrubado): o preâmbulo sai da ementa e "CÓDIGO DE LIMPEZA URBANA / CAPÍTULO I" deixam de ser ementa (viram agrupadores depois do preâmbulo)', /^O PRESIDENTE DA C[ÂA]MARA/.test(g.preambulo || '') && !/CAPITULO I|CAP[ÍI]TULO I/i.test(c.visText(g.ementa)) && g.artigos[0].grupos?.length > 0 || (g.artigos[0].gruposAntes || []).length > 0);
const r = c.parseMinuta(fs.readFileSync('./res3006.txt', 'utf8'));
ok('Resolução 3.006/2026 (real, DOPA/SEI): "O PRESIDENTE DA CÂMARA MUNICIPAL DE PORTO ALEGRE / Faço saber… eu promulgo a seguinte Resolução:" é preâmbulo; a ementa é só "Concede a Comenda Porto do Sol…"', /^O PRESIDENTE DA C[ÂA]MARA/.test(r.preambulo || '') && /promulgo a seguinte Resolução:\s*$/.test(r.preambulo) && limpa(r) && /Concede a Comenda/.test(c.visText(r.ementa)));
const e28 = doc(36064);
ok('EC 28/2009 (real, id 36064; erro antigo): a ementa "…determinando que o Prefeito Municipal, nos 60 dias…" NÃO é preâmbulo (antes a ementa inteira virava preâmbulo e a ementa ficava vazia)', /^Inclui inc\. XXI/.test(c.visText(e28.ementa)) && /^A MESA DA C[ÂA]MARA/.test(e28.preambulo || ''));
const sint = (ementa) => c.parseMinuta(`LEI Nº 1, DE 1º DE MARÇO DE 2020.\n${ementa}\nO PREFEITO MUNICIPAL DE PORTO ALEGRE\nFaço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei:\nArt. 1º Texto.\nArt. 2º Esta Lei entra em vigor na data de sua publicação.`);
ok('(sintético) negativo: ementa que cita "o Prefeito Municipal" no meio ou no início em caixa mista continua ementa', (() => { const d = sint('Autoriza o Prefeito Municipal a doar imóvel.'); return /Autoriza o Prefeito Municipal/.test(c.visText(d.ementa)) && /^O PREFEITO MUNICIPAL/.test(d.preambulo); })());
ok('(sintético) negativo: "O Presidente da Câmara Municipal" em caixa mista no começo da linha da ementa não abre preâmbulo', (() => { const d = sint('O Presidente da Câmara Municipal fica autorizado a contratar.'); return /fica autorizado a contratar/.test(c.visText(d.ementa)); })());
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
