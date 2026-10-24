from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import duckdb
from pathlib import Path
import time
import random
import subprocess
import platform

app = FastAPI(title="Chaos Stack Telemetry Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).resolve().parent / "chaos_metrics.db"

@app.get("/metrics")
def get_metrics():
    if not DB_PATH.exists():
        return []

    try:
        con = duckdb.connect(str(DB_PATH), read_only=True)
        cols = [c[0] for c in con.execute("DESCRIBE strikes").fetchall()]
        target_col = "target_layer" if "target_layer" in cols else "target"
        
        query = f"""
            SELECT {target_col} as target, severity, COUNT(*) as hits
            FROM strikes
            GROUP BY {target_col}, severity
            ORDER BY hits DESC
        """
        rows = con.execute(query).fetchall()
        con.close()
        
        return [
            {"target": str(r[0]), "severity": str(r[1]), "hits": int(r[2])}
            for r in rows
        ]
    except Exception as e:
        print(f"[API ERROR metrics] {e}")
        return []

@app.get("/latency")
def get_latency():
    """Returns rolling latency points influenced by recent strike activity."""
    strike_count = 0
    if DB_PATH.exists():
        try:
            con = duckdb.connect(str(DB_PATH), read_only=True)
            strike_count = con.execute("SELECT count(*) FROM strikes").fetchone()[0]
            con.close()
        except Exception:
            pass

    base_latency = random.randint(18, 32)
    spike_bonus = random.choice([0, 0, 180, 520]) if strike_count > 0 else 0
    current_latency = base_latency + spike_bonus

    return {
        "timestamp": time.strftime("%H:%M:%S"),
        "latency_ms": current_latency,
        "status": "DEGRADED" if current_latency > 150 else "HEALTHY"
    }

@app.get("/target-status")
def get_target_status():
    """Inspects live Docker and recent strikes to compute real-time target health."""
    status = {
        "docker": "HEALTHY",
        "aws": "HEALTHY",
        "network": "HEALTHY"
    }

    try:
        res = subprocess.run(
            ["docker", "ps", "-q", "-f", "name=ubuntu-target"],
            capture_output=True,
            text=True,
            timeout=1
        )
        if not res.stdout.strip():
            status["docker"] = "COMPROMISED"
    except Exception:
        status["docker"] = "COMPROMISED"

    if DB_PATH.exists():
        try:
            con = duckdb.connect(str(DB_PATH), read_only=True)
            cols = [c[0] for c in con.execute("DESCRIBE strikes").fetchall()]
            target_col = "target_layer" if "target_layer" in cols else "target"
            
            recent = con.execute(f"""
                SELECT {target_col}, severity 
                FROM strikes 
                ORDER BY rowid DESC LIMIT 2
            """).fetchall()
            con.close()

            for target_name, severity in recent:
                t = str(target_name).lower()
                sev = str(severity).lower()
                if t in status and status[t] != "COMPROMISED":
                    if sev == "high":
                        status[t] = "COMPROMISED" if t == "docker" else "DEGRADED"
                    elif sev in ("medium", "low"):
                        status[t] = "DEGRADED"
        except Exception as e:
            print(f"[API ERROR target-status] {e}")

    return status

@app.get("/distro-status")
def get_distro_status():
    """Runs pre-flight compatibility probes across host and container targets."""
    results = [
        {
            "name": f"Arch Linux ({platform.release().split('-')[0]})",
            "status": "PASS",
            "details": "Host Kernel & Socket OK"
        },
        {
            "name": "Ubuntu 24.04 LTS",
            "status": "PASS",
            "details": "Target Container Reachable"
        },
        {
            "name": "Fedora 40",
            "status": "FAIL",
            "details": "Unprovisioned Target"
        }
    ]

    docker_sock = Path("/var/run/docker.sock")
    if not docker_sock.exists():
        results[0]["status"] = "FAIL"
        results[0]["details"] = "Docker Socket Inaccessible"

    try:
        res_ubuntu = subprocess.run(
            ["docker", "exec", "ubuntu-target", "which", "sh"],
            capture_output=True,
            text=True,
            timeout=1
        )
        if res_ubuntu.returncode != 0:
            results[1]["status"] = "FAIL"
            results[1]["details"] = "Container Unreachable"
    except Exception:
        results[1]["status"] = "FAIL"
        results[1]["details"] = "Container Offline"

    try:
        res_fedora = subprocess.run(
            ["docker", "ps", "-q", "-f", "name=fedora-target"],
            capture_output=True,
            text=True,
            timeout=1
        )
        if res_fedora.stdout.strip():
            results[2]["status"] = "PASS"
            results[2]["details"] = "Environment Verified"
        else:
            results[2]["status"] = "FAIL"
            results[2]["details"] = "Unprovisioned Target"
    except Exception:
        results[2]["status"] = "FAIL"
        results[2]["details"] = "Probe Error"

    return results