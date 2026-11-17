#!/usr/bin/env bash
# teste_janela.sh — a janela de coleta (ingestao/janela.sh): só de madrugada em Brasília.
# Uso: bash teste_janela.sh
falhou=0
conf() { # descrição, esperado, data/hora UTC
  local r; r=$(AGORA_EPOCH=$(date -u -d "$3" +%s) bash ingestao/janela.sh | cut -d' ' -f1)
  if [ "$r" = "$2" ]; then echo "✓ $1"; else echo "✗ $1 (esperado $2, veio $r)"; falhou=1; fi
}
conf "02:59 UTC (23:59 em Brasília): fora"            fora   "2026-11-18 02:59:00"
conf "03:00 UTC (00:00 em Brasília): dentro"          dentro "2026-11-18 03:00:00"
conf "04:17 UTC (01:17, o horário do agendamento): dentro" dentro "2026-11-18 04:17:00"
conf "09:49 UTC (06:49 em Brasília): dentro"          dentro "2026-11-18 09:49:00"
conf "09:50 UTC (06:50 em Brasília): fora"            fora   "2026-11-18 09:50:00"
conf "14:00 UTC (11:00 em Brasília, expediente): fora" fora  "2026-11-18 14:00:00"
lim=$(AGORA_EPOCH=$(date -u -d "2026-11-18 04:17:00" +%s) bash ingestao/janela.sh | cut -d' ' -f2)
if [ "$lim" = "$(date -u -d '2026-11-18 09:50:00' +%s)" ]; then echo "✓ o limite informado é 09:50 UTC do mesmo dia"; else echo "✗ limite errado: $lim"; falhou=1; fi
echo "======================================================================"
[ "$falhou" = 0 ] && echo "RESULTADO: janela ok" || echo "RESULTADO: janela com falha"
exit $falhou
