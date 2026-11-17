// teste_versionamento.mjs
//
// Versionamento de ponta a ponta com dado REAL: a LC 320/1994 e as DEZ leis
// complementares que a alteraram (384/1996, 412/1998, 449/2000, 474/2002,
// 514/2004, 525/2005, 692/2012, 761/2015, 849/2019, 958/2022), aplicadas em
// ordem cronológica, e o resultado comparado, dispositivo a dispositivo, com
// o texto compilado de referência (lc320_compilado_leisorg.txt).
//
// Textos das alteradoras: fixtures/lc320/lcNNN.txt — extraídos, sem retoque,
// dos arquivos publicados na base da PGM (SAPL), baixados em 17/11/2026.
// fixtures/lc320/lc514.docx é o arquivo original da LC 514 (prova da extração).
//
// Este teste também REGISTRA o que ainda não funciona (marcado "PENDÊNCIA"):
// é a lista de trabalho do motor, não um atestado de perfeição.
// Sem rede. Uso: node teste_versionamento.mjs

import fs from 'node:fs';
import * as c from './norma-core.js';
import { docxParaTexto } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

// identidade (número, data) vem do CATÁLOGO: 3 dos 8 arquivos têm cabeçalho fora do padrão
const CADEIA = [
  ['./lc384.txt', '384', '1996-09-04'], ['./lc412.txt', '412', '1998-03-24'],
  ['./fixtures/lc320/lc449.txt', '449', '2000-06-19'], ['./fixtures/lc320/lc474.txt', '474', '2002-05-21'],
  ['./fixtures/lc320/lc514.txt', '514', '2004-12-28'], ['./fixtures/lc320/lc525.txt', '525', '2005-07-07'],
  ['./fixtures/lc320/lc692.txt', '692', '2012-03-29'], ['./fixtures/lc320/lc761.txt', '761', '2015-04-09'],
  ['./fixtures/lc320/lc849.txt', '849', '2019-04-11'], ['./fixtures/lc320/lc958.txt', '958', '2022-10-04'],
];

// --- extração de DOCX ------------------------------------------------------
{
  const t = docxParaTexto(fs.readFileSync('./fixtures/lc320/lc514.docx'));
  ok('DOCX real (LC 514/2004): texto extraído é igual ao fixture .txt', t === fs.readFileSync('./fixtures/lc320/lc514.txt', 'utf8'));
  ok('DOCX real: um parágrafo por linha, aspas curvas preservadas', t.split('\n').includes('“Art. 2º ...') && t.startsWith('LEI COMPLEMENTAR N° 514, de 28 de dezembro de 2004.'));
  ok('docxParaTexto: bytes que não são DOCX → null', docxParaTexto(Buffer.from('não é zip')) === null);
}

// --- cadeia ------------------------------------------------------------------
const raw320 = fs.readFileSync('./lc320.txt', 'utf8').trim();
const v0 = c.criarVersaoOriginal(c.parseMinuta(raw320), c.extrairCabecalhoLeiPublicada(raw320));
let v = v0;
const versoes = [v0];
const porLei = {};
for (const [arq, numero, data] of CADEIA) {
  const raw = c.limparMarkdownLinks(fs.readFileSync(arq, 'utf8').trim());
  const fonte = { tipoAto: 'LEI COMPLEMENTAR', numero, ano: data.slice(0, 4), dataPublicacao: data };
  const doc = c.parseMinuta(raw, c.detectNRCandidates(raw));
  const comandos = c.extrairComandosLei(doc, { leiBaseIndex: c.indexarVersao(v) });
  const r = c.apurarTextoVigente(v, [{ fonteAlteradora: fonte, comandos }]);
  porLei[numero] = { comandos, log: r.log, blocos: c.detectNRCandidates(raw).length, cabecalho: c.extrairCabecalhoLeiPublicada(raw) };
  if (r.versaoFinal !== v) versoes.push(r.versaoFinal);
  v = r.versaoFinal;
}
const idx = c.indexarVersao(v);
const no = (ver, chave) => { const p = c.localizarCaminho(ver, chave); return p ? p[p.length - 1].node : null; };
const aplicados = (n) => porLei[n].comandos.filter((k) => ['replace_text', 'insert_node', 'revoke_node'].includes(k.operacao) && !porLei[n].log.some((l) => l.comando === k));
const recusados = (n) => porLei[n].log.filter((l) => !['nao_classificado', 'clausula_generica_sem_efeito'].includes(l.comando.operacao));

// --- aspas curvas ------------------------------------------------------------
ok('aspas curvas: os blocos “…” das alteradoras são detectados (LC 514: 1, LC 525: 4, LC 958: 4)', porLei['514'].blocos === 1 && porLei['525'].blocos === 4 && porLei['958'].blocos === 4);

// --- endereçamento ------------------------------------------------------------
ok('LC 474/2002: "nova redação ao parágrafo único do art. 10" + bloco que começa em "Parágrafo único" → UM replace_text no endereço certo',
  aplicados('474').length === 1 && aplicados('474')[0].operacao === 'replace_text' && aplicados('474')[0].dispositivoAlvo === 'parágrafo único do art. 10');
