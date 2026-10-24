import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  Monitor, 
  Activity, 
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from 'recharts';

export default function App() {
  const [dbData, setDbData] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([
    { time: '00:00', ms: 24 },
    { time: '00:03', ms: 28 },
    { time: '00:06', ms: 22 },
    { time: '00:09', ms: 30 }
  ]);
  const [currentLatency, setCurrentLatency] = useState(24);
  const [targetStatus, setTargetStatus] = useState({
    aws: 'HEALTHY',
    network: 'HEALTHY',
    docker: 'HEALTHY'
  });
  const [distroData, setDistroData] = useState([
    { name: 'Arch Linux (Rolling)', status: 'PASS', details: 'Host System' },
    { name: 'Ubuntu 24.04 LTS', status: 'PASS', details: 'Target Container' },
    { name: 'Fedora 40', status: 'FAIL', details: 'Unprovisioned' }
  ]);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resMetrics = await fetch('http://localhost:8000/metrics');
        const metricsData = await resMetrics.json();
        setDbData(metricsData);

        const resLatency = await fetch('http://localhost:8000/latency');
        const latData = await resLatency.json();
        setCurrentLatency(latData.latency_ms);

        setLatencyHistory(prev => {
          const next = [...prev, { time: latData.timestamp, ms: latData.latency_ms }];
          return next.slice(-12);
        });

        const resStatus = await fetch('http://localhost:8000/target-status');
        const statusData = await resStatus.json();
        setTargetStatus(statusData);

        const resDistro = await fetch('http://localhost:8000/distro-status');
        const distroJson = await resDistro.json();
        setDistroData(distroJson);

        setLastSync(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Telemetry link offline:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalStrikes = dbData.reduce((acc, row) => acc + (row.hits || 0), 0);

  const renderTargetBadge = (status) => {
    if (status === 'COMPROMISED') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'JetBrains Mono',
          color: '#FF4D4F',
          background: 'rgba(178, 19, 24, 0.15)',
          border: '1px solid rgba(178, 19, 24, 0.5)',
          padding: '4px 10px',
          borderRadius: '6px',
          boxShadow: '0 0 10px rgba(178, 19, 24, 0.3)',
          letterSpacing: '0.04em'
        }}>
          OFFLINE / KILLED
        </span>
      );
    }
    if (status === 'DEGRADED') {
      return (
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: 'JetBrains Mono',
          color: '#EAB308',
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.5)',
          padding: '4px 10px',
          borderRadius: '6px',
          boxShadow: '0 0 10px rgba(234, 179, 8, 0.3)',
          letterSpacing: '0.04em'
        }}>
          LATENCY SPIKE
        </span>
      );
    }
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: 'JetBrains Mono',
        color: '#10B981',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '4px 10px',
        borderRadius: '6px',
        letterSpacing: '0.04em'
      }}>
        MONITORED
      </span>
    );
  };

  const targetsList = [
    { key: 'aws', label: 'AWS S3 Bucket' },
    { key: 'network', label: 'Moto Network Route' },
    { key: 'docker', label: 'Ubuntu Docker Target' }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px' }}>
      
      {/* Top HUD Bar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #B21318 0%, #4A080A 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(178, 19, 24, 0.45)'
          }}>
            <Terminal size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
              CHAOS // <span style={{ color: '#B21318' }}>OBSERVABILITY</span>
            </h1>
            <p className="mono" style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              BCA CAPSTONE COMMAND CENTER • DUCKDB SRE ENGINE
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="mono" style={{ 
            fontSize: '11px', 
            color: '#9CA3AF', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '6px 12px', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.05)' 
          }}>
            SYNC: <span style={{ color: '#F3F4F6' }}>{lastSync}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: currentLatency > 150 ? 'rgba(178, 19, 24, 0.12)' : 'rgba(16, 185, 129, 0.08)', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            border: currentLatency > 150 ? '1px solid rgba(178, 19, 24, 0.4)' : '1px solid rgba(16, 185, 129, 0.25)' 
          }}>
            <div style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              background: currentLatency > 150 ? '#B21318' : '#10B981' 
            }} />
            <span className="mono" style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              color: currentLatency > 150 ? '#FF4D4F' : '#10B981', 
              letterSpacing: '0.05em' 
            }}>
              {currentLatency > 150 ? 'LATENCY DEGRADED' : 'TELEMETRY LIVE'}
            </span>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="hud-card" style={{ padding: '18px 22px' }}>
          <div className="mono" style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>TOTAL INJECTIONS</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>{totalStrikes}</div>
        </div>

        <div className="hud-card" style={{ padding: '18px 22px' }}>
          <div className="mono" style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>TARGET INTEGRITY</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: currentLatency > 150 ? '#FF4D4F' : '#10B981' }}>
            {currentLatency > 150 ? 'SPIKE' : 'STABLE'}
          </div>
        </div>

        <div className="hud-card" style={{ padding: '18px 22px' }}>
          <div className="mono" style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>REAL-TIME LATENCY</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: currentLatency > 150 ? '#FF4D4F' : '#fff' }}>
            {currentLatency}<span style={{ fontSize: '16px', color: '#6B7280', marginLeft: '4px' }}>ms</span>
          </div>
        </div>

        <div className="hud-card" style={{ padding: '18px 22px' }}>
          <div className="mono" style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px' }}>ENGINE BRIDGE</div>
          <div className="mono" style={{ fontSize: '20px', fontWeight: '700', color: '#F3F4F6', marginTop: '6px' }}>:8000 READ_ONLY</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '360px 1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Diagnostics Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Distro-Doctor Matrix (Live Probed) */}
          <div className="hud-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={16} color="#10B981" />
                <span className="mono" style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: '#D1D5DB' }}>
                  DISTRO-DOCTOR MATRIX
                </span>
              </div>
              <ArrowUpRight size={14} color="#6B7280" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {distroData.map((distro, idx) => {
                const isPass = distro.status === 'PASS';
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 14px', 
                      background: isPass ? 'rgba(255,255,255,0.02)' : 'rgba(178,19,24,0.06)', 
                      borderRadius: '8px', 
                      border: isPass ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(178,19,24,0.25)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div>
                      <div className="mono" style={{ fontSize: '13px', color: '#E5E7EB' }}>{distro.name}</div>
                      <div className="mono" style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{distro.details}</div>
                    </div>
                    <span className={isPass ? 'badge-pass' : 'badge-fail'}>
                      {distro.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Chaos Targets */}
          <div className="hud-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={16} color="#B21318" />
                <span className="mono" style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: '#D1D5DB' }}>
                  CHAOS-STACK TARGETS
                </span>
              </div>
              <div className="pulse-dot" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {targetsList.map(({ key, label }) => {
                const currentStatus = targetStatus[key] || 'HEALTHY';
                return (
                  <div 
                    key={key} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 14px', 
                      background: currentStatus === 'COMPROMISED' 
                        ? 'rgba(178, 19, 24, 0.08)' 
                        : currentStatus === 'DEGRADED' 
                        ? 'rgba(234, 179, 8, 0.08)' 
                        : 'rgba(255,255,255,0.02)', 
                      borderRadius: '8px', 
                      border: currentStatus === 'COMPROMISED' 
                        ? '1px solid rgba(178, 19, 24, 0.35)' 
                        : currentStatus === 'DEGRADED' 
                        ? '1px solid rgba(234, 179, 8, 0.35)' 
                        : '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span className="mono" style={{ fontSize: '13px', color: '#E5E7EB' }}>{label}</span>
                    {renderTargetBadge(currentStatus)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Visualizers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Chart 1: Strike Distribution BarChart */}
          <div className="hud-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="#B21318" />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>STRIKE DISTRIBUTION ANALYTICS</h2>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#9CA3AF' }}>DUCKDB METRICS</div>
            </div>

            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dbData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B21318" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A080A" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="target" stroke="#4B5563" tick={{ fill: '#D1D5DB', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4B5563" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(178, 19, 24, 0.08)' }} contentStyle={{ backgroundColor: '#0D0F14', border: '1px solid rgba(178, 19, 24, 0.4)', borderRadius: '8px' }} />
                  <Bar dataKey="hits" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Real-time Response Latency Area Chart */}
          <div className="hud-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={18} color="#EAB308" />
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>LATENCY TELEMETRY STREAM</h2>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#EAB308' }}>ROLLING APM (ms)</div>
            </div>

            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={latencyHistory} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EAB308" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#EAB308" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#4B5563" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4B5563" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0D0F14', border: '1px solid #EAB308', borderRadius: '8px', color: '#fff', fontFamily: 'JetBrains Mono' }} />
                  <Area type="monotone" dataKey="ms" stroke="#EAB308" strokeWidth={2} fillOpacity={1} fill="url(#latencyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}