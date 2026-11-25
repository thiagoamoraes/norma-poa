#!/usr/bin/env bash
# teste_guarda_horario.sh — a guarda de horário (ingestao/guarda-horario.sh).
falhou=0
conf() { # descrição, esperado, EVENTO, EXECUCOES_HOJE, data/hora UTC
  local r; r=$(EVENTO="$3" EXECUCOES_HOJE="$4" AGORA_EPOCH=$(date -u -d "$5" +%s) bash ingestao/guarda-horario.sh | cut -d' ' -f1-2)
  if [ "$r" = "$2" ]; then echo "✓ $1"; else echo "✗ $1 (esperado '$2', veio '$r')"; falhou=1; fi
}
conf "agendada no horário normal (04:17 UTC): segue, parando 09:20"   "seguir 09:20" schedule 0 "2026-11-18 04:17:00"
conf "agendada com atraso de 5 h (09:20 UTC): ainda é madrugada, segue" "seguir 09:20" schedule 0 "2026-11-18 09:20:00"
conf "agendada às 10:00 UTC (07:00 em Brasília): pula"               "pular fora"   schedule 0 "2026-11-18 10:00:00"
conf "agendada às 13:23 UTC (o caso real de 17/11): pula"            "pular fora"   schedule 0 "2026-11-17 13:23:00"
conf "agendada às 02:59 UTC (23:59 em Brasília): pula"               "pular fora"   schedule 0 "2026-11-18 02:59:00"
conf "agendada, mas o disparo externo já rodou hoje: pula"           "pular já"     schedule 1 "2026-11-18 04:17:00"
conf "disparo manual/externo às 13:23 UTC: livre"                    "seguir"       workflow_dispatch 0 "2026-11-17 13:23:00"
conf "disparo manual com outra execução hoje: livre"                 "seguir"       workflow_dispatch 2 "2026-11-17 13:23:00"
echo "======================================================================"
[ "$falhou" = 0 ] && echo "RESULTADO: guarda de horário ok" || echo "RESULTADO: guarda de horário com falha"
exit $falhou
