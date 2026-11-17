// teste_minuta.mjs
//
// Minuta de lei alteradora (ingestao/minuta.mjs) com prova de ida e volta:
// a minuta é gerada sobre o TEXTO VIGENTE REAL da LC 320/1994 (o mesmo que
// teste_versionamento.mjs apura, com as dez alteradoras reais), depois o motor
// a lê como leria uma lei de verdade e a aplica — e o resultado tem de ser o
// que foi pedido. Os pedidos em si são (sintéticos): nenhuma redação aqui é lei.
// Sem rede. Uso: node teste_minuta.mjs

import fs from 'node:fs';
import * as c from './norma-core.js';
import { gerarMinuta, citar, idParaChave, rotuloDeAbertura, dataPorExtenso } from './ingestao/minuta.mjs';
import { conferirMinuta } from './ingestao/minuta-conferencia.mjs';
import { apurarHistorico } from './ingestao/historico.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

// --- texto vigente real da LC 320 -----------------------------------------
const regs = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_lc320.json', 'utf8'));
const reg = (n) => regs.find((r) => r.numero === n);
const arq = { 384: './lc384.txt', 412: './lc412.txt' };
const nums = ['384', '412', '449', '474', '514', '525', '692', '761', '849', '958'];
const h = apurarHistorico({ registro: reg('320'), texto: fs.readFileSync('./lc320.txt', 'utf8') },
  nums.map((n) => ({ registro: reg(n), texto: fs.readFileSync(arq[n] || `./fixtures/lc320/lc${n}.txt`, 'utf8') })));
const vigente = h.dispositivos.map((d) => ({ id: d.id, pai: d.pai, tipo: d.tipo, rotulo: d.rotulo, ...d.estados[d.estados.length - 1] })).filter((d) => d.situacao !== 'renumerado');
const lei = reg('320');

// a mesma lei como ÁRVORE do motor, para aplicar a minuta de verdade
let arvore = c.criarVersaoOriginal(c.parseMinuta(c.limparMarkdownLinks(fs.readFileSync('./lc320.txt', 'utf8').trim())), { tipoAto: 'LEI COMPLEMENTAR', numero: '320', ano: '1994', dataPublicacao: '1994-05-02' });
for (const n of nums) {
  const raw = c.limparMarkdownLinks(fs.readFileSync(arq[n] || `./fixtures/lc320/lc${n}.txt`, 'utf8').trim());
  const r = reg(n);
  arvore = c.apurarTextoVigente(arvore, [{ fonteAlteradora: { tipoAto: 'LEI COMPLEMENTAR', numero: n, ano: String(r.ano), dataPublicacao: r.data }, comandos: c.extrairComandosLei(c.parseMinuta(raw, c.detectNRCandidates(raw)), { leiBaseIndex: c.indexarVersao(arvore) }) }]).versaoFinal;
}
const aplicar = (texto) => {
  const comandos = c.extrairComandosLei(c.parseMinuta(texto, c.detectNRCandidates(texto)), { leiBaseIndex: c.indexarVersao(arvore) });
  return c.apurarTextoVigente(arvore, [{ fonteAlteradora: { tipoAto: 'LEI COMPLEMENTAR', numero: '9999', ano: '2027', dataPublicacao: '2027-01-01' }, comandos }]);
};
const no = (ver, chave) => { const p = c.localizarCaminho(ver, chave); return p ? p[p.length - 1].node : null; };
const recusas = (r) => r.log.filter((l) => !['nao_classificado', 'clausula_generica_sem_efeito'].includes(l.comando.operacao));

