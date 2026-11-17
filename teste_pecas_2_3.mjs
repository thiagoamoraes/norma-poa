import fs from 'node:fs';
import {
  parseMinuta, detectNRCandidates, limparMarkdownLinks, prepararTextoOrigem,
  extrairCabecalhoLeiPublicada, extrairReferenciasLei, chaveLei,
  construirIndiceColecao, resolverReferenciaLei, extrairComandosLei,
  parseLeiAlvoIndex, visText
} from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const lc320raw = fs.readFileSync('./lc320.txt', 'utf8').trim();
const lc384raw = limparMarkdownLinks(fs.readFileSync('./lc384.txt', 'utf8').trim());
const lc412raw = limparMarkdownLinks(fs.readFileSync('./lc412.txt', 'utf8').trim());

// ─── PEÇA 2: resolvedor interlegislativo ───────────────────────────────────────
linha('PEÇA 2 — extrairReferenciasLei()');
{
  const refs = extrairReferenciasLei(lc384raw);
  console.log('  Referências encontradas na LC 384:', refs.length);
  refs.forEach(r => console.log('   ', JSON.stringify(r)));
  ok('Encontra pelo menos 2 referências à LC 320 (forma extensa e abreviada "/94")', refs.filter(r => r.numero === '320').length >= 2);
  ok('Forma extensa resolve ano completo (1994)', refs.some(r => r.numero === '320' && r.ano === '1994'));
  ok('Forma abreviada "/94" gera anosCandidatos [1994, 2094]', refs.some(r => r.numero === '320' && r.anosCandidatos && r.anosCandidatos.includes(1994)));

  const refsLC320base = extrairReferenciasLei(lc320raw);
  ok('"Lei Orgânica do Município" NÃO gera falso positivo (sem Nº explícito)', !refsLC320base.some(r => /org[âa]nica/i.test(r.raw)));
  ok('LC 320 art.8 (original) cita LC 282/1992', refsLC320base.some(r => r.numero === '282' && r.ano === '1992'));
  ok('LC 320 art.10 cita LC 43/1979', refsLC320base.some(r => r.numero === '43' && r.ano === '1979'));
  ok('LC 320 art.14 cita as 7 leis revogadas (Lei 172/1948, LC 3/1973... LC 225/1990)',
    refsLC320base.filter(r => r.ano && ['1948','1973','1978','1982','1984','1986','1990'].includes(r.ano)).length === 7);
}

linha('PEÇA 2 — construirIndiceColecao() + resolverReferenciaLei()');
{
  const colecao = [lc320raw, lc384raw, lc412raw].map(raw => {
    const cab = extrairCabecalhoLeiPublicada(raw);
    return { ...cab, raw };
  });
  const idx = construirIndiceColecao(colecao);
  ok('Chave "lc 320/1994" presente no índice', !!idx['lc 320/1994']);
  ok('chaveLei() produz a mesma chave que o índice usa', chaveLei('LEI COMPLEMENTAR','320','1994') === 'lc 320/1994');

  const refs384 = extrairReferenciasLei(lc384raw);
  const refExtensa = refs384.find(r => r.ano === '1994');
  const resolvidaExtensa = resolverReferenciaLei(refExtensa, idx);
  ok('Resolve a referência em forma extensa da LC 384 → acha a LC 320 na coleção', resolvidaExtensa === idx['lc 320/1994']);

  const refAbrev = refs384.find(r => r.anosCandidatos);
  const resolvidaAbrev = resolverReferenciaLei(refAbrev, idx);
  ok('Resolve a referência abreviada "/94" tentando os dois séculos → também acha a LC 320', resolvidaAbrev === idx['lc 320/1994']);
}

// ─── PEÇA 3: extrator de comando ───────────────────────────────────────────────
linha('PEÇA 3 — extrairComandosLei() na LC 384/1996 (sem leiBaseIndex — fallback por gatilho)');
{
  const cand = detectNRCandidates(lc384raw);
  const doc = parseMinuta(lc384raw, cand);
  const comandos = extrairComandosLei(doc);
  comandos.forEach(c => console.log('  ', JSON.stringify({ art: c.artigoOrigem, op: c.operacao, alvo: c.dispositivoAlvo, lei: c.leiAlvo?.chave })));

  const c1 = comandos.filter(c => c.artigoOrigem === 1);
  ok('Art. 1º (acrescenta § único ao art. 2º): 1 comando gerado', c1.length === 1);
  ok('Art. 1º classificado como insert_node (gatilho "acrescenta")', c1[0]?.operacao === 'insert_node');
  ok('Art. 1º aponta pro endereço correto (parágrafo único do art. 2º)', c1[0]?.dispositivoAlvo === 'parágrafo único do art. 2º');
  ok('Art. 1º aponta pra lei-alvo correta (lc 320/1994, via forma extensa)', c1[0]?.leiAlvo?.chave === 'lc 320/1994' || (c1[0]?.leiAlvo?.anosCandidatos||[]).includes(1994));

  const c2 = comandos.filter(c => c.artigoOrigem === 2);
  ok('Art. 2º (nova redação ao art. 4º): 1 comando gerado', c2.length === 1);
  ok('Art. 2º classificado como replace_text (gatilho "nova redação")', c2[0]?.operacao === 'replace_text');
  ok('Art. 2º aponta pro art. 4º', c2[0]?.dispositivoAlvo === 'art. 4º');

  const c4 = comandos.find(c => c.artigoOrigem === 4);
  ok('Art. 4º ("Revogam-se as disposições em contrário.") = cláusula genérica sem efeito', c4?.operacao === 'clausula_generica_sem_efeito');
  ok('Cláusula genérica NÃO tem dispositivoAlvo nem leiAlvo (não é comando executável)', !c4?.dispositivoAlvo && !c4?.leiAlvo);
}

