// teste_rotulo_embutido.mjs — rodada 61 (decisão 57, item 4): a conferência acusa rótulo de inciso EMBUTIDO no texto de outro
// dispositivo (o inciso foi engolido e a norma saía "aceita" com o dispositivo incompleto). Textos REAIS do SAPL da PGM:
//  (id 42533, Lei 12.707/2020) o inciso VII vem escrito "Vll" (dois "l" minúsculos); sem o rótulo reconhecido, "; e Vll – …" fica dentro do VI;
//  (id 45738, Lei 13.396/2023) a extração do PDF perdeu os números "II" e "III": o "I – …" ficou dentro do caput do art. 3º;
//  (id 35123, antiga) "; e XII – …" dentro do inciso XI.
// Sinal: depois de ":" ou ";" aparece um rótulo romano seguido de travessão, dentro do texto de um dispositivo.
// Medido em 27/11/2026 nas 2.880 normas ACEITAS: exatamente estas 3 (nenhum falso positivo). Sem rede.
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';
let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/rotulo_embutido_registros.json', 'utf8'));
const residuo = JSON.parse(fs.readFileSync('./fixtures/textos/residuo_registros.json', 'utf8'));
const roda = (reg, arq) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(arq, 'utf8')), reg).verificacao;

for (const [id, desc] of [[42533, 'Lei 12.707/2020: "Vll" engole o inciso VII dentro do VI'], [45738, 'Lei 13.396/2023: incisos sem "II" e "III" dentro do caput do art. 3º'], [35123, 'antiga: "; e XII –" dentro do inciso XI']]) {
  const v = roda(regs.find((r) => r.idSapl === id), `./fixtures/textos/rotulo_embutido_${id}.txt`);
  ok(`id ${id} (real, ${desc}): deixa de ser aceita, com o motivo rotulo_embutido_no_texto`, v.situacao === 'revisar' && v.motivos.includes('rotulo_embutido_no_texto'));
}
// controles: normas reais bem formadas, com incisos de verdade, continuam aceitas e sem o motivo
for (const id of [37136, 42014]) {
  const v = roda(residuo.find((r) => r.idSapl === id), `./fixtures/textos/residuo_${id}.txt`);
  ok(`id ${id} (real, controle): continua aceita e sem rotulo_embutido_no_texto`, v.situacao === 'aceita' && !v.motivos.includes('rotulo_embutido_no_texto'));
}
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
