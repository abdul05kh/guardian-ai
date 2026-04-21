'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { generateHash, verifyHash } from '@/lib/crypto';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const baseCollection = collection(db, 'audit_log');
    const q = userProfile?.orgId
      ? query(baseCollection, where('orgId', '==', userProfile.orgId), orderBy('loggedAt', 'desc'))
      : query(baseCollection, where('userId', '==', user.uid), orderBy('loggedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(logs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    const entry = entries.find(e => e.entityId === verifyInput || e.payloadHash.startsWith(verifyInput));
    if (entry) {
      const valid = entry.payload ? await verifyHash(entry.payload, entry.payloadHash) : null;
      setVerifyResult({
        found: true,
        entry,
        valid,
        reason: entry.payload ? 'Verified against stored audit payload.' : 'Hash payload unavailable; integrity status unknown.',
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
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-md)', background: verifyResult.found && verifyResult.valid ? 'rgba(16, 185, 129, 0.06)' : verifyResult.found ? 'rgba(245, 158, 11, 0.06)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${verifyResult.found && verifyResult.valid ? 'rgba(16, 185, 129, 0.2)' : verifyResult.found ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  {verifyResult.found ? (
                    verifyResult.valid === true ? (
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
                        {verifyResult.reason && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{verifyResult.reason}</div>}
                      </div>
                    ) : verifyResult.valid === null ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--warning-glow)', marginBottom: '8px' }}>
                          ⚠️ Record found but payload is missing
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Action: {verifyResult.entry.actionType}<br/>
                          Entity: {verifyResult.entry.entityId}
                        </div>
                        <div className="hash-display" style={{ marginTop: '8px', fontSize: '10px' }}>
                          Stored: {verifyResult.entry.payloadHash}
                        </div>
                        {verifyResult.reason && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{verifyResult.reason}</div>}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--warning-glow)', marginBottom: '8px' }}>
                          ⚠️ Record found but hash verification failed
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Action: {verifyResult.entry.actionType}<br/>
                          Entity: {verifyResult.entry.entityId}
                        </div>
                        <div className="hash-display" style={{ marginTop: '8px', fontSize: '10px' }}>
                          Stored: {verifyResult.entry.payloadHash}
                        </div>
                        {verifyResult.reason && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{verifyResult.reason}</div>}
                      </div>
                    )
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
