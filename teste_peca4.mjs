import fs from 'node:fs';
import {
  parseMinuta, detectNRCandidates, limparMarkdownLinks,
  extrairCabecalhoLeiPublicada, extrairComandosLei,
  criarVersaoOriginal, indexarVersao, apurarTextoVigente, localizarCaminho, aplicarComandoLei
} from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const lc320raw = fs.readFileSync('./lc320.txt', 'utf8').trim();
const lc384raw = limparMarkdownLinks(fs.readFileSync('./lc384.txt', 'utf8').trim());
const lc412raw = limparMarkdownLinks(fs.readFileSync('./lc412.txt', 'utf8').trim());

// ─── v0: promulgação original da LC 320 ───────────────────────────────────────
linha('v0 — criarVersaoOriginal(LC 320/1994)');
const doc320 = parseMinuta(lc320raw);
// NÃO chama normalizar() aqui — normalizar() muta texto (grafia/terminador/
// nomenclatura), o que é apropriado pra revisar uma MINUTA antes do plenário,
// nunca pra ingerir uma lei JÁ PUBLICADA (mutaria o registro oficial).
// criarVersaoOriginal() já chama marcarEstadosEspeciais() internamente — é
// só isso que a peça 4 precisa. Ver CHANGELOG, rodada 8.
const cab320 = extrairCabecalhoLeiPublicada(lc320raw);
const v0 = criarVersaoOriginal(doc320, cab320);
ok('v0.id = "lc 320/1994@1994-05-02"', v0.id === 'lc 320/1994@1994-05-02');
ok('v0.versaoAnterior = null', v0.versaoAnterior === null);
ok('Todo artigo tem desFixo atribuído', v0.artigos.every(a => !!a.desFixo));
ok('Art. 8º tem desFixo "Art. 8º"', v0.artigos[7].desFixo === 'Art. 8º');
ok('§ 1º do art. 2º (VETADO) tem desFixo "§ 1º" e origem = promulgação original',
  v0.artigos[1].children[0].desFixo === '§ 1º' && v0.artigos[1].children[0].origem.tipo === 'promulgacao_original');

// ─── v1: aplica os comandos da LC 384/1996 ────────────────────────────────────
linha('v1 — apurarTextoVigente(v0, LC 384/1996)');
const cand384 = detectNRCandidates(lc384raw);
const doc384 = parseMinuta(lc384raw, cand384);
const leiBaseIndex0 = indexarVersao(v0);
const comandos384 = extrairComandosLei(doc384, { leiBaseIndex: leiBaseIndex0 });
const cab384 = extrairCabecalhoLeiPublicada(lc384raw);
const r1 = apurarTextoVigente(v0, [{ fonteAlteradora: cab384, comandos: comandos384 }]);
const v1 = r1.versaoFinal;

console.log('  Log de comandos não aplicados nesta etapa:', JSON.stringify(r1.log.map(l => ({op: l.comando.operacao, motivo: l.erro || 'ignorado/stub'})), null, 2));
ok('2 comandos no log (art. vigência = nao_classificado, esperado; + cláusula genérica do art. 4º)', r1.log.length === 2);
ok('Um deles é clausula_generica_sem_efeito (ignorado, não erro real)', r1.log.some(l => l.comando.operacao === 'clausula_generica_sem_efeito' && l.ignorado));
ok('O outro é nao_classificado (art. de vigência "entra em vigor..." — esperado, não é comando)', r1.log.some(l => l.comando.operacao === 'nao_classificado'));

const idx1 = indexarVersao(v1);
ok('parágrafo único do art. 2º inserido com o texto correto',
  idx1['parágrafo único do art. 2º']?.includes('sejam homenageados mais de uma vez'));
ok('§ 1º do art. 2º ainda é VETADO (LC384 não tocou nele)',
  localizarCaminho(v1, '§ 1º do art. 2º')[localizarCaminho(v1,'§ 1º do art. 2º').length-1].node.vetado === true);
ok('art. 4º substituído pelo texto da LC384 ("inclusive quando estes pertencerem a diferentes categorias")',
  idx1['art. 4º']?.includes('inclusive quando estes pertencerem a diferentes categorias'));
const noArt4_v1 = localizarCaminho(v1, 'art. 4º')[0].node;
ok('art. 4º tem origem.lei = LC 384/1996', noArt4_v1.origem.lei.numero === '384' && noArt4_v1.origem.lei.ano === '1996');
ok('art. 4º tem origem.operacao = replace_text', noArt4_v1.origem.operacao === 'replace_text');
ok('art. 8º NÃO foi tocado ainda (permanece "através de plebiscito", texto de 1994)',
  idx1['art. 8º']?.includes('através de plebiscito'));

// ─── v2: aplica os comandos da LC 412/1998 sobre v1 (não sobre v0!) ──────────
linha('v2 — apurarTextoVigente(v1, LC 412/1998)');
const cand412 = detectNRCandidates(lc412raw);
const doc412 = parseMinuta(lc412raw, cand412);
const leiBaseIndex1 = indexarVersao(v1); // estado da lei DEPOIS da LC384 — é isso que a LC412 realmente viu em 1998
const comandos412 = extrairComandosLei(doc412, { leiBaseIndex: leiBaseIndex1 });
const cab412 = extrairCabecalhoLeiPublicada(lc412raw);
const r2 = apurarTextoVigente(v1, [{ fonteAlteradora: cab412, comandos: comandos412 }]);
const v2 = r2.versaoFinal;

