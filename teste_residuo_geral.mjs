// teste_residuo_geral.mjs — três bugs do leitor/preparo que sobravam nas normas recentes (21/11/2026), textos REAIS do SAPL da PGM:
//  (id 38364) título de agrupador com muitas linhas em branco entre o número e o título ("Seção II" / vazio / vazio / "Dos Órgãos…"):
//             a varredura limitava-se a 8 linhas BRUTAS e estourava;
//  (id 37136) "Art .10." (espaço antes do ponto, número colado) → "Art. 10.";
//  (id 42014) epígrafe "LEI Nº COMPLEMENTAR Nº 848" (primeiro "Nº" a mais).
// A conferência não foi tocada. Sem rede. Uso: node teste_residuo_geral.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido, colarPontoDoArtigo } from './ingestao/extracao-texto.mjs';
import { extrairCabecalhoLeiPublicada } from './norma-core.js';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/residuo_registros.json', 'utf8'));
const reg = (id) => regs.find((r) => r.idSapl === id);
const roda = (id, arq) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(arq, 'utf8')), reg(id)).verificacao;

const v1 = roda(38364, './dados/textos/sapl/38364.txt');
ok('id 38364 (real, 5 cópias, título depois de várias linhas em branco): sem "trecho_nao_localizado" nem "texto_fora_da_arvore" e aceita', !v1.motivos.includes('trecho_nao_localizado_na_origem') && !v1.motivos.includes('texto_fora_da_arvore') && v1.situacao === 'aceita');
const v2 = roda(37136, './fixtures/textos/residuo_37136.txt');
ok('id 37136 (real, "Art .10."): aceita, sem motivos', v2.situacao === 'aceita' && v2.motivos.length === 0);
ok('"Art .10." vira "Art. 10." e "Art . 59 -" (espaço dos dois lados) fica como está (sintético)', colarPontoDoArtigo('  Art .10. Texto\n  Art . 59 - Outro') === '  Art. 10. Texto\n  Art . 59 - Outro');
const c42014 = extrairCabecalhoLeiPublicada(fs.readFileSync('./fixtures/textos/residuo_42014.txt', 'utf8'));
ok('id 42014 (real, "LEI Nº COMPLEMENTAR Nº 848"): o cabeçalho é reconhecido como lei complementar nº 848 de 22/03/2019', !!c42014 && c42014.numero === '848' && c42014.tipoAto === 'LEI COMPLEMENTAR' && c42014.dataPublicacao === '2019-03-22');
const v3 = roda(42014, './fixtures/textos/residuo_42014.txt');
ok('id 42014 (real): sem "cabecalho_nao_reconhecido" e aceita', !v3.motivos.includes('cabecalho_nao_reconhecido') && v3.situacao === 'aceita');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
