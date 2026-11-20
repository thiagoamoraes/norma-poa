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
import { descreverComandos } from './ingestao/revisao-comandos.mjs';
import { compararComCompilacao, normalizarParaComparar } from './ingestao/revisao-compilacao.mjs';
import { validarDecisao, lerDecisoesJsonl, paraJsonl, situacaoDaDecisao, resumoDaRevisao, situacaoHumana, resumoHumano, listaParaOMotor, CATEGORIAS_HUMANAS } from './ingestao/revisao.mjs';

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

// --- F4: efeito das decisões nos relatórios ----------------------------------
{
  // normas reais (fixtures): uma que o motor aceita e uma que reprova
  const aceita = carregar('lc689_2012', 6, '689').e, reprova = carregar('lc1005_2024', 6, '1005').e;
  const nA = { idSapl: 38042, rotulo: 'LC 689/2012', epoca: 'recente', situacao: aceita.verificacao.situacao, motivos: aceita.verificacao.motivos, sha256Origem: 'sha-a', versaoEstruturador: 7 };
  const nR = { idSapl: 48003, rotulo: 'LC 1.005/2024', epoca: 'recente', situacao: reprova.verificacao.situacao, motivos: reprova.verificacao.motivos, sha256Origem: 'sha-r', versaoEstruturador: 7 };
  const dec = (n, decisao, extra = {}) => ({ idSapl: n.idSapl, decisao, sha256Origem: n.sha256Origem, versaoEstruturador: n.versaoEstruturador, em: '2026-11-20T12:00:00Z', ...extra });
  ok('(sintético) humano: norma que o motor aceita, sem decisão = aceita_motor; que reprova, sem decisão = pendente', situacaoHumana(nA, undefined) === 'aceita_motor' && situacaoHumana(nR, undefined) === 'pendente');
  ok('(sintético) humano: cada decisão sobre norma reprovada vira a categoria certa', situacaoHumana(nR, dec(nR, 'aceitar')) === 'aceita_humano' && situacaoHumana(nR, dec(nR, 'corrigir', { correcoes: [] })) === 'corrigida' && situacaoHumana(nR, dec(nR, 'defeito_de_fonte')) === 'defeito_de_fonte' && situacaoHumana(nR, dec(nR, 'encaminhar_ao_motor')) === 'encaminhada');
  ok('(sintético) humano: "aceitar" sobre norma que o motor já aceitou só a confirma (não vira aceita_humano)', situacaoHumana(nA, dec(nA, 'aceitar')) === 'aceita_motor');
  ok('(sintético) humano: decisão de texto ou leitor antigo reabre a norma (desatualizada)', situacaoHumana(nR, { ...dec(nR, 'aceitar'), sha256Origem: 'velho' }) === 'desatualizada' && situacaoHumana(nR, { ...dec(nR, 'aceitar'), versaoEstruturador: 6 }) === 'desatualizada');
  const m = new Map([[nR.idSapl, dec(nR, 'encaminhar_ao_motor', { nota: '§ 1º sozinho na lei' })]]);
  const r = resumoHumano([nA, nR, { ...nR, idSapl: 1, epoca: 'antiga' }], m);
  ok('(sintético) resumo humano: separa por época e a soma fecha com o total', r.recente.aceita_motor === 1 && r.recente.encaminhada === 1 && r.antiga.pendente === 1 && CATEGORIAS_HUMANAS.reduce((t, c) => t + r.geral[c], 0) === 3);
  const md = listaParaOMotor([nA, nR], m);
  ok('lista para o motor: só os encaminhados, com o rótulo, os motivos reais e a nota', /Casos: 1/.test(md) && md.includes('LC 1.005/2024') && md.includes('rotulo_nao_confere_com_a_origem') && md.includes('§ 1º sozinho na lei') && !md.includes('LC 689/2012'));
  ok('lista para o motor: decisão desatualizada não entra', /Casos: 0/.test(listaParaOMotor([{ ...nR, sha256Origem: 'outro' }], m)));
}

