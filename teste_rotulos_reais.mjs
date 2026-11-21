// teste_rotulos_reais.mjs — causas de `rotulo_nao_confere_com_a_origem` que eram do LEITOR (não da lei):
//  (D3) "§ N …" no início de linha que é só citação ("…e do" / "§ 1º deste artigo");
//  (D4) "conforme" / "segue:" partidos em duas linhas, que escondiam o bloco entre aspas;
//  (D5) "( NR)" com espaço; (A1) hifenização "milési-" / "mo)" que não pode juntar com marcador de alínea.
// Textos REAIS do SAPL da PGM (fixtures/textos/rotulo_*.txt, lc1005_2024.txt, ruido_41876.txt). A conferência
// NÃO foi afrouxada: o caso negativo (artigo realmente pulado) continua acusado. Sem rede. Uso: node teste_rotulos_reais.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regsA = JSON.parse(fs.readFileSync('./fixtures/textos/rotulo_registros.json', 'utf8'));
const regsB = JSON.parse(fs.readFileSync('./fixtures/textos/ruido_registros.json', 'utf8'));
const regsC = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_estrutura.json', 'utf8'));
const roda = (arq, reg) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(arq, 'utf8')), reg).verificacao;
const sem = (v) => !v.motivos.includes('rotulo_nao_confere_com_a_origem');

ok('id 36114 (real): "§ N" no início de linha que é citação não vira parágrafo', sem(roda('./fixtures/textos/rotulo_36114.txt', regsA.find((r) => r.idSapl === 36114))));
ok('id 40278 (real): idem', sem(roda('./fixtures/textos/rotulo_40278.txt', regsA.find((r) => r.idSapl === 40278))));
ok('id 36373 (real): "conforme" / "segue:" em duas linhas não esconde o bloco entre aspas', sem(roda('./fixtures/textos/rotulo_36373.txt', regsA.find((r) => r.idSapl === 36373))));
ok('LC 838/2018 (real): idem (cue partido)', sem(roda('./fixtures/textos/ruido_41876.txt', regsB.find((r) => r.idSapl === 41876))));
ok('id 40111 (real): "milési-" / "mo)" é uma palavra hifenizada, não marcador de alínea', sem(roda('./fixtures/textos/rotulo_40111.txt', regsA.find((r) => r.idSapl === 40111))));
const v1005 = roda('./fixtures/textos/lc1005_2024.txt', regsC.find((r) => r.tipoSapl === 6 && r.numero === '1005'));
ok('LC 1.005/2024 (real): "( NR)" com espaço fecha o bloco; os arts. 10 a 12 não são mais engolidos; o único motivo que sobra é o anexo não lido (8 anexos depois do fecho)', sem(v1005) && v1005.motivos.every((m) => m === 'anexo_nao_lido'));

// negativo (a conferência continua acusando erro real): sobre a LC 1.005, apagar o artigo 11 inteiro desloca os seguintes
const t = prepararTextoExtraido(fs.readFileSync('./fixtures/textos/lc1005_2024.txt', 'utf8'));
const i11 = t.search(/^\s*Art\.\s*11[.º°]?\s/m), i12 = t.search(/^\s*Art\.\s*12[.º°]?\s/m);
const bruto = t.slice(0, i11) + t.slice(i12);
const vNeg = estruturarNorma(bruto, regsC.find((r) => r.tipoSapl === 6 && r.numero === '1005')).verificacao;
ok('(sintético) negativo: sem o artigo 11 no texto (deslocamento real), o rótulo que não confere continua acusado', i11 > 0 && i12 > i11 && vNeg.motivos.includes('rotulo_nao_confere_com_a_origem'));
// (decisão 25) fronteira do rótulo: o sufixo do texto não basta ("I" onde está escrito "XXXI")
const v43543 = roda('./fixtures/textos/rotulo_43543.txt', regsA.find((r) => r.idSapl === 43543));
ok('LC 925/2021 (real): o inciso "XXXI" lido como "I" deixa de ser aceito por terminar igual (falso aceite)', !sem(v43543) && v43543.situacao === 'revisar' && v43543.metricas.rotulosDivergentes.some((d) => d.rotulo === 'I –' && /XXXI$/.test(d.naOrigem)));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
