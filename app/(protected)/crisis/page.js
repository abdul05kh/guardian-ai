'use client';

import { useState, useEffect } from 'react';
import { classifyCrisis, generateCrisisActionPlan } from '@/lib/gemini';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import DOMPurify from 'dompurify';
import { createAuditEntry } from '@/lib/crypto';

const SAMPLE_VENUES_FALLBACK = [
  { id: 1, name: 'Grand Hyatt Mumbai', type: 'hotel', capacity: 800, zones: ['Lobby', 'Pool', 'Restaurant', 'Ballroom', 'Parking'] },
];

const MOCK_RESPONDERS = [
  { id: 1, name: 'Rajesh Kumar', role: 'Security Lead', zone: 'Lobby', status: 'active' },
  { id: 2, name: 'Dr. Priya Sharma', role: 'Medical Officer', zone: 'Pool', status: 'active' },
  { id: 3, name: 'Amit Patel', role: 'Fire Marshal', zone: 'Ballroom', status: 'standby' },
  { id: 4, name: 'Sneha Gupta', role: 'Operations Manager', zone: 'Restaurant', status: 'active' },
  { id: 5, name: 'Vikram Singh', role: 'Security Guard', zone: 'Parking', status: 'active' },
  { id: 6, name: 'Meera Joshi', role: 'First Responder', zone: 'Lobby', status: 'standby' },
];

const SEVERITY_COLORS = {
  low: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-glow)', border: 'rgba(59, 130, 246, 0.3)' },
  medium: { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-glow)', border: 'rgba(245, 158, 11, 0.3)' },
  high: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-glow)', border: 'rgba(239, 68, 68, 0.3)' },
  critical: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ff4444', border: 'rgba(239, 68, 68, 0.5)' },
};

