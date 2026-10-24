# ⚠️ Chaos-Stack

> A local Chaos Engineering CLI and SRE Observability Control Plane built to intentionally break Docker and emulated AWS infrastructure to validate system resilience.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Telemetry_Bridge-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Docker](https://img.shields.io/badge/Docker-SDK-2496ED)
![AWS](https://img.shields.io/badge/AWS-boto3-FF9900)
![DuckDB](https://img.shields.io/badge/DuckDB-Analytics-FFD000)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📌 Overview

Standard applications are built for the happy path. **Chaos-Stack** ensures your architecture survives the worst-case scenario. 

Instead of waiting for a random server failure or network drop in production, Chaos-Stack acts as a localized "Chaos Monkey," executing controlled fire drills on your architecture. By combining `boto3`, the Docker SDK, DuckDB, an asynchronous FastAPI bridge, and a real-time React observability HUD into a unified monorepo, it injects faults into containers, networks, and cloud resources to validate auto-recovery mechanisms and application fallback states.

---

## 🧠 Core Capabilities

- **🐋 The Docker Assassin (`--target docker`)**: Connects to the host Docker daemon and executes randomized container terminations (`SIGKILL` / cgroup freeze). Proves that orchestrators can seamlessly detect and recover failed instances.

- **🕸️ Network Sabotage (`--target network`)**: Injects artificial latency (up to 1000ms) directly into a running container's network interface using Linux Traffic Control (`tc qdisc`). Validates application timeout handlers and offline-mode caching.

- **☁️ Cloud IAM Lockout (`--target aws`)**: Connects to local AWS mocking servers (Moto / MinIO) via `boto3` and forcefully injects `DenyAll` IAM policies onto active S3 buckets. Validates that the application gracefully handles sudden cloud access revocation.

- **📊 Resilience Analytics (`report`)**: Logs all strikes, blast radii, and target layers into a zero-dependency **DuckDB** database to track system vulnerability trends over time.

- **🩹 System Healing (`heal`)**: Automatically rolls back injected AWS IAM policies, unfreezes containers, and prepares the environment for the next test cycle.

- **🩺 Dynamic Distro-Doctor Matrix & Telemetry Bridge (`api.py`)**: An asynchronous FastAPI bridge that exposes DuckDB strike metrics and live pre-flight system diagnostics (`/distro-status`, `/target-status`), dynamically probing kernel headers, Docker socket states, and container runtimes.

- **🖥️ SRE HUD Command Center (`dashboard/`)**: A cyber-industrial React/Vite operational dashboard displaying live latency waveforms, dynamic target health badges (`MONITORED`, `LATENCY SPIKE`, `OFFLINE / KILLED`), and real-time DuckDB strike distribution charts.

- **🕹️ SRE Demo Orchestrator (`run_demo.sh`)**: An interactive terminal runbook that provisions targets, launches the telemetry bridge and dashboard, and provides an interactive strike menu for live capstone evaluations.

---

## 📁 Repository Structure

```text
chaos-stack/
├── cli/
│   └── main.py              # Main CLI entrypoint and argument parser
├── attacks/
│   ├── aws_strike.py        # boto3 S3 IAM policy injection logic
│   ├── docker_strike.py     # Docker SDK SIGKILL / freeze execution
│   └── network_strike.py    # tc netem latency injection logic
├── analytics/
│   └── logger.py            # DuckDB historical execution tracking
├── api.py                   # FastAPI telemetry daemon & dynamic health probes
├── run_demo.sh              # Single-command demo runner & evaluation menu
├── stress_drill.sh          # Continuous automated chaos strike injection loop
├── dashboard/               # React + Vite SRE Command Center (Monorepo)
│   ├── src/
│   │   ├── App.jsx          # Live HUD layout, charts & state machine
│   │   └── index.css        # Terminal design tokens & custom styling
│   ├── package.json
│   └── vite.config.js
├── .gitignore               # Privacy & clean version control rules
└── README.md                # Project documentation

```

---

## ⚙️ Prerequisites & Installation

### Prerequisites

* **OS:** Linux (Arch, Ubuntu/Debian, or Fedora recommended for `tc` support)
* **Python:** 3.10+
* **Node.js:** 18+ & npm
* **Docker Engine:** Running locally (`sudo systemctl start docker`)
* **System Tools:** `iproute2` (for network latency injection via `tc`)

### Step-by-Step Setup

1. **Clone the repository:**
```bash
git clone [https://github.com/Braveen811/chaos-stack.git](https://github.com/Braveen811/chaos-stack.git)
cd chaos-stack

```


2. **Set up Python Virtual Environment:**
```bash
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install boto3 docker duckdb rich fastapi uvicorn

```


3. **Install CLI Package locally:**
```bash
pip install -e .

```


*(Alternatively, if running without `pip install -e .`, invoke commands via `python -m cli.main`)*
4. **Install Dashboard Dependencies:**
```bash
cd dashboard
npm install
cd ..

```



---

## 🚀 Quick Start Guide

You can run Chaos-Stack in two ways: via the **Interactive Full-Stack Orchestrator** (recommended for evaluation), or manually via the **Modular CLI**.

---

### Option A: Interactive SRE Demo (Recommended)

Run the single-command orchestrator to boot mock targets, launch the FastAPI bridge and React HUD, and display the interactive attack menu:

```bash
chmod +x run_demo.sh stress_drill.sh
./run_demo.sh

```

* Open `http://localhost:5173` to view the live dashboard.
* Select strike options (`1` to `4`) from the terminal prompt to observe live status badge changes, latency spikes, and DuckDB chart updates.

---

### Option B: Manual CLI Execution

#### 1. Start Emulated Cloud Infrastructure & Targets

```bash
# Start Docker target container
docker run -d --name ubuntu-target ubuntu sleep infinity

# Start Moto server (AWS mock)
docker run -d --name moto-server -p 5000:5000 motoserver/moto

# Provision a test S3 bucket
python -c "import boto3; boto3.client('s3', endpoint_url='http://localhost:5000', aws_access_key_id='test', aws_secret_access_key='test', region_name='us-east-1').create_bucket(Bucket='capstone-frontend-assets')"

```

#### 2. Unleash Chaos

Target specific infrastructure layers using the `--severity` flag:

```bash
chaos-stack strike --target docker --severity high
chaos-stack strike --target network --severity high
chaos-stack strike --target aws --severity high

```

#### 3. Analyze the Damage

View historical execution logs and hit distributions directly from DuckDB:

```bash
chaos-stack report

```

*Example Output:*

```text
📊 Chaos Resilience Analytics (DuckDB)
┏━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━┓
┃ Target Layer    ┃ Severity        ┃       Hits ┃
┡━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━┩
│ AWS             │ HIGH            │          2 │
│ DOCKER          │ HIGH            │          1 │
│ NETWORK         │ HIGH            │          2 │
└─────────────────┴─────────────────┴────────────┘

```

#### 4. Heal the Infrastructure

Reverse cloud configuration locks and restore normal state:

```bash
chaos-stack heal

```

*Example Output:*

```text
[*] Reversing all chaos injections. System healing...
[✔] Removed DenyAll policy from S3 bucket: capstone-frontend-assets

```

---

## 🛡️ Cloud Emulation Setup

For the AWS strike to function locally without incurring cloud costs, `chaos-stack` targets port `5000` by default. Moto provides lightweight, local AWS mocking without external dependencies:

```bash
# Start Moto server
docker run -d --name moto-server -p 5000:5000 motoserver/moto

# Verify bucket creation
python -c "import boto3; boto3.client('s3', endpoint_url='http://localhost:5000', aws_access_key_id='test', aws_secret_access_key='test', region_name='us-east-1').create_bucket(Bucket='test-bucket')"

```

---

## 🗺️ Roadmap & Contributing

**Planned Features:**

* Integration with LocalStack for extended AWS service sabotage (EC2, RDS).
* WebSocket streaming for sub-second trace telemetry in the React dashboard.
* Automated recovery probes for Kubernetes Pod restart cycles.

**Contributing:**
Contributions, issues, and feature requests are welcome! Feel free to check the issues tab.

**License:**
Distributed under the MIT License.

**Author:** [Braveen R](https://braveenr.linklee.in/)

---

## ✌️ Wrapping Up & Operational Modes

`chaos-stack` bridges the gap between theoretical reliability and real-world production resilience:

* **Strike Mode (`chaos-stack strike`)**: Instant, targeted fault injection for simulating container terminations, network latency degradation, and cloud permission faults.
* **Analytics & Healing Mode (`chaos-stack report` & `chaos-stack heal`)**: Comprehensive persistence and tracking of infrastructure resilience via DuckDB, paired with automated rollback capabilities.
* **Telemetry & HUD Mode (`./run_demo.sh` / `api.py`)**: End-to-end full-stack SRE monitoring, linking host kernel health and container lifecycles to a browser HUD.

See you in the terminal!