// --- 1. um pedido de cada tipo, juntos --------------------------------------
{
  const T = {
    art3: 'É vedado denominar logradouros ou equipamentos públicos com nomes de pessoas vivas ou de pessoas jurídicas.',
    par5: 'O disposto no § 4º aplica-se também aos equipamentos públicos.',
    par2: 'A consulta será realizada pelo órgão competente.',
    par10: 'A identificação será publicada no sítio eletrônico do Município.',
    art12c: 'O Executivo Municipal manterá cadastro público das denominações.',
  };
  const m = gerarMinuta({ lei, dispositivos: vigente, explicacao: 'ajustando regras de denominação', pedidos: [
    { operacao: 'nova_redacao', alvo: 'art-3', texto: T.art3 },
    { operacao: 'inclusao', pai: 'art-2', tipo: 'paragrafo', texto: T.par5 },
    { operacao: 'nova_redacao', alvo: 'art-8/par-2', texto: T.par2 },
    { operacao: 'inclusao', pai: 'art-10', tipo: 'paragrafo', texto: T.par10 },
    { operacao: 'inclusao_artigo', apos: 'art-12-B', texto: T.art12c },
    { operacao: 'revogacao', alvo: 'art-6' },
  ] });
  const L = m.texto.split('\n');
  ok('(sintético) minuta gerada sem erro; um aviso: o art. 10 tem parágrafo único', m.erros.length === 0 && m.avisos.length === 1 && /art\. 10 tem parágrafo único/.test(m.avisos[0]));
  ok('epígrafe de projeto de lei complementar', L[0] === 'PROJETO DE LEI COMPLEMENTAR Nº ___/____');
  ok('ementa no molde da LC 958/2022: altera…; inclui…; e revoga…, todos na Lei…, + explicação',
    L[2] === 'Altera o caput do art. 3º e o § 2º do art. 8º; inclui § 5º no art. 2º, § 2º no art. 10 e art. 12-C; e revoga o art. 6º, todos na Lei Complementar nº 320, de 2 de maio de 1994, e alterações posteriores, ajustando regras de denominação.');
  ok('artigos na ordem da lei alterada; 1ª remissão por extenso, as seguintes abreviadas',
    L[4] === 'Art. 1º Fica incluído § 5º no art. 2º da Lei Complementar nº 320, de 2 de maio de 1994, e alterações posteriores, conforme segue:'
    && L.includes('Art. 2º Fica alterado o caput do art. 3º da Lei Complementar nº 320, de 1994, e alterações posteriores, conforme segue:'));
  ok('dispositivo novo recebe o próximo número (§ 5º do art. 2º) — nada é renumerado', L.includes('§ 5º O disposto no § 4º aplica-se também aos equipamentos públicos.” (NR)'));
  ok('caput inalterado e sequência inalterada viram linha pontilhada (LC 611, art. 16, IV)', /^“Art\. 2º \.{20,}$/.test(L[5]) && /^\.{20,}$/.test(L[6]));
  ok('artigo novo: mesmo número do anterior + letra (art. 12-C) e bloco SEM "(NR)"', L.includes('“Art. 12-C. O Executivo Municipal manterá cadastro público das denominações.”'));
  ok('artigo com parágrafo único: a própria minuta manda renumerar (molde da LC 514/2004)',
    L.includes('Art. 4º Fica incluído § 2º no art. 10 da Lei Complementar nº 320, de 1994, e alterações posteriores, renumerando o atual parágrafo único para § 1º, conforme segue:'));
  ok('vigência antes da revogação; a cláusula de revogação cita a lei por extenso', L[L.length - 3] === 'Art. 6º Esta Lei Complementar entra em vigor na data de sua publicação.' && L[L.length - 2] === 'Art. 7º Fica revogado o art. 6º da Lei Complementar nº 320, de 2 de maio de 1994.');

  const conf = conferirMinuta(m.texto, vigente, m.pedidosResolvidos, m.renumeracoes);
  ok('IDA E VOLTA: o motor lê a minuta e entende exatamente os 7 comandos pedidos (6 pedidos + 1 renumeração)', conf.confere && conf.comandosLidos === 7);

  const r = aplicar(m.texto);
  const v = r.versaoFinal;
  ok('APLICAÇÃO sobre a árvore real: nenhum comando recusado', recusas(r).length === 0);
  ok('art. 3º com a nova redação, ponto final preservado', no(v, 'art. 3º').texto === T.art3);
  ok('§ 5º do art. 2º incluído; §§ 1º a 4º intocados', no(v, '§ 5º do art. 2º').texto === T.par5 && no(v, '§ 4º do art. 2º') === no(arvore, '§ 4º do art. 2º'));
  ok('§ 2º do art. 8º com a nova redação; §§ 1º, 3º e 4º intocados', no(v, '§ 2º do art. 8º').texto === T.par2 && no(v, '§ 3º do art. 8º') === no(arvore, '§ 3º do art. 8º'));
  ok('art. 10: o parágrafo único virou § 1º (mesmo texto) e o novo é o § 2º', no(v, 'parágrafo único do art. 10') === null && no(v, '§ 1º do art. 10').texto === no(arvore, 'parágrafo único do art. 10').texto && no(v, '§ 2º do art. 10').texto === T.par10);
  ok('art. 12-C incluído depois do art. 12-B', v.artigos.map((a) => a.desFixo).join('|').includes('Art. 12-B|Art. 12-C|Art. 13') && no(v, 'art. 12-c').texto === T.art12c);
  ok('art. 6º revogado, na árvore, sem renumerar o art. 7º', no(v, 'art. 6º').revogado === true && v.artigos[5].desFixo === 'Art. 6º' && v.artigos[6].desFixo === 'Art. 7º');
}

