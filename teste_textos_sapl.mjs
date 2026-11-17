// teste_textos_sapl.mjs
//
// Extração de texto e fila de download (funções puras de ingestao/).
// Fixture REAL: fixtures/sapl/lei9113_2003_sirel.html — Lei nº 9.113/2003,
// arquivo do legado SIREL exatamente como servido pelo SAPL da PGM (16/11/2026).
// Sem rede. Uso: node teste_textos_sapl.mjs

import { readFile } from 'node:fs/promises';
import { htmlSirelParaTexto, removerRepeticaoIntegral, removerRepeticaoDeTexto, contarAlfanumericos, extensaoDaUrl } from './ingestao/extracao-texto.mjs';
import { filaDeDownload, normalizarRegistroSapl, normalizarVinculoSapl } from './ingestao/sapl-comum.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

// --- htmlSirelParaTexto (real) -------------------------------------------
const bytes = await readFile('./fixtures/sapl/lei9113_2003_sirel.html');
const { texto, repeticoes } = htmlSirelParaTexto(bytes);
const linhas = texto.split('\n');
ok('Lei 9.113/2003: acentos decodificados (windows-1252 → "LEI Nº 9.113")', linhas.includes('LEI Nº 9.113, de 16 de maio de 2003.'));
ok('Lei 9.113/2003: nenhum caractere de substituição nem tag sobrando', !/�|<[a-z\/]/i.test(texto));
ok('Lei 9.113/2003: preâmbulo em linha própria', linhas.some((l) => /^O PREFEITO MUNICIPAL DE PORTO ALEGRE\.?$/.test(l)));
ok('Lei 9.113/2003: "Art. 1º" e "Art. 2º" iniciam linha', linhas.filter((l) => /^Art\. [12]º /.test(l)).length === 2);
ok('Lei 9.113/2003: parágrafo único preservado', linhas.some((l) => l.startsWith('Parágrafo único')));
ok('Lei 9.113/2003: fecho presente', linhas.some((l) => l.startsWith('PREFEITURA MUNICIPAL DE PORTO ALEGRE, 16 de maio de 2003')));
ok('Lei 9.113/2003: palavras coladas da fonte NÃO são "arrumadas"', texto.includes('logradouropúblico'));
ok('Lei 9.113/2003: título da página ("SIREL") fica fora do texto', !linhas.includes('SIREL'));
ok('Lei 9.113/2003: o arquivo traz o documento 3 vezes; fica uma cópia e a contagem', repeticoes === 3 && linhas.filter((l) => l.startsWith('LEI Nº 9.113')).length === 1);
ok('(sintético) repetição parcial não é mexida', removerRepeticaoIntegral(['a', 'b', 'c', 'a', 'b', 'x']).repeticoes === 1);
ok('(sintético) bloco curto demais (menos de 3 linhas) não é tratado como repetição', removerRepeticaoIntegral(['a', 'a', 'a', 'a']).repeticoes === 1);
ok('contarAlfanumericos ignora pontuação e espaço ("º" conta como letra)', contarAlfanumericos('Art. 1º – a b') === 7);

// --- documento repetido em texto de PDF (real: LC 692/2012) -----------------
{
  const bruto = await readFile('./fixtures/lc320/lc692.txt', 'utf8');
  const r = removerRepeticaoDeTexto(bruto);
  ok('LC 692/2012 (PDF com a lei 3 vezes): fica uma cópia, com a contagem', r.repeticoes === 3 && (r.texto.match(/LEI COMPLEMENTAR Nº 692/g) || []).length === 1 && (bruto.match(/LEI COMPLEMENTAR Nº 692/g) || []).length === 3);
  ok('LC 692/2012: a cópia que fica vai até o fim do fecho e mantém a formatação das linhas', /Registre-se e publique-se/.test(r.texto) === /Registre-se e publique-se/.test(bruto) && bruto.startsWith(r.texto.slice(0, 200)));
  const lc514 = await readFile('./fixtures/lc320/lc514.txt', 'utf8');
  ok('texto sem repetição não é tocado (LC 514/2004)', removerRepeticaoDeTexto(lc514).repeticoes === 1 && removerRepeticaoDeTexto(lc514).texto === lc514);
}

// --- extensaoDaUrl -------------------------------------------------------
ok('extensaoDaUrl: PDF com %20 no nome', extensaoDaUrl('https://legislacao.portoalegre.rs.gov.br/media/sapl/public/normajuridica/sirel/LC%20135.pdf') === 'pdf');
ok('extensaoDaUrl: maiúscula vira minúscula', extensaoDaUrl('https://x.example/a/B.PDF') === 'pdf');
ok('extensaoDaUrl: sem extensão → bin', extensaoDaUrl('https://x.example/a/b') === 'bin');

// --- filaDeDownload (registros reais do fixture de catálogo) --------------
const amostra = JSON.parse(await readFile('./fixtures/sapl/normas_amostra.json', 'utf8')).map(normalizarRegistroSapl);
{
  const fila = filaDeDownload(amostra, new Set());
  ok('fila: só normas com URL de texto (4 das 7)', fila.length === 4 && fila.every((r) => r.texto.url));
  ok('fila: Lei Orgânica primeiro, depois LC, depois leis', fila.map((r) => r.tipoSapl).join(',') === '1,6,5,5');
  ok('fila: dentro do tipo, a mais recente primeiro (Lei 12.845/2021 antes da 689/1951)', fila[2].idSapl === 43271 && fila[3].idSapl === 9965);
  ok('fila: já resolvidos saem', filaDeDownload(amostra, new Set([25277, 43271])).length === 2);
  const dobrado = amostra.concat([{ ...amostra.find((r) => r.idSapl === 43271), texto: { situacao: 'sem_texto', url: null, formato: null } }]);
  ok('(sintético) fila: vale a ÚLTIMA ocorrência do idSapl no catálogo', filaDeDownload(dobrado, new Set()).length === 3);
}

// --- normalizarVinculoSapl (registro real da API, 16/11/2026) --------------
{
  const v = normalizarVinculoSapl({ id: 5429, __str__: 'Principal: Lei municipal nº 4, de 05 de maio de 1886 - Relacionada: Lei municipal-Intendência nº 2, de 13 de março de 1893', metadata: {}, resumo: '', norma_principal: 6658, norma_relacionada: 6677, tipo_vinculo: 1 });
  ok('vínculo: principal, relacionada e tipo preservados', v.idVinculo === 5429 && v.principal === 6658 && v.relacionada === 6677 && v.tipoVinculo === 1);
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
