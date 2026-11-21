// teste_paginas.mjs — as três páginas estáticas (docs/) no navegador, com dados reais servidos do disco.
// Rodada 60 (decisões 53–56). Pula se o Playwright não estiver instalado. Páginas servidas por rota virtual
// (http://norma.test/**); o ambiente não deixa subir servidor e file:// não deixa a página buscar os JSON.
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path';
let chromium;
for (const base of ['./', '/opt/node22/lib/node_modules/', '/usr/lib/node_modules/']) { try { ({ chromium } = createRequire(path.resolve(base) + '/')('playwright')); break; } catch { /* tenta o próximo */ } }
if (!chromium) { console.log('teste_paginas: Playwright não encontrado; teste pulado.'); process.exit(0); }
let falhas = 0, total = 0;
const ok = (desc, cond) => { total++; if (cond) console.log(`  ✓ ${desc}`); else { falhas++; console.log(`  ✗ ${desc}`); } };
const RAIZ = path.resolve('.');
const tipos = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jsonl': 'text/plain' };
const b = await chromium.launch();
async function abrir(url, w = 1440, h = 900) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage(); const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.route('http://norma.test/**', (r) => { const f = path.join(RAIZ, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({ body: fs.readFileSync(f), contentType: tipos[path.extname(f)] || 'application/octet-stream' }) : r.fulfill({ status: 404, body: '' }); });
  await page.goto('http://norma.test/' + url); await page.waitForTimeout(1800);
  return { page, erros, ctx };
}

console.log('Consulta (LC 12/1975, id 17878: histórico incompleto, 480 dispositivos)');
{
  const { page, erros, ctx } = await abrir('docs/index.html#n=17878');
  await page.waitForSelector('#pend', { timeout: 8000 });
  ok('aviso de histórico incompleto vem resumido (lista recolhida)', await page.$eval('#pend-lista', (e) => e.hidden));
  const alturaAviso = await page.$eval('#pend', (e) => e.getBoundingClientRect().height);
  ok(`o aviso ocupa pouco espaço (${Math.round(alturaAviso)} px)`, alturaAviso < 120);
  await page.click('#pend-ver'); ok('"Ver quais" abre a lista', !(await page.$eval('#pend-lista', (e) => e.hidden)));
  ok('há sumário de artigos', (await page.$$('#sumario a[data-ir]')).length > 10);
  await page.fill('#ir-art', '5'); await page.press('#ir-art', 'Enter'); await page.waitForTimeout(300);
  ok('"ir para o art. 5" aponta o endereço da página para o dispositivo', /#n=17878&d=art-5$/.test(await page.evaluate(() => location.hash)));
  ok('o dispositivo recebe o foco', await page.evaluate(() => document.activeElement && document.activeElement.id === 'd-art-5'));
  const corpo = await page.$eval('#detalhe', (e) => e.innerText);
  ok('não diz "conferida" para a leitura automática', !/Leitura automática conferida/.test(corpo));
  ok('há a seção "Leis que a alteraram"', /Leis que a alteraram \(\d+\)/.test(corpo));
  await ctx.close();
  const c2 = await abrir('docs/index.html#n=17878&d=art-9'); await c2.page.waitForSelector('#d-art-9', { timeout: 8000 });
  ok('o link permanente com &d= abre já no dispositivo', await c2.page.evaluate(() => document.getElementById('d-art-9').classList.contains('achado')));
  ok('sem erro de página', erros.length === 0 && c2.erros.length === 0); await c2.ctx.close();
}
console.log('Consulta (EC 51, id 49145: sem histórico)');
{
  const { page, erros, ctx } = await abrir('docs/index.html#n=49145');
  const corpo = await page.$eval('#detalhe', (e) => e.innerText);
  ok('leitura aprovada nas verificações automáticas (nenhuma pessoa leu)', /Leitura aprovada nas verificações automáticas/.test(corpo) && /Nenhuma pessoa leu/.test(corpo));
  ok('a faixa NÃO é verde para aceito só pelo motor', await page.$eval('#corpo .estado', (e) => e.classList.contains('nt') && !e.classList.contains('ok')));
  ok('sem erro de página', erros.length === 0);
  await ctx.close();
}
console.log('Revisão (id 37042)');
{
  const { page, erros, ctx } = await abrir('docs/revisao.html#37042', 1280, 720);
  await page.waitForSelector('#decisao', { timeout: 8000 });
  const r = await page.$eval('#decisao', (e) => e.getBoundingClientRect());
  ok(`a barra de decisão está dentro da tela a 1280x720 (base em ${Math.round(r.bottom)} px)`, r.bottom <= 722 && r.top >= 0);
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200);
  ok('...e continua visível depois de rolar', (await page.$eval('#decisao', (e) => e.getBoundingClientRect().bottom)) <= 722);
  ok('data em dd/mm/aaaa', /data 07\/12\/2010/.test(await page.$eval('.meta', (e) => e.innerText)));
  ok('contador de pontos', /Ponto 1 de 2/.test(await page.$eval('#pt-num', (e) => e.textContent)));
  await page.keyboard.press('n'); ok('N vai ao ponto seguinte', /Ponto 2 de 2/.test(await page.$eval('#pt-num', (e) => e.textContent)));
  await page.keyboard.press('p'); ok('P volta', /Ponto 1 de 2/.test(await page.$eval('#pt-num', (e) => e.textContent)));
  await page.uncheck('#atalhos'); await page.keyboard.press('n');
  ok('com o interruptor desligado, N não faz nada (decisão 14)', /Ponto 1 de 2/.test(await page.$eval('#pt-num', (e) => e.textContent)));
  ok('sem "leitor" no vocabulário visível', !/\bleitor\b/i.test(await page.$eval('body', (e) => e.innerText)));
  ok('o aviso "sem caráter oficial" continua no topo (decisão 16)', /sem caráter oficial/.test(await page.$eval('header', (e) => e.innerText)));
  ok('sem erro de página', erros.length === 0); await ctx.close();
}
console.log('Comparação (id 17878)');
{
  const { page, erros, ctx } = await abrir('docs/compara.html#17878');
  ok('lista de leis com 8 linhas visíveis', (await page.$eval('#lei', (e) => e.size)) === 8);
  const op = await page.$eval('#comparar', (e) => getComputedStyle(e).opacity);
  ok('botão desabilitado continua legível (sem opacidade)', op === '1');
  ok('sem erro de página', erros.length === 0); await ctx.close();
}
for (const u of ['docs/index.html', 'docs/revisao.html', 'docs/compara.html']) {
  const { page, ctx } = await abrir(u);
  ok(`${u}: link "pular" e ícone`, !!(await page.$('a.pular')) && !!(await page.$('link[rel=icon]'))); await ctx.close();
}
await b.close();
console.log(`\nteste_paginas: ${total - falhas}/${total}`);
process.exit(falhas ? 1 : 0);
