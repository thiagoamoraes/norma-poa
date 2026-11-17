#!/usr/bin/env bash
# ingestao/rotina.sh — rotina de coleta (agendada pelo GitHub Actions; roda
# igual numa máquina qualquer com Node 22+ e poppler-utils).
#
# Uma única fila de requisições ao SAPL, 1 por minuto, nesta ordem:
#   1. novidades   — normas novas/alteradas no topo de cada tipo (4 requisições)
#   2. dopa        — conferência com o Diário Oficial (outro servidor; ver conferencia-dopa.mjs)
#   3. catalogo    — retoma a carga completa, se ainda não terminou
#                    (no dia 1º de cada mês, marca nova carga completa)
#   4. vinculos    — carga dos vínculos, no máximo VINCULOS_POR_EXECUCAO páginas
#   5. textos      — baixa arquivos de texto até o prazo acabar
# Depois, sem rede: relatório de cobertura, estruturação com verificação dos
# textos já baixados e dados da página de consulta (docs/). Não faz commit
# (isso é do workflow).
#
# Parada pontual: PARAR_EM_UTC=HH:MM (hora UTC) faz a coleta parar naquela hora,
# só naquele dia (ver parar-em.sh). Sem ela, vale MINUTOS.
#
# Variáveis: MINUTOS (padrão 55) · PARAR_EM_UTC (padrão: sem limite) · ETAPAS (padrão "novidades dopa catalogo vinculos textos")
#            MAX_ARQUIVOS (padrão: sem limite) · VINCULOS_POR_EXECUCAO (padrão 60)
set -u
cd "$(dirname "$0")/.."

MINUTOS="${MINUTOS:-55}"
ETAPAS="${ETAPAS:-novidades dopa catalogo vinculos textos}"
VINCULOS_POR_EXECUCAO="${VINCULOS_POR_EXECUCAO:-60}"
export PRAZO_EPOCH=$(( $(date +%s) + MINUTOS * 60 ))
if [ -n "${PARAR_EM_UTC:-}" ]; then
  parada=$(bash ingestao/parar-em.sh)
  case "$parada" in
    ate*)
      limite="${parada#ate }"
      if [ "$limite" -lt "$PRAZO_EPOCH" ]; then export PRAZO_EPOCH="$limite"; fi
      echo "parada pontual pedida: nenhuma requisição começa depois de ${PARAR_EM_UTC} UTC" ;;
    passou) echo "PARAR_EM_UTC=${PARAR_EM_UTC} já passou hoje: nada a coletar."; exit 0 ;;
    *) echo "PARAR_EM_UTC inválido (use HH:MM, hora UTC): ${PARAR_EM_UTC}"; exit 2 ;;
  esac
fi
falhas=0
primeira=1
inicio=$(date +%s)
resultados=""

etapa() { # nome, comando...
  local nome="$1"; shift
  case " $ETAPAS " in *" $nome "*) ;; *) return 0 ;; esac
  # o intervalo de 60 s vale também ENTRE um script e o seguinte
  if [ "$primeira" -eq 0 ]; then sleep 60; fi
  primeira=0
  echo "=== $nome ($(date -u +%FT%TZ))"
  if "$@"; then resultados="${resultados}\"${nome}\":\"ok\","; else echo "!!! etapa $nome terminou com erro"; falhas=$((falhas + 1)); resultados="${resultados}\"${nome}\":\"erro\","; fi
}

etapa novidades node ingestao/catalogo-sapl.mjs --novidades
etapa dopa      node ingestao/conferencia-dopa.mjs
if [ "$(date -u +%d)" = "01" ]; then
  case " $ETAPAS " in *" catalogo "*) node ingestao/catalogo-sapl.mjs --marcar-recarga ;; esac
fi
etapa catalogo  node ingestao/catalogo-sapl.mjs
etapa vinculos  node ingestao/catalogo-sapl.mjs --vinculos --max-paginas "$VINCULOS_POR_EXECUCAO"
if [ -n "${MAX_ARQUIVOS:-}" ]; then
  etapa textos  node ingestao/baixar-textos.mjs --max-arquivos "$MAX_ARQUIVOS"
else
  etapa textos  node ingestao/baixar-textos.mjs
fi

echo "=== relatório"
node ingestao/relatorio-cobertura.mjs || falhas=$((falhas + 1))
echo "=== estruturação (sem rede)"
node ingestao/estruturar.mjs || falhas=$((falhas + 1))
echo "=== histórico das leis listadas em dados/historico/_piloto.json (sem rede)"
node ingestao/gerar-historico.mjs || falhas=$((falhas + 1))
echo "=== dados da página de consulta"
node ingestao/gerar-site.mjs || falhas=$((falhas + 1))
echo "=== painel de situação"
# uma linha por execução em dados/_execucoes.jsonl: é o que o painel usa para
# dizer se a rotina está viva e se as últimas noites deram certo
fim=$(date +%s)
printf '{"em":"%s","minutos":%d,"falhas":%d,"evento":"%s","run":"%s","etapas":{%s}}\n' "$(date -u +%FT%TZ)" $(( (fim - inicio) / 60 )) "$falhas" "${GITHUB_EVENT_NAME:-local}" "${GITHUB_RUN_NUMBER:-}" "${resultados%,}" >> dados/_execucoes.jsonl
node ingestao/situacao.mjs || true
exit "$falhas"
