import fs from 'node:fs';
import {
  parseMinuta, normalizar, limparMarkdownLinks, extrairProvenienciaPromulgacao
} from './norma-core.js';

let pass = 0, fail = 0;
const ok = (desc, cond) => { if (cond) { pass++; console.log(`  ✓ ${desc}`); } else { fail++; console.log(`  ✗ FALHOU: ${desc}`); } };
const linha = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

const lc320raw = fs.readFileSync('./lc320.txt', 'utf8').trim();
const lc384raw = limparMarkdownLinks(fs.readFileSync('./lc384.txt', 'utf8').trim());
const lc412raw = limparMarkdownLinks(fs.readFileSync('./lc412.txt', 'utf8').trim());

// ─── VETADO continua marcado, sem confundir com REVOGADO ──────────────────────
linha('normalizar(): VETADO e REVOGADO são flags distintas');
{
  const doc = parseMinuta(lc320raw);
  normalizar(doc);
  const art2 = doc.artigos[1];
  ok('§ 1º do art. 2º: vetado=true', art2.children[0].vetado === true);
  ok('§ 1º do art. 2º: revogado NÃO está setado (não confundir os dois estados)', !art2.children[0].revogado);
}

// ─── REVOGADO detectado (texto sintético — nenhum dos 3 reais tem esse padrão) ─
linha('normalizar(): dispositivo com texto placeholder "REVOGADO" fica marcado');
{
  const sint = `LEI COMPLEMENTAR Nº 999, DE 1º DE JANEIRO DE 2020.

DISPÕE SOBRE TESTE.

O PREFEITO MUNICIPAL DE PORTO ALEGRE, Faço saber que a Câmara Municipal aprovou e eu sanciono a seguinte Lei Complementar:

Art. 1º Texto normal do artigo um.

Art. 2º REVOGADO.

Art. 3º Esta Lei Complementar entra em vigor na data de sua publicação.`;
  const doc = parseMinuta(sint);
  normalizar(doc);
  ok('Art. 2º ("REVOGADO.") marcado revogado=true', doc.artigos[1].revogado === true);
  ok('Art. 2º NÃO marcado vetado (são proveniências diferentes)', !doc.artigos[1].vetado);
  ok('Art. 1º (texto normal) não tem nenhuma das duas flags', !doc.artigos[0].revogado && !doc.artigos[0].vetado);

  // forma parentética "(Revogado)", comum em compilados
  const sint2 = sint.replace('Art. 2º REVOGADO.', 'Art. 2º (Revogado)');
  const doc2 = parseMinuta(sint2);
  normalizar(doc2);
  ok('Forma parentética "(Revogado)" também é reconhecida', doc2.artigos[1].revogado === true);
}

// ─── Proveniência da promulgação ────────────────────────────────────────────────
linha('extrairProvenienciaPromulgacao(): distingue sanção normal de veto derrubado');
{
  const p320 = extrairProvenienciaPromulgacao(lc320raw);
  ok('LC 320/1994: sanção normal do Prefeito', p320.promulgadoPor === 'PREFEITO' && p320.motivoProvavel === 'sancao_normal');

  const p384 = extrairProvenienciaPromulgacao(lc384raw);
  ok('LC 384/1996: sanção normal do Prefeito', p384.promulgadoPor === 'PREFEITO' && p384.motivoProvavel === 'sancao_normal');

  const p412 = extrairProvenienciaPromulgacao(lc412raw);
  ok('LC 412/1998: promulgação pelo Presidente da Câmara (achado real!)', p412.promulgadoPor === 'PRESIDENTE_CAMARA');
  ok('LC 412/1998: motivo = veto_derrubado', p412.motivoProvavel === 'veto_derrubado');
  ok('LC 412/1998: base legal capturada (art. 77, § 7º, da Lei Orgânica)', p412.baseLegal === 'art. 77, § 7º, da Lei Orgânica');
  console.log('  → LC 412/1998:', JSON.stringify(p412));
}

// ─── Emenda à Lei Orgânica: promulgação pela Câmara não é veto derrubado ─────
linha('extrairProvenienciaPromulgacao(): emenda à Lei Orgânica não é confundida com veto derrubado');
{
  const sintEmenda = `EMENDA Nº 15 À LEI ORGÂNICA

ALTERA O ART. 50 DA LEI ORGÂNICA DO MUNICÍPIO DE PORTO ALEGRE.

A MESA DA CÂMARA MUNICIPAL DE PORTO ALEGRE, nos termos do art. 42 da Lei Orgânica do Município, promulga a seguinte Emenda à Lei Orgânica:

Art. 1º O art. 50 da Lei Orgânica do Município passa a vigorar com a seguinte redação: "Art. 50 ..."

Art. 2º Esta Emenda entra em vigor na data de sua publicação.`;
  const p = extrairProvenienciaPromulgacao(sintEmenda);
  ok('Emenda à Lei Orgânica: promulgadoPor = PRESIDENTE_CAMARA', p.promulgadoPor === 'PRESIDENTE_CAMARA');
  ok('Emenda à Lei Orgânica: motivo = emenda_lei_organica, NÃO veto_derrubado', p.motivoProvavel === 'emenda_lei_organica');
  console.log('  → Emenda sintética:', JSON.stringify(p));
  console.log('  (heurística não testada com texto real de emenda à Lei Orgânica — sinalizado no JSDoc)');
}

// ─── Resumo ────────────────────────────────────────────────────────────────────
linha(`RESULTADO: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
