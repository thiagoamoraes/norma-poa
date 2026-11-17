// ingestao/sapl-io.mjs
//
// Rede e disco compartilhados pelos coletores do SAPL (catalogo-sapl.mjs e
// baixar-textos.mjs). É AQUI que mora a etiqueta de coleta — os coletores não
// chamam fetch() diretamente.
//
// ETIQUETA (servidor público, não sobrecarregar):
//   - uma requisição por vez, com no mínimo 60 s entre o INÍCIO de uma e o da
//     seguinte (o robots.txt do site pede "Crawl-delay: 60");
//   - User-Agent identificado;
//   - falha de servidor/rede: 2 novas tentativas (após 3 e 10 min) e, se
//     persistir, erro — o chamador para com o estado salvo;
//   - prazo opcional (variável PRAZO_EPOCH, em segundos): nenhuma requisição
//     começa depois dele.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const BASE_SAPL = 'https://legislacao.portoalegre.rs.gov.br';
export const USER_AGENT = 'norma-experimento/0.3 (projeto experimental de dados legislativos abertos; coleta sequencial, 1 requisicao por minuto)';
export const INTERVALO_MS = 60_000;

const aguardar = (ms) => new Promise((r) => setTimeout(r, ms));
export const agora = () => new Date().toISOString();

const PRAZO_MS = process.env.PRAZO_EPOCH ? Number(process.env.PRAZO_EPOCH) * 1000 : Infinity;
let ultimaRequisicao = 0;

/** true se não dá mais tempo de fazer outra requisição dentro do prazo. */
export function prazoEsgotado() {
  const proxima = Math.max(Date.now(), ultimaRequisicao + INTERVALO_MS);
  return proxima + 30_000 > PRAZO_MS;
}

async function esperarVez(rapido = false) {
  const falta = ultimaRequisicao + (rapido ? 20 : INTERVALO_MS) - Date.now();
  if (falta > 0) await aguardar(falta);
  ultimaRequisicao = Date.now();
}

/** Erro que NÃO adianta repetir (404, 403, 410…): o chamador registra e segue. */
export class ErroDefinitivo extends Error {
  constructor(status, url) { super(`HTTP ${status} em ${url}`); this.status = status; }
}

/** Falha que persistiu nas 3 tentativas (rede, servidor): pode passar depois; quem chama decide se segue. */
export class ErroTemporario extends Error {
  constructor(url, causa) { super(`desisti de ${url}: ${causa}`); this.url = url; this.causa = causa; }
}

/** "fetch failed (ECONNRESET: read ECONNRESET)": o undici esconde a causa real em `e.cause`. */
export function descreverErro(e) {
  const c = e && e.cause;
  return `${e && e.message}${c ? ` (${c.code || c.name}: ${c.message})` : ''}`;
}

/**
 * GET educado. `tipo`: 'json' → objeto; 'binario' → { bytes: Buffer, contentType }.
 * Lança ErroDefinitivo em 4xx (exceto 408/429) e ErroTemporario quando desiste.
 *
 * Tentativas: 3, com espera de 1 e de 5 minutos entre elas (até 17/11/2026 eram
 * 3 e 10: em 4 de 5 casos reais a 2ª tentativa já passava e cada arquivo ruim
 * custava 13 minutos da noite). Cada tentativa tem prazo próprio — sem ele um
 * servidor que não responde segura a rotina inteira.
 */
export async function requisitar(url, tipo) {
  // Só para teste_rede_local.mjs: com TESTE_RAPIDO=1 E endereço local, os tempos
  // encolhem. Para qualquer servidor de verdade a etiqueta de 1 por minuto vale sempre.
  const rapido = process.env.TESTE_RAPIDO === '1' && /^(127\.0\.0\.1|localhost)$/.test(new URL(url).hostname);
  const esperas = rapido ? [0, 30, 60] : [0, 60_000, 300_000];
  let ultimoErro;
  for (const espera of esperas) {
    if (espera) {
      console.log(`  ${agora()} aguardando ${espera / 1000}s antes de tentar de novo…`);
      await aguardar(espera);
    }
    await esperarVez(rapido);
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(rapido ? 400 : tipo === 'json' ? 60_000 : 180_000) });
      if (resp.status >= 400 && resp.status < 500 && resp.status !== 408 && resp.status !== 429) {
        throw new ErroDefinitivo(resp.status, url);
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (tipo === 'json') return await resp.json();
      return { bytes: Buffer.from(await resp.arrayBuffer()), contentType: resp.headers.get('content-type') || '' };
    } catch (e) {
      if (e instanceof ErroDefinitivo) throw e;
      ultimoErro = e;
      console.log(`  ${agora()} falha em ${url}: ${descreverErro(e)}`);
    }
  }
  throw new ErroTemporario(url, descreverErro(ultimoErro));
}

/** Lê um JSONL inteiro (arquivo ausente → []). */
export async function lerJsonl(caminho) {
  if (!existsSync(caminho)) return [];
  return (await readFile(caminho, 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
