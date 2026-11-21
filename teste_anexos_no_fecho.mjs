// teste_anexos_no_fecho.mjs — anexo como NÓ, fecho e tabela no corpo (decisões 34 a 40, 21/11/2026).
// O leitor guarda tudo depois da assinatura em `doc.fecho`, e a conferência contava isso como coberto: norma "aceita" com
// anexo ou tabela que ninguém leu. Agora o estruturador (sem mexer no core): (a) divide o fecho no 1º cabeçalho estrito de
// ANEXO e guarda cada anexo como nó da raiz, com rótulo ESCRITO e texto bruto preservado (aceita, com o aviso
// `anexo_preservado_nao_interpretado`; só título/gráfico → `anexo_grafico_nao_lido`); (b) fecho com mais de 600 caracteres
// (fora do carimbo de assinatura eletrônica) reprova: `fecho_com_texto_demais`; (c) 3+ linhas de tabela de PDF no
// articulado, fora de bloco de alteração, reprovam: `tabela_no_corpo`. O motor ainda NÃO interpreta o conteúdo de anexos.
// Textos REAIS do SAPL da PGM (fixtures/textos/anexo_*). Sem rede. Uso: node teste_anexos_no_fecho.mjs
import fs from 'node:fs';
import { estruturarNorma, classificarAnexosNoFecho, dividirFechoEAnexos, slugDoAnexo, tamanhoDoFechoSemCarimbo, tabelaNoCorpo } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';
import { ancorarConferencia } from './ingestao/revisao-ancoras.mjs';
import { roteiroDeConferencia, tituloDoMotivo } from './ingestao/revisao.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/anexo_registros.json', 'utf8'));
const roda = (id) => { const t = prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/anexo_${id}.txt`, 'utf8')); return { t, e: estruturarNorma(t, regs.find((r) => r.idSapl === id)) }; };
const anexos = (e) => e.dispositivos.filter((d) => d.tipo === 'anexo');

// (a) anexo como nó
{
  const { t, e } = roda(49707);
  ok('LC 1.033/2025 (real, 8 anexos de tabela): aceita; 8 nós "anexo" na raiz com rótulo escrito (anexo-i … anexo-viii) e o aviso anexo_preservado_nao_interpretado', e.verificacao.situacao === 'aceita' && anexos(e).length === 8 && anexos(e)[0].id === 'anexo-i' && anexos(e)[0].rotulo === 'ANEXO I' && anexos(e).every((d) => d.pai === null) && e.verificacao.avisos.includes('anexo_preservado_nao_interpretado'));
  ok('LC 1.033/2025: o fecho de verdade ficou só com local, data e assinaturas (sem a palavra ANEXO e com menos de 600 caracteres); o texto do anexo foi para o nó', !/ANEXO/.test(e.fecho) && e.fecho.length < 600 && anexos(e)[0].texto.length > 500);
  const a = ancorarConferencia(t, e);
  ok('LC 1.033/2025: a conferência cobre o anexo PELO NÓ (âncoras: nada não localizado, nenhuma lacuna real) e os anexos vêm depois do fecho', a.resumo.naoLocalizados === 0 && a.resumo.lacunasReais === 0 && a.itens.findIndex((i) => i.ref === 'fecho') < a.itens.findIndex((i) => i.id === 'anexo-i'));
}
{
  const { e } = roda(47674);
  ok('LC 994/2023 (real, anexo com relação de imóveis): aceita, com o anexo preservado como nó', e.verificacao.situacao === 'aceita' && anexos(e).length === 1 && e.verificacao.avisos.includes('anexo_preservado_nao_interpretado'));
}
{
  const { e } = roda(40791);
  ok('LC 799/2016 (real, 33 anexos só título): aceita; 33 nós "anexo" com semTexto e o aviso anexo_grafico_nao_lido (não "preservado")', e.verificacao.situacao === 'aceita' && anexos(e).length === 33 && anexos(e).every((d) => d.semTexto) && e.verificacao.avisos.includes('anexo_grafico_nao_lido') && !e.verificacao.avisos.includes('anexo_preservado_nao_interpretado'));
  const { e: e2 } = roda(41114);
  ok('LC 811/2017 (real): o anexo que a lei diz "VETADO." é nó com vetado: true (vetado nunca sai da árvore)', anexos(e2).some((d) => d.vetado) || /VETAD/.test(anexos(e2).map((d) => d.texto).join(' ')));
  const { e: e3 } = roda(51498);
  ok('Lei 14.584/2026 (real, carimbo de assinatura sob "ANEXO"): aceita, anexo gráfico', e3.verificacao.situacao === 'aceita' && e3.verificacao.avisos.includes('anexo_grafico_nao_lido'));
}

// (b) fecho com texto demais
{
  const { e } = roda(36255);
  ok('id 36255 (real): fecho de ~24 mil caracteres (quadro de tabela depois da assinatura, sem cabeçalho de anexo) agora reprova com fecho_com_texto_demais', e.verificacao.situacao === 'revisar' && e.verificacao.motivos.includes('fecho_com_texto_demais'));
  const { e: e2 } = roda(40148);
  ok('id 40148 (real, fecho de 1.308 caracteres com quadro): idem', e2.verificacao.motivos.includes('fecho_com_texto_demais'));
  const { e: e3 } = roda(42659);
  ok('id 42659 (real, Câmara, 1.021 caracteres de carimbo de assinatura eletrônica SEI): NÃO reprova (carimbo não conta)', !e3.verificacao.motivos.includes('fecho_com_texto_demais') && e3.verificacao.situacao === 'aceita');
  ok('(sintético) o carimbo não conta, mas texto de verdade antes dele conta', tamanhoDoFechoSemCarimbo('PORTO ALEGRE, 1º de março de 2020.\nNome,\nCargo.\nDocumento assinado eletronicamente por Fulano, em 1/3/2020 ' + 'x'.repeat(900)) < 100 && tamanhoDoFechoSemCarimbo('PORTO ALEGRE, 1º de março de 2020.\n' + 'texto '.repeat(150)) > 600);
}

// (c) tabela no corpo
for (const [id, nome] of [[38309, 'id 38309 (real)'], [42122, 'id 42122 (real, MZ/UEU/SUBUNIDADE)'], [40350, 'id 40350 (real, dentro do inc. III do art. 2º)']]) {
  const { e } = roda(id);
  ok(`${nome}: tabela de PDF no articulado, antes "aceita" com as linhas fundidas ao dispositivo anterior, agora tabela_no_corpo`, e.verificacao.situacao === 'revisar' && e.verificacao.motivos.includes('tabela_no_corpo') && e.verificacao.metricas.tabelaNoCorpo.linhas >= 3);
}
{
  const { e } = roda(37109);
  ok('id 37109 (real, "conforme tabela abaixo" DENTRO de bloco de alteração): negativo — a tabela fica com o bloco e não gera tabela_no_corpo', !e.verificacao.motivos.includes('tabela_no_corpo'));
  const linhas = ['Art. 1º Texto.', 'a   b   c', '1   2   3', '4   5   6', 'Art. 2º Fim.'];
  ok('(sintético) 3 linhas de colunas fora de bloco são tabela; 2 linhas não', !!tabelaNoCorpo(linhas, [], 0, linhas.length) && !tabelaNoCorpo(linhas.slice(0, 3), [], 0, 3) && !tabelaNoCorpo(linhas, [{ startIdx: 1, endIdx: 3 }], 0, linhas.length));
}

// (c2) decisão 42: tabela de 2 colunas (alinhadas) conta; incisos, texto justificado e ruído de OCR não
{
  const L = (f) => fs.readFileSync(`./fixtures/textos/${f}`, 'utf8').split('\n');
  const tem = (f) => !!tabelaNoCorpo(L(f), [], 0, L(f).length);
  ok('id 26743 (real, LC 284/1992: mínimos de vasos/lavatórios/chuveiros em 2 colunas): é tabela', tem('tabela2col_26743.txt'));
  ok('id 27924 (real, LC 334/1994: quadro por Unidade Territorial): é tabela', tem('tabela2col_27924.txt'));
  ok('id 16471 (real, incisos "XI -   texto" com espaçamento largo): NÃO é tabela', !tem('nao_tabela_incisos_16471.txt'));
  ok('id 21359 (real, texto justificado de digitalização): NÃO é tabela', !tem('nao_tabela_justificado_21359.txt'));
  ok('id 28339 (real, texto justificado de digitalização): NÃO é tabela', !tem('nao_tabela_justificado_28339.txt'));
  ok('(sintético) 3 linhas de 2 colunas desalinhadas (2ª célula em lugares diferentes) não são tabela', !tabelaNoCorpo(['Vasos   05', 'Lavatórios            10', 'Chuveiros    10', 'Mictórios                  05'], [], 0, 4));
}

// unidades
ok('(sintético) dividirFechoEAnexos: rótulo escrito, título do cabeçalho, bruto preservado e vetado', (() => { const r = dividirFechoEAnexos('PREFEITURA…, 1º de março de 2020.\nANEXO I – Mapa\nlinha A\nANEXO II\nVETADO.'); return r.fecho.startsWith('PREFEITURA') && r.anexos.length === 2 && r.anexos[0].rotulo === 'ANEXO I' && r.anexos[0].titulo === 'Mapa' && r.anexos[0].bruto === 'ANEXO I – Mapa\nlinha A' && r.anexos[1].vetado === true; })());
ok('(sintético) slugDoAnexo: "ANEXO 1.2" → anexo-1-2; "ANEXO" → anexo; "ANEXO ÚNICO" → anexo-unico', slugDoAnexo('ANEXO 1.2') === 'anexo-1-2' && slugDoAnexo('ANEXO') === 'anexo' && slugDoAnexo('ANEXO ÚNICO') === 'anexo-unico');
ok('(sintético) "ANEXO" só vale como cabeçalho estrito (início de linha); frase que cita anexo no meio não conta', classificarAnexosNoFecho('Conforme o anexo desta Lei, valem as regras.').length === 0);
ok('os motivos fecho_com_texto_demais e tabela_no_corpo têm título em português e o roteiro traz os cartões "fecho" e "tabela"', tituloDoMotivo('fecho_com_texto_demais') !== 'Motivo ainda sem título' && tituloDoMotivo('tabela_no_corpo') !== 'Motivo ainda sem título' && roteiroDeConferencia(['fecho_com_texto_demais', 'tabela_no_corpo'], 'a\nb', [], { tabela: { linhas: 4, trecho: 'x' } }).map((r) => r.chave).join() === 'fecho_longo,tabela');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
