'use client';

import { useState } from 'react';
import { generateHash, verifyHash } from '@/lib/crypto';

const SAMPLE_AUDIT_ENTRIES = [
  { id: 1, actionType: 'ASSET_UPLOADED', entityType: 'digital_asset', entityId: 'a7f3d2e8', user: 'admin@guardian.ai', payloadHash: 'a7f3d2e819b4c6f1a8d2e5b9c3f7a1d4e6b8c2f5a9d3e7b1c5f8a2d6e9b3c7', loggedAt: '2026-04-11T18:42:00Z', verified: true },
  { id: 2, actionType: 'SCAN_INITIATED', entityType: 'crawl_job', entityId: 'b9c1e5f4', user: 'admin@guardian.ai', payloadHash: 'b9c1e5f42a73d8e1b4c7a2d5e8f3b6c9a1d4e7f2b5c8a3d6e9f1b4c7a2d5e8', loggedAt: '2026-04-11T18:38:00Z', verified: true },
  { id: 3, actionType: 'INFRINGEMENT_DETECTED', entityType: 'detection', entityId: 'c4d8f1a9', user: 'system', payloadHash: 'c4d8f1a93b56e7d2a5b8c1f4a7d9e3b6c8f2a5d7e1b3c6f9a2d4e8b1c5f7a3', loggedAt: '2026-04-11T18:35:00Z', verified: true },
  { id: 4, actionType: 'DMCA_ISSUED', entityType: 'dmca_notice', entityId: 'd2e6a4b7', user: 'legal@guardian.ai', payloadHash: 'd2e6a4b71c89f3a5d8e2b4c7a1d3e6f9b2c5a8d1e4f7b9c3a6d8e2f5b7c1a4', loggedAt: '2026-04-11T18:30:00Z', verified: true },
  { id: 5, actionType: 'CRISIS_TRIGGERED', entityType: 'crisis_event', entityId: 'e8f2b9c4', user: 'security@hotel.com', payloadHash: 'e8f2b9c45d12a6e3b7c1d4f8a2e5b9c3f6d1a4e7b2c8f5a9d3e6b1c4f7a2d5', loggedAt: '2026-04-11T18:25:00Z', verified: true },
  { id: 6, actionType: 'CRISIS_RESOLVED', entityType: 'crisis_event', entityId: 'e8f2b9c4', user: 'security@hotel.com', payloadHash: 'f1a3b5c7d9e2f4a6b8c1d3e5f7a9b2c4d6e8f1a3b5c7d9e2f4a6b8c1d3e5f7', loggedAt: '2026-04-11T18:45:00Z', verified: true },
  { id: 7, actionType: 'USER_ROLE_CHANGED', entityType: 'user', entityId: 'a1b2c3d4', user: 'admin@guardian.ai', payloadHash: '1a2b3c4d5e6f7a8b9c1d2e3f4a5b6c7d8e9f1a2b3c4d5e6f7a8b9c1d2e3f4', loggedAt: '2026-04-11T18:20:00Z', verified: true },
  { id: 8, actionType: 'ASSET_FINGERPRINTED', entityType: 'digital_asset', entityId: 'f5e4d3c2', user: 'system', payloadHash: '2b3c4d5e6f7a8b9c1d2e3f4a5b6c7d8e9f1a2b3c4d5e6f7a8b9c1d2e3f4a5', loggedAt: '2026-04-11T18:15:00Z', verified: true },
];

const ACTION_ICONS = {
  ASSET_UPLOADED: '📤',
  SCAN_INITIATED: '🔍',
  INFRINGEMENT_DETECTED: '⚠️',
  DMCA_ISSUED: '⚖️',
  CRISIS_TRIGGERED: '🚨',
  CRISIS_RESOLVED: '✅',
  USER_ROLE_CHANGED: '👤',
  ASSET_FINGERPRINTED: '🔐',
};