// --- F2: comando × resultado (alteradoras) -------------------------------------
{
  const lc320 = { registro: reg(6, '320'), texto: fs.readFileSync('./lc320.txt', 'utf8') };
  const comBase = (chave) => (chave === 'lc 320/1994' ? lc320 : null);
  const fonte = (n, data) => ({ tipoAto: 'LEI COMPLEMENTAR', numero: n, ano: data.slice(0, 4), dataPublicacao: data });

  const r412 = descreverComandos(fs.readFileSync('./lc412.txt', 'utf8'), fonte('412', '1998-03-24'), comBase);
  ok('LC 412/1998 (real, comando misto) com a LC 320 na base: classificação confiável; o caput do art. 8º é substituição e os §§ 1º a 3º são inserção',
    r412.classificacaoConfiavel && r412.comandos.map((k) => `${k.operacao}:${k.dispositivo}`).join('|') === 'replace_text:art. 8º|insert_node:§ 1º do art. 8º|insert_node:§ 2º do art. 8º|insert_node:§ 3º do art. 8º');
  const art8 = r412.comandos[0];
  ok('LC 412/1998: o art. 8º tem antes e depois, e o depois é o texto novo da alteradora', art8.situacao === 'aplicavel' && art8.antes && art8.depois && art8.antes !== art8.depois);
  ok('LC 412/1998: o parágrafo inserido não tinha "antes" e passa a ter texto', r412.comandos[1].antes === undefined && r412.comandos[1].depois.length > 20 && r412.comandos[1].situacao === 'aplicavel');
  ok('LC 412/1998: o comando aponta a lei-alvo na base (LC 320)', art8.alvoNaBase.idSapl === reg(6, '320').idSapl && art8.chave === 'lc 320/1994');

  const r514 = descreverComandos(fs.readFileSync('./fixtures/lc320/lc514.txt', 'utf8'), fonte('514', '2004-12-28'), comBase);
  const p1 = r514.comandos.find((k) => k.dispositivo === '§ 1º do art. 2º');
  ok('LC 514/2004 (real): o § 1º do art. 2º da LC 320 era VETADO e passa a ter texto da alteradora', p1.situacao === 'aplicavel' && p1.antes === 'VETADO.' && p1.antesVetado === true && p1.depois.length > 30);
  const ren = r514.comandos.find((k) => k.operacao === 'renumber_node');
  ok('LC 514/2004: a renumeração do parágrafo único não acha o alvo no TEXTO ORIGINAL (só existe depois de alteração anterior): sinaliza, não inventa', ren.situacao === 'dispositivo_nao_encontrado' && /não encontrado/.test(ren.erro));

  const semBase = descreverComandos(fs.readFileSync('./lc412.txt', 'utf8'), fonte('412', '1998-03-24'), () => null);
  ok('LC 412/1998 sem a LC 320 na base: nenhum antes/depois inventado, tudo "alvo_fora_da_base", classificação NÃO confiável', !semBase.classificacaoConfiavel && semBase.comandos.length > 0 && semBase.comandos.every((k) => k.situacao === 'alvo_fora_da_base' && k.antes === undefined && k.depois === undefined));

  const r1005 = descreverComandos(fs.readFileSync('./fixtures/textos/lc1005_2024.txt', 'utf8'), fonte('1005', '2024-08-29'), () => null);
  const alt = r1005.comandos.filter((k) => k.dispositivo === '§ 1º do art. 6º');
  ok('LC 1.005/2024 (real, com "(NR)" truncado): o bloco que engoliu os arts. 10 e 11 aparece como comando com texto de OUTRO artigo ("Ficam criados…") — o defeito fica visível ao revisor', alt.length >= 2 && alt.some((k) => /^Ficam criados na letra c/.test(k.novo)) && alt.some((k) => /^Integram a estrutura/.test(k.novo)));
  ok('LC 1.005/2024: as leis-alvo são identificadas pelo nome, mesmo fora da base', r1005.comandos.every((k) => k.chave) && r1005.comandos.some((k) => k.chave === 'lc 817/2017'));
  ok('texto que não é lei não derruba a descrição', descreverComandos('lixo', fonte('1', '2000-01-01'), () => null).comandos.length === 0);
}

