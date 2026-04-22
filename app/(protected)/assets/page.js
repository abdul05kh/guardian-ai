'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateHash } from '@/lib/crypto';
import { analyzeMediaContent } from '@/lib/gemini';

const SAMPLE_ASSETS = [
  { id: 1, name: 'IPL 2026 Final Broadcast', type: 'video', status: 'active', violations: 34, hash: 'a7f3d2...e819b4', confidence: 94 },
  { id: 2, name: 'Stadium Anthem - Official Audio', type: 'audio', status: 'active', violations: 12, hash: 'b9c1e5...f42a73', confidence: 88 },
  { id: 3, name: 'Brand Logo Package v3', type: 'image', status: 'active', violations: 67, hash: 'c4d8f1...a93b56', confidence: 97 },
  { id: 4, name: 'Press Conference - March 2026', type: 'video', status: 'dmca_pending', violations: 8, hash: 'd2e6a4...b71c89', confidence: 82 },
  { id: 5, name: 'Match Highlights Reel', type: 'video', status: 'active', violations: 156, hash: 'e8f2b9...c45d12', confidence: 91 },
];

const STATUS_MAP = {
  active: { label: 'Protected', badge: 'badge-success' },
  expired: { label: 'Expired', badge: 'badge-warning' },
  dmca_pending: { label: 'DMCA Pending', badge: 'badge-danger' },
  withdrawn: { label: 'Withdrawn', badge: 'badge-purple' },
};

const TYPE_ICONS = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
  document: '📄',
};

