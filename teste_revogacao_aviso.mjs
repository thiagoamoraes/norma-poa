// teste_revogacao_aviso.mjs — decisão 48: revogação que o motor reconhece mas não interpreta (lista com item de Tabela, "caput e seus §§",
// intervalo sem lei-base, revogação condicionada) NÃO fica mais em silêncio: a norma segue aceita, com o aviso `revogacao_nao_interpretada`
// e a contagem em `metricas.revogacoesNaoLidas`. Norma cuja revogação plural foi lida inteira não leva o aviso.
// Textos REAIS do SAPL da PGM (dados/textos/sapl/<id>.txt). Sem rede. Uso: node teste_revogacao_aviso.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const est = (id) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8')), null).verificacao;

const a = est(46293);
ok('id 46293 (real, LC 1.0xx: revoga "Tabela IV/V" da LC 7): aviso revogacao_nao_interpretada, 3 pontos, e NÃO reprova (decisão 48)', a.avisos.includes('revogacao_nao_interpretada') && a.metricas.revogacoesNaoLidas === 3 && !a.motivos.length);
const b = est(43501);
ok('id 43501 (real): "o caput do art. 47 e seus §§" e "as Tabelas II e III" → 2 pontos não lidos; os itens limpos não contam', b.avisos.includes('revogacao_nao_interpretada') && b.metricas.revogacoesNaoLidas === 2);
const c = est(50200);
ok('id 50200 (real): 4 itens "Tabela II … Anexo" → 4 pontos não lidos', c.metricas.revogacoesNaoLidas === 4);
const d = est(47888);
ok('negativo (real, id 47888): "Ficam revogados os arts. 59, 60, 61 e 62 da LC 765" foi lido inteiro: sem o aviso', !d.avisos.includes('revogacao_nao_interpretada') && d.metricas.revogacoesNaoLidas === undefined);
ok('o aviso não é motivo de revisão: as quatro normas seguem aceitas', [a, b, c, d].every((x) => x.situacao === 'aceita'));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
