'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('@/app/components/Map'), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

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
const EVENT_TYPES = {
  ASSET_UPLOADED: { icon: '📤', color: 'var(--success)', type: 'asset_added' },
  SCAN_INITIATED: { icon: '🔍', color: 'var(--cyan-primary)', type: 'scan_complete' },
  INFRINGEMENT_DETECTED: { icon: '⚠️', color: 'var(--danger)', type: 'detection' },
  DMCA_ISSUED: { icon: '⚖️', color: 'var(--warning)', type: 'dmca_sent' },
  CRISIS_TRIGGERED: { icon: '🚨', color: 'var(--danger)', type: 'crisis_alert' },
  CRISIS_RESOLVED: { icon: '✅', color: 'var(--success)', type: 'scan_complete' },
  USER_ROLE_CHANGED: { icon: '👤', color: 'var(--purple-primary)', type: 'asset_added' },
  ASSET_FINGERPRINTED: { icon: '🔐', color: 'var(--success)', type: 'scan_complete' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [chartLoaded, setChartLoaded] = useState(false);
  const kpis = useMemo(() => generateKPIData(), []);
  
  // Real KPIs state
  const [assetsCount, setAssetsCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [activeCrises, setActiveCrises] = useState(0);
  const [dmcaSent, setDmcaSent] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartLoaded(true);
    
    // Simulate generic time-series data for the analytical chart
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    setChartData(days.map(day => Math.floor(Math.random() * 50) + 10));
    
    // Listen to live events (audit log)
    const auditQuery = query(collection(db, 'audit_log'), orderBy('loggedAt', 'desc'), limit(15));
    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        const eventMeta = EVENT_TYPES[data.actionType] || { icon: '📝', color: 'var(--blue-primary)', type: 'info' };
        return {
          id: doc.id,
          ...data,
          time: new Date(data.loggedAt).toLocaleTimeString(),
          icon: eventMeta.icon,
          color: eventMeta.color,
          message: `${data.actionType.replace(/_/g, ' ')}: ${data.entityType} ${data.entityId.substring(0, 8)}`,
        };
      });
      setEvents(logs);
    });

    // Listen to KPIs
    const assetsUnsub = onSnapshot(collection(db, 'digital_assets'), (snap) => setAssetsCount(snap.size));
    const detUnsub = onSnapshot(collection(db, 'infringement_detections'), (snap) => setViolationsCount(snap.size));
    const dmcaUnsub = onSnapshot(query(collection(db, 'infringement_detections'), where('status', '==', 'dmca_sent')), (snap) => setDmcaSent(snap.size));
    const crisisUnsub = onSnapshot(query(collection(db, 'crisis_events'), where('status', '==', 'active')), (snap) => setActiveCrises(snap.size));

    return () => {
      unsubscribeAudit();
      assetsUnsub();
      detUnsub();
      dmcaUnsub();
      crisisUnsub();
    };
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
          <div className="kpi-value kpi-value-animated">{assetsCount.toLocaleString()}</div>
          <div className={`kpi-change positive`}>
            Live from Firestore
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-header">
            <span className="kpi-label">Detected Violations</span>
            <div className="kpi-icon danger">🔍</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: 'var(--danger-glow)' }}>{violationsCount}</div>
          <div className="kpi-change negative">
            Live from Firestore
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Crises</span>
            <div className="kpi-icon warning">🚨</div>
          </div>
          <div className="kpi-value kpi-value-animated" style={{ color: activeCrises > 0 ? 'var(--warning-glow)' : 'var(--success-glow)' }}>
            {activeCrises}
          </div>
          <div className="kpi-change positive">
            Live from Firestore
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <span className="kpi-label">DMCA Notices Sent</span>
            <div className="kpi-icon success">⚖️</div>
          </div>
          <div className="kpi-value kpi-value-animated">{dmcaSent}</div>
          <div className="kpi-change positive">
            Live from Firestore
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

      {/* Analytics Chart */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">📈 Detections Over Time</h3>
        </div>
        <div className="card-body" style={{ height: '300px', padding: '20px' }}>
          {chartLoaded && chartData.length > 0 ? (
            <Line 
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                  {
                    label: 'Violations Detected',
                    data: chartData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: 'start',
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                  x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                }
              }}
            />
          ) : (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               Loading Analytics...
             </div>
          )}
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
          <div className="card-body" style={{ padding: 0 }}>
            <div className="map-placeholder" style={{ height: '350px', background: 'transparent' }}>
              <DashboardMap />
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
