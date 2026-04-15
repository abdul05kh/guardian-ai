'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function PoliciesPage() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [targetPlatform, setTargetPlatform] = useState('Telegram');
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [revenueThreshold, setRevenueThreshold] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'enforcement_policies'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPolicies(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching policies:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await addDoc(collection(db, 'enforcement_policies'), {
        orgId: userProfile?.orgId || 'default-org',
        createdBy: userProfile?.email || 'admin',
        targetPlatform,
        confidenceThreshold: Number(confidenceThreshold),
        revenueThreshold: Number(revenueThreshold),
        action: 'AUTO_DMCA_DISPATCH',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
      
      addToast('Enterprise Auto-Enforcement Policy activated', 'success');
      // Reset defaults
      setTargetPlatform('Telegram');
      setConfidenceThreshold(90);
      setRevenueThreshold(0);
    } catch (error) {
      console.error(error);
      addToast('Failed to create policy', 'error');
    }
    setSubmitting(false);
  };

  const handleDeletePolicy = async (id) => {
    try {
      await deleteDoc(doc(db, 'enforcement_policies', id));
      addToast('Policy revoked securely', 'info');
    } catch (error) {
      console.error(error);
      addToast('Failed to revoke policy', 'error');
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Autonomous Enforcement Policies
        </h1>
        <p className="text-slate-400">
          Configure zero-touch rules to let Guardian AI instantly secure threats the millisecond they meet your minimum risk criteria.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        
        {/* Create Policy Form */}
        <div className="card h-fit">
          <div className="card-header border-b border-white/5 pb-4 mb-4">
            <h3 className="card-title text-blue-400">⚡ New Auto-DMCA Policy</h3>
          </div>
          <form onSubmit={handleCreatePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-slate-400">Target Platform Engine</label>
              <select 
                className="form-input bg-slate-900 border-slate-700" 
                value={targetPlatform}
                onChange={e => setTargetPlatform(e.target.value)}
              >
                <option value="Any">Global (Any Platform)</option>
                <option value="Telegram">Telegram Nodes</option>
                <option value="Discord">Discord Networks</option>
                <option value="YouTube">YouTube Streams</option>
                <option value="Tor">Tor Relays</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-slate-400">Minimum Confidence %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="range" 
                  min="50" max="99" 
                  className="flex-grow accent-blue-500"
                  value={confidenceThreshold}
                  onChange={e => setConfidenceThreshold(e.target.value)}
                />
                <span className="font-mono text-blue-400 font-bold bg-blue-900/30 px-3 py-1 rounded">
                  {confidenceThreshold}%
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-wider text-slate-400">Minimum Revenue Risk ($)</label>
              <input 
                type="number" 
                min="0"
                className="form-input bg-slate-900 border-slate-700 font-mono" 
                value={revenueThreshold}
                onChange={e => setRevenueThreshold(e.target.value)}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary w-full justify-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? 'Authenticating...' : 'Deploy Autonomous Rule'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Policies Grid */}
        <div className="grid gap-4 auto-rows-max">
          <h3 className="text-xl font-bold mb-2">Active Rulesets</h3>
          {loading ? (
             <div className="text-slate-500 animate-pulse">Synchronizing organizational keys...</div>
          ) : policies.length === 0 ? (
            <div className="card text-center p-8 border-dashed border-2 border-slate-800 bg-transparent">
              <div className="text-3xl mb-4 opacity-50">🛡️</div>
              <h4 className="text-slate-300 font-bold">No Enforcement Policies</h4>
              <p className="text-slate-500 text-sm mt-2">Detections require manual human review to trigger DMCA dispatch.</p>
            </div>
          ) : (
            policies.map(policy => (
              <div key={policy.id} className="card relative overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-colors">
                {/* Active Indicator Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                
                <div className="flex justify-between items-start ml-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>{policy.status}</span>
                      <span className="text-xs text-slate-500 font-mono">ID: {policy.id.substring(0,8)}</span>
                    </div>
                    
                    <h4 className="text-md font-bold text-slate-200">
                      Auto-Dispatch DMCA to <span className="text-blue-400">{policy.targetPlatform}</span>
                    </h4>
                    
                    <div className="text-sm mt-3 flex gap-6 text-slate-400">
                      <div>
                        Condition: <span className="text-red-400 font-mono font-bold">{'>='}{policy.confidenceThreshold}%</span> Match
                      </div>
                      <div>
                        Value: <span className="text-purple-400 font-mono font-bold">${policy.revenueThreshold.toLocaleString()}</span> Risk
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeletePolicy(policy.id)}
                    className="btn btn-sm btn-ghost text-red-500 hover:bg-red-500/10 hover:border-red-500/30"
                  >
                    Revoke Target
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