ok('LC 525/2005: "art. 2o" (letra o) é lido como art. 2º; os 4 comandos são aplicados', aplicados('525').length === 4 && recusados('525').length === 0
  && aplicados('525').map((k) => k.dispositivoAlvo).join(' | ') === '§ 3º do art. 2º | art. 4º | art. 5º | art. 9º');
ok('LC 761/2015 e LC 849/2019: inserem § 4º no art. 8º e § 4º no art. 2º', aplicados('761')[0]?.dispositivoAlvo === '§ 4º do art. 8º' && aplicados('849')[0]?.dispositivoAlvo === '§ 4º do art. 2º');
ok('LC 958/2022: 50 comandos de alteração (2 nova redação, 47 inclusões, 1 revogação), todos aplicados, nenhum recusado', aplicados('958').length === 50 && recusados('958').length === 0);
ok('LC 958/2022: art. 12-B entra com os 21 incisos e o parágrafo único, cada um com origem na LC 958',
  no(v, 'art. 12-b').children.length === 22 && no(v, 'art. 12-b').children.every((f) => f.origem?.lei?.numero === '958'));

// --- revogação (1º exemplo real) ---------------------------------------------
{
  const a7 = no(v, 'art. 7º');
  ok('LC 958/2022, art. 6º: art. 7º revogado — continua na árvore, marcado, com origem na LC 958', a7 && a7.revogado === true && a7.texto === '(Revogado)' && a7.desFixo === 'Art. 7º' && a7.origem.lei.numero === '958' && a7.origem.operacao === 'revoke_node');
  ok('revogado o artigo, seguem revogados os seus parágrafos', a7.children.length === 2 && a7.children.every((f) => f.revogado));
  ok('a versão anterior guarda o texto do art. 7º antes da revogação', /manifestação favorável da comunidade/.test(no(versoes[versoes.length - 2], 'art. 7º').texto));
  ok('art. 8º continua logo depois do art. 7º (nada foi renumerado)', v.artigos[6].desFixo === 'Art. 7º' && v.artigos[7].desFixo === 'Art. 8º');
}

// --- guardas -------------------------------------------------------------------
ok('LC 449/2000 (arquivo com "art. 5®"): o endereço não é reconhecido e o comando é RECUSADO — não nasce um segundo art. 5',
  recusados('449').length === 1 && /já existe artigo/.test(recusados('449')[0].erro) && v.artigos.filter((a) => /^Art\. 5º?$/.test(a.desFixo)).length === 1);
ok('LC 692/2012 (arquivo traz o documento 3 vezes): art. 9º-A entra uma vez só, entre o art. 9º e o art. 10',
  aplicados('692').length === 1 && recusados('692').length === 2 && v.artigos.map((a) => a.desFixo).join('|').includes('Art. 9º|Art. 9º-A|Art. 10'));

// --- cadeia de versões ---------------------------------------------------------
ok('uma versão por alteradora que mudou algo: v0 + 9 (só a LC 449 não mudou nada)', versoes.length === 10);
ok('cada versão tem identidade própria e aponta para a anterior', versoes.slice(1).every((x, i) => x.versaoAnterior === versoes[i].id && x.id !== versoes[i].id));
ok('ids: "lc 320/1994@<data da alteradora>"', versoes[1].id === 'lc 320/1994@1996-09-04' && v.id === 'lc 320/1994@2022-10-04' && v.fonte.lei.numero === '958');
ok('versões são imutáveis: a v0 segue com o art. 4º de 1994', /^É proibida a duplicidade/.test(no(v0, 'art. 4º').texto) && !/inclusive/.test(no(v0, 'art. 4º').texto));
ok('art. 4º: LC 384 (1996) e depois LC 525 (2005) — cada versão mostra o texto e a origem do seu tempo',
  no(versoes[1], 'art. 4º').origem.lei.numero === '384' && /^É defeso atribuir/.test(no(v, 'art. 4º').texto) && no(v, 'art. 4º').origem.lei.numero === '525');
ok('dispositivo nunca alterado continua sendo o MESMO objeto da v0 (compartilhamento estrutural)', no(v, 'art. 1º') === no(v0, 'art. 1º'));

