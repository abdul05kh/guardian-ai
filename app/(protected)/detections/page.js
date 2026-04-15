'use client';

import { useState, useEffect } from 'react';
import { generateDMCANotice, scanExternalUrl } from '@/lib/gemini';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateHash } from '@/lib/crypto';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function DetectionsPage() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingDMCA, setGeneratingDMCA] = useState(null);
  const [dmcaNotice, setDmcaNotice] = useState(null);
  
  const [showScanner, setShowScanner] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'infringement_detections'),
      orderBy('detectedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDetections(dets);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching detections: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleScan = async () => {
    if (!scanUrl.trim()) return;
    setIsScanning(true);
    addToast('Scanning target URL using WebScanner...', 'info');
    
    try {
      const response = await scanExternalUrl(scanUrl);
      const res = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (res.infringementFound) {
        // [ENTERPRISE MODULE]: Zero-Touch Enforcement Policy Evaluation
        let autoEnforced = false;
        try {
          // Look up active autonomous rules
          const { getDocs } = await import('firebase/firestore');
          const policiesSnapshot = await getDocs(collection(db, 'enforcement_policies'));
          
          for (const p of policiesSnapshot.docs) {
            const policy = p.data();
            const platformMatches = policy.targetPlatform === 'Any' || policy.targetPlatform === res.platform;
            const thresholdMet = (res.confidence || 0) >= policy.confidenceThreshold;
            
            if (policy.status === 'ACTIVE' && platformMatches && thresholdMet) {
              // Trigger Autonomous Sandbox Strike
              addToast(`⚡ Zero-Touch Policy invoked: Auto-dispatching DMCA to ${res.platform}`, 'warning');
              
              // 1. Generate Notice Autonomously
              const autoNoticeText = await generateDMCANotice(res.assetName || 'Target Asset', scanUrl, res.platform, userProfile?.orgId || 'Guardian AI Org');
              
              // 2. Log Detection as Automatically Mitigated
              const detectionRef = await addDoc(collection(db, 'infringement_detections'), {
                assetName: res.assetName || 'Unknown Material',
                url: scanUrl,
                platform: res.platform || 'General Web',
                method: res.method || 'Unknown',
                confidence: res.confidence || 85,
                revenueAtRisk: res.revenueAtRisk || 0,
                status: 'dmca_sent', // Bypasses pending review completely
                detectedAt: new Date().toISOString(),
                dmcaSentAt: new Date().toISOString(),
                autoEnforcedRuleId: p.id,
                orgId: userProfile?.orgId || null
              });

              // 3. Drop to TrustLedger Cryptographically
              await addDoc(collection(db, 'audit_log'), {
                 actionType: 'AUTO_DMCA_DISPATCHED',
                 entityType: 'dmca_notice',
                 entityId: detectionRef.id,
                 user: 'SYSTEM_ZERO_TOUCH',
                 payloadHash: await generateHash(`AUTO_DMCA${detectionRef.id}${new Date().toISOString()}`),
                 loggedAt: new Date().toISOString(),
                 verified: true,
                 ruleApplied: p.id
              });
              
              addToast('Autonomous DMCA Strike strictly logged to TrustLedger', 'success');
              autoEnforced = true;
              break; // Execute exactly one policy match
            }
          }
        } catch(e) {
          console.error("Auto-Enforcement Interceptor Failed:", e);
        }

        // Standard intake if no autonomous rule was met
        if (!autoEnforced) {
          await addDoc(collection(db, 'infringement_detections'), {
            assetName: res.assetName || 'Unknown Material',
            url: scanUrl,
            platform: res.platform || 'General Web',
            method: res.method || 'Unknown',
            confidence: res.confidence || 85,
            revenueAtRisk: res.revenueAtRisk || 0,
            status: 'pending_review',
            detectedAt: new Date().toISOString(),
            orgId: userProfile?.orgId || null
          });
          
          await addDoc(collection(db, 'audit_log'), {
             actionType: 'SCAN_INITIATED',
             entityType: 'url',
             entityId: scanUrl,
             user: userProfile?.email || 'unknown',
             payloadHash: await generateHash(`SCAN${scanUrl}${new Date().toISOString()}`),
             loggedAt: new Date().toISOString(),
             verified: true
          });

          addToast(`Infringement detected with ${res.confidence}% confidence`, 'warning');
        }
      } else {
        addToast('No infringement detected on the target URL', 'success');
      }
      setShowScanner(false);
      setScanUrl('');
    } catch (error) {
      console.error(error);
      addToast('Failed to scan URL', 'error');
    }
    setIsScanning(false);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}>Detections</h2>
        <button className="btn btn-primary" onClick={() => setShowScanner(true)}>🔍 Web Scanner</button>
      </div>
      
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
              <button className="btn btn-danger" onClick={async () => {
                try {
                  const detId = dmcaNotice.detection.id;
                  await updateDoc(doc(db, 'infringement_detections', detId), {
                    status: 'dmca_sent',
                    dmcaSentAt: new Date().toISOString()
                  });
                  
                  const payloadString = 'DMCA_ISSUED' + detId + new Date().toISOString();
                  const hash = await generateHash(payloadString);
                  
                  await addDoc(collection(db, 'audit_log'), {
                    actionType: 'DMCA_ISSUED',
                    entityType: 'dmca_notice',
                    entityId: detId,
                    user: userProfile?.email || 'unknown',
                    payloadHash: hash,
                    loggedAt: new Date().toISOString(),
                    verified: true
                  });
                  
                  addToast(`DMCA Notice dispatched for ${dmcaNotice.detection.assetName}`, 'success');
                  setDmcaNotice(null);
                } catch (error) {
                  console.error("Failed to update status", error);
                  addToast("Failed to dispatch DMCA", 'error');
                }
              }} disabled={loading}>
                📤 Send DMCA Notice
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay" onClick={() => !isScanning && setShowScanner(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔍 Scanner / Request Analysis</h3>
              <button className="modal-close" onClick={() => !isScanning && setShowScanner(false)} disabled={isScanning}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Target URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://example.com/stream" 
                  value={scanUrl}
                  onChange={e => setScanUrl(e.target.value)}
                  disabled={isScanning}
                />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                The WebScanner AI module will analyze the target for potential infringement of active org assets.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowScanner(false)} disabled={isScanning}>Cancel</button>
              <button className="btn btn-primary" onClick={handleScan} disabled={isScanning || !scanUrl.trim()}>
                {isScanning ? 'Scanning...' : 'Scan URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