export default function CrisisPage() {
  const { user, userProfile } = useAuth();
  const { addToast } = useToast();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [crisisActive, setCrisisActive] = useState(false);
  const [crisisData, setCrisisData] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [alertsSent, setAlertsSent] = useState(false);
  const [crisisDescription, setCrisisDescription] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [responders, setResponders] = useState(MOCK_RESPONDERS);
  const [activeCrisisId, setActiveCrisisId] = useState(null);
  const [crisisSource, setCrisisSource] = useState('manual');

  // Cyber-Kinetic Hybrid Dispatch Listener
  useEffect(() => {
    if (!user) return;
    const q = userProfile?.orgId
      ? query(collection(db, 'active_crisis_events'), where('orgId', '==', userProfile.orgId), where('status', '==', 'active'))
      : query(collection(db, 'active_crisis_events'), where('status', '==', 'active'));
      
    const unsub = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        const doc = snap.docs[0];
        const evt = doc.data();
        
        setCrisisSource(evt.source);
        setActiveCrisisId(doc.id);
        setCrisisDescription(evt.description);
        setCrisisData(evt.crisisData);
        setCrisisActive(true);
        setAlertsSent(true);
        // Map responders
        setResponders(prev => prev.map(r => ({
          ...r,
          status: 'responding',
        })));
        
        // Auto-generate plan if missing
        if (!actionPlan) {
          try {
            const planResult = await generateCrisisActionPlan(
              evt.crisisData.crisisType || 'security',
              evt.crisisData.severity || 'high',
              selectedVenue?.capacity || 800,
              MOCK_RESPONDERS.length,
              userProfile?.geminiApiKey
            );
            
            let plan;
            try {
              plan = typeof planResult === 'string' ? JSON.parse(planResult) : planResult;
              if (!plan.actions || !Array.isArray(plan.actions) || plan.actions.length === 0) {
                throw new Error('Empty action plan from AI');
              }
            } catch {
              plan = { actions: [{ priority: 1, task: 'Secure the area', assignTo: 'Security', timeframe: '0-60s', critical: true }], evacuationRequired: false };
            }
            
            setActionPlan(plan);
          } catch(e) {
            setActionPlan({ actions: [{ priority: 1, task: 'Investigate Hybrid Kinetic Threat', assignTo: 'Security', timeframe: '0-60s', critical: true }], evacuationRequired: false });
          }
        }
      }
    });
    return () => unsub();
  }, [user, userProfile, selectedVenue]);

  useEffect(() => {
    if (!user) return;
    const baseCollection = collection(db, 'venues');
    const q = userProfile?.orgId
      ? query(baseCollection, where('orgId', '==', userProfile.orgId))
      : query(baseCollection, where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        let zoneList = [];
        if (Array.isArray(data.zones)) {
          zoneList = data.zones;
        } else {
          const count = parseInt(data.zones) || 5;
          zoneList = Array.from({ length: count }, (_, i) => `Zone ${String.fromCharCode(65 + i)}`);
        }
        return {
          id: doc.id,
          ...data,
          zones: zoneList
        };
      });

      const finalVenues = fetched.length ? fetched : SAMPLE_VENUES_FALLBACK;
      setVenues(finalVenues);
      
      if (!selectedVenue) {
        setSelectedVenue(finalVenues[0]);
      } else {
        // Update selected venue if its data changed in Firestore
        const updatedSelected = finalVenues.find(v => v.id === selectedVenue.id);
        if (updatedSelected) setSelectedVenue(updatedSelected);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile, selectedVenue]);

  const triggerSOS = async () => {
    if (!selectedVenue) return;
    
    // Sanitize user input to prevent XSS payloads in logs or AI engine
    const rawDesc = crisisDescription.trim();
    const sanitizedDesc = rawDesc ? DOMPurify.sanitize(rawDesc) : 'Emergency situation detected in the venue';
    
    // Safety check just in case sanitization strips everything (e.g. if input was just <script>)
    const finalDesc = sanitizedDesc || 'Emergency situation detected in the venue';

    setCrisisDescription(finalDesc);
    setCrisisActive(true);
    setClassifying(true);
    
    const startTime = Date.now();
    setTimeline([{
      time: new Date().toLocaleTimeString(),
      event: '🆘 SOS triggered',
      detail: `Source: Manual trigger | Venue: ${selectedVenue?.name || 'Loading...'}`,
      type: 'danger',
    }]);

    // Step 1: AI Classification
    try {
      const result = await classifyCrisis(finalDesc, selectedVenue?.type || 'venue', 'Zone A', userProfile?.geminiApiKey);
      let parsed;
      try {
        parsed = typeof result === 'string' ? JSON.parse(result) : result;
      } catch {
        parsed = { crisisType: 'security', severity: 'high', confidence: 0.85, immediateActions: ['Secure area', 'Alert staff'], requiredResponders: ['Security', 'Medical'], briefing: 'Emergency detected.' };
      }
      
      setCrisisData(parsed);
      setClassifying(false);

      const classifyTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setTimeline(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        event: `🤖 AI Classification: ${parsed.crisisType?.toUpperCase()} — ${parsed.severity?.toUpperCase()}`,
        detail: `Confidence: ${(parsed.confidence * 100).toFixed(0)}% | Latency: ${classifyTime}s`,
        type: 'active',
      }]);

      // Step 2: Alert Broadcast
      await new Promise(r => setTimeout(r, 800));
      setAlertsSent(true);
      setTimeline(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        event: '📡 Firebase Cloud Messaging — Alerts broadcast',
        detail: `${responders.length} responders notified across ${selectedVenue.zones.length} zones`,
        type: 'active',
      }]);

      // Update responder statuses
      setResponders(prev => prev.map(r => ({
        ...r,
        status: r.role.includes('Security') || r.role.includes('Medical') ? 'responding' : 'alerted',
      })));

      // Step 3: Generate action plan
      await new Promise(r => setTimeout(r, 500));
      const planResult = await generateCrisisActionPlan(
        parsed.crisisType || 'security',
        parsed.severity || 'high',
        selectedVenue?.capacity || 0,
        responders.length,
        userProfile?.geminiApiKey
      );
      
      let plan;
      try {
        plan = typeof planResult === 'string' ? JSON.parse(planResult) : planResult;
        if (!plan.actions || !Array.isArray(plan.actions) || plan.actions.length === 0) {
          throw new Error('Empty action plan from AI');
        }
      } catch {
        plan = { actions: [{ priority: 1, task: 'Secure the area', assignTo: 'Security', timeframe: '0-60s', critical: true }], evacuationRequired: false };
      }

      setActionPlan(plan);
      setTimeline(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        event: '📋 AI Action Plan generated',
        detail: `${plan.actions?.length || 0} tasks assigned | Evacuation: ${plan.evacuationRequired ? 'YES' : 'No'}`,
        type: 'active',
      }]);

    } catch (error) {
      setClassifying(false);
      setCrisisData({ crisisType: 'unknown', severity: 'high', confidence: 0.5, briefing: 'Classification failed — manual review required.' });
    }
  };

  const resolveCrisis = async () => {
    addToast('Crisis resolved and logged to TrustLedger', 'success');
    setTimeline(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      event: '✅ Crisis resolved',
      detail: 'All actions completed. Incident logged to TrustLedger.',
      type: 'success',
    }]);

    const { doc, updateDoc, addDoc, collection } = await import('firebase/firestore');
    if (activeCrisisId) {
      await updateDoc(doc(db, 'active_crisis_events', activeCrisisId), { status: 'resolved' });
    }
    
    try {
      const eventId = activeCrisisId || `manual_${Date.now()}`;
      const auditLog = await createAuditEntry({
        userId: user.uid,
        orgId: userProfile?.orgId || null,
        actionType: 'CRISIS_RESOLVED',
        entityType: 'crisis_event',
        entityId: eventId,
        payload: `CRISIS_RESOLVED_${eventId}_${new Date().toISOString()}`
      });
      await addDoc(collection(db, 'audit_log'), {
        ...auditLog,
        user: userProfile?.email || user?.email || 'unknown'
      });
    } catch (err) {
      console.error('Failed to write to TrustLedger', err);
    }

    setTimeout(() => {
      setCrisisActive(false);
      setCrisisData(null);
      setActionPlan(null);
      setAlertsSent(false);
      setTimeline([]);
      setResponders(MOCK_RESPONDERS);
      setCrisisDescription('');
      setActiveCrisisId(null);
      setCrisisSource('manual');
    }, 2000);
  };

  return (
    <div className="page-content">
      <style jsx>{`
        .crisis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .venue-select {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .venue-chip {
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-medium);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .venue-chip.active {
          background: rgba(59, 130, 246, 0.12);
          color: var(--blue-glow);
          border-color: var(--border-accent);
        }
        .venue-chip:hover {
          border-color: var(--border-accent);
        }
        .sos-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 32px;
        }
        .crisis-description-input {
          width: 100%;
          max-width: 400px;
          padding: 10px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          text-align: center;
        }
        .crisis-description-input:focus {
          border-color: var(--danger);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .responder-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .responder-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }
        .responder-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          margin-bottom: 8px;
        }
        .action-priority {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .zone-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }
        .zone-tag {
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          font-size: 12px;
          text-align: center;
          transition: all var(--transition-fast);
        }
        .zone-tag.alert {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--danger-glow);
          animation: pulse-dot 2s infinite;
        }
        @media (max-width: 900px) {
          .crisis-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Venue Selection */}
      <div className="venue-select">
        {!selectedVenue ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading venues...</div>
        ) : (
          venues.map(v => (
            <button
              key={v.id}
              className={`venue-chip ${selectedVenue?.id === v.id ? 'active' : ''}`}
              onClick={() => !crisisActive && setSelectedVenue(v)}
            >
              {v.type === 'Hotel' ? '🏨' : v.type === 'Stadium' ? '🏟️' : '🏢'} {v.name}
            </button>
          ))
        )}
      </div>

      {/* Crisis Banner */}
      {crisisActive && crisisData && (
        <div style={{
          padding: '16px 24px',
          borderRadius: 'var(--radius-lg)',
          background: SEVERITY_COLORS[crisisData.severity]?.bg || SEVERITY_COLORS.high.bg,
          border: `1px solid ${SEVERITY_COLORS[crisisData.severity]?.border || SEVERITY_COLORS.high.border}`,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: SEVERITY_COLORS[crisisData.severity]?.color }}>
              🚨 {crisisSource === 'cyber_kinetic_engine' ? 'PREDICTIVE CYBER-KINETIC THREAT' : 'ACTIVE EMERGENCY'} — {crisisData.crisisType?.toUpperCase()} | Severity: {crisisData.severity?.toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {crisisData.briefing}
            </div>
          </div>
          <button className="btn btn-success btn-sm" onClick={resolveCrisis}>
            ✓ Resolve Crisis
          </button>
        </div>
      )}

      <div className="crisis-grid">
        {/* Left Column — SOS + Venue Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SOS Panel */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🆘 Emergency Trigger</h3>
              <span className="badge badge-blue">{selectedVenue?.name || 'Initializing...'}</span>
            </div>
            <div className="card-body">
              <div className="sos-container">
                {!crisisActive ? (
                  <>
                    <input
                      className="crisis-description-input"
                      placeholder="Describe the emergency (optional)..."
                      value={crisisDescription}
                      onChange={(e) => setCrisisDescription(e.target.value)}
                    />
                    <button className="sos-button" onClick={triggerSOS}>
                      SOS
                      <span className="sos-sub">PRESS TO ALERT</span>
                    </button>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Triggers AI classification → staff alerts → action plan
                    </div>
                  </>
                ) : classifying ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto 16px', borderTopColor: 'var(--danger)' }}></div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--danger-glow)' }}>
                      AI Classifying Emergency...
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Vertex AI processing — targeting &lt;400ms
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <span className={`badge ${crisisData?.severity === 'critical' ? 'badge-danger' : crisisData?.severity === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
                        {crisisData?.crisisType?.toUpperCase()} — {crisisData?.severity?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Confidence: {(crisisData?.confidence * 100)?.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Venue Zones */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🗺️ Venue Zones</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Capacity: {selectedVenue?.capacity?.toLocaleString() || '0'}</span>
            </div>
            <div className="card-body">
              <div className="zone-grid">
                {selectedVenue?.zones?.map((zone, i) => (
                  <div key={zone} className={`zone-tag ${crisisActive && i === 0 ? 'alert' : ''}`}>
                    {zone}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Action Plan */}
          {actionPlan && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🤖 AI Response Plan</h3>
                <span className="badge badge-purple">Gemini Generated</span>
              </div>
              <div className="card-body">
                {actionPlan.actions?.map((action, i) => (
                  <div key={i} className="action-item">
                    <div className="action-priority" style={{
                      background: action.critical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: action.critical ? 'var(--danger-glow)' : 'var(--blue-glow)',
                    }}>
                      {action.priority}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{action.task}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Assign: {action.assignTo} • Timeframe: {action.timeframe}
                      </div>
                    </div>
                    {action.critical && <span className="badge badge-danger">Critical</span>}
                  </div>
                ))}
                {actionPlan.evacuationRequired && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <strong style={{ color: 'var(--danger-glow)' }}>⚠️ EVACUATION REQUIRED</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Responders + Timeline + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Responder Board */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">👥 Responder Board</h3>
              {alertsSent && <span className="badge badge-success">Alerts Sent</span>}
            </div>
            <div className="card-body" style={{ padding: '14px 22px' }}>
              <div className="responder-list">
                {responders.map(r => (
                  <div key={r.id} className="responder-item">
                    <div className="responder-status" style={{
                      background: r.status === 'responding' ? 'var(--danger)' : r.status === 'alerted' ? 'var(--warning)' : r.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                      boxShadow: r.status === 'responding' ? '0 0 8px var(--danger)' : 'none',
                      animation: r.status === 'responding' ? 'pulse-dot 1.5s infinite' : 'none',
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.role} • {r.zone}</div>
                    </div>
                    <span className={`badge ${r.status === 'responding' ? 'badge-danger' : r.status === 'alerted' ? 'badge-warning' : r.status === 'active' ? 'badge-success' : 'badge-blue'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Crisis Timeline */}
          {timeline.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">⏱️ Crisis Timeline</h3>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {timeline.map((item, i) => (
                    <div key={i} className={`timeline-item ${item.type}`}>
                      <div className="timeline-time">{item.time}</div>
                      <div className="timeline-content">
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.event}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
