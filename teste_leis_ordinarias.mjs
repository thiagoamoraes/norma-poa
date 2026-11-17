// teste_leis_ordinarias.mjs
//
// O mesmo percurso da LC 320, agora com duas LEIS ORDINÁRIAS reais e suas
// alteradoras (fixtures/leis-ordinarias/, textos extraídos sem retoque dos
// arquivos da base da PGM em 17/11/2026; identidade em registros.json):
//   Lei nº 11.213/2012 (eventos no Largo Glênio Peres) ← Leis 11.575/2014,
//     12.458/2018, 12.615/2019 e 13.203/2022;
//   Lei nº 11.229/2012 (Bônus-Moradia) ← Leis 12.854/2021, 13.312/2022 e 13.967/2024.
// Estruturação, histórico e minuta com ida e volta. Sem rede.
// Uso: node teste_leis_ordinarias.mjs

import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';
import { apurarHistorico, alteradorasPelaEmenta } from './ingestao/historico.mjs';
import { gerarMinuta } from './ingestao/minuta.mjs';
import { conferirMinuta } from './ingestao/minuta-conferencia.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

const regs = JSON.parse(fs.readFileSync('./fixtures/leis-ordinarias/registros.json', 'utf8'));
const reg = (n) => regs.find((r) => r.numero === n);
const texto = (n) => prepararTextoExtraido(fs.readFileSync(`./fixtures/leis-ordinarias/lei${n}_${reg(n).ano}.txt`, 'utf8'));
const TODAS = ['11213', '11575', '12458', '12615', '13203', '11229', '12854', '13312', '13967'];

// --- estruturação --------------------------------------------------------------
{
  const e = Object.fromEntries(TODAS.map((n) => [n, estruturarNorma(texto(n), reg(n))]));
  ok('as 9 leis (7 PDF, 2 DOCX) são aceitas pela verificação', TODAS.every((n) => e[n].verificacao.situacao === 'aceita'));
  ok('fecho "PREFEITURA MUNIC IPAL DE PORTO ALEGRE" (grafia do arquivo, 2012–2015) é reconhecido: Leis 11.229/2012 e 11.575/2014', /^PREFEITURA MUNIC IPAL/.test(e['11229'].fecho) && /^PREFEITURA MUNIC IPAL/.test(e['11575'].fecho));
  ok('…e as assinaturas não grudam no último artigo (art. 12 da Lei 11.229: só a cláusula de vigência)', /^Esta Lei entra em vigor na data de sua publicação\.$/.test(e['11229'].dispositivos.find((d) => d.id === 'art-12').texto));
  ok('hifenização desfeita no texto estruturado (Lei 11.213, art. 3º: "poderão", "programas")', /poderão ser realizados eventos ou campanhas de assistência social, saúde ou programas governamentais/.test(e['11213'].dispositivos.find((d) => d.id === 'art-3').texto));
  ok('Lei 11.213/2012: 9 artigos; Lei 11.229/2012: 12 artigos', e['11213'].verificacao.metricas.artigos === 9 && e['11229'].verificacao.metricas.artigos === 12);
}

// --- de onde vêm as alteradoras -------------------------------------------------
{
  const catalogo = new Map(regs.map((r) => [r.idSapl, r]));
  const pares = alteradorasPelaEmenta(catalogo);
  const de = (base) => pares.filter((p) => p.base === reg(base).idSapl).map((p) => catalogo.get(p.alteradora).numero).sort().join(' ');
  ok('pelas ementas: as 4 alteradoras da Lei 11.213 e as 3 da Lei 11.229', de('11213') === '11575 12458 12615 13203' && de('11229') === '12854 13312 13967');
}

// --- histórico ----------------------------------------------------------------
const hist = (base, alts) => apurarHistorico({ registro: reg(base), texto: texto(base) }, alts.map((n) => ({ registro: reg(n), texto: texto(n), candidataPelaEmenta: true })));
const h1 = hist('11213', ['13203', '11575', '12615', '12458']);
const h2 = hist('11229', ['13967', '12854', '13312']);
const d = (h, id) => h.dispositivos.find((x) => x.id === id);
const ult = (h, id) => { const x = d(h, id); return x ? x.estados[x.estados.length - 1] : null; };
ok('Lei 11.213: 5 versões, todas as alteradoras aplicadas, nada a conferir', h1.versoes.length === 5 && h1.naoAplicadas.length === 0 && h1.aConferir.length === 0 && !h1.descartadas);
ok('Lei 11.213: parágrafo único do art. 2º com nova redação (Lei 11.575/2014) e incisos I a V, cada um da sua lei',
  ult(h1, 'art-2/par-unico').origem.lei === 'Lei nº 11.575/2014' && ['I', 'II', 'III', 'IV', 'V'].map((r) => ult(h1, `art-2/par-unico/inc-${r}`).origem.lei).join(' | ') === 'Lei nº 11.575/2014 | Lei nº 11.575/2014 | Lei nº 12.458/2018 | Lei nº 12.615/2019 | Lei nº 13.203/2022');