// --- comparação com o compilado de referência ----------------------------------
const norm = (s) => (s || '').replace(/\s+/g, ' ').replace(/[–—]/g, '-').replace(/\s*\((?:Redação|Parágrafo|Suprimid|Vide|Revogad)[^)]*\)\s*/gi, ' ').replace(/[“”]/g, '"').trim().replace(/[.;:,]+$/, '').toLowerCase();
const ref = c.parseLeiAlvoIndex(c.prepararTextoOrigem(fs.readFileSync('./lc320_compilado_leisorg.txt', 'utf8')));
const chaves = [...new Set([...Object.keys(ref), ...Object.keys(idx)])];
const fecho = /prefeitura municipal de porto alegre, 02 de maio/; // a referência cola o fecho no último artigo
const diferentes = chaves.filter((k) => { const a = norm(idx[k]), b = norm(ref[k]); return !(a === b || (b.startsWith(a) && fecho.test(b))); });
console.log(`  (iguais à referência: ${chaves.length - diferentes.length} de ${chaves.length})`);
ok('72 de 78 dispositivos iguais ao compilado de referência', chaves.length === 78 && diferentes.length === 6);
const esperadas = {
  'DIVERGÊNCIA DA REFERÊNCIA — art. 7º revogado pela LC 958/2022, art. 6º; o compilado de referência ainda traz o texto': ['art. 7º', '§ 1º do art. 7º', '§ 2º do art. 7º'],
  'DEFEITO DO ARQUIVO DE ORIGEM — LC 692 (faltam palavras), LC 474 ("n-" por "nº"), e um travessão a mais na LC 958 que a referência não tem': ['art. 9º-a', 'parágrafo único do art. 10', 'inc. i do art. 12-b'],
};
for (const [motivo, lista] of Object.entries(esperadas)) ok(`${motivo}: ${lista.join(', ')}`, lista.every((k) => diferentes.includes(k)));
ok('nenhuma diferença fora das 6 explicadas acima', diferentes.every((k) => Object.values(esperadas).flat().includes(k)));
// --- renumeração ordenada pela lei e texto novo em rótulo de dispositivo vetado ---
{
  const k514 = porLei['514'].comandos.filter((k) => k.operacao !== 'nao_classificado');
  ok('LC 514/2004: 3 comandos — renumerar o parágrafo único para § 3º, depois os §§ 1º e 2º', k514.map((k) => `${k.operacao}:${k.dispositivoAlvo}`).join(' | ') === 'renumber_node:parágrafo único do art. 2º | replace_text:§ 1º do art. 2º | replace_text:§ 2º do art. 2º' && porLei['514'].log.length === 1);
  const v514 = versoes.find((x) => x.fonte?.lei?.numero === '514');
  const antes = versoes[versoes.indexOf(v514) - 1];
  const p3 = no(v514, '§ 3º do art. 2º'), pu = no(antes, 'parágrafo único do art. 2º');
  ok('LC 514: o parágrafo único vira § 3º — MESMO dispositivo (id e texto), rótulo novo, troca registrada', p3 && p3.id === pu.id && p3.texto === pu.texto && p3.desFixo === '§ 3º' && p3.renumerado.de === 'Parágrafo único.' && p3.renumerado.lei.numero === '514' && p3.origem.lei.numero === '384');
  ok('LC 514: depois dela não há mais "parágrafo único" no art. 2º', no(v514, 'parágrafo único do art. 2º') === null && no(v514, 'art. 2º').children.map((f) => f.desFixo).join(' ') === '§ 1º § 2º § 3º');
  const p1 = no(v514, '§ 1º do art. 2º');
  ok('LC 514: § 1º novo entra no rótulo do § 1º vetado — dispositivo NOVO (outro id), sem marca de vetado, exceção registrada', /percentual mínimo de 30%/.test(p1.texto) && !p1.vetado && p1.id !== no(antes, '§ 1º do art. 2º').id && p1.origem.ocupouPosicaoDeVetado === true && p1.origem.lei.numero === '514');
  ok('a versão anterior continua com os §§ 1º e 2º vetados', no(antes, '§ 1º do art. 2º').vetado === true && no(antes, '§ 2º do art. 2º').vetado === true);
  ok('LC 525/2005 passa a dar NOVA REDAÇÃO ao § 3º (antes, sem a renumeração, ela "incluía" um § 3º)', aplicados('525')[0].operacao === 'replace_text' && no(v, '§ 3º do art. 2º').origem.lei.numero === '525' && no(v, '§ 3º do art. 2º').id === pu.id);
  ok('texto vigente do art. 2º: §§ 1º a 4º, como no compilado de referência', no(v, 'art. 2º').children.map((f) => f.desFixo).join(' ') === '§ 1º § 2º § 3º § 4º' && ['§ 1º do art. 2º', '§ 2º do art. 2º', '§ 3º do art. 2º', '§ 4º do art. 2º'].every((k) => !diferentes.includes(k)));
  ok('(sintético) linha "parágrafo único para…" em minúscula não vira dispositivo; "Parágrafo único." e "PARÁGRAFO ÚNICO" continuam valendo',
    c.parseMinuta('LEI Nº 1\nArt. 1º Texto que renumera o atual\nparágrafo único para § 3º.\nParágrafo único. Vale.\nArt. 2º Outro.\nPARÁGRAFO ÚNICO - Vale também.').artigos.map((a) => a.children.length).join() === '1,1');
}
ok('PENDÊNCIA — cabeçalho fora do padrão não é reconhecido: LC 449 ("…Nº 449", sem data), LC 474 (sem "Nº"), LC 692 (timbre antes)', !porLei['449'].cabecalho && !porLei['474'].cabecalho && !porLei['692'].cabecalho);

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
