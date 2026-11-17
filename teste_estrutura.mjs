// teste_estrutura.mjs
//
// Estruturação com verificação (ingestao/estrutura.mjs) sobre textos REAIS do
// repositório, conferidos contra registros REAIS do catálogo
// (fixtures/sapl/registros_estrutura.json, colhidos da API do SAPL em 16/11/2026).
// Sem rede. Uso: node teste_estrutura.mjs

import fs from 'node:fs';
import { estruturarNorma, slugDoRotulo, conferirConservacao } from './ingestao/estrutura.mjs';
import { htmlSirelParaTexto } from './ingestao/extracao-texto.mjs';
import { limparMarkdownLinks, parseLeiPublicada } from './norma-core.js';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };
const regs = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_estrutura.json', 'utf8'));
const reg = (tipoSapl, numero) => regs.find((r) => r.tipoSapl === tipoSapl && r.numero === numero);

// --- LC 611/2009: lei longa, com Títulos/Capítulos/Seções ------------------
{
  const e = estruturarNorma(fs.readFileSync('./lc611.txt', 'utf8'), reg(6, '611'));
  ok('LC 611/2009: aceita, sem motivo de revisão', e.verificacao.situacao === 'aceita' && e.verificacao.motivos.length === 0);
  ok('LC 611/2009: 34 artigos, 174 dispositivos', e.verificacao.metricas.artigos === 34 && e.dispositivos.length === 174);
  ok('LC 611/2009: cabeçalho confere com o catálogo (nº, data, tipo)', e.cabecalho.numero === '611' && e.cabecalho.data === '2009-02-03' && e.cabecalho.tipoAto === 'LEI COMPLEMENTAR');
  const ids = e.dispositivos.map((d) => d.id);
  ok('LC 611/2009: endereços estáveis e únicos', new Set(ids).size === ids.length && ids.includes('art-1/par-unico') && ids.includes('art-13/inc-XXIV') && ids.includes('art-17/par-unico'));
  ok('LC 611/2009: todo filho aponta para um pai que existe', e.dispositivos.every((d) => d.pai === null || ids.includes(d.pai)));
  ok('LC 611/2009: agrupadores viajam com o artigo (art. 2º abre Título II, Capítulo I, Seção I)',
    e.dispositivos.find((d) => d.id === 'art-2').agrupadores.map((g) => g.tipo).join(',') === 'titulo,capitulo,secao');
}