// --- 2. inciso e alínea, aninhados -------------------------------------------
{
  const m = gerarMinuta({ lei, dispositivos: vigente, explicacao: 'acrescentando categoria', pedidos: [
    { operacao: 'nova_redacao', alvo: 'art-9/inc-XX', texto: 'via de tráfego; e' },
    { operacao: 'inclusao', pai: 'art-9', tipo: 'inciso', texto: 'mirante.' },
    { operacao: 'inclusao', pai: 'art-12-B', tipo: 'inciso', apos: 'art-12-B/inc-II', texto: 'alça a via de ligação entre logradouros em desnível;' },
  ] });
  const L = m.texto.split('\n');
  ok('(sintético) inciso novo no fim: XXI; frase "Fica alterado o inc. XX e fica incluído inc. XXI no art. 9º…"',
    L.some((l) => /^Art\. 1º Fica alterado o inc\. XX e fica incluído inc\. XXI no art\. 9º da Lei Complementar nº 320, de 2 de maio de 1994/.test(l)) && L.includes('XXI – mirante.” (NR)'));
  ok('(sintético) inciso no meio: mesmo número do anterior + letra (II-A), sem renumerar os seguintes', L.includes('II-A – alça a via de ligação entre logradouros em desnível;'));
  const conf = conferirMinuta(m.texto, vigente, m.pedidosResolvidos, m.renumeracoes);
  ok('ida e volta dos incisos', conf.confere && conf.comandosLidos === 3);
  const r = aplicar(m.texto);
  ok('aplicação: inc. XXI do art. 9º e inc. II-A do art. 12-B existem; nenhum recusado', recusas(r).length === 0 && no(r.versaoFinal, 'inc. xxi do art. 9º')?.texto === 'mirante.' && /alça/.test(no(r.versaoFinal, 'inc. ii-a do art. 12-b')?.texto || ''));
}

// --- 3. um só pedido: ementa direta -----------------------------------------
{
  const m = gerarMinuta({ lei, dispositivos: vigente, pedidos: [{ operacao: 'revogacao', alvo: 'art-8/par-4' }] });
  const L = m.texto.split('\n');
  ok('(sintético) só revogação: ementa "Revoga o § 4º do art. 8º da Lei…", vigência no art. 1º e revogação no art. 2º',
    /^Revoga o § 4º do art\. 8º da Lei Complementar nº 320, de 2 de maio de 1994, e alterações posteriores, \[breve explicação/.test(L[2]) && L[4].startsWith('Art. 1º Esta Lei Complementar entra em vigor') && L[5] === 'Art. 2º Fica revogado o § 4º do art. 8º da Lei Complementar nº 320, de 2 de maio de 1994.');
  ok('sem a explicação da ementa, a minuta avisa (LC 611, art. 18, III)', m.avisos.some((a) => /breve explicação/.test(a)));
  ok('ida e volta e aplicação da revogação de parágrafo', conferirMinuta(m.texto, vigente, m.pedidosResolvidos).confere && no(aplicar(m.texto).versaoFinal, '§ 4º do art. 8º').revogado === true);
}

// --- 4. o que a minuta recusa ----------------------------------------------
{
  const erro = (pedidos) => gerarMinuta({ lei, dispositivos: vigente, pedidos }).erros.join(' | ');
  ok('recusa nova redação de dispositivo já revogado (art. 7º, revogado pela LC 958/2022)', /já está revogado/.test(erro([{ operacao: 'nova_redacao', alvo: 'art-7', texto: 'x' }])));
  ok('recusa dispositivo que não existe', /não existe no texto vigente/.test(erro([{ operacao: 'nova_redacao', alvo: 'art-99', texto: 'x' }])));
  ok('recusa incluir filho em dispositivo revogado', /está revogado; não recebe dispositivo novo/.test(erro([{ operacao: 'inclusao', pai: 'art-7', tipo: 'paragrafo', texto: 'x' }])));
  ok('recusa dois pedidos para o mesmo dispositivo', /mais de um pedido/.test(erro([{ operacao: 'nova_redacao', alvo: 'art-3', texto: 'a' }, { operacao: 'nova_redacao', alvo: 'art-3', texto: 'b' }])));
  ok('recusa alterar e revogar o mesmo artigo', /alterado e, ao mesmo tempo, revogado/.test(erro([{ operacao: 'nova_redacao', alvo: 'art-8/par-1', texto: 'a' }, { operacao: 'revogacao', alvo: 'art-8' }])));
  ok('recusa pedido sem texto', /falta o texto/.test(erro([{ operacao: 'nova_redacao', alvo: 'art-3', texto: '  ' }])));
  ok('com erro, não há texto de minuta', gerarMinuta({ lei, dispositivos: vigente, pedidos: [{ operacao: 'revogacao', alvo: 'art-7' }] }).texto === null);
}

// --- 5. peças -------------------------------------------------------------
ok('citar / idParaChave / rotuloDeAbertura', citar('art-5/par-2/inc-III') === 'inc. III do § 2º do art. 5º' && idParaChave('art-12-B/inc-III/ali-b') === 'al. b) do inc. iii do art. 12-b'
  && rotuloDeAbertura('art-12-B') === 'Art. 12-B.' && rotuloDeAbertura('art-5') === 'Art. 5º' && rotuloDeAbertura('par-unico') === 'Parágrafo único.' && rotuloDeAbertura('inc-II-A') === 'II-A –');
ok('dataPorExtenso', dataPorExtenso('1994-05-02') === '2 de maio de 1994' && dataPorExtenso('1999-12-01') === '1º de dezembro de 1999');

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