ok('Lei 11.213: as Leis 12.458 e 12.615 alteram DUAS leis (o calendário de eventos e esta); aqui só entra o comando desta', h1.versoes[2].comandosAplicados === 1 && h1.versoes[3].comandosAplicados === 1);
ok('Lei 11.229: 4 versões, todas as alteradoras aplicadas', h2.versoes.length === 4 && h2.naoAplicadas.length === 0 && h2.versoes.map((v) => v.comandosAplicados || 0).join() === '0,1,5,7');
ok('Lei 11.229: § 2º do art. 1º (Lei 13.312/2022) ganha o inc. IV pela Lei 13.967/2024', ult(h2, 'art-1/par-2/inc-III').origem.lei === 'Lei nº 13.312/2022' && ult(h2, 'art-1/par-2/inc-IV').origem.lei === 'Lei nº 13.967/2024');
ok('Lei 11.229: parágrafo único do art. 4º revogado e art. 10-A incluído pela Lei 13.967/2024', ult(h2, 'art-4/par-unico').situacao === 'revogado' && ult(h2, 'art-10-A').origem.operacao === 'insert_node' && h2.dispositivos.map((x) => x.id).join(' ').includes('art-10 art-10-A art-11'));
ok('Lei 11.229: art. 8º com a redação da Lei 12.854/2021', ult(h2, 'art-8').origem.lei === 'Lei nº 12.854/2021' && d(h2, 'art-8').estados.length === 2);

// --- minuta sobre lei ordinária -------------------------------------------------
{
  const vigente = h1.dispositivos.map((x) => ({ id: x.id, pai: x.pai, tipo: x.tipo, rotulo: x.rotulo, ...x.estados[x.estados.length - 1] })).filter((x) => x.situacao !== 'renumerado');
  const m = gerarMinuta({ lei: reg('11213'), dispositivos: vigente, explicacao: 'incluindo feira no rol de exceções', pedidos: [
    { operacao: 'inclusao', pai: 'art-2/par-unico', tipo: 'inciso', texto: 'a Feira do Livro Infantil, realizada no mês de outubro.' },
    { operacao: 'nova_redacao', alvo: 'art-6', texto: 'Fica vedada a utilização de som amplificado no Largo Jornalista Glênio Peres após as 22h (vinte e duas horas).' },
  ] });
  const L = m.texto.split('\n');
  ok('(sintético) lei ordinária: epígrafe "PROJETO DE LEI", "Lei nº 11.213, de 6 de fevereiro de 2012", "Esta Lei entra em vigor…"',
    L[0] === 'PROJETO DE LEI Nº ___/____' && /na Lei nº 11\.213, de 6 de fevereiro de 2012, e alterações posteriores, incluindo feira/.test(L[2]) && L[L.length - 2] === 'Art. 3º Esta Lei entra em vigor na data de sua publicação.');
  ok('(sintético) inciso novo dentro do parágrafo único: "Fica incluído inc. VI no parágrafo único do art. 2º…", com o parágrafo e os incisos anteriores em linha pontilhada',
    L[4] === 'Art. 1º Fica incluído inc. VI do parágrafo único no art. 2º da Lei nº 11.213, de 6 de fevereiro de 2012, e alterações posteriores, conforme segue:' || /^Art\. 1º Fica incluído inc\. VI/.test(L[4]));
  ok('(sintético) bloco: caput pontilhado, "Parágrafo único. ....", pontilhado, "VI – …” (NR)', /^“Art\. 2º \.+$/.test(L[5]) && /^Parágrafo único\. \.+$/.test(L[6]) && /^\.+$/.test(L[7]) && L[8] === 'VI – a Feira do Livro Infantil, realizada no mês de outubro.” (NR)');
  const conf = conferirMinuta(m.texto, vigente, m.pedidosResolvidos, m.renumeracoes);
  ok('IDA E VOLTA em lei ordinária: o motor lê de volta os 2 comandos pedidos (inciso em parágrafo único; nova redação de artigo)', conf.confere && conf.comandosLidos === 2);
}
{
  const vigente = h2.dispositivos.map((x) => ({ id: x.id, pai: x.pai, tipo: x.tipo, rotulo: x.rotulo, ...x.estados[x.estados.length - 1] })).filter((x) => x.situacao !== 'renumerado');
  const m = gerarMinuta({ lei: reg('11229'), dispositivos: vigente, explicacao: 'ajustando prioridades', pedidos: [
    { operacao: 'nova_redacao', alvo: 'art-1/par-2/inc-IV', texto: 'chefiadas por mulheres; ou' },
    { operacao: 'inclusao', pai: 'art-1/par-2', tipo: 'inciso', texto: 'com pessoas idosas.' },
    { operacao: 'inclusao_artigo', apos: 'art-10-A', texto: 'O Executivo Municipal regulamentará esta Lei.' },
  ] });
  ok('(sintético) Lei 11.229: artigo novo depois do art. 10-A recebe a letra seguinte (art. 10-B); inciso novo é o V', m.erros.length === 0 && /“Art\. 10-B\. O Executivo Municipal regulamentará esta Lei\.”/.test(m.texto) && m.texto.split('\n').includes('V – com pessoas idosas.') && /^\.+” \(NR\)$/m.test(m.texto)); // depois do inc. V ainda há o § 3º: linha pontilhada antes de fechar
  ok('(sintético) recusa nova redação do parágrafo único do art. 4º, revogado pela Lei 13.967/2024', /já está revogado/.test(gerarMinuta({ lei: reg('11229'), dispositivos: vigente, pedidos: [{ operacao: 'nova_redacao', alvo: 'art-4/par-unico', texto: 'x' }] }).erros.join()));
  const conf = conferirMinuta(m.texto, vigente, m.pedidosResolvidos, m.renumeracoes);
  ok('IDA E VOLTA na Lei 11.229: 3 comandos (inciso de parágrafo alterado, inciso incluído, artigo novo)', conf.confere && conf.comandosLidos === 3);
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
