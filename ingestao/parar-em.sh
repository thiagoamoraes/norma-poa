#!/usr/bin/env bash
# ingestao/parar-em.sh — parada PONTUAL da coleta num dia específico.
#
# Preferência do mantenedor: coletar só de madrugada em Brasília (UTC-3, sem
# horário de verão). O agendamento já cuida disso (04:17 UTC = 01:17, 320
# minutos, termina antes das 07:00). Quando num dia específico for preciso parar
# mais cedo, preenche-se PARAR_EM_UTC (HH:MM, hora UTC) — no disparo manual,
# a entrada `parar_em_utc`. 07:00 de Brasília = 10:00 UTC. Sem a variável, não
# há limite além de MINUTOS.
#
# Imprime "livre" (sem limite), "ate <epoch>", "passou" (a hora de hoje já
# passou) ou "invalido". AGORA_EPOCH existe só para teste.
agora="${AGORA_EPOCH:-$(date +%s)}"
if [ -z "${PARAR_EM_UTC:-}" ]; then echo livre; exit 0; fi
if ! printf '%s' "$PARAR_EM_UTC" | grep -Eq '^([01][0-9]|2[0-3]):[0-5][0-9]$'; then echo invalido; exit 0; fi
dia=$(date -u -d "@$agora" +%F)
limite=$(date -u -d "$dia $PARAR_EM_UTC:00" +%s)
if [ "$agora" -lt "$limite" ]; then echo "ate $limite"; else echo passou; fi
