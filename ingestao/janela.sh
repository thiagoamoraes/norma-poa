#!/usr/bin/env bash
# ingestao/janela.sh — a coleta só roda de madrugada, no horário de Brasília
# (UTC-3, sem horário de verão): das 00:00 às 07:00. Fora disso não há coleta,
# para não competir com o expediente de quem mantém as fontes.
#
# Imprime "dentro <epoch-do-limite>" (e a rotina não faz requisição depois do
# limite) ou "fora". O limite é 06:50 de Brasília (09:50 UTC): a última
# requisição começa antes disso e o restante da rotina (OCR do último arquivo,
# estruturação, gravação) termina por volta das 07:00.
#
# Variáveis (para teste ou ajuste): INICIO_UTC (padrão 03:00) · LIMITE_UTC
# (padrão 09:50) · AGORA_EPOCH (padrão: agora).
agora="${AGORA_EPOCH:-$(date +%s)}"
dia=$(date -u -d "@$agora" +%F)
inicio=$(date -u -d "$dia ${INICIO_UTC:-03:00}:00" +%s)
limite=$(date -u -d "$dia ${LIMITE_UTC:-09:50}:00" +%s)
if [ "$agora" -ge "$inicio" ] && [ "$agora" -lt "$limite" ]; then echo "dentro $limite"; else echo "fora"; fi
