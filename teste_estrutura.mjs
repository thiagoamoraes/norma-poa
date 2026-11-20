// teste_estrutura.mjs
//
// Estruturação com verificação (ingestao/estrutura.mjs) sobre textos REAIS do
// repositório, conferidos contra registros REAIS do catálogo
// (fixtures/sapl/registros_estrutura.json, colhidos da API do SAPL em 16/11/2026).
// Sem rede. Uso: node teste_estrutura.mjs

import fs from 'node:fs';
import { estruturarNorma, slugDoRotulo, conferirConservacao } from './ingestao/estrutura.mjs';
import * as estrutura from './ingestao/estrutura.mjs';
import { htmlSirelParaTexto, prepararTextoExtraido, juntarFechoQuebrado, cp1252ParaUnicode } from './ingestao/extracao-texto.mjs';
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

// --- LC 689/2012: “Art. e o número separados por quebra de linha (rodada 24) --
// No PDF, a abertura do bloco de alteração veio partida: a linha traz só “Art.
// e o número do artigo alterado ("25....") vem na linha seguinte. Sem juntar, o
// bloco não é reconhecido e o inciso citado vira dispositivo da própria alteradora.
{
  const bruto = fs.readFileSync('./fixtures/textos/lc689_2012.txt', 'utf8');
  const e = estruturarNorma(prepararTextoExtraido(bruto), reg(6, '689'));
  ok('LC 689/2012: o bloco de alteração, de abertura partida, é reconhecido (1 bloco)', e.verificacao.metricas.blocosDeAlteracao === 1);
  ok('LC 689/2012: o inciso citado NÃO vira dispositivo da alteradora (art-1 art-2 art-3)', e.dispositivos.map((d) => d.id).join(' ') === 'art-1 art-2 art-3');
  ok('LC 689/2012: aceita, sem motivo de revisão', e.verificacao.situacao === 'aceita' && e.verificacao.motivos.length === 0);
  ok('preparo: o arquivo guardado não muda; só a leitura junta (o bruto ainda tem “Art. sozinho)', /^\s*“Art\.\s*$/m.test(bruto));
  ok('preparo (sintético): “Art. + número na linha seguinte → uma linha só', prepararTextoExtraido('texto:\n\n  “Art.\n 25.....\nIV – x').split('\n').map((l) => l.trim()).includes('“Art. 25.....'));
  ok('preparo (sintético): “Art. seguido de linha que NÃO começa por algarismo fica como está', prepararTextoExtraido('“Art.\nFica alterado').split('\n')[0] === '“Art.');
  ok('preparo (sintético): "Art." sem aspas de abertura nunca é juntado', prepararTextoExtraido('Art.\n5º Fica').split('\n')[0] === 'Art.');
}

