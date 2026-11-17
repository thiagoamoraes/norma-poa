#!/usr/bin/env bash
# teste_parar_em.sh — a parada pontual da coleta (ingestao/parar-em.sh).
# Uso: bash teste_parar_em.sh
falhou=0
conf() { # descrição, esperado (primeira palavra), PARAR_EM_UTC, data/hora UTC
  local r; r=$(PARAR_EM_UTC="$3" AGORA_EPOCH=$(date -u -d "$4" +%s) bash ingestao/parar-em.sh | cut -d' ' -f1)
  if [ "$r" = "$2" ]; then echo "✓ $1"; else echo "✗ $1 (esperado $2, veio $r)"; falhou=1; fi
}
conf "sem PARAR_EM_UTC: livre, a qualquer hora"            livre   ""      "2026-11-18 14:00:00"
conf "10:00 UTC (07:00 em Brasília), às 09:12: faltam 48 min" ate  "10:00" "2026-11-18 09:12:00"
conf "10:00 UTC, às 10:00 em ponto: já passou"             passou  "10:00" "2026-11-18 10:00:00"
conf "10:00 UTC, às 11:30: já passou"                      passou  "10:00" "2026-11-18 11:30:00"
conf "formato inválido (\"7h\") é recusado"                invalido "7h"   "2026-11-18 09:12:00"
conf "hora inexistente (\"25:00\") é recusada"             invalido "25:00" "2026-11-18 09:12:00"
lim=$(PARAR_EM_UTC=10:00 AGORA_EPOCH=$(date -u -d "2026-11-18 09:12:00" +%s) bash ingestao/parar-em.sh | cut -d' ' -f2)
if [ "$lim" = "$(date -u -d '2026-11-18 10:00:00' +%s)" ]; then echo "✓ o limite informado é 10:00 UTC do mesmo dia"; else echo "✗ limite errado: $lim"; falhou=1; fi
echo "======================================================================"
[ "$falhou" = 0 ] && echo "RESULTADO: parada pontual ok" || echo "RESULTADO: parada pontual com falha"
exit $falhou