console.log('  Log de comandos não aplicados nesta etapa:', JSON.stringify(r2.log.map(l => ({op: l.comando.operacao, motivo: l.erro || 'ignorado/stub'})), null, 2));
ok('2 comandos no log (art. vigência = nao_classificado + cláusula genérica do art. 3º)', r2.log.length === 2);
ok('Um deles é clausula_generica_sem_efeito (ignorado)', r2.log.some(l => l.comando.operacao === 'clausula_generica_sem_efeito' && l.ignorado));

const idx2 = indexarVersao(v2);
ok('art. 8º (caput) substituído pelo texto da LC412 ("mediante consulta prévia")',
  idx2['art. 8º']?.includes('mediante consulta prévia'));
ok('§ 1º do art. 8º inserido (não existia antes de 1998)',
  idx2['§ 1º do art. 8º']?.includes('no mínimo, 2/3'));
ok('§ 2º do art. 8º inserido', idx2['§ 2º do art. 8º']?.includes('cidadãos eleitores'));
ok('§ 3º do art. 8º inserido', idx2['§ 3º do art. 8º']?.includes('entidade geral representativa'));

const noArt8Caput_v2 = localizarCaminho(v2, 'art. 8º')[0].node;
const noPar1_v2 = localizarCaminho(v2, '§ 1º do art. 8º'); const noPar1Node = noPar1_v2[noPar1_v2.length-1].node;
ok('Caput do art. 8º: origem.operacao = replace_text', noArt8Caput_v2.origem.operacao === 'replace_text');
ok('§ 1º do art. 8º: origem.operacao = insert_node', noPar1Node.origem.operacao === 'insert_node');
ok('Caput e § 1º do art. 8º têm a MESMA origem.lei (LC 412/1998) — resolve de graça o problema de anotação em bloco do CHANGELOG',
  noArt8Caput_v2.origem.lei.numero === '412' && noPar1Node.origem.lei.numero === '412');

// ─── Coisas que NÃO deveriam ter mudado entre v0 e v2 ────────────────────────
linha('Compartilhamento estrutural — artigos não tocados permanecem intactos');
{
  ok('Art. 1º (nunca alterado): mesmo texto em v0 e v2', v0.artigos[0].texto === v2.artigos[0].texto);
  ok('Art. 5º, 6º, 7º (nunca alterados): desFixo intacto apesar de inserções em outros artigos',
    v2.artigos[4].desFixo === 'Art. 5º' && v2.artigos[5].desFixo === 'Art. 6º' && v2.artigos[6].desFixo === 'Art. 7º');
  ok('§ 2º do art. 7º ainda VETADO em v2 (nunca tocado por LC384 nem LC412)', (() => {
    const c = localizarCaminho(v2, '§ 2º do art. 7º'); return c[c.length-1].node.vetado === true;
  })());
  // compartilhamento estrutural de verdade: o nó do Art. 1º em v2 é a MESMA referência que em v1 (nunca reconstruído)
  ok('Art. 1º: mesma referência de objeto entre v1 e v2 (prova de structural sharing, não só igualdade de valor)',
    v1.artigos[0] === v2.artigos[0]);
}

// ─── Comando pra lei errada é rejeitado (checagem de segurança) ──────────────
linha('Segurança: comando apontando pra lei-alvo diferente da versão é rejeitado');
{
  const comandoErrado = { operacao: 'replace_text', dispositivoAlvo: 'art. 1º', novoTexto: 'texto indevido',
    leiAlvo: { tipoAto: 'LEI COMPLEMENTAR', numero: '999', ano: '2000', chave: 'lc 999/2000' } };
  const resultado = aplicarComandoLei(v2, comandoErrado, cab412);
  ok('Comando pra LC 999/2000 aplicado sobre versão da LC 320 é rejeitado com erro', !!resultado.erro);
  ok('Art. 1º de v2 continua intacto (comando rejeitado, não aplicado)', resultado.erro && !resultado.versao);
}

// ─── Sintético: inserção de artigo novo no nível raiz (Art. 9º-A) ────────────
// NENHUM dos 3 documentos reais insere um artigo-irmão novo (só filhos de
// artigo existente) — este caminho de código fica sem validação com dado
// real, mesmo status de revoke_node/veto_derrubado. Registrado no CHANGELOG.
linha('SINTÉTICO (não validado com dado real) — insert_node de artigo-irmão novo (Art. 9º-A)');
{
  const comandoSintetico = {
    operacao: 'insert_node', dispositivoAlvo: 'art. 9º-a', novoTexto: 'Texto do novo artigo inserido.',
    leiAlvo: { chave: 'lc 320/1994' },
    _noOrigemNrBloco: { tipo: 'artigo', desFixo: 'Art. 9º-A', children: [] }
  };
  const fonteFicticia = { tipoAto: 'LEI COMPLEMENTAR', numero: '999', ano: '2020', dataPublicacao: '2020-01-01' };
  const r3 = apurarTextoVigente(v2, [{ fonteAlteradora: fonteFicticia, comandos: [comandoSintetico] }]);
  const idx3 = indexarVersao(r3.versaoFinal);
  console.log('  Log:', JSON.stringify(r3.log));
  console.log('  Ordem dos artigos ao redor da inserção:', r3.versaoFinal.artigos.slice(7,10).map(a=>a.desFixo));
  console.log('  (Sem validação com dado real — confirma só que o código roda sem quebrar, não que a heurística de posicionamento está certa)');
}

// ─── Resumo ────────────────────────────────────────────────────────────────────
linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
