// teste_catalogo_sapl.mjs
//
// Testa as funções puras de ingestao/sapl-comum.mjs contra registros REAIS da
// API do SAPL da PGM (fixtures/sapl/normas_amostra.json — 7 registros colhidos
// em 16/11/2026, com o campo operacional `ip` esvaziado).
// Sem rede. Uso: node teste_catalogo_sapl.mjs

import { readFile } from 'node:fs/promises';
import {
  linkDaObservacao, situacaoTexto, normalizarRegistroSapl,
  lacunasDeSequencia, compactarFaixas, ESCOPO_INICIAL, conferirDopa, dataBrParaIso,
} from './ingestao/sapl-comum.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

const amostra = JSON.parse(await readFile('./fixtures/sapl/normas_amostra.json', 'utf8'));
const porId = Object.fromEntries(amostra.map((r) => [r.id, r]));

// --- situacaoTexto -----------------------------------------------------
{
  const s = situacaoTexto(porId[43271]); // Lei 12.845/2021 — PDF anexado
  ok('Lei 12.845/2021: situação "arquivo"', s.situacao === 'arquivo');
  ok('Lei 12.845/2021: URL convertida para https', s.url.startsWith('https://legislacao.portoalegre.rs.gov.br/media/'));
  ok('Lei 12.845/2021: formato pdf', s.formato === 'pdf');
}
{
  const s = situacaoTexto(porId[9965]); // Lei 689/1951 — só link SIREL na observação
  ok('Lei 689/1951: situação "link_observacao"', s.situacao === 'link_observacao');
  ok('Lei 689/1951: URL do legado SIREL extraída', /\/normajuridica\/sirel\//.test(s.url));
}
{
  const s = situacaoTexto(porId[9869]); // Lei 608/1951 — observação só com nº de processo
  ok('Lei 608/1951: observação sem link → "sem_texto"', s.situacao === 'sem_texto' && s.url === null);
}
ok('Lei-Intendência 254/1929: observação vazia → "sem_texto"', situacaoTexto(porId[7913]).situacao === 'sem_texto');
{
  const s = situacaoTexto(porId[23449]); // LC 135/1986 — tem arquivo E link na observação
  ok('LC 135/1986: `texto_integral` prevalece sobre link da observação', s.situacao === 'arquivo' && /LC%20135\.pdf$/.test(s.url));
}
ok('Emenda à LOM 1/1951: sem texto', situacaoTexto(porId[9976]).situacao === 'sem_texto');

// --- linkDaObservacao --------------------------------------------------
ok('linkDaObservacao: null/"" → null', linkDaObservacao(null) === null && linkDaObservacao('') === null);
ok('linkDaObservacao: texto sem âncora → null', linkDaObservacao(porId[9869].observacao) === null);

// --- normalizarRegistroSapl --------------------------------------------
{
  const n = normalizarRegistroSapl(porId[25277]); // LOM 1990
  ok('LOM 1990: identidade preservada', n.idSapl === 25277 && n.tipoSapl === 1 && n.numero === '1' && n.ano === 1990 && n.data === '1990-04-03');
  ok('LOM 1990: ementa e observação intactas (sem "arrumar" texto de fonte)', n.ementa === porId[25277].ementa && n.observacao === porId[25277].observacao);
  ok('campos operacionais do SAPL não vão para o catálogo', !('ip' in n) && !('user' in n) && !('metadata' in n));
  ok('registro leva a situação do texto', n.texto.situacao === 'arquivo' && n.fonte === 'sapl-pgm');
}
ok('escopo inicial: LOM, emendas, LC e lei', [1, 2, 5, 6].every((t) => t in ESCOPO_INICIAL) && Object.keys(ESCOPO_INICIAL).length === 4);

// --- lacunasDeSequencia / compactarFaixas (sintético) --------------------
{
  const l = lacunasDeSequencia(['1', '2', '5', '6', '9', '12-A', '']);
  ok('(sintético) lacunas: faltantes 3,4,7,8', JSON.stringify(l.faltantes) === '[3,4,7,8]' && l.minimo === 1 && l.maximo === 9);
  ok('(sintético) lacunas: não numéricos são devolvidos, não descartados', l.naoNumericos.length === 2 && l.naoNumericos.includes('12-A'));
  ok('(sintético) compactarFaixas', compactarFaixas([3, 4, 7, 8, 9, 15]) === '3–4, 7–9, 15');
  ok('(sintético) lista vazia', lacunasDeSequencia([]).faltantes.length === 0 && compactarFaixas([]) === '');
}

// --- conferirDopa -------------------------------------------------------
// Fixture REAL: índice da Edição 7889 do DOPA (Executivo, 16/11/2026), como
// lido por dopa-discovery.mjs em 17/11/2026 — 10 leis, nº 14.688 a 14.697.
{
  const edicao = JSON.parse(await readFile('./fixtures/dopa/edicao_7889_executivo.json', 'utf8'));
  const catalogo = amostra.map(normalizarRegistroSapl); // nenhuma dessas 10 leis está na amostra
  const c = conferirDopa([edicao], catalogo, '2026-11-17');
  ok('DOPA 7889: as 10 leis publicadas aparecem como ausentes do catálogo', c.ausentes.length === 10 && c.noCatalogo.length === 0);
  ok('DOPA 7889: publicada em 16/11, conferida em 17/11 → 1 dia', c.ausentes.every((e) => e.dias === 1 && e.publicadoEm === '2026-11-16'));
  const lei14692 = { ...catalogo.find((r) => r.idSapl === 43271), numero: '14692', ano: 2026 };
  const c2 = conferirDopa([edicao], catalogo.concat([lei14692]), '2026-11-17');
  ok('(sintético) com a Lei 14.692/2026 no catálogo, ela sai dos ausentes ("14.692" casa com "14692")', c2.noCatalogo.length === 1 && c2.noCatalogo[0].numero === '14.692' && c2.ausentes.length === 9);
  const rm = { tipoAto: 'Resolução de Mesa', numero: '674', ano: '2026', textoIndice: 'RESOLUÇÃO DE MESA Nº 674, DE 1º DE SETEMBRO DE 2026', linkNorma: 'x' };
  const c3 = conferirDopa([{ data: '02/09/2026', poder: 'legislativo', numeroEdicao: 1, entradas: [rm, rm] }], catalogo, '2026-11-17');
  ok('(sintético) Resolução de Mesa vai para "só o DOPA traz", uma vez só mesmo se repetida', c3.foraDoSapl.length === 1 && c3.ausentes.length === 0);
  ok('dataBrParaIso', dataBrParaIso('16/11/2026') === '2026-11-16' && dataBrParaIso('ontem') === null);
  ok('(sintético) mesma norma em dois cadernos conta uma vez, pela 1ª publicação', conferirDopa([{ ...edicao, data: '17/11/2026' }, edicao], catalogo, '2026-11-20').ausentes.every((e) => e.publicadoEm === '2026-11-16') );
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
