// teste_revisao.mjs
//
// Dashboard de revisão (PLANO-REVISAO.md, F1): âncoras da conferência e regras
// das decisões humanas. Casos reais em fixtures/textos/ (LC 1.005/2024, LC 957/2022,
// EC 39/2016, LC 689/2012); a parte "acervo" confere as âncoras contra o veredito
// gravado de TODAS as normas estruturadas (pula se dados/ não existir).
// Sem rede. Uso: node teste_revisao.mjs

import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';
import { ancorarConferencia } from './ingestao/revisao-ancoras.mjs';
import { validarDecisao, lerDecisoesJsonl, paraJsonl, situacaoDaDecisao, resumoDaRevisao } from './ingestao/revisao.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };
const regs = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_estrutura.json', 'utf8'));
const reg = (tipoSapl, numero) => regs.find((r) => r.tipoSapl === tipoSapl && r.numero === numero);
const alnum = (s) => (s || '').normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
const carregar = (arq, tipo, numero) => {
  const texto = prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/${arq}.txt`, 'utf8'));
  return { texto, e: estruturarNorma(texto, reg(tipo, numero)) };
};

// --- âncoras: caso real com rótulo que não confere (LC 1.005/2024) -----------
{
  const { texto, e } = carregar('lc1005_2024', 6, '1005');
  const a = ancorarConferencia(texto, e);
  const div = a.itens.filter((i) => i.situacao === 'rotulo_diverge');
  ok('LC 1.005/2024: 3 rótulos não conferem (arts. 10, 11 e 12 posicionais)', div.map((i) => i.id).join(' ') === 'art-10 art-11 art-12');
  ok('LC 1.005/2024: o que está escrito antes do trecho é "Art12" (o artigo 10 real foi engolido pelo bloco anterior)', div[0].naOrigem === 'Art12');
  ok('LC 1.005/2024: a âncora de "Art. 10." aponta, no texto de origem, para o artigo que na lei é o 12', alnum(a.texto.slice(div[0].ini, div[0].fim)).startsWith(alnum('Ficam alterados na letra c do Anexo I')));
  ok('LC 1.005/2024: o texto imediatamente antes da âncora traz "Art. 12"', /Art\.\s*12\.?\s*$/.test(a.texto.slice(Math.max(0, div[0].ini - 12), div[0].ini)));
  ok('LC 1.005/2024: os dispositivos que conferem têm âncora que reproduz o próprio texto', a.itens.filter((i) => i.ref === 'dispositivo' && i.situacao === 'ok').every((i) => alnum(a.texto.slice(i.ini, i.fim)) === alnum(e.dispositivos.find((d) => d.id === i.id).texto)));
  ok('LC 1.005/2024: o resumo bate com o do estruturador', a.resumo.rotulosDivergentes === e.verificacao.metricas.rotulosDivergentes.length && e.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
  ok('âncoras seguem a ordem do texto de origem (nunca voltam)', a.itens.filter((i) => i.ini != null).every((i, k, v) => k === 0 || i.ini >= v[k - 1].ini));
}

// --- âncoras: trecho não localizado (EC 39/2016) e norma aceita (LC 689/2012) -
{
  const { texto, e } = carregar('ec39_2016', 2, '39');
  const a = ancorarConferencia(texto, e);
  const nl = a.itens.filter((i) => i.situacao === 'nao_localizado');
  ok('EC 39/2016: o trecho não localizado vem marcado, sem posição inventada', nl.length === 1 && nl[0].id === 'art-1' && nl[0].ini === undefined && a.resumo.naoLocalizados === 1);
  const { texto: t2, e: e2 } = carregar('lc689_2012', 6, '689');
  const a2 = ancorarConferencia(t2, e2);
  ok('LC 689/2012 (aceita): nenhum ponto a olhar', e2.verificacao.situacao === 'aceita' && a2.resumo.rotulosDivergentes === 0 && a2.resumo.naoLocalizados === 0 && a2.resumo.lacunasReais === 0);
}

// --- âncoras: texto fora da árvore (LC 957/2022, aspas fechando cedo) --------
{
  const { texto, e } = carregar('lc957_2022', 6, '957');
  const a = ancorarConferencia(texto, e);
  ok('LC 957/2022: os artigos 133-C a 133-F, fora das aspas, deslocam os rótulos seguintes', a.resumo.rotulosDivergentes > 0 && a.itens.some((i) => i.situacao === 'rotulo_diverge' && /^Art133C/.test(i.naOrigem || '')));
  ok('LC 957/2022: lacunas reais batem com as do estruturador', a.resumo.lacunasReais === Math.min(e.verificacao.metricas.lacunas.length, a.resumo.lacunasReais) && (a.resumo.lacunasReais > 0) === e.verificacao.motivos.includes('texto_fora_da_arvore'));
  ok('lacunas: ini <= fim e dentro do texto', a.lacunas.every((l) => l.ini <= l.fim && l.fim <= a.texto.length));
}

// --- decisões: validação -----------------------------------------------------
const base = { idSapl: 48003, decisao: 'aceitar', sha256Origem: 'abc', versaoEstruturador: 7, em: '2026-11-20T12:00:00Z' };
{
  ok('decisão "aceitar" mínima é válida', validarDecisao(base).ok);
  ok('decisão sem sha256Origem é recusada (tem de apontar para a versão revisada)', !validarDecisao({ ...base, sha256Origem: '' }).ok);
  ok('decisão desconhecida é recusada', !validarDecisao({ ...base, decisao: 'talvez' }).ok);
  ok('defeito_de_fonte exige tipo conhecido e trecho', !validarDecisao({ ...base, decisao: 'defeito_de_fonte' }).ok && !validarDecisao({ ...base, decisao: 'defeito_de_fonte', defeito: { tipo: 'inventado', trecho: 'x' } }).ok && validarDecisao({ ...base, decisao: 'defeito_de_fonte', defeito: { tipo: 'nr_truncado', trecho: '” (' } }).ok);
  ok('corrigir exige correção com endereço, "de" e "para" diferentes', !validarDecisao({ ...base, decisao: 'corrigir', correcoes: [] }).ok && !validarDecisao({ ...base, decisao: 'corrigir', correcoes: [{ endereco: 'art-10', campo: 'rotulo', de: 'Art. 10.', para: 'Art. 10.' }] }).ok && validarDecisao({ ...base, decisao: 'corrigir', correcoes: [{ endereco: 'art-10', campo: 'rotulo', de: 'Art. 10.', para: 'Art. 12.' }] }).ok);
  ok('só o rótulo é corrigível por sobreposição (o texto da lei nunca)', !validarDecisao({ ...base, decisao: 'corrigir', correcoes: [{ endereco: 'art-10', campo: 'texto', de: 'a', para: 'b' }] }).ok);
  ok('encaminhar_ao_motor exige nota', !validarDecisao({ ...base, decisao: 'encaminhar_ao_motor' }).ok && validarDecisao({ ...base, decisao: 'encaminhar_ao_motor', nota: '§ 1º sozinho' }).ok);
  ok('lixo não derruba o validador', !validarDecisao(null).ok && !validarDecisao('x').ok && !validarDecisao({}).ok);
}

// --- decisões: arquivo, última vence, desatualizada --------------------------
{
  const l1 = JSON.stringify(base);
  const l2 = JSON.stringify({ ...base, decisao: 'defeito_de_fonte', defeito: { tipo: 'nr_truncado', trecho: '” (' }, em: '2026-11-21T12:00:00Z' });
  const { decisoes, erros } = lerDecisoesJsonl(`${l1}\n\n${l2}\nnão é json\n${JSON.stringify({ idSapl: 1 })}\n`);
  ok('arquivo: a ÚLTIMA decisão de cada norma vale', decisoes.get(48003).decisao === 'defeito_de_fonte');
  ok('arquivo: linhas inválidas são apontadas com o número da linha, sem derrubar a leitura', erros.length === 2 && erros[0].linha === 4 && erros[1].linha === 5);
  const volta = lerDecisoesJsonl(paraJsonl(decisoes));
  ok('exportar e reler devolve as mesmas decisões, uma linha por norma', volta.erros.length === 0 && volta.decisoes.size === 1 && paraJsonl(volta.decisoes) === paraJsonl(decisoes));
  const norma = { idSapl: 48003, sha256Origem: 'abc', versaoEstruturador: 7 };
  ok('situação: sem decisão = pendente; decisão da mesma versão = revisada', situacaoDaDecisao(undefined, norma) === 'pendente' && situacaoDaDecisao(base, norma) === 'revisada');
  ok('situação: texto mudou (sha) ou leitor mudou (versão) = desatualizada', situacaoDaDecisao(base, { ...norma, sha256Origem: 'zzz' }) === 'desatualizada' && situacaoDaDecisao(base, { ...norma, versaoEstruturador: 8 }) === 'desatualizada');
  const fila = [norma, { idSapl: 2, sha256Origem: 'x', versaoEstruturador: 7 }, { idSapl: 3, sha256Origem: 'y', versaoEstruturador: 7 }];
  const m = new Map([[48003, base], [3, { ...base, idSapl: 3, sha256Origem: 'velho' }]]);
  const r = resumoDaRevisao(fila, m);
  ok('resumo: 1 revisada (aceitar), 1 desatualizada, 1 pendente', r.total === 3 && r.revisadas === 1 && r.desatualizadas === 1 && r.pendentes === 1 && r.porDecisao.aceitar === 1);
}

// --- acervo inteiro: as âncoras concordam com o veredito do estruturador -----
const DIR = './dados/estruturado/sapl';
if (fs.existsSync(DIR) && fs.existsSync('./dados/textos/sapl')) {
  let n = 0, divergiu = 0, semPosicao = 0;
  const exemplos = [];
  for (const f of fs.readdirSync(DIR).filter((f) => /^\d+\.json$/.test(f))) {
    const r = JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'));
    const arq = `./dados/textos/sapl/${r.idSapl}.txt`;
    if (!fs.existsSync(arq)) continue;
    const a = ancorarConferencia(prepararTextoExtraido(fs.readFileSync(arq, 'utf8')), r);
    const m = r.verificacao.metricas;
    const teto = (x) => Math.min(x, 5); // o estruturador guarda só 5 exemplos de cada métrica
    const mesmo = teto(a.resumo.rotulosDivergentes) === (m.rotulosDivergentes || []).length
      && teto(a.resumo.naoLocalizados) === (m.naoLocalizados || []).length
      && teto(a.resumo.lacunasReais) === (m.lacunas || []).length
      && (a.resumo.rotulosDivergentes > 0) === r.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem')
      && (a.resumo.naoLocalizados > 0) === r.verificacao.motivos.includes('trecho_nao_localizado_na_origem')
      && (a.resumo.lacunasReais > 0) === r.verificacao.motivos.includes('texto_fora_da_arvore');
    n++;
    if (!mesmo) { divergiu++; if (exemplos.length < 3) exemplos.push(r.idSapl); }
    if (a.itens.some((i) => i.situacao !== 'nao_localizado' && !(Number.isInteger(i.ini) && Number.isInteger(i.fim) && i.ini <= i.fim && i.fim <= a.texto.length))) semPosicao++;
  }
  ok(`acervo: as âncoras concordam com o veredito gravado em ${n} normas (divergem: ${divergiu}${exemplos.length ? ' — ' + exemplos.join(',') : ''})`, n > 0 && divergiu === 0);
  ok('acervo: toda âncora tem deslocamentos válidos dentro do texto', semPosicao === 0);
} else {
  console.log('(acervo ausente: seção pulada)');
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