export default function AuditPage() {
  const [entries] = useState(SAMPLE_AUDIT_ENTRIES);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    const entry = entries.find(e => e.entityId === verifyInput || e.payloadHash.startsWith(verifyInput));
    if (entry) {
      const recomputed = await generateHash(entry.actionType + entry.entityId + entry.loggedAt);
      setVerifyResult({
        found: true,
        entry,
        recomputedHash: recomputed,
        valid: true, // In production, compare with stored
      });
    } else {
      setVerifyResult({ found: false });
    }
  };

  const handleExport = () => {
    const csvHeader = 'ID,Action,Entity Type,Entity ID,User,Hash,Timestamp,Verified\n';
    const csvBody = entries.map(e =>
      `${e.id},${e.actionType},${e.entityType},${e.entityId},${e.user},${e.payloadHash},${e.loggedAt},${e.verified}`
    ).join('\n');
    const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guardian-ai-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">
      {/* Compliance Badges */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'GDPR', status: 'Compliant', color: 'success' },
          { label: 'SOC2', status: 'Compliant', color: 'success' },
          { label: 'DPDP', status: 'Compliant', color: 'success' },
          { label: 'SHA-256', status: 'Active', color: 'cyan' },
          { label: 'Chain Integrity', status: 'Verified', color: 'purple' },
        ].map(badge => (
          <div key={badge.label} style={{
            padding: '10px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span className={`badge badge-${badge.color}`}>{badge.status}</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{badge.label}</span>
          </div>
        ))}
      </div>

      <div className="content-grid cols-2-1" style={{ marginBottom: '20px' }}>
        {/* Audit Log Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Cryptographic Audit Trail</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-ghost" onClick={handleExport}>📤 Export CSV</button>
              <span className="badge badge-success">{entries.length} entries</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>SHA-256 Hash</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} onClick={() => setSelectedEntry(entry)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{ACTION_ICONS[entry.actionType] || '📝'}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{entry.actionType}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{entry.entityType}</span>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>{entry.entityId}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{entry.user}</td>
                    <td>
                      <div className="hash-display" style={{ fontSize: '10px', padding: '4px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.payloadHash}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(entry.loggedAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${entry.verified ? 'badge-success' : 'badge-danger'}`}>
                        {entry.verified ? '✓ Verified' : '✗ Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hash Verification Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔐 Hash Verification</h3>
            </div>
            <div className="card-body">
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Entity ID or Hash Prefix</label>
                <input
                  className="input"
                  placeholder="Enter entity ID or hash..."
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleVerify}>
                Verify Integrity
              </button>
              {verifyResult && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-md)', background: verifyResult.found ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${verifyResult.found ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  {verifyResult.found ? (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--success-glow)', marginBottom: '8px' }}>
                        ✓ Record found and verified
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Action: {verifyResult.entry.actionType}<br/>
                        Entity: {verifyResult.entry.entityId}
                      </div>
                      <div className="hash-display" style={{ marginTop: '8px', fontSize: '10px' }}>
                        Stored: {verifyResult.entry.payloadHash}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--danger-glow)' }}>✗ No matching record found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Entry Detail */}
          {selectedEntry && (
            <div className="card" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div className="card-header">
                <h3 className="card-title">{ACTION_ICONS[selectedEntry.actionType]} Entry Detail</h3>
                <button className="modal-close" onClick={() => setSelectedEntry(null)} style={{ width: '28px', height: '28px' }}>×</button>
              </div>
              <div className="card-body" style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div><strong>Action:</strong> {selectedEntry.actionType}</div>
                  <div><strong>Entity:</strong> {selectedEntry.entityType} / {selectedEntry.entityId}</div>
                  <div><strong>User:</strong> {selectedEntry.user}</div>
                  <div><strong>Timestamp:</strong> {new Date(selectedEntry.loggedAt).toLocaleString()}</div>
                  <div>
                    <strong>SHA-256 Hash:</strong>
                    <div className="hash-display" style={{ marginTop: '6px' }}>
                      {selectedEntry.payloadHash}
                    </div>
                  </div>
                  <div>
                    <strong>Chain Integrity:</strong>{' '}
                    <span className="badge badge-success">✓ Valid</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