// --- LCs de 2011–2014: palavras coladas pela extração no cabeçalho (rodada 24) ---
// O cabeçalho existe, mas a extração do PDF cola ou parte palavras. A identidade
// continua vindo do catálogo, e só vale se o número escrito for o do registro.
{
  const lc = (arq, n) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/${arq}.txt`, 'utf8')), reg(6, n));
  const reconhecido = (e) => !e.verificacao.motivos.includes('cabecalho_nao_reconhecido') && e.verificacao.avisos.includes('cabecalho_fora_do_padrao') && e.cabecalho.fonte === 'catalogo';
  ok('LC 719/2013 ("LEICOMPLEMENTAR Nº 719"): cabeçalho vem do catálogo, com aviso', reconhecido(lc('lc719_2013', '719')));
  ok('LC 723/2013 ("LEI COMPLEMENTAR723"): idem', reconhecido(lc('lc723_2013', '723')));
  ok('LC 674/2011 ("Nº 67 4", espaço no meio do número): idem', reconhecido(lc('lc674_2011', '674')));
  ok('LC 741/2014 ("LEI COMPLEMENTARNº 741"): idem', reconhecido(lc('lc741_2014', '741')));
  ok('LC 358/1995 (OCR, "Nº: 358 072"): a leitura com espaço NÃO esconde o número certo (segue reconhecida)', reconhecido(estruturarNorma(prepararTextoExtraido(fs.readFileSync('./fixtures/textos/lc358_1995_ocr.txt', 'utf8')), reg(6, '358'))));
  ok('LC 719 anexada ao registro da LC 723: NÃO herda a identidade do catálogo', lc('lc719_2013', '723').verificacao.motivos.includes('cabecalho_nao_reconhecido'));
  const sint = (cab) => estruturarNorma(`${cab}\n\nDispõe sobre algo.\n\nArt. 1º Fica criado o algo.\n\nArt. 2º Esta Lei Complementar entra em vigor.\n`, reg(6, '719'));
  ok('(sintético) "LEI COMPLEMENTARES Nº 719" (palavra diferente) não é aceito como tipo', sint('LEI COMPLEMENTARES Nº 719, DE 30 DE SETEMBRO DE 2013.').verificacao.motivos.includes('cabecalho_nao_reconhecido'));
}

// --- época da norma: corte na sanção da LC 611 (03/02/2009) ----------------
{
  const ep = (r) => estrutura.epocaDaNorma?.(r);
  ok('época: LC 611 (sancionada em 03/02/2009) já é recente', ep(reg(6, '611')) === 'recente');
  ok('época: LC 689/2012 é recente', ep(reg(6, '689')) === 'recente');
  ok('época: LC 358/1995 é antiga', ep(reg(6, '358')) === 'antiga');
  ok('época (sintético): véspera do corte (02/02/2009) é antiga', ep({ data: '2009-02-02', ano: 2009 }) === 'antiga');
  ok('época (sintético): sem data, só o ano — 2008 antiga, 2010 recente', ep({ ano: 2008 }) === 'antiga' && ep({ ano: 2010 }) === 'recente');
  ok('época (sintético): sem data e ano 2009 (ou sem nada) → indefinida, nunca palpite', ep({ ano: 2009 }) === 'indefinida' && ep({}) === 'indefinida' && ep(null) === 'indefinida');
}

// --- fecho com a data partida em duas linhas (rodada 30) -------------------------------------
{
  const bruto = fs.readFileSync('./fixtures/textos/lc820_2017.txt', 'utf8');
  const prep = prepararTextoExtraido(bruto);
  ok('LC 820/2017 (real): "CÂMARA MUNICIPAL DE PORTO ALEGRE, 6 DE NOVEMBRO DE" + "2017." viram uma linha só', /^\s*CÂMARA MUNICIPAL DE PORTO ALEGRE, 6 DE NOVEMBRO DE 2017\.\s*$/m.test(prep) && /DE\s*\n\s*2017\./.test(bruto));
  const e = estruturarNorma(prep, reg(6, '820'));
  ok('LC 820/2017: o fecho passa a ser reconhecido (sem sem_fecho)', !!e.fecho && !e.verificacao.motivos.includes('sem_fecho'));
  ok('(sintético) só junta quando a linha seguinte é APENAS o ano: "…DE" + "Registre-se" fica como está', juntarFechoQuebrado('CÂMARA MUNICIPAL DE PORTO ALEGRE, 6 DE NOVEMBRO DE\nRegistre-se.').split('\n').length === 2);
  ok('(sintético) texto qualquer terminado em "de" seguido de ano NÃO é fecho e não é juntado ("a data de" + "2017.")', juntarFechoQuebrado('conforme a data de\n2017.').split('\n').length === 2);
  ok('(sintético) o 4º padrão ("Porto Alegre, 19 de março de" + "2009.") também é juntado', juntarFechoQuebrado('Porto Alegre, 19 de março de\n2009.').trim() === 'Porto Alegre, 19 de março de 2009.');
}

// --- "§ 1º" escrito sozinho na lei: o endereço segue o rótulo escrito (rodada 30) -------------
{
  const e = estruturarNorma(prepararTextoExtraido(fs.readFileSync('./fixtures/textos/lc521_2005.txt', 'utf8')), reg(6, '521'));
  ok('LC 521/2005 (real): o § 1º do art. 1º, sozinho, tem o endereço do rótulo escrito (art-1/par-1), não "par-unico"', e.dispositivos.some((d) => d.id === 'art-1/par-1' && d.rotulo === '§ 1º') && !e.dispositivos.some((d) => d.id === 'art-1/par-unico'));
  ok('LC 521/2005: deixa de ser reprovada por rótulo e leva só o AVISO "paragrafo_numerado_sem_irmao"', !e.verificacao.motivos.includes('rotulo_nao_confere_com_a_origem') && e.verificacao.avisos.includes('paragrafo_numerado_sem_irmao'));
  const lc611 = estruturarNorma(fs.readFileSync('./lc611.txt', 'utf8'), reg(6, '611'));
  ok('lei bem escrita (LC 611, "Parágrafo único" de verdade): sem o aviso e com o endereço de sempre (art-1/par-unico)', !lc611.verificacao.avisos.includes('paragrafo_numerado_sem_irmao') && lc611.dispositivos.some((d) => d.id === 'art-1/par-unico'));
}

// --- aspas gravadas como caracteres de controle (HTML do SIREL; rodada 30) -----------------------
{
  const bruto = fs.readFileSync('./fixtures/textos/lc499_2003_sirel.txt', 'utf8');
  ok('LC 499/2003 (real, SIREL): o texto guardado tem aspas como caracteres de CONTROLE (U+0093/U+0094) e travessão U+0096', /\u0093/.test(bruto) && /\u0094/.test(bruto) && /\u0096/.test(bruto));
  const prep = prepararTextoExtraido(bruto);
  ok('LC 499/2003: o preparo troca os controles por aspas e travessão de verdade (“ ” –); o arquivo guardado não muda', !/[\u0080-\u009f]/.test(prep) && /“Art\. 53\./.test(prep) && /[\u0080-\u009f]/.test(bruto));
  const e = estruturarNorma(prep, reg(6, '499'));
  ok('LC 499/2003: o bloco de alteração é reconhecido e a lei-alvo NÃO vira dispositivo da alteradora', e.verificacao.metricas.blocosDeAlteracao > 0 && !e.dispositivos.some((d) => /^art-53/.test(d.id)));
  ok('LC 499/2003: passa a ser aceita (antes, reprovada por rótulo)', e.verificacao.situacao === 'aceita');
  ok('(sintético) cp1252ParaUnicode: 147/148 viram “ ”, 150 vira –, 146 vira ’; texto comum e letras acentuadas ficam como estão', cp1252ParaUnicode('\u0093A\u0094 \u0096 d\u0092água ação ã') === '“A” – d’água ação ã');
  const { texto } = htmlSirelParaTexto(new TextEncoder().encode('<html><body><p>LEI Nº 1</p><p>&#147;Art. 1&#186; Texto.&#148; (NR) &#150; fim</p></body></html>'));
  ok('(sintético) htmlSirelParaTexto: entidades numéricas &#147; &#148; &#150; saem como “ ” –, já na leitura do HTML', /“Art\. 1º Texto\.” \(NR\) – fim/.test(texto));
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
