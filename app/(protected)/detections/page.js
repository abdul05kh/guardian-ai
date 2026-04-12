'use client';

import { useState } from 'react';
import { generateDMCANotice } from '@/lib/gemini';

const SAMPLE_DETECTIONS = [
  { id: 1, assetName: 'IPL 2026 Final Broadcast', platform: 'Telegram', url: 'https://t.me/piracy_channel_432/8291', confidence: 96.2, method: 'perceptual_hash', detectedAt: '2026-04-11T18:40:00Z', status: 'pending_review', revenueAtRisk: 125000 },
  { id: 2, assetName: 'Match Highlights Reel', platform: 'YouTube', url: 'https://youtube.com/watch?v=x7f2a3d9', confidence: 91.8, method: 'vertex_vision', detectedAt: '2026-04-11T18:35:00Z', status: 'confirmed', revenueAtRisk: 45000 },
  { id: 3, assetName: 'Brand Logo Package v3', platform: 'X/Twitter', url: 'https://x.com/user/status/1234567890', confidence: 88.4, method: 'perceptual_hash', detectedAt: '2026-04-11T18:30:00Z', status: 'confirmed', revenueAtRisk: 8000 },
  { id: 4, assetName: 'Stadium Anthem - Official Audio', platform: 'TikTok', url: 'https://tiktok.com/@user/video/123', confidence: 82.1, method: 'audio_fingerprint', detectedAt: '2026-04-11T18:22:00Z', status: 'pending_review', revenueAtRisk: 12000 },
  { id: 5, assetName: 'IPL 2026 Final Broadcast', platform: 'Dailymotion', url: 'https://dailymotion.com/video/x8df2a1', confidence: 94.7, method: 'vertex_vision', detectedAt: '2026-04-11T18:18:00Z', status: 'false_positive', revenueAtRisk: 0 },
];

export default function DetectionsPage() {
  const [detections, setDetections] = useState(SAMPLE_DETECTIONS);
  const [generatingDMCA, setGeneratingDMCA] = useState(null);
  const [dmcaNotice, setDmcaNotice] = useState(null);

  const handleGenerateDMCA = async (detection) => {
    setGeneratingDMCA(detection.id);
    const notice = await generateDMCANotice(
      detection.assetName,
      detection.url,
      detection.platform,
      'Guardian AI Protected Organization'
    );
    setDmcaNotice({ detection, text: notice });
    setGeneratingDMCA(null);
  };

  const statusStyles = {
    pending_review: { badge: 'badge-warning', label: 'Pending Review' },
    confirmed: { badge: 'badge-danger', label: 'Confirmed' },
    false_positive: { badge: 'badge-blue', label: 'False Positive' },
    dmca_sent: { badge: 'badge-success', label: 'DMCA Sent' },
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px 18px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--danger-glow)' }}>{detections.filter(d => d.status === 'confirmed').length}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confirmed Violations</span>
        </div>
        <div style={{ padding: '10px 18px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--warning-glow)' }}>{detections.filter(d => d.status === 'pending_review').length}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Review</span>
        </div>
        <div style={{ padding: '10px 18px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--purple-glow)' }}>
            ${(detections.reduce((sum, d) => sum + d.revenueAtRisk, 0) / 1000).toFixed(0)}K
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Revenue at Risk</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🔍 Infringement Detections</h3>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Platform</th>
                <th>Confidence</th>
                <th>Method</th>
                <th>Revenue at Risk</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {detections.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, fontSize: '13px' }}>{d.assetName}</td>
                  <td><span className="badge badge-blue">{d.platform}</span></td>
                  <td>
                    <div className="confidence-bar" style={{ width: '120px' }}>
                      <div className="bar">
                        <div className={`fill ${d.confidence >= 90 ? 'high' : d.confidence >= 70 ? 'medium' : 'low'}`} style={{ width: `${d.confidence}%` }}></div>
                      </div>
                      <span className="score">{d.confidence}%</span>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{d.method}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: d.revenueAtRisk > 0 ? 'var(--danger-glow)' : 'var(--text-muted)' }}>
                    ${d.revenueAtRisk.toLocaleString()}
                  </td>
                  <td><span className={`badge ${statusStyles[d.status]?.badge}`}>{statusStyles[d.status]?.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {d.status !== 'false_positive' && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleGenerateDMCA(d)}
                          disabled={generatingDMCA === d.id}
                        >
                          {generatingDMCA === d.id ? '...' : '⚖️ DMCA'}
                        </button>
                      )}
                      <button className="btn btn-sm btn-ghost">Review</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DMCA Notice Modal */}
      {dmcaNotice && (
        <div className="modal-overlay" onClick={() => setDmcaNotice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">⚖️ Generated DMCA Notice</h3>
              <button className="modal-close" onClick={() => setDmcaNotice(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '12px' }}>
                <span className="badge badge-blue">{dmcaNotice.detection.platform}</span>
                <span className="badge badge-purple" style={{ marginLeft: '6px' }}>AI Generated</span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', maxHeight: '400px', overflow: 'auto' }}>
                {dmcaNotice.text}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDmcaNotice(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => {
                setDetections(prev => prev.map(d => d.id === dmcaNotice.detection.id ? { ...d, status: 'dmca_sent' } : d));
                setDmcaNotice(null);
              }}>
                📤 Send DMCA Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
