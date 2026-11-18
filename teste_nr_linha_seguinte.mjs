// teste_nr_linha_seguinte.mjs — bloco de redação alterada cujo "(NR)" vem sozinho na
// linha SEGUINTE ao fecha-aspas. Textos REAIS (LC 804/2017 e LC 834/2017, extraídos do
// SAPL da PGM) em fixtures/lcs-nr/. Sem rede. Uso: node teste_nr_linha_seguinte.mjs
import fs from 'node:fs';
import { detectNRCandidates } from './norma-core.js';
import { estruturarNorma } from './ingestao/estrutura.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const txt = (id) => fs.readFileSync(`./fixtures/lcs-nr/${id}.txt`, 'utf8');
const reg = (id) => JSON.parse(fs.readFileSync(`./fixtures/lcs-nr/${id}.json`, 'utf8'));

const b = detectNRCandidates(txt(40856));
ok('LC 804 (real): 3 blocos de redação alterada detectados', b.length === 3);
ok('LC 804 (real): o 1º bloco (art. 4º alterado) termina no "(NR)" da linha seguinte; os blocos 2 e 3 (artigos novos 7º-A e 16-A) corretamente não têm "(NR)"', b[0].semNR === false && b[1].semNR === true && b[2].semNR === true);
for (const id of [40856, 41717]) {
  const r = estruturarNorma(txt(id), reg(id));
  ok(`LC ${reg(id).numero} (real): sem "trecho_nao_localizado_na_origem"`, !r.verificacao.motivos.includes('trecho_nao_localizado_na_origem'));
  ok(`LC ${reg(id).numero} (real): o "(NR)" não gruda no dispositivo que introduz o bloco`, !r.dispositivos.some((d) => /\(NR\)\s*$/.test(d.texto || '')));
}
ok('LC 804 (real) é aceita', estruturarNorma(txt(40856), reg(40856)).verificacao.situacao === 'aceita');
const sint = 'Art. 1º O art. 2º passa a vigorar com a seguinte redação:\n\n“Art. 2º Texto novo.”\n(NR)\n\nArt. 2º Esta Lei entra em vigor.';
ok('(sintético) "(NR)" colado ao fecha-aspas na mesma linha continua valendo', detectNRCandidates('Art. 1º O art. 2º passa a vigorar com a seguinte redação:\n\n“Art. 2º Texto novo.” (NR)\n').every((x) => x.semNR === false));
ok('(sintético) "(NR)" na linha seguinte também fecha o bloco', detectNRCandidates(sint).every((x) => x.semNR === false) && detectNRCandidates(sint).length === 1);
console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
