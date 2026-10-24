#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHAOS_DIR="$HOME/Projects/chaos-stack"
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" DASHBOARD_DIR="$HOME/Projects/capstone-dashboard"DASHBOARD_DIR="$HOME/Projects/capstone-dashboard" pwd)/dashboard"
PYTHON_BIN="$CHAOS_DIR/venv/bin/python"

cleanup() {
    echo -e "\n${YELLOW}[!] Shutting down demo environment...${NC}"
    if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
        echo -e "${CYAN}[*] Stopping Vite React Dashboard (PID: $VITE_PID)...${NC}"
        kill "$VITE_PID" 2>/dev/null
    fi
    echo -e "${GREEN}[✔] Clean exit completed.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

clear
echo -e "${RED}"
echo "  ██████╗██╗  ██╗ █████╗  ██████╗ ███████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗"
echo " ██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔════╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝"
echo " ██║     ███████║███████║██║   ██║███████╗    ███████╗   ██║   ███████║██║     █████╔╝ "
echo " ██║     ██╔══██║██╔══██║██║   ██║╚════██║    ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ "
echo " ╚██████╗██║  ██║██║  ██║╚██████╔╝███████║    ███████║   ██║   ██║  ██║╚██████╗██║  ██╗"
echo "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${CYAN}=== SRE OBSERVABILITY & RESILIENCE PLATFORM (CAPSTONE DEMO) ===${NC}\n"

# 1. Check Docker Daemon
echo -e "${BLUE}[1/5] Checking Docker service...${NC}"
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker daemon is not active. Start it with: sudo systemctl start docker${NC}"
    exit 1
fi
echo -e "${GREEN}      ✔ Docker daemon is running.${NC}"

# 2. Check chaos-api systemd service
echo -e "${BLUE}[2/5] Checking chaos-api.service status...${NC}"
if ! systemctl --user is-active --quiet chaos-api; then
    echo -e "${YELLOW}      [!] chaos-api not active. Starting via systemctl...${NC}"
    systemctl --user start chaos-api
    sleep 2
fi

if systemctl --user is-active --quiet chaos-api; then
    echo -e "${GREEN}      ✔ Telemetry Bridge daemon is active on :8000${NC}"
else
    echo -e "${RED}[ERROR] Failed to start chaos-api.service. Check logs: journalctl --user -u chaos-api${NC}"
    exit 1
fi

# 3. Ensure Target Infrastructure is ready
echo -e "${BLUE}[3/5] Verifying mock target containers...${NC}"
if ! docker ps --format '{{.Names}}' | grep -wq "^ubuntu-target$"; then
    echo -e "${CYAN}      -> Spawning ubuntu-target...${NC}"
    docker rm -f ubuntu-target >/dev/null 2>&1
    docker run -d --name ubuntu-target ubuntu sleep infinity >/dev/null 2>&1
fi

if ! docker ps --format '{{.Names}}' | grep -wq "^moto-server$"; then
    echo -e "${CYAN}      -> Spawning moto-server on :5000...${NC}"
    docker rm -f moto-server >/dev/null 2>&1
    docker run -d --name moto-server -p 5000:5000 motoserver/moto >/dev/null 2>&1
    sleep 2
fi

$PYTHON_BIN -c "import boto3; s3 = boto3.client('s3', endpoint_url='http://localhost:5000', region_name='us-east-1', aws_access_key_id='test', aws_secret_access_key='test'); s3.create_bucket(Bucket='production-data-lake') if 'production-data-lake' not in [b['Name'] for b in s3.list_buckets().get('Buckets', [])] else None" >/dev/null 2>&1
echo -e "${GREEN}      ✔ Target infrastructure ready (Docker + Moto AWS).${NC}"

# 4. Launch React Frontend
echo -e "${BLUE}[4/5] Launching HUD Dashboard frontend...${NC}"
cd "$DASHBOARD_DIR" || exit 1
npm run dev -- --clearScreen false >/dev/null 2>&1 &
VITE_PID=$!
sleep 2
echo -e "${GREEN}      ✔ Dashboard running at: ${YELLOW}http://localhost:5173${NC}"

# 5. Interactive Demo Command Center
cd "$CHAOS_DIR" || exit 1
source "$CHAOS_DIR/venv/bin/activate"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  All systems live! Ready for presentation.${NC}"
echo -e "${GREEN}================================================================${NC}"

while true; do
    echo -e "\n${CYAN}Select an action to demonstrate:${NC}"
    echo -e "  ${YELLOW}1)${NC} Inject Docker SIGKILL Strike (High Severity)"
    echo -e "  ${YELLOW}2)${NC} Inject AWS Mock Corruption Strike (High Severity)"
    echo -e "  ${YELLOW}3)${NC} Inject Network Latency Strike (Medium Severity)"
    echo -e "  ${YELLOW}4)${NC} Launch Continuous Stress Drill (Live Streaming HUD)"
    echo -e "  ${YELLOW}5)${NC} Print Live DuckDB Aggregation Table"
    echo -e "  ${YELLOW}q)${NC} Exit & Teardown Demo"
    read -rp "Action [1-5, q]: " choice

    case $choice in
        1)
            echo -e "\n${RED}[*] Executing Docker Chaos Strike...${NC}"
            if ! docker ps --format '{{.Names}}' | grep -wq "^ubuntu-target$"; then
                docker run -d --name ubuntu-target ubuntu sleep infinity >/dev/null 2>&1
            fi
            chaos-stack strike --target docker --severity high
            ;;
        2)
            echo -e "\n${RED}[*] Executing AWS Chaos Strike...${NC}"
            chaos-stack strike --target aws --severity high
            ;;
        3)
            echo -e "\n${RED}[*] Executing Network Chaos Strike...${NC}"
            chaos-stack strike --target network --severity medium
            ;;
        4)
            echo -e "\n${RED}[*] Starting Continuous Stress Drill. Press [CTRL+C] to return to menu.${NC}"
            ./stress_drill.sh
            ;;
        5)
            echo -e "\n${BLUE}[*] Telemetry snapshot from :8000/metrics:${NC}"
            curl -s http://localhost:8000/metrics | jq . 2>/dev/null || curl http://localhost:8000/metrics
            echo ""
            ;;
        q|Q)
            cleanup
            ;;
        *)
            echo -e "${RED}[!] Invalid option selected.${NC}"
            ;;
    esac
done