// --- F2: Lei Orgânica como alvo presumido (decisão de 20/11/2026) -----------------------------
{
  const fonteEC = (n, data) => ({ tipoAto: 'EMENDA À LEI ORGÂNICA', numero: n, ano: data.slice(0, 4), dataPublicacao: data });
  const ec28 = fs.readFileSync('./fixtures/textos/ec28_2009.txt', 'utf8');
  const sem = descreverComandos(ec28, fonteEC('28', '2009-03-20'), () => null);
  ok('EC 28/2009 (real) sem a LO na base: o alvo é identificado (Lei Orgânica, presumido) mas "fora da base" — nada de antes/depois inventado', sem.comandos.length === 1 && sem.comandos[0].chave === 'lo 1/1990' && sem.comandos[0].presumido === true && sem.comandos[0].situacao === 'alvo_fora_da_base' && sem.comandos[0].antes === undefined);
  const antiga = descreverComandos(ec28, fonteEC('28', '1985-03-20'), () => ({ registro: { idSapl: 1, tipoSapl: 1, numero: '1', ano: 1990, data: '1990-04-03' }, texto: 'LEI ORGÂNICA\nArt. 1º Texto.' }));
  ok('(sintético) a MESMA frase em ato anterior a 1990 não é resolvida para a LO de 1990 (a presunção só vale desde então) e nunca consulta a base', antiga.comandos[0].situacao === 'alvo_nao_identificado' && /anterior a 1990/.test(antiga.comandos[0].erro));
  const arqLO = './dados/textos/sapl/25277.txt';
  if (fs.existsSync(arqLO)) {
    const lo = { registro: { idSapl: 25277, tipoSapl: 1, numero: '1', ano: 1990, data: '1990-04-03', rotulo: 'Lei Orgânica nº 1, de 03 de abril de 1990' }, texto: fs.readFileSync(arqLO, 'utf8') };
    const com = descreverComandos(ec28, fonteEC('28', '2009-03-20'), (ch) => (ch === 'lo 1/1990' ? lo : null));
    ok('EC 28/2009 com a LO de 1990 do acervo na base: o inc. XXI do art. 94 é "aplicável" e nasce sem "antes" (é inclusão)', com.comandos[0].situacao === 'aplicavel' && com.comandos[0].antes === undefined && /^enviar à Câmara/.test(com.comandos[0].depois));
  }
}

