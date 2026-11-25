#!/usr/bin/env bash
# teste_disparar_coleta.sh — a decisão de disparar a coleta noturna (ingestao/disparar-coleta.sh).
# Sem rede: o comando `gh` é substituído por um falso que devolve execuções combinadas e registra os disparos.
# Horários dos cenários em UTC (Brasília = UTC-3): 22:02 BRT = 01:02 UTC; 03:36 = 06:36; 01:32 = 04:32; 04:32 = 07:32.
falhou=0
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/gh" <<'EOF'
#!/usr/bin/env bash
if [ "${FAKE_FALHA:-0}" = "1" ]; then exit 1; fi
if [ "$1" = api ] && [ "$2" = "-X" ]; then
  if [ "${FAKE_RECUSA:-0}" = "1" ]; then exit 1; fi
  echo "$*" >> "$FAKE_LOG"; exit 0
fi
printf '%b' "$FAKE_RUNS"
EOF
chmod +x "$tmp/gh"
# run <modo> "<data hora UTC>" "<execuções: evento\tstatus\tcriada, separadas por \n>"  → imprime a saída e deixa o log em $tmp/log
run() { : > "$tmp/log"; GH="$tmp/gh" FAKE_LOG="$tmp/log" FAKE_RUNS="$3" ESPERA=0 AGORA_EPOCH=$(date -u -d "$2" +%s) bash ingestao/disparar-coleta.sh "$1"; }
disparou() { [ -s "$tmp/log" ]; }
ok() { if [ "$2" = 0 ]; then echo "✓ $1"; else echo "✗ $1"; falhou=1; fi; }
D="2026-11-26"
C1=$'workflow_dispatch\tcompleted\t2026-11-26T01:02:30Z\n'       # execução 1 já rodada (terminou)
FORA=$'schedule\tcompleted\t2026-11-25T12:37:00Z\n'

# ── execução 1 (22:02 BRT = 01:02 UTC) ──
out=$(run execucao1 "$D 01:02:00" "$FORA"); disparou; ok "execucao1 às 22:02 sem nada rodando: dispara" $?
grep -q 'inputs\[minutos\]=330' "$tmp/log" && grep -q 'inputs\[parar_em_utc\]=06:30' "$tmp/log" && ! grep -q 'etapas' "$tmp/log"; ok "execucao1 pede 330 min, parada 03:30 BRT (06:30 UTC) e etapas completas" $?
echo "$out" | grep -q 'DISPAREI.*22:02'; ok "a saída diz que disparou, em horário de Brasília (agora 22:02)" $?
out=$(run execucao1 "$D 01:02:00" $'workflow_dispatch\tcompleted\t2026-11-26T00:10:00Z\n'); ! disparou; ok "execucao1 com disparo há menos de 3 h: não dispara" $?
out=$(run execucao1 "$D 01:02:00" $'workflow_dispatch\tin_progress\t2026-11-25T20:00:00Z\n'); ! disparou; ok "execucao1 com execução em andamento: não dispara" $?
out=$(run execucao1 "$D 08:00:00" "$FORA"); ! disparou; ok "execucao1 às 05:00 BRT (fora da janela): não dispara" $?
out=$(run execucao1 "$D 16:00:00" "$FORA"); ! disparou; ok "execucao1 às 13:00 BRT (expediente): não dispara" $?
out=$(run execucao1 "$D 00:10:00" "$FORA"); ! disparou; ok "execucao1 às 21:10 BRT (antes das 21:30): não dispara" $?

# ── execução 2 (03:36 BRT = 06:36 UTC) ──
out=$(run execucao2 "$D 06:36:00" "$C1"); disparou; ok "execucao2 às 03:36 depois da execução 1: dispara" $?
grep -q 'inputs\[etapas\]=textos' "$tmp/log" && grep -q 'inputs\[parar_em_utc\]=09:20' "$tmp/log"; ok "execucao2 pede só textos, parada 06:20 BRT (09:20 UTC)" $?
out=$(run execucao2 "$D 06:36:00" $'workflow_dispatch\tin_progress\t2026-11-26T01:02:30Z\n'); disparou; ok "execucao2 com a execução 1 ainda em andamento: dispara (o workflow enfileira)" $?
out=$(run execucao2 "$D 06:36:00" $'workflow_dispatch\tin_progress\t2026-11-26T01:02:30Z\nworkflow_dispatch\tqueued\t2026-11-26T06:30:00Z\n'); ! disparou; ok "execucao2 com outra já na fila: não dispara" $?
out=$(run execucao2 "$D 06:36:00" $'workflow_dispatch\tcompleted\t2026-11-26T06:10:00Z\n'); ! disparou; ok "execucao2 com disparo há menos de 1 h: não dispara" $?
out=$(run execucao2 "$D 09:00:00" "$C1"); ! disparou; ok "execucao2 às 06:00 BRT (tarde demais): não dispara" $?

# ── reserva 1 (01:32 BRT = 04:32 UTC): só se a execução 1 não aconteceu ──
out=$(run reserva1 "$D 04:32:00" "$FORA"); disparou; ok "reserva1 sem disparo desde 21:00 BRT: dispara completa até 03:30" $?
grep -q 'inputs\[parar_em_utc\]=06:30' "$tmp/log" && ! grep -q 'etapas' "$tmp/log"; ok "reserva1 usa parada 06:30 UTC e etapas completas" $?
out=$(run reserva1 "$D 04:32:00" "$C1"); ! disparou; ok "reserva1 com a execução 1 já feita: não dispara" $?
out=$(run reserva1 "$D 04:32:00" $'workflow_dispatch\tin_progress\t2026-11-26T01:02:30Z\n'); ! disparou; ok "reserva1 com execução em andamento: não dispara" $?

# ── reserva 2 (04:32 BRT = 07:32 UTC): só se a execução 2 não aconteceu ──
out=$(run reserva2 "$D 07:32:00" "$C1"); disparou; ok "reserva2 sem a execução 2: dispara só textos até 06:20" $?
out=$(run reserva2 "$D 07:32:00" $'workflow_dispatch\tcompleted\t2026-11-26T06:36:30Z\nworkflow_dispatch\tcompleted\t2026-11-26T01:02:30Z\n'); ! disparou; ok "reserva2 com a execução 2 já feita: não dispara" $?
out=$(run reserva2 "$D 07:32:00" $'workflow_dispatch\tin_progress\t2026-11-26T06:36:30Z\n'); ! disparou; ok "reserva2 com execução em andamento: não dispara" $?

# ── falhas e entradas inválidas ──
out=$(FAKE_FALHA=1 run execucao1 "$D 01:02:00" "$FORA"); rc=$?; [ "$rc" = 1 ] && ! disparou; ok "se não consegue listar as execuções: erro (código 1) e nada é disparado" $?
out=$(FAKE_RECUSA=1 run execucao1 "$D 01:02:00" "$FORA"); rc=$?; [ "$rc" = 1 ]; ok "se o GitHub recusa o disparo: erro (código 1), dito com clareza" $?
out=$(run qualquer "$D 01:02:00" "$FORA"); rc=$?; [ "$rc" = 2 ]; ok "modo inválido: código 2" $?
out=$(SO_SIMULAR=1 run execucao1 "$D 01:02:00" "$FORA"); ! disparou && echo "$out" | grep -q SIMULA; ok "SO_SIMULAR=1 diz o que faria sem disparar" $?
echo "======================================================================"
[ "$falhou" = 0 ] && echo "RESULTADO: disparo da coleta ok" || echo "RESULTADO: disparo da coleta com falha"
exit $falhou
