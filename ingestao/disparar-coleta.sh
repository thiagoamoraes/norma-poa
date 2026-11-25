#!/usr/bin/env bash
# ingestao/disparar-coleta.sh <modo> — decide e dispara a coleta noturna (workflow coleta-diaria.yml).
#
# Chamado pelos gatilhos agendados da plataforma (ROTEIRO 10-C). Toda a decisão fica aqui,
# testada em teste_disparar_coleta.sh, para o gatilho não depender de interpretação de texto.
# Horários abaixo em Brasília (UTC-3, sem horário de verão); as contas são em UTC.
#
# Janela de coleta (decisão do mantenedor, 25/11/2026): começa às 22:00 e conclui até 06:30.
# O GitHub limita cada job a 6 h; por isso são duas execuções em sequência (o workflow as enfileira):
#   execucao1  22:02  etapas completas (novidades, DOPA, catálogo, vínculos, textos), até 03:30
#   execucao2  03:36  só textos, até 06:20
#   reserva1   01:32  só age se a execucao1 não aconteceu: coleta completa até 03:30
#   reserva2   04:32  só age se a execucao2 não aconteceu: só textos até 06:20
# Nunca dispara fora da janela do modo, nem se já há execução em andamento ou na fila.
#
# Variáveis (só para teste): AGORA_EPOCH · GH (comando gh) · ESPERA (segundos antes de conferir; padrão 10)
# · SO_SIMULAR=1 (diz o que faria, sem disparar).
# Saída: uma linha. Código 0 = decidiu (disparou ou não precisava); 1 = erro; 2 = modo inválido.
set -u
modo="${1:-}"
GH="${GH:-gh}"; REPO="${REPO:-thiagoamoraes/norma-poa}"; WF="coleta-diaria.yml"
agora="${AGORA_EPOCH:-$(date +%s)}"
hora_brt=$(TZ=America/Sao_Paulo date -d "@$agora" +%H:%M)
dia_utc=$(date -u -d "@$agora" +%F)
min_utc=$(( 10#$(date -u -d "@$agora" +%H) * 60 + 10#$(date -u -d "@$agora" +%M) ))

case "$modo" in
  execucao1) ini=30;  fim=300; etapas="";       minutos=330; parar="06:30" ;;  # 21:30–02:00 BRT
  execucao2) ini=360; fim=510; etapas="textos"; minutos=200; parar="09:20" ;;  # 03:00–05:30 BRT
  reserva1)  ini=240; fim=360; etapas="";       minutos=130; parar="06:30" ;;  # 01:00–03:00 BRT
  reserva2)  ini=420; fim=510; etapas="textos"; minutos=120; parar="09:20" ;;  # 04:00–05:30 BRT
  *) echo "modo inválido: '${modo}' (use execucao1, execucao2, reserva1 ou reserva2)"; exit 2 ;;
esac

lista=$($GH api "repos/$REPO/actions/workflows/$WF/runs?per_page=30" --jq '.workflow_runs[] | [.event,.status,.created_at] | @tsv') \
  || { echo "ERRO: não consegui listar as execuções do GitHub; nada foi disparado"; exit 1; }

ativas=0; naFila=0; recentes_min=-1; desde_00=0; desde_06=0; ultima_disp=0
ep_00=$(date -u -d "$dia_utc 00:00:00" +%s); ep_06=$(date -u -d "$dia_utc 06:00:00" +%s)
while IFS=$'\t' read -r evento status criada; do
  [ -z "$evento" ] && continue
  ep=$(date -u -d "$criada" +%s)
  [ "$status" != "completed" ] && ativas=$((ativas + 1))
  case "$status" in queued|pending|waiting|requested) naFila=$((naFila + 1)) ;; esac
  if [ "$evento" = "workflow_dispatch" ]; then
    [ "$ep" -gt "$ultima_disp" ] && ultima_disp=$ep
    [ "$ep" -ge "$ep_00" ] && desde_00=$((desde_00 + 1))
    [ "$ep" -ge "$ep_06" ] && desde_06=$((desde_06 + 1))
  fi
done <<< "$lista"
min_desde_ultima=$(( ultima_disp > 0 ? (agora - ultima_disp) / 60 : 999999 ))

nao() { echo "NÃO disparei ($modo, agora $hora_brt em Brasília): $1"; exit 0; }
if [ "$min_utc" -lt "$ini" ] || [ "$min_utc" -ge "$fim" ]; then nao "fora da janela deste modo"; fi
case "$modo" in
  execucao1)
    [ "$ativas" -gt 0 ] && nao "há execução em andamento ou na fila"
    [ "$min_desde_ultima" -lt 180 ] && nao "já houve disparo há menos de 3 horas" ;;
  execucao2)
    [ "$naFila" -gt 0 ] && nao "já há execução na fila"
    [ "$min_desde_ultima" -lt 60 ] && nao "já houve disparo há menos de 1 hora" ;;
  reserva1)
    [ "$ativas" -gt 0 ] && nao "há execução em andamento ou na fila"
    [ "$desde_00" -gt 0 ] && nao "a execução principal das 22:00 aconteceu; a reserva não é necessária" ;;
  reserva2)
    [ "$ativas" -gt 0 ] && nao "há execução em andamento ou na fila"
    [ "$desde_06" -gt 0 ] && nao "a segunda execução (03:36) aconteceu; a reserva não é necessária" ;;
esac

args=(-f ref=main -f "inputs[parar_em_utc]=$parar" -f "inputs[minutos]=$minutos")
[ -n "$etapas" ] && args+=(-f "inputs[etapas]=$etapas")
if [ "${SO_SIMULAR:-0}" = "1" ]; then echo "SIMULAÇÃO ($modo, agora $hora_brt em Brasília): dispararia ${args[*]}"; exit 0; fi
if ! $GH api -X POST "repos/$REPO/actions/workflows/$WF/dispatches" "${args[@]}"; then echo "ERRO: o disparo foi recusado pelo GitHub ($modo); nada rodou"; exit 1; fi
sleep "${ESPERA:-10}"
conf=$($GH api "repos/$REPO/actions/workflows/$WF/runs?event=workflow_dispatch&per_page=3" --jq '.workflow_runs[] | [.id,.status,.created_at] | @tsv' 2>/dev/null | head -1)
echo "DISPAREI ($modo, agora $hora_brt em Brasília): minutos=$minutos parar_em_utc=$parar${etapas:+ etapas=$etapas}. Execução mais recente: ${conf:-não consegui confirmar}"
exit 0