export default function AssetsPage() {
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState(SAMPLE_ASSETS);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const baseCollection = collection(db, 'digital_assets');
    const q = userProfile?.orgId
      ? query(baseCollection, where('orgId', '==', userProfile.orgId))
      : query(baseCollection, where('uploadedBy', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setAssets(SAMPLE_ASSETS);
        return;
      }

      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate fingerprinting progress
      const steps = ['Uploading to Cloud Storage...', 'Generating perceptual hash...', 'Creating Vertex AI embedding...', 'Registering in TrustLedger...'];
      for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        setUploadProgress((i + 1) * 25);
      }

      // Generate hash from file name + content type
      const hash = await generateHash(file.name + file.type + file.size + Date.now());

      // Try uploading to Firebase Storage
      let downloadURL = '';
      try {
        const storageRef = ref(storage, `assets/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        downloadURL = await getDownloadURL(storageRef);
      } catch (err) {
        console.log('Storage upload skipped:', err.message);
      }

      // Save to Firestore
      try {
        await addDoc(collection(db, 'digital_assets'), {
          assetName: file.name,
          assetType: file.type.split('/')[0] || 'document',
          gcsUri: downloadURL,
          perceptualHash: hash.substring(0, 16),
          status: 'active',
          uploadedBy: user.uid,
          userId: user.uid,
          orgId: userProfile?.orgId || null,
          createdAt: serverTimestamp(),
          violations: 0,
        });
      } catch (err) {
        console.log('Firestore save skipped:', err.message);
      }

      // Add to local state
      const newAsset = {
        id: Date.now(),
        name: file.name,
        type: file.type.split('/')[0] || 'document',
        status: 'active',
        violations: 0,
        hash: hash.substring(0, 6) + '...' + hash.substring(hash.length - 6),
        confidence: 95 + Math.floor(Math.random() * 5),
      };

      setAssets(prev => [newAsset, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleScan = async (asset) => {
    setSelectedAsset(asset);
    setScanning(true);
    setScanResults(null);

    // Simulate crawl scan
    const platforms = ['YouTube', 'Telegram', 'X/Twitter', 'Dailymotion', 'TikTok', 'Reddit', 'Dark Web'];
    const results = [];

    for (const platform of platforms) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
      const found = Math.random() > 0.5;
      if (found) {
        results.push({
          platform,
          url: `https://${platform.toLowerCase().replace(/[^a-z]/g, '')}.com/watch?v=${Math.random().toString(36).substring(7)}`,
          confidence: (70 + Math.random() * 30).toFixed(1),
          detectedAt: new Date().toISOString(),
        });
      }
    }

    setScanResults(results);
    setScanning(false);
  };

  const handleAiAnalyze = async (asset) => {
    setSelectedAsset(asset);
    setAiAnalysis('loading');
    try {
      const result = await analyzeMediaContent(`${asset.type} content named "${asset.name}" with ${asset.violations} known violations`);
      setAiAnalysis(typeof result === 'string' ? JSON.parse(result) : result);
    } catch (e) {
      setAiAnalysis({ error: 'AI analysis failed. Configure Gemini API key for live analysis.' });
    }
  };

  if (!mounted) return <div className="page-content"><div className="spinner" /></div>;

  return (
    <div className="page-content">
      <style jsx>{`
        .asset-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }
        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .asset-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: all var(--transition-base);
          cursor: pointer;
        }
        .asset-card:hover {
          border-color: var(--border-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow-blue);
        }
        .asset-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .asset-type-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .asset-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .asset-hash {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--cyan-glow);
        }
        .asset-stats {
          display: flex;
          gap: 16px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }
        .asset-stat {
          font-size: 12px;
          color: var(--text-muted);
        }
        .asset-stat strong {
          color: var(--text-primary);
          font-family: var(--font-mono);
        }
        .asset-card-actions {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }
        .scan-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scan-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-xl);
          padding: 32px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        .scan-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .scan-item:last-child { border-bottom: none; }
      `}</style>

      {/* Actions Bar */}
      <div className="asset-actions">
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          ➕ Upload Asset
        </button>
        <button className="btn btn-ghost">
          📤 Bulk Import
        </button>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total:</span>
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{assets.length} assets</span>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="asset-grid">
        {assets.map((asset) => (
          <div key={asset.id} className="asset-card">
            <div className="asset-card-header">
              <div className="asset-type-icon">{TYPE_ICONS[asset.type] || '📄'}</div>
              <div style={{ flex: 1 }}>
                <div className="asset-name">{asset.name}</div>
                <div className="asset-hash">SHA-256: {asset.hash}</div>
              </div>
              <span className={`badge ${STATUS_MAP[asset.status]?.badge || 'badge-blue'}`}>
                {STATUS_MAP[asset.status]?.label || asset.status}
              </span>
            </div>

            <div className="confidence-bar">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '70px' }}>Confidence</span>
              <div className="bar">
                <div className={`fill ${asset.confidence >= 90 ? 'high' : asset.confidence >= 70 ? 'medium' : 'low'}`} style={{ width: `${asset.confidence}%` }}></div>
              </div>
              <span className="score" style={{ color: asset.confidence >= 90 ? 'var(--success-glow)' : 'var(--warning-glow)' }}>{asset.confidence}%</span>
            </div>

            <div className="asset-stats">
              <div className="asset-stat">
                Violations: <strong style={{ color: asset.violations > 50 ? 'var(--danger-glow)' : 'var(--text-primary)' }}>{asset.violations}</strong>
              </div>
              <div className="asset-stat">
                Type: <strong>{asset.type}</strong>
              </div>
            </div>

            <div className="asset-card-actions">
              <button className="btn btn-sm btn-primary" onClick={() => handleScan(asset)}>🔍 Scan</button>
              <button className="btn btn-sm btn-ghost" onClick={() => handleAiAnalyze(asset)}>🤖 AI Analyze</button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Digital Asset</h3>
              <button className="modal-close" onClick={() => !uploading && setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {uploading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }}></div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {uploadProgress <= 25 ? 'Uploading to Cloud Storage...' :
                     uploadProgress <= 50 ? 'Generating perceptual hash...' :
                     uploadProgress <= 75 ? 'Creating Vertex AI embedding...' :
                     'Registering in TrustLedger...'}
                  </div>
                  <div className="progress-bar" style={{ marginTop: '16px' }}>
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{uploadProgress}% complete</div>
                </div>
              ) : (
                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">Drop your media asset here</div>
                  <div className="upload-hint">Video, image, audio, or document — up to 50MB</div>
                  <div className="upload-hint" style={{ marginTop: '8px' }}>
                    <span className="badge badge-blue">Perceptual Hash</span>
                    <span className="badge badge-purple" style={{ marginLeft: '6px' }}>AI Embedding</span>
                    <span className="badge badge-cyan" style={{ marginLeft: '6px' }}>Audio Fingerprint</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept="video/*,image/*,audio/*,.pdf,.doc,.docx"
                    onChange={(e) => handleUpload(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan Results Overlay */}
      {(scanning || scanResults) && (
        <div className="scan-overlay" onClick={() => { setScanning(false); setScanResults(null); }}>
          <div className="scan-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>
                🔍 Scan Results: {selectedAsset?.name}
              </h3>
              <button className="modal-close" onClick={() => { setScanning(false); setScanResults(null); }}>×</button>
            </div>

            {scanning ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }}></div>
                <div>Scanning platforms for unauthorized copies...</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Checking YouTube, Telegram, X, Dailymotion, TikTok, Reddit, Dark Web...
                </div>
              </div>
            ) : scanResults && (
              <div>
                <div style={{ marginBottom: '16px', padding: '12px', background: scanResults.length > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-md)', border: `1px solid ${scanResults.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
                  <span style={{ fontWeight: 600, color: scanResults.length > 0 ? 'var(--danger-glow)' : 'var(--success-glow)' }}>
                    {scanResults.length > 0 ? `⚠️ ${scanResults.length} potential infringements found` : '✓ No infringements detected'}
                  </span>
                </div>

                {scanResults.map((result, i) => (
                  <div key={i} className="scan-item">
                    <span style={{ fontSize: '14px', fontWeight: 600, width: '100px' }}>{result.platform}</span>
                    <span style={{ flex: 1, fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.url}
                    </span>
                    <div className="confidence-bar" style={{ width: '120px' }}>
                      <div className="bar">
                        <div className={`fill ${parseFloat(result.confidence) >= 90 ? 'high' : 'medium'}`} style={{ width: `${result.confidence}%` }}></div>
                      </div>
                      <span className="score">{result.confidence}%</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      alert('DMCA Notice dispatched for ' + result.url);
                      const newResults = scanResults.filter(r => r !== result);
                      setScanResults(newResults);
                      if (newResults.length === 0) setScanning(false);
                    }}>DMCA</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Overlay */}
      {aiAnalysis && (
        <div className="modal-overlay" onClick={() => setAiAnalysis(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🤖 AI Analysis: {selectedAsset?.name}</h3>
              <button className="modal-close" onClick={() => setAiAnalysis(null)}>×</button>
            </div>
            <div className="modal-body">
              {aiAnalysis === 'loading' ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }}></div>
                  <div>Gemini AI analyzing asset...</div>
                </div>
              ) : aiAnalysis.error ? (
                <div className="error-msg">{aiAnalysis.error}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div><strong>Category:</strong> <span className="badge badge-blue">{aiAnalysis.category}</span></div>
                  <div><strong>Protection Priority:</strong> <span className={`badge ${aiAnalysis.protectionPriority === 'high' || aiAnalysis.protectionPriority === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{aiAnalysis.protectionPriority}</span></div>
                  <div><strong>Uniqueness Score:</strong> {aiAnalysis.uniquenessScore}/100</div>
                  <div><strong>Key Features:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {(aiAnalysis.features || []).map((f, i) => <span key={i} className="badge badge-purple">{f}</span>)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    {aiAnalysis.summary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
