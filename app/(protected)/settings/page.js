'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    role: 'Admin'
  });
  
  const [configData, setConfigData] = useState({
    geminiApiKey: '',
    organizationName: '',
    scanFrequency: 'Daily'
  });
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        role: userProfile.role || 'Admin'
      });
      setConfigData({
        geminiApiKey: userProfile.geminiApiKey || '',
        organizationName: userProfile.organizationName || '',
        scanFrequency: userProfile.scanFrequency || 'Daily'
      });
    } else if (user) {
      setProfileData(prev => ({ ...prev, displayName: user.displayName || '' }));
    }
  }, [userProfile, user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    await updateUserProfile({
      displayName: profileData.displayName,
      role: profileData.role
    });
    setSavingProfile(false);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    await updateUserProfile({
      geminiApiKey: configData.geminiApiKey,
      organizationName: configData.organizationName,
      scanFrequency: configData.scanFrequency
    });
    setSavingConfig(false);
  };

  return (
    <div className="page-content">
      <div className="content-grid cols-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">👤 Profile</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input className="input" value={profileData.displayName} onChange={e => setProfileData({...profileData, displayName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" defaultValue={user?.email || ''} disabled />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input" value={profileData.role} onChange={e => setProfileData({...profileData, role: e.target.value})}>
                  <option value="admin">Admin</option>
                  <option value="asset_manager">Asset Manager</option>
                  <option value="crisis_coordinator">Crisis Coordinator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🔧 Platform Configuration</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Gemini API Key</label>
                <input className="input" type="password" placeholder="Enter your Gemini API key" value={configData.geminiApiKey} onChange={e => setConfigData({...configData, geminiApiKey: e.target.value})} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get your key from aistudio.google.com</span>
              </div>
              <div className="input-group">
                <label className="input-label">Organization Name</label>
                <input className="input" placeholder="Your organization name" value={configData.organizationName} onChange={e => setConfigData({...configData, organizationName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Scan Frequency</label>
                <select className="input" value={configData.scanFrequency} onChange={e => setConfigData({...configData, scanFrequency: e.target.value})}>
                  <option value="Every 30 minutes">Every 30 minutes</option>
                  <option value="Every hour">Every hour</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
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
