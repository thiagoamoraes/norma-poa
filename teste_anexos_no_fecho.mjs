// teste_anexos_no_fecho.mjs — decisões 34 a 36 (21/11/2026). O leitor guarda tudo depois do fecho em `doc.fecho` e a
// conferência de conservação contava isso como coberto: uma norma com ANEXO de texto/tabela saía "aceita" sem o anexo ter
// sido lido. Agora: anexo com texto ou tabela → motivo `anexo_nao_lido` ("a revisar"); anexo só título/gráfico (mapa, planta,
// croqui, carimbo de assinatura) → norma aceita, com o aviso `anexo_grafico_nao_lido`. O motor ainda NÃO lê anexos (decisão 33).
// Textos REAIS do SAPL da PGM (fixtures/textos/anexo_*). Sem rede. Uso: node teste_anexos_no_fecho.mjs
import fs from 'node:fs';
import { estruturarNorma, classificarAnexosNoFecho } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';
import { roteiroDeConferencia, tituloDoMotivo } from './ingestao/revisao.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/anexo_registros.json', 'utf8'));
const roda = (id) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/anexo_${id}.txt`, 'utf8')), regs.find((r) => r.idSapl === id));

for (const [id, nome, n] of [[49707, 'LC 1.033/2025 (8 anexos de tabela)', 8], [47674, 'LC 994/2023 (anexo com relação de imóveis)', 1]]) {
  const v = roda(id).verificacao;
  ok(`${nome}: antes "aceita" sem ler o anexo; agora "a revisar" com anexo_nao_lido`, v.situacao === 'revisar' && v.motivos.includes('anexo_nao_lido') && v.metricas.totalDeAnexos === n);
}
for (const [id, nome] of [[40791, 'LC 799/2016 (33 anexos só título)'], [41114, 'LC 811/2017 (anexos vetados, só título)'], [51498, 'Lei 14.584/2026 (carimbo de assinatura sob "ANEXO")']]) {
  const v = roda(id).verificacao;
  ok(`${nome}: segue aceita, sem anexo_nao_lido, com o aviso anexo_grafico_nao_lido`, v.situacao === 'aceita' && !v.motivos.includes('anexo_nao_lido') && v.avisos.includes('anexo_grafico_nao_lido'));
}
// unidades (sintéticas)
const fecho = (anexos) => 'PREFEITURA MUNICIPAL DE PORTO ALEGRE, 1º de março de 2020.\nRegistre-se e publique-se.\n' + anexos;
ok('(sintético) fecho sem anexo: nada é classificado', classificarAnexosNoFecho(fecho('')).length === 0);
ok('(sintético) "ANEXO I" com 3 linhas curtas é gráfico/título; com 7 linhas ou mais de 160 caracteres é "com conteúdo"', classificarAnexosNoFecho(fecho('ANEXO I\nMapa\nEscala 1:5000\nFonte: SMAM'))[0].graficoOuTitulo === true && classificarAnexosNoFecho(fecho('ANEXO I\n' + 'linha\n'.repeat(7)))[0].graficoOuTitulo === false && classificarAnexosNoFecho(fecho('ANEXO I\n' + 'x'.repeat(200)))[0].graficoOuTitulo === false);
ok('(sintético) "ANEXO" só reconhecido como cabeçalho estrito (início de linha, curto); frase que cita anexo no meio não conta', classificarAnexosNoFecho(fecho('Conforme o anexo desta Lei, valem as regras.')).length === 0 && classificarAnexosNoFecho(fecho('ANEXO II – Quadro de valores\na\nb')).length === 1);
ok('o motivo anexo_nao_lido tem título em português e o roteiro traz "Anexo que o motor não leu" com a lista dos anexos', tituloDoMotivo('anexo_nao_lido') !== 'Motivo ainda sem título' && roteiroDeConferencia(['anexo_nao_lido'], 'x', [], { anexos: [{ cabecalho: 'ANEXO I', linhas: 35, caracteres: 900, graficoOuTitulo: false }] }).some((r) => r.chave === 'anexos' && /ANEXO I — 35 linha/.test(r.trecho)));
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
