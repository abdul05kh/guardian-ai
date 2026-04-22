'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function DMCAPage() {
  const { user, userProfile } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const baseCollection = collection(db, 'infringement_detections');
    const q = userProfile?.orgId
      ? query(baseCollection, where('orgId', '==', userProfile.orgId), where('status', '==', 'dmca_sent'))
      : query(baseCollection, where('userId', '==', user.uid), where('status', '==', 'dmca_sent'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort to avoid requiring a composite index on status + detectedAt immediately
      data.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
      setNotices(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching DMCA notices:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header"><h3 className="card-title">⚖️ DMCA Notice Management</h3></div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto' }}></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <div className="empty-title">DMCA notices appear here</div>
              <div className="empty-desc">Generate DMCA notices from the Detections page or AssetSentinel by clicking the DMCA button on any confirmed infringement.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Target URL</th>
                    <th>Platform</th>
                    <th>Dispatched At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(n => (
                    <tr key={n.id}>
                      <td style={{ fontWeight: 600 }}>{n.assetName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{n.url}</td>
                      <td><span className="badge badge-blue">{n.platform}</span></td>
                      <td>{new Date(n.dmcaSentAt || n.detectedAt).toLocaleString()}</td>
                      <td><span className="badge badge-success">Notice Sent</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
