#!/usr/bin/env bash
# Manage the Hugo dev server as a background process.
# Usage: ./hugo.sh {start|stop|restart|status|logs}

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.hugo-server.pid"
LOG_FILE="$SCRIPT_DIR/.hugo-server.log"
HUGO_CMD=(hugo server --bind 0.0.0.0)

is_running() {
    [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

start() {
    if is_running; then
        echo "Hugo server already running (PID $(cat "$PID_FILE"))"
        return 0
    fi
    rm -f "$PID_FILE"
    nohup "${HUGO_CMD[@]}" >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
    sleep 1
    if is_running; then
        echo "Hugo server started (PID $(cat "$PID_FILE"))"
        echo "Logs: $LOG_FILE"
    else
        echo "Hugo server failed to start. Last log lines:"
        tail -n 20 "$LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop() {
    if ! is_running; then
        echo "Hugo server not running"
        rm -f "$PID_FILE"
        return 0
    fi
    local pid
    pid="$(cat "$PID_FILE")"
    kill "$pid"
    for _ in $(seq 1 10); do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.5
    done
    if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid"
    fi
    rm -f "$PID_FILE"
    echo "Hugo server stopped (PID $pid)"
}

status() {
    if is_running; then
        echo "Hugo server running (PID $(cat "$PID_FILE"))"
        echo "Logs: $LOG_FILE"
    else
        echo "Hugo server not running"
        return 1
    fi
}

logs() {
    [[ -f "$LOG_FILE" ]] || { echo "No log file at $LOG_FILE"; return 1; }
    tail -f "$LOG_FILE"
}

case "${1:-}" in
    start)   start ;;
    stop)    stop ;;
    restart) stop; start ;;
    status)  status ;;
    logs)    logs ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