// --- LC 320/1994 e LC 384/1996 ---------------------------------------------
{
  const e320 = estruturarNorma(limparMarkdownLinks(fs.readFileSync('./lc320.txt', 'utf8')), reg(6, '320'));
  ok('LC 320/1994: aceita, 14 artigos', e320.verificacao.situacao === 'aceita' && e320.verificacao.metricas.artigos === 14);
  ok('LC 320/1994: §§ vetados seguem na árvore, marcados', e320.dispositivos.filter((d) => d.vetado).length >= 2 && e320.dispositivos.some((d) => d.id === 'art-2/par-1' && d.vetado));
  const e384 = estruturarNorma(limparMarkdownLinks(fs.readFileSync('./lc384.txt', 'utf8')), reg(6, '384'));
  ok('LC 384/1996 (alteradora): aceita, com 2 blocos de alteração', e384.verificacao.situacao === 'aceita' && e384.verificacao.metricas.blocosDeAlteracao === 2);
  ok('LC 384/1996: o conteúdo do bloco NÃO vira dispositivo da alteradora (4 artigos, nenhum filho)', e384.dispositivos.map((d) => d.id).join(' ') === 'art-1 art-2 art-3 art-4');
  ok('LC 384/1996: o bloco fica guardado no artigo que o introduz', /^"Art\. 2º \.\.\./.test(e384.dispositivos[0].blocoDeAlteracao) && /Parágrafo Único/.test(e384.dispositivos[0].blocoDeAlteracao));
}

// --- Lei 9.113/2003: arquivo do SIREL, preâmbulo em duas linhas --------------
{
  const { texto } = htmlSirelParaTexto(fs.readFileSync('./fixtures/sapl/lei9113_2003_sirel.html'));
  ok('Lei 9.113/2003: o timbre da página do SIREL não entra no texto', texto.startsWith('LEI Nº 9.113, de 16 de maio de 2003.'));
  const doc = parseLeiPublicada(texto);
  ok('Lei 9.113/2003: preâmbulo de duas linhas fica inteiro no preâmbulo', /^O PREFEITO MUNICIPAL DE PORTO ALEGRE\. Faço saber .* a seguinte Lei:$/.test(doc.preambulo));
  ok('Lei 9.113/2003: a ementa não engole o "Faço saber"', !/Faço saber/.test(doc.ementa.texto) && doc.ementa.texto.startsWith('Denomina Avenida Homero Guerreiro'));
  const e = estruturarNorma(texto, reg(5, '9113'));
  ok('Lei 9.113/2003: aceita (2 artigos, parágrafo único, fecho)', e.verificacao.situacao === 'aceita' && e.dispositivos.map((d) => d.id).join(' ') === 'art-1 art-1/par-unico art-2' && !!e.fecho);
}

// --- o que NÃO pode ser aceito ---------------------------------------------
{
  const e = estruturarNorma(fs.readFileSync('./lei14504_parcial.txt', 'utf8'), reg(5, '14504'));
  ok('Lei 14.504/2026 (promulgação parcial): vai para revisão, com o motivo', e.verificacao.situacao === 'revisar' && e.verificacao.motivos.includes('promulgacao_parcial'));
  const lc611 = fs.readFileSync('./lc611.txt', 'utf8');
  const trocado = estruturarNorma(lc611, reg(6, '320'));
  ok('texto da LC 611 com registro da LC 320: reprovado por divergir do catálogo', trocado.verificacao.motivos.includes('numero_diverge_do_catalogo') && trocado.verificacao.motivos.includes('data_diverge_do_catalogo'));
  const semArt5 = lc611.split('\n').filter((l) => !/^\s*Art\. 5º/.test(l)).join('\n');
  ok('(sintético) LC 611 sem a linha do art. 5º: o rótulo dado pela posição não confere com o que está escrito → revisão', estruturarNorma(semArt5, reg(6, '611')).verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
  const semFecho = lc611.slice(0, lc611.indexOf('PREFEITURA MUNICIPAL DE PORTO ALEGRE, 3 de'));
  ok('(sintético) LC 611 cortada antes do fecho: "sem_fecho"', estruturarNorma(semFecho, reg(6, '611')).verificacao.motivos.includes('sem_fecho'));
}

// --- cabeçalho fora do padrão: a identidade vem do catálogo -----------------
// Arquivos reais das alteradoras da LC 320 (fixtures/lc320/), registros reais
// do catálogo (fixtures/sapl/registros_lc320.json).
{
  const regsLc320 = JSON.parse(fs.readFileSync('./fixtures/sapl/registros_lc320.json', 'utf8'));
  const r = (n) => regsLc320.find((x) => x.numero === n);
  const e = (n) => estruturarNorma(fs.readFileSync(`./fixtures/lc320/lc${n}.txt`, 'utf8'), r(n));
  const e474 = e('474');
  ok('LC 474/2002 ("LEI COMPLEMENTAR 474, de 21 de maio de 2002.", sem "Nº"): cabeçalho vem do catálogo, com aviso', !e474.verificacao.motivos.includes('cabecalho_nao_reconhecido') && e474.verificacao.avisos.includes('cabecalho_fora_do_padrao') && e474.cabecalho.fonte === 'catalogo' && e474.cabecalho.numero === '474' && e474.cabecalho.data === '2002-05-21');
  const e449 = e('449');
  ok('LC 449/2000 ("LEI COMPLEMENTAR Nº 449", sem data): idem', e449.cabecalho.fonte === 'catalogo' && e449.cabecalho.data === '2000-06-19' && !e449.verificacao.motivos.includes('cabecalho_nao_reconhecido'));
  const e692 = e('692');
  ok('LC 692/2012 (timbre antes; "DE 29 DEDE 2012"): idem — e segue em revisão por outros motivos (o arquivo é defeituoso)', e692.cabecalho.fonte === 'catalogo' && e692.verificacao.situacao === 'revisar');
  const trocado = estruturarNorma(fs.readFileSync('./fixtures/lc320/lc474.txt', 'utf8'), r('449'));
  ok('arquivo da LC 474 anexado ao registro da LC 449: NÃO herda a identidade do catálogo', trocado.verificacao.motivos.includes('cabecalho_nao_reconhecido') && !trocado.cabecalho.fonte);
  ok('cabeçalho reconhecido pelo motor continua vindo do texto (LC 958/2022)', !e('958').cabecalho.fonte && e('958').cabecalho.numero === '958');
}

// --- peças ---------------------------------------------------------------
ok('slugDoRotulo: artigo com letra, parágrafo, inciso, alínea', slugDoRotulo('artigo', 'Art. 5º-A') === 'art-5-A' && slugDoRotulo('artigo', 'Art. 13.') === 'art-13'
  && slugDoRotulo('paragrafo', '§ 2º') === 'par-2' && slugDoRotulo('paragrafo', 'Parágrafo único.') === 'par-unico'
  && slugDoRotulo('inciso', 'XXIV –') === 'inc-XXIV' && slugDoRotulo('alinea', 'b)') === 'ali-b');
ok('slugDoRotulo: rótulo irreconhecível → null (vira motivo de revisão, não palpite)', slugDoRotulo('artigo', 'Artigo primeiro') === null);
{
  const c = conferirConservacao('Art. 1º Um texto. Linha perdida que ninguém leu e que é bem comprida mesmo. Art. 2º Outro texto.', ['Um texto.', 'Outro texto.']);
  ok('(sintético) conservação: texto que ficou fora da árvore aparece como lacuna', c.lacunas.length === 1 && c.lacunas[0].tamanho > 40);
  ok('(sintético) conservação: trecho que não está na origem é apontado', conferirConservacao('abc def', ['xyz']).naoLocalizados.length === 1);
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
