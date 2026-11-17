// teste_situacao.mjs
//
// Painel de situação (ingestao/situacao.mjs): a decisão "em carga" × "em dia",
// os alertas e as próximas ações. Entradas (sintéticas) montadas em cima de
// números do acervo real de 17/11/2026 (catálogo de leis na página 83 de 152,
// vínculos ainda não coletados). Sem rede. Uso: node teste_situacao.mjs

import { avaliarSituacao, renderizarSituacao, LIMITE_MB_AVISO } from './ingestao/situacao.mjs';

let passou = 0, falhou = 0;
const ok = (desc, cond) => { cond ? passou++ : falhou++; console.log(`${cond ? '✓' : '✗'} ${desc}`); };

const AGORA = '2026-11-20T10:00:00.000Z';
const dia = (n) => new Date(Date.parse(AGORA) - n * 86_400_000).toISOString().slice(0, 10);
const exec = (n, falhas = 0) => ({ em: new Date(Date.parse(AGORA) - n * 86_400_000 + 3600_000).toISOString(), falhas, minutos: 320, evento: 'schedule', etapas: { textos: falhas ? 'erro' : 'ok' } });
const emCarga = () => ({
  agoraIso: AGORA,
  catalogo: { 1: { concluido: true }, 2: { concluido: true }, 6: { concluido: true }, 5: { concluido: false, proximaPagina: 83, totalPaginas: 152 } },
  vinculos: null,
  textos: { fila: 7000, porSituacao: { ok: 300 }, porDia: { [dia(1)]: 300, [dia(2)]: 280 } },
  estruturacao: { aceitas: 200, revisar: 100, motivos: { rotulo_nao_confere_com_a_origem: 60, sem_fecho: 40 } },
  historico: { leis: 469, completas: 1, incompletas: 0, semTextoDaBase: 468, erro: 0 },
  dopa: { ausentesAtrasadas: 0, soDopa: 0 },
  execucoes: [exec(3), exec(2), exec(1)],
  tamanhoMB: 120,
});
const emDia = () => ({ ...emCarga(), catalogo: { 1: { concluido: true }, 2: { concluido: true }, 6: { concluido: true }, 5: { concluido: true } }, vinculos: { concluido: true },
  textos: { fila: 0, porSituacao: { ok: 7000 }, porDia: { [dia(1)]: 12 } }, estruturacao: { aceitas: 6900, revisar: 0, motivos: {} }, historico: { leis: 469, completas: 469, incompletas: 0, semTextoDaBase: 0, erro: 0 } });

{
  const r = avaliarSituacao(emCarga());
  ok('acervo como está hoje (catálogo incompleto, vínculos pendentes, fila de 7.000): EM CARGA, sem alerta', r.estado === 'em_carga' && r.alertas.length === 0);
  ok('critérios que falham são nomeados: catálogo (página 83 de 152), vínculos, fila de textos', r.criterios.filter((c) => !c.ok).map((c) => c.nome.split(' ')[0]).join() === 'Catálogo,Vínculos,Fila' && /página 83 de 152/.test(r.criterios[0].detalhe));
  ok('previsão de esvaziar a fila: 7.000 ÷ média de 290 por dia ativo ≈ 25 dias', r.ritmo.baixados7 === 580 && r.ritmo.mediaDia === 290 && r.ritmo.previsaoDias === 25);
  ok('próximas ações vêm de regra fixa: revisão da estruturação cita o motivo mais frequente e a tarefa 1 do roteiro', r.proximas.some((p) => /100 norma\(s\) aguardam revisão/.test(p) && /rotulo_nao_confere_com_a_origem/.test(p) && /tarefa 1/.test(p)));
  ok('…e histórico incompleto remete à tarefa 4 só quando há incompleto (aqui: 0 → não aparece)', !r.proximas.some((p) => /tarefa 4/.test(p)));
}
{
  const r = avaliarSituacao(emDia());
  ok('tudo concluído, fila vazia, execuções boas, nada pendente no Diário Oficial: EM DIA', r.estado === 'em_dia' && r.criterios.every((c) => c.ok));
  ok('em dia e sem pendência: a única ação é a conferência semanal', r.proximas.length === 1 && /conferência semanal/.test(r.proximas[0]));
  ok('em dia, o painel não promete previsão (fila vazia)', r.ritmo.previsaoDias === null);
}
{
  const e = emDia(); e.execucoes = [exec(6), exec(5), exec(4)];
  const r = avaliarSituacao(e);
  ok('ALERTA: última execução há mais de 2 dias (agendamento parado ou desativado); o texto lembra o limite de 5 dias do Diário Oficial', r.alertas.some((a) => /há 4\.0 dias/.test(a) && /5 dias/.test(a)));
  ok('com alerta, a primeira ação é resolvê-lo', /Resolver os alertas/.test(r.proximas[0]));
}
{
  const e = emCarga(); e.execucoes = [exec(3), exec(2, 1), exec(1, 2)];
  const r = avaliarSituacao(e);
  ok('ALERTA: duas execuções seguidas com erro; e "em dia" fica fora de alcance enquanto houver erro recente', r.alertas.some((a) => /duas últimas execuções/.test(a)) && r.criterios.find((c) => /sem erro/.test(c.nome)).ok === false);
}
{
  const e = emCarga(); e.textos.porDia = { [dia(20)]: 300 };
  const r = avaliarSituacao(e);
  ok('ALERTA: fila não anda há 7 dias com execuções recentes (bloqueio da fonte ou erro repetido)', r.alertas.some((a) => /não diminuiu nos últimos 7 dias/.test(a)));
}
{
  const e = emDia(); e.dopa = { ausentesAtrasadas: 2, soDopa: 0 }; e.tamanhoMB = LIMITE_MB_AVISO + 1;
  const r = avaliarSituacao(e);
  ok('ALERTA: norma publicada há mais de 7 dias que a fonte ainda não tem; e tamanho acima do limite', r.estado === 'em_carga' && r.alertas.length === 2 && r.alertas.some((a) => /2 norma\(s\) publicada\(s\)/.test(a)) && r.alertas.some((a) => /MB/.test(a)));
}
{
  const e = emCarga(); e.execucoes = [];
  ok('sem nenhuma execução registrada: alerta próprio, sem quebrar', avaliarSituacao(e).alertas.some((a) => /Nenhuma execução/.test(a)));
  const e2 = emCarga(); e2.textos.porSituacao = { ok: 100, ocr_adiado_arquivo_grande: 4, formato_sem_extracao: 3 };
  const p = avaliarSituacao(e2).proximas.join('|');
  ok('arquivos de OCR adiado e sem extração viram ações com a tarefa certa', /4 arquivo\(s\) digitalizado\(s\) grande\(s\).*tarefa 3/.test(p) && /3 arquivo\(s\) baixado\(s\) sem extração/.test(p));
}
{
  const e = emCarga();
  const md = renderizarSituacao(e, avaliarSituacao(e));
  ok('o painel em texto traz estado, o que fazer, critérios, números e a tabela das últimas execuções', /\*\*Estado: EM CARGA\*\*/.test(md) && /## O que fazer agora/.test(md) && /\| ✗ \| Catálogo completo/.test(md) && /Estruturação: 200 aceita\(s\), 100 em revisão \(66\.7% de aceitação\)/.test(md) && /## Últimas execuções da rotina/.test(md));
}

console.log('='.repeat(70));
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou ? 1 : 0);
