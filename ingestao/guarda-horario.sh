#!/usr/bin/env bash
# ingestao/guarda-horario.sh — decide se uma execução do workflow deve coletar.
#
# Preferência do mantenedor (17/11/2026): coletar só de madrugada em Brasília
# (UTC-3, sem horário de verão). O agendamento do GitHub chega a atrasar horas;
# uma execução AGENDADA que acorda tarde não pode coletar no expediente.
#
# Entradas (variáveis): EVENTO (schedule | workflow_dispatch) · EXECUCOES_HOJE
# (quantas outras execuções deste workflow já começaram hoje, em UTC) ·
# AGORA_EPOCH (só para teste).
# Saída, uma linha: "pular <motivo>" ou "seguir <HH:MM UTC em que parar>".
#
# Regras (só para EVENTO=schedule; o disparo manual ou externo é livre):
#   - fora de 03:00–10:00 UTC (00:00–07:00 em Brasília): pular;
#   - já houve outra execução hoje (o disparo externo chegou antes): pular;
#   - senão, seguir e parar às 09:20 UTC (06:20 em Brasília).
agora="${AGORA_EPOCH:-$(date +%s)}"
hora=$(date -u -d "@$agora" +%H)
if [ "${EVENTO:-}" != "schedule" ]; then echo "seguir"; exit 0; fi
if [ "$((10#$hora))" -lt 3 ] || [ "$((10#$hora))" -ge 10 ]; then echo "pular fora da madrugada de Brasília (agora $(date -u -d "@$agora" +%H:%M) UTC)"; exit 0; fi
if [ "${EXECUCOES_HOJE:-0}" -gt 0 ]; then echo "pular já houve outra execução hoje"; exit 0; fi
echo "seguir 09:20"
