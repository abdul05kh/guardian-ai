'use client';

import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, userProfile } = useAuth();

  return (
    <div className="page-content">
      <div className="content-grid cols-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">👤 Profile</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input className="input" defaultValue={user?.displayName || ''} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" defaultValue={user?.email || ''} disabled />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input">
                  <option>Admin</option>
                  <option>Asset Manager</option>
                  <option>Crisis Coordinator</option>
                  <option>Viewer</option>
                </select>
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🔧 Platform Configuration</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Gemini API Key</label>
                <input className="input" type="password" placeholder="Enter your Gemini API key" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get your key from aistudio.google.com</span>
              </div>
              <div className="input-group">
                <label className="input-label">Organization Name</label>
                <input className="input" placeholder="Your organization name" />
              </div>
              <div className="input-group">
                <label className="input-label">Scan Frequency</label>
                <select className="input">
                  <option>Every 30 minutes</option>
                  <option>Every hour</option>
                  <option>Every 6 hours</option>
                  <option>Daily</option>
                </select>
              </div>
              <button className="btn btn-primary">Save Configuration</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header"><h3 className="card-title">🔗 Google Cloud Integration</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { name: 'Firebase Auth', status: 'Connected', color: 'success' },
              { name: 'Firestore', status: 'Connected', color: 'success' },
              { name: 'Cloud Storage', status: 'Connected', color: 'success' },
              { name: 'Gemini API', status: 'Not configured', color: 'warning' },
              { name: 'Cloud Messaging', status: 'Connected', color: 'success' },
              { name: 'BigQuery', status: 'Not configured', color: 'warning' },
            ].map(svc => (
              <div key={svc.name} style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{svc.name}</div>
                <span className={`badge badge-${svc.color}`}>{svc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
