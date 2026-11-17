// teste_emenda_lo.mjs — cabeçalho de Emenda à Lei Orgânica (core) e a estruturação dela.
// Textos REAIS de fixtures/emendas-lo/ (extraídos do SAPL da PGM, sem retoque) com o
// registro real do catálogo ao lado. Sem rede. Uso: node teste_emenda_lo.mjs
import fs from 'node:fs';
import { extrairCabecalhoLeiPublicada } from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const txt = (id) => fs.readFileSync(`./fixtures/emendas-lo/${id}.txt`, 'utf8');
const reg = (id) => JSON.parse(fs.readFileSync(`./fixtures/emendas-lo/${id}.json`, 'utf8'));
const T = 'EMENDA À LEI ORGÂNICA';

let c = extrairCabecalhoLeiPublicada(txt(40404)); // linhas "PROC. Nº…/PELO Nº…" antes do título
ok('EC 37/2015 (real, com linhas de PROC./PELO antes): tipo, número, ano e data', c?.tipoAto === T && c.numero === '37' && c.ano === '2015' && c.dataPublicacao === '2015-12-16');
c = extrairCabecalhoLeiPublicada(txt(37910));
ok('EC 32/2011 (real): data 2011-12-19', c?.numero === '32' && c.dataPublicacao === '2011-12-19');
c = extrairCabecalhoLeiPublicada(txt(34370));
ok('EC 23/2006 (real, "N.º" e "JUNHO DE2006" sem espaço): data 2006-06-26', c?.numero === '23' && c.dataPublicacao === '2006-06-26');
c = extrairCabecalhoLeiPublicada(txt(35889));
ok('EC 26 (real, ano cortado na linha): número vale, data NÃO é inventada', c?.tipoAto === T && c.numero === '26' && c.ano === null && c.dataPublicacao === null);
c = extrairCabecalhoLeiPublicada(txt(27350));
ok('EC 4/1993 (real, só "Nº 04"): número sem zero à esquerda, sem data', c?.tipoAto === T && c.numero === '4' && c.dataPublicacao === null);
ok('linha que só cita o tipo continua sinalizada como não suportada (sintético)', extrairCabecalhoLeiPublicada('EMENDA À LEI ORGÂNICA\nTexto')?.tipoNaoSuportado === T);
ok('Lei comum não é afetada (sintético)', extrairCabecalhoLeiPublicada('LEI Nº 100, DE 1 DE MARÇO DE 2000.')?.tipoAto === 'LEI');

for (const id of [40404, 37910, 34370]) {
  const r = estruturarNorma(txt(id), reg(id));
  ok(`EC ${reg(id).numero}: estruturada sem "cabecalho_nao_reconhecido" nem "tipo_sem_suporte"`, !r.verificacao.motivos.includes('cabecalho_nao_reconhecido') && !r.verificacao.motivos.includes('tipo_sem_suporte'));
}
ok('EC 37/2015 é aceita (passa em todas as conferências)', estruturarNorma(txt(40404), reg(40404)).verificacao.situacao === 'aceita');
const r30 = estruturarNorma(txt(30834), reg(30834));
ok('EC 16 (real): data do texto (20/10/2000) ≠ catálogo (10/10/2000) é apontada, não escondida', r30.verificacao.motivos.includes('data_diverge_do_catalogo'));
console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