// --- F3: comparação com a compilação colada (leis.org) -------------------------
{
  // histórico REAL da LC 320 (saída de gerar-historico.mjs) × compilação REAL (lc320_compilado_leisorg.txt)
  const h = JSON.parse(fs.readFileSync('./fixtures/historico/lc320_historico.json', 'utf8'));
  const compilado = fs.readFileSync('./lc320_compilado_leisorg.txt', 'utf8');
  const r = compararComCompilacao(h, compilado);
  ok('LC 320 × compilação do leis.org: 72 iguais, 6 diferentes, 1 só no motor, 0 só na compilação', r.resumo.igual === 72 && r.resumo.diferente === 6 && r.resumo.so_no_motor === 1 && r.resumo.so_na_compilacao === 0 && r.naoMapeadas.length === 0);
  const dif = r.itens.filter((i) => i.estado === 'diferente').map((i) => i.id).sort().join(' ');
  ok('as 6 diferenças são exatamente as já nomeadas em teste_versionamento (art. 7º e §§ revogados pela LC 958; art. 9º-A e par. único do art. 10 com defeito do arquivo; inc. I do art. 12-B com travessão)', dif === ['art-10/par-unico', 'art-12-B/inc-I', 'art-7', 'art-7/par-1', 'art-7/par-2', 'art-9-A'].sort().join(' '));
  const a7 = r.itens.find((i) => i.id === 'art-7');
  ok('art. 7º: o motor traz "(Revogado)" (a lei revoga) e a compilação ainda traz o texto — vale a lei; a diferença só é listada, nunca "corrigida"', a7.motor === '(Revogado)' && a7.situacaoMotor === 'revogado' && /^A denominação de logradouros/.test(a7.compilado));
  const so = r.itens.find((i) => i.estado === 'so_no_motor');
  ok('o único "só no motor" é o parágrafo único do art. 2º, renumerado pela LC 514 (a posição segue na árvore)', so.id === 'art-2/par-unico');
  // sintéticos: o que o revisor cola pode ter diferenças próprias
  const maiusculas = compilado.replace('Cada Vereador deverá', 'CADA VEREADOR DEVERÁ');
  ok('(sintético) só maiúscula/minúscula muda na compilação → continua igual (a troca de fato aconteceu no texto)', maiusculas !== compilado && compararComCompilacao(h, maiusculas).resumo.diferente === 6);
  const trocado = compararComCompilacao(h, compilado.replace(/§ 2º Cada Vereador deverá/, '§ 2º Cada Prefeito deverá'));
  ok('(sintético) palavra trocada na compilação → vira "diferente" (7 no total)', trocado.resumo.diferente === 7 && trocado.itens.some((i) => i.estado === 'diferente' && /Prefeito/.test(i.compilado || '')));
  const vazio = compararComCompilacao(h, '');
  ok('(sintético) compilação vazia: nada some em silêncio — todo dispositivo do motor aparece como "só no motor"', vazio.resumo.so_no_motor === h.dispositivos.length && vazio.resumo.igual === 0);
  ok('normalização: espaço, travessão, aspas curvas e anotação de redação não contam', normalizarParaComparar('“A”  – B (Redação dada pela LC 1)') === normalizarParaComparar('"A" - B'));
}

// --- regra de desatualização: só texto ou veredito (decisão de 20/11/2026) --------------------
{
  const dec = { idSapl: 7, decisao: 'aceitar', sha256Origem: 'abc', versaoEstruturador: 7, em: '2026-11-20T12:00:00Z', motivosNaHora: ['sem_fecho', 'rotulo_nao_confere_com_a_origem'] };
  const norma = { idSapl: 7, sha256Origem: 'abc', versaoEstruturador: 8, situacao: 'revisar', motivos: ['rotulo_nao_confere_com_a_origem', 'sem_fecho'] };
  ok('(sintético) versão do leitor subiu mas o VEREDITO é o mesmo (mesmos motivos, em outra ordem): a decisão continua valendo', situacaoDaDecisao(dec, norma) === 'revisada');
  ok('(sintético) versão subiu e os motivos MUDARAM: volta à fila (desatualizada)', situacaoDaDecisao(dec, { ...norma, motivos: ['sem_fecho'] }) === 'desatualizada');
  ok('(sintético) o texto mudou (sha): desatualizada, mesmo com o mesmo veredito', situacaoDaDecisao(dec, { ...norma, sha256Origem: 'novo' }) === 'desatualizada');
  ok('(sintético) sem como comparar o veredito (decisão sem motivosNaHora, ou norma sem motivos): regra rígida, versão diferente = desatualizada', situacaoDaDecisao({ ...dec, motivosNaHora: undefined }, norma) === 'desatualizada' && situacaoDaDecisao(dec, { ...norma, motivos: undefined }) === 'desatualizada');
  ok('(sintético) mesma versão: vale, sem olhar os motivos', situacaoDaDecisao(dec, { ...norma, versaoEstruturador: 7, motivos: ['outro'] }) === 'revisada');
  ok('(sintético) humano: o motor passou a aceitar a norma — a decisão desatualizada não a reabre (aceita_motor)', situacaoHumana({ ...norma, situacao: 'aceita', motivos: [] }, dec) === 'aceita_motor');
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
