#!/usr/bin/env node
// cruzar-projeto.mjs — responde "o que vale a pena manter?" com evidência.
//
//   1) COBERTURA: para cada função exportada por norma-core.js, quais arquivos
//      de teste a referenciam. Aponta funções sem teste e funções que dependem
//      de UM só arquivo de teste (se ele sumir, some a cobertura).
//   2) DERIVA DE DOCUMENTAÇÃO: identificadores de código citados entre crases
//      nos .md que NÃO existem em nenhum .js/.mjs — sinal de documento
//      defasado (função renomeada ou removida).
//
// NÃO executa os testes (para isso, rode cada teste_*.mjs). É análise estática:
// uma função "referenciada" por um teste pode ainda assim estar mal coberta.
//
// Uso (na raiz do repositório):
//   node cruzar-projeto.mjs [doc.md ...]
// Sem argumentos, examina os .md que existirem entre os padrão abaixo.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DOCS_PADRAO = ['CLAUDE.md', 'PECA4-MODELO-DE-DADOS.md', 'PROJETO-INSTRUCOES.md', 'PECA5-INGESTAO-PDF-PLANO.md'];
const ler = (f) => readFileSync(f, 'utf8');
const ehTesteDoCore = (f) => /^teste_.*\.mjs$/.test(f) && f !== 'teste_dopa_discovery.mjs'; // esse testa o coletor

if (!existsSync('norma-core.js')) {
  console.error('norma-core.js não encontrado — rode na raiz do repositório.');
  process.exit(1);
}

const arquivos = readdirSync('.');
const nucleo = ler('norma-core.js');
const exportados = [
  ...new Set([
    ...[...nucleo.matchAll(/^export (?:async )?function (\w+)/gm)].map((m) => m[1]),
    ...[...nucleo.matchAll(/^export const (\w+)/gm)].map((m) => m[1]),
  ]),
].sort();

const testes = arquivos.filter(ehTesteDoCore).concat(existsSync('normateste.mjs') ? ['normateste.mjs'] : []).sort();
const fonteTeste = Object.fromEntries(testes.map((t) => [t, ler(t)]));
const cita = (texto, id) => new RegExp(`\\b${id}\\b`).test(texto);

// ─── 1) cobertura ────────────────────────────────────────────────────────────
console.log(`\n=== COBERTURA: ${exportados.length} exports de norma-core.js × ${testes.length} arquivos de teste ===\n`);
const linhas = exportados.map((e) => [e, testes.filter((t) => cita(fonteTeste[t], e))]);
const larg = Math.max(...exportados.map((e) => e.length));
for (const [e, usados] of linhas) {
  const nomes = usados.map((t) => t.replace(/^teste_/, '').replace(/\.mjs$/, ''));
  console.log(`${e.padEnd(larg)}  ${usados.length}  ${usados.length ? nomes.join(', ') : '— SEM TESTE'}`);
}
const sem = linhas.filter(([, u]) => u.length === 0).map(([e]) => e);
const unico = linhas.filter(([, u]) => u.length === 1);
console.log(`\nSem nenhum teste (${sem.length}): ${sem.join(', ') || 'nenhum'}`);
const porArquivo = {};
for (const [e, [t]] of unico) (porArquivo[t] ||= []).push(e);
console.log(`\nDependem de UM ÚNICO arquivo de teste (${unico.length}) — agrupadas por esse arquivo:`);
for (const [t, fs] of Object.entries(porArquivo)) console.log(`  ${t}: ${fs.join(', ')}`);

// ─── 2) deriva de documentação ───────────────────────────────────────────────
const universo = arquivos.filter((f) => /\.(m?js)$/.test(f)).map(ler).join('\n');
const docs = (process.argv.length > 2 ? process.argv.slice(2) : DOCS_PADRAO).filter((d) => existsSync(d));
console.log(`\n=== DERIVA DE DOCUMENTAÇÃO (${docs.length} documento(s)) ===`);
for (const doc of docs) {
  const ids = new Set([...ler(doc).matchAll(/`([A-Za-z_][A-Za-z0-9_]*)(?:\(\))?`/g)].map((m) => m[1]));
  // só identificadores "de código": camelCase ou com sublinhado, não CONSTANTE, mais de 3 letras
  const candidatos = [...ids].filter((i) => /[a-z][A-Z]|_/.test(i) && i !== i.toUpperCase() && i.length > 3);
  const ausentes = candidatos.filter((i) => !cita(universo, i)).sort();
  console.log(`${doc}: ${candidatos.length} identificadores citados; ausentes no código: ${ausentes.length}${ausentes.length ? ' → ' + ausentes.join(', ') : ''}`);
}
console.log('\n(Análise estática: "citado" ≠ "bem testado". Para provar compatibilidade, rode os testes.)');
