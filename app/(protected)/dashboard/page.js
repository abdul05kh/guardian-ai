'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';

// Simulated real-time data for dashboard
const generateKPIData = () => ({
  assetsProtected: { value: 1247, change: '+12.3%', positive: true },
  violationsToday: { value: 34, change: '+8', positive: false },
  activeCrises: { value: 2, change: '-1', positive: true },
  dmcaSent: { value: 156, change: '+23', positive: true },
  avgDetectionTime: { value: '67s', change: '-12s', positive: true },
  revenueProtected: { value: '$2.4M', change: '+18%', positive: true },
});

const PLATFORMS = ['YouTube', 'Telegram', 'X/Twitter', 'Dailymotion', 'TikTok', 'Dark Web', 'Torrent Sites'];
const EVENT_TYPES = [
  { type: 'detection', icon: '🔍', color: 'var(--danger)' },
  { type: 'dmca_sent', icon: '⚖️', color: 'var(--warning)' },
  { type: 'asset_added', icon: '🛡️', color: 'var(--success)' },
  { type: 'crisis_alert', icon: '🚨', color: 'var(--danger)' },
  { type: 'scan_complete', icon: '✅', color: 'var(--success)' },
];

function generateEvent() {
  const evt = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const messages = {
    detection: `Infringement detected on ${platform} — Confidence: ${(75 + Math.random() * 25).toFixed(1)}%`,
    dmca_sent: `DMCA notice dispatched to ${platform} — Awaiting response`,
    asset_added: `New asset fingerprinted and registered — Hash generated`,
    crisis_alert: `Security alert triggered — Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
    scan_complete: `Crawl scan completed — ${Math.floor(100 + Math.random() * 400)} URLs analyzed`,
  };
  return {
    id: Date.now() + Math.random(),
    ...evt,
    message: messages[evt.type],
    time: new Date().toLocaleTimeString(),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis] = useState(generateKPIData);
  const [events, setEvents] = useState([]);
  const [chartLoaded, setChartLoaded] = useState(false);

  // Simulate real-time event feed
  useEffect(() => {
    const initial = Array.from({ length: 8 }, generateEvent);
    setEvents(initial);

    const interval = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev.slice(0, 19)]);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, []);

  // Load chart.js dynamically (client-side only)
  useEffect(() => {
    setChartLoaded(true);
  }, []);

  return (
    <div className="page-content">
      <style jsx>{`
        .kpi-value-animated {
          animation: count-up 0.6s ease-out;
        }
        .chart-container {
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mini-chart {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 60px;
        }
        .mini-chart .bar {
          width: 8px;
          border-radius: 4px 4px 0 0;
          transition: height 0.5s ease;
        }
        .event-feed {
          max-height: 500px;
          overflow-y: auto;
        }
        .event-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-subtle);
          animation: slideInLeft 0.3s ease-out;
        }
        .event-item:last-child { border-bottom: none; }
        .event-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          background: var(--bg-tertiary);
        }
        .event-msg {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
        }
        .event-time {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          margin-top: 2px;
        }
        .map-placeholder {
          height: 300px;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .map-placeholder::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(239, 68, 68, 0.06) 0%, transparent 50%);
        }
        .map-dots {
          display: flex;
          gap: 6px;
          position: absolute;
          top: 40%;
          left: 30%;
        }
        .map-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--danger);
          animation: pulse-dot 2s infinite;
        }
        .map-dot:nth-child(2) { animation-delay: 0.5s; }
        .map-dot:nth-child(3) { animation-delay: 1s; }
        .platform-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .platform-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .platform-name {
          width: 100px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .platform-bar-bg {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .platform-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 1s ease-out;
        }
        .platform-count {
          width: 40px;
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-mono);
        }
      `}</style>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Assets Protected</span>
            <div className="kpi-icon blue">🛡️</div>
          </div>
          <div className="kpi-value kpi-value-animated">{kpis.assetsProtected.value.toLocaleString()}</div>
          <div className={`kpi-change ${kpis.assetsProtected.positive ? 'positive' : 'negative'}`}>
            {kpis.assetsProtected.positive ? '↑' : '↓'} {kpis.assetsProtected.change} this week
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-header">
            <span className="kpi-label">Violations Today</span>
            <div className="kpi-icon danger">🔍</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: 'var(--danger-glow)' }}>{kpis.violationsToday.value}</div>
          <div className="kpi-change negative">
            ↑ {kpis.violationsToday.change} from yesterday
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Crises</span>
            <div className="kpi-icon warning">🚨</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: kpis.activeCrises.value > 0 ? 'var(--warning-glow)' : 'var(--success-glow)' }}>
            {kpis.activeCrises.value}
          </div>
          <div className="kpi-change positive">
            ↓ {kpis.activeCrises.change} resolved
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <span className="kpi-label">DMCA Notices Sent</span>
            <div className="kpi-icon success">⚖️</div>
          </div>
          <div className="kpi-value kpi-value-animated">{kpis.dmcaSent.value}</div>
          <div className="kpi-change positive">
            ↑ {kpis.dmcaSent.change} this month
          </div>
        </div>
      </div>

      {/* Second row: Detection Time + Revenue */}
      <div className="content-grid cols-2" style={{ marginBottom: '20px' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Avg Detection Latency</span>
            <div className="kpi-icon cyan">⚡</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: 'var(--cyan-glow)' }}>{kpis.avgDetectionTime.value}</div>
          <div className="kpi-change positive">↓ {kpis.avgDetectionTime.change} improvement</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: '75%', background: 'var(--gradient-success)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Target: 90s</span><span>Current: 67s ✓</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Revenue Protected</span>
            <div className="kpi-icon purple">💰</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: 'var(--purple-glow)' }}>{kpis.revenueProtected.value}</div>
          <div className="kpi-change positive">↑ {kpis.revenueProtected.change} monthly growth</div>
          <div className="mini-chart" style={{ marginTop: 12 }}>
            {[35, 42, 28, 55, 48, 65, 52, 70, 58, 80, 72, 85].map((h, i) => (
              <div key={i} className="bar" style={{
                height: `${h}%`,
                background: `linear-gradient(to top, var(--purple-primary), var(--purple-glow))`,
                opacity: 0.5 + (i / 24),
              }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content — Map + Feed + Platform Stats */}
      <div className="content-grid cols-2-1" style={{ marginBottom: '20px' }}>
        {/* Violation Map */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🌍 Global Infringement Map</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-danger">● 12 Active</span>
              <span className="badge badge-warning">● 8 Pending</span>
            </div>
          </div>
          <div className="card-body">
            <div className="map-placeholder">
              <div className="map-dots" style={{ top: '35%', left: '25%' }}>
                <div className="map-dot"></div>
              </div>
              <div className="map-dots" style={{ top: '45%', left: '55%' }}>
                <div className="map-dot"></div>
                <div className="map-dot"></div>
              </div>
              <div className="map-dots" style={{ top: '30%', left: '70%' }}>
                <div className="map-dot"></div>
              </div>
              <div className="map-dots" style={{ top: '55%', left: '42%' }}>
                <div className="map-dot"></div>
              </div>
              <span style={{ position: 'relative', zIndex: 1, fontSize: 48, opacity: 0.3 }}>🗺️</span>
              <span style={{ position: 'relative', zIndex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
                Real-time infringement detection map
              </span>
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Live Feed</h3>
            <span className="badge badge-success">● Live</span>
          </div>
          <div className="card-body event-feed" style={{ padding: '12px 22px' }}>
            {events.map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-icon" style={{ background: `${event.color}15` }}>
                  {event.icon}
                </div>
                <div>
                  <div className="event-msg">{event.message}</div>
                  <div className="event-time">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Distribution + Recent Detections */}
      <div className="content-grid cols-2">
        {/* Violations by Platform */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Violations by Platform</h3>
          </div>
          <div className="card-body">
            <div className="platform-stats">
              {[
                { name: 'Telegram', count: 142, pct: 85, color: 'var(--blue-primary)' },
                { name: 'YouTube', count: 98, pct: 65, color: 'var(--danger)' },
                { name: 'X / Twitter', count: 67, pct: 45, color: 'var(--text-secondary)' },
                { name: 'TikTok', count: 54, pct: 36, color: 'var(--cyan-primary)' },
                { name: 'Dailymotion', count: 38, pct: 25, color: 'var(--warning)' },
                { name: 'Dark Web', count: 23, pct: 15, color: 'var(--purple-primary)' },
                { name: 'Torrent Sites', count: 18, pct: 12, color: 'var(--success)' },
              ].map((p) => (
                <div key={p.name} className="platform-row">
                  <span className="platform-name">{p.name}</span>
                  <div className="platform-bar-bg">
                    <div className="platform-bar-fill" style={{ width: `${p.pct}%`, background: p.color }}></div>
                  </div>
                  <span className="platform-count" style={{ color: p.color }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⏱️ Crisis Response Times</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Fire Emergency', time: '1m 42s', target: '3m', status: 'success' },
                { label: 'Medical Emergency', time: '2m 15s', target: '3m', status: 'success' },
                { label: 'Security Incident', time: '3m 08s', target: '5m', status: 'success' },
                { label: 'Evacuation Drill', time: '4m 33s', target: '5m', status: 'warning' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '160px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${(parseFloat(item.time) / parseFloat(item.target)) * 100}%`,
                        background: item.status === 'success' ? 'var(--gradient-success)' : 'linear-gradient(90deg, var(--warning), var(--warning-glow))',
                      }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: item.status === 'success' ? 'var(--success-glow)' : 'var(--warning-glow)', width: '70px' }}>
                    {item.time}
                  </div>
                  <span className={`badge badge-${item.status}`}>
                    &lt; {item.target}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '24px', padding: '14px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>SYSTEM STATUS</div>
              <div style={{ fontSize: '14px', color: 'var(--success-glow)', fontWeight: 600 }}>
                ✓ All response times within target SLAs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
