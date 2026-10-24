#!/usr/bin/env bash

TARGETS=("docker" "aws" "network")
SEVERITIES=("low" "medium" "high")

echo "=================================================="
echo " Starting Chaos-Stack Automated Telemetry Drill"
echo " Press [CTRL+C] at any time to stop the drill."
echo "=================================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$PROJECT_DIR/venv/bin/python"

ensure_targets() {
    # Check ubuntu-target
    if ! docker ps --format '{{.Names}}' | grep -wq "^ubuntu-target$"; then
        echo "[Setup] Rebuilding ubuntu-target..."
        docker rm -f ubuntu-target >/dev/null 2>&1
        docker run -d --name ubuntu-target ubuntu sleep infinity >/dev/null 2>&1
    fi

    # Check moto-server
    if ! docker ps --format '{{.Names}}' | grep -wq "^moto-server$"; then
        echo "[Setup] Starting moto-server on :5000..."
        docker rm -f moto-server >/dev/null 2>&1
        docker run -d --name moto-server -p 5000:5000 motoserver/moto >/dev/null 2>&1
        sleep 2
    fi

    # Ensure target S3 bucket exists with short timeout
    $PYTHON_BIN - << 'PYEOF' >/dev/null 2>&1
import boto3
from botocore.config import Config

cfg = Config(connect_timeout=2, read_timeout=2, retries={'max_attempts': 1})
try:
    s3 = boto3.client(
        's3',
        endpoint_url='http://localhost:5000',
        region_name='us-east-1',
        aws_access_key_id='test',
        aws_secret_access_key='test',
        config=cfg
    )
    buckets = [b['Name'] for b in s3.list_buckets().get('Buckets', [])]
    if 'production-data-lake' not in buckets:
        s3.create_bucket(Bucket='production-data-lake')
except Exception:
    pass
PYEOF
}

count=1
while true; do
    ensure_targets

    target=${TARGETS[$RANDOM % ${#TARGETS[@]}]}
    severity=${SEVERITIES[$RANDOM % ${#SEVERITIES[@]}]}

    echo -e "\n\033[1;31m[Drill #$count]\033[0m Target: \033[1;33m$target\033[0m | Severity: \033[1;35m$severity\033[0m"
    
    chaos-stack strike --target "$target" --severity "$severity"

    ((count++))
    sleep 3
done