linha('PEÇA 3 — extrairComandosLei() na LC 412/1998 (COM leiBaseIndex — deve resolver bloco misto)');
{
  const leiBaseIndex = parseLeiAlvoIndex(lc320raw); // estado da LC 320 em 1998, antes desta alteração
  const cand = detectNRCandidates(lc412raw);
  const doc = parseMinuta(lc412raw, cand);
  const comandos = extrairComandosLei(doc, { leiBaseIndex });
  comandos.forEach(c => console.log('  ', JSON.stringify({ art: c.artigoOrigem, op: c.operacao, alvo: c.dispositivoAlvo })));

  const c1 = comandos.filter(c => c.artigoOrigem === 1);
  ok('Art. 1º (redação nova ao caput + inclui §§1-3): gera 4 comandos (caput + 3 parágrafos)', c1.length === 4);
  const caput = c1.find(c => c.dispositivoAlvo === 'art. 8º');
  ok('Caput do art. 8º → replace_text (endereço já existe na lei-base de 1994)', caput?.operacao === 'replace_text');
  const p1 = c1.find(c => c.dispositivoAlvo === '§ 1º do art. 8º');
  const p2 = c1.find(c => c.dispositivoAlvo === '§ 2º do art. 8º');
  const p3 = c1.find(c => c.dispositivoAlvo === '§ 3º do art. 8º');
  ok('§ 1º do art. 8º → insert_node (endereço não existe na lei-base de 1994)', p1?.operacao === 'insert_node');
  ok('§ 2º do art. 8º → insert_node', p2?.operacao === 'insert_node');
  ok('§ 3º do art. 8º → insert_node', p3?.operacao === 'insert_node');
  ok('Texto do § 3º inserido bate com o texto real do bloco NR', p3?.novoTexto?.includes('acompanhado e fiscalizado pela entidade geral'));
}

linha('PEÇA 3 — mesmo teste da LC 412 SEM leiBaseIndex (fallback por gatilho — mostra a limitação)');
{
  const cand = detectNRCandidates(lc412raw);
  const doc = parseMinuta(lc412raw, cand);
  const comandos = extrairComandosLei(doc); // sem leiBaseIndex
  const c1 = comandos.filter(c => c.artigoOrigem === 1);
  const operacoes = c1.map(c => c.operacao);
  console.log('  Operações sem leiBaseIndex:', operacoes);
  console.log('  (Esperado: o fallback por gatilho classifica tudo igual, já que o texto de introdução');
  console.log('   tem tanto "nova redação" quanto "inclui" — não dá pra distinguir caput de §§ novos só pelo verbo.)');
}

// ─── Comando de revogação de dispositivo específico e de lei inteira ─────────
linha('PEÇA 3 — revoke_node e revoke_lei (com texto sintético, já que os 3 documentos reais só têm cláusula genérica)');
{
  const textoSintetico = `LEI COMPLEMENTAR Nº 999, DE 1º DE JANEIRO DE 2020.

REVOGA DISPOSITIVO DA LEI COMPLEMENTAR Nº 320, DE 2 DE MAIO DE 1994.

Art. 1º Fica revogado o § 2º do art. 6º da Lei Complementar nº 320, de 2 de maio de 1994.

Art. 2º Esta Lei Complementar entra em vigor na data de sua publicação.`;
  const doc = parseMinuta(limparMarkdownLinks(textoSintetico));
  const comandos = extrairComandosLei(doc);
  const c1 = comandos.find(c => c.artigoOrigem === 1);
  ok('Revogação específica de dispositivo → operacao=revoke_node', c1?.operacao === 'revoke_node');
  ok('revoke_node aponta pro endereço certo (§ 2º do art. 6º)', c1?.dispositivoAlvo === '§ 2º do art. 6º');
  ok('revoke_node aponta pra lei-alvo certa (lc 320/1994)', c1?.leiAlvo?.chave === 'lc 320/1994');

  // revoke_lei já testado indiretamente via LC 320 art.14 (7 leis revogadas por número)
  const doc320 = parseMinuta(lc320raw);
  const comandos320 = extrairComandosLei(doc320);
  const art14 = comandos320.filter(c => c.artigoOrigem === 14);
  ok('LC 320 art.14 gera 7 comandos revoke_lei (uma por lei revogada nominalmente)',
    art14.filter(c => c.operacao === 'revoke_lei').length === 7);
}

// ─── Resumo ────────────────────────────────────────────────────────────────────
linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
