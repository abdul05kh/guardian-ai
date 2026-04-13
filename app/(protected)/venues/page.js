'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function VenuesPage() {
  const { userProfile } = useAuth();
  const { addToast } = useToast();
  const [venues, setVenues] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', type: 'Hotel', capacity: '', zones: '' });

  useEffect(() => {
    const q = query(collection(db, 'venues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddVenue = async () => {
    if (!newVenue.name) return;
    try {
      await addDoc(collection(db, 'venues'), {
        ...newVenue,
        capacity: parseInt(newVenue.capacity) || 0,
        zones: parseInt(newVenue.zones) || 1,
        status: 'active',
        orgId: userProfile?.orgId || null,
      });
      addToast(`Venue ${newVenue.name} added successfully`, 'success');
      setShowAdd(false);
      setNewVenue({ name: '', type: 'Hotel', capacity: '', zones: '' });
    } catch (e) {
      addToast('Failed to add venue', 'error');
      console.error(e);
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>Registered Venues</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Add Venue</button>
      </div>

      <div className="content-grid cols-3">
        {venues.map(v => (
          <div key={v.id} className="card" style={{ cursor: 'pointer' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>{v.type === 'Hotel' ? '🏨' : v.type === 'Stadium' ? '🏟️' : '🏢'}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{v.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{v.type}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{v.capacity.toLocaleString()}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Capacity</div></div>
                <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>{v.zones}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zones</div></div>
              </div>
              <div style={{ marginTop: '16px' }}><span className="badge badge-success">{v.status}</span></div>
            </div>
          </div>
        ))}
        {venues.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No venues registered yet. Click "Add Venue" to get started.
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Add New Venue</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Venue Name</label>
                <input className="input" placeholder="e.g. Grand Hyatt Mumbai" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input" value={newVenue.type} onChange={e => setNewVenue({...newVenue, type: e.target.value})}>
                  <option>Hotel</option>
                  <option>Stadium</option>
                  <option>Convention</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Capacity</label>
                  <input className="input" type="number" placeholder="800" value={newVenue.capacity} onChange={e => setNewVenue({...newVenue, capacity: e.target.value})} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Number of Zones</label>
                  <input className="input" type="number" placeholder="5" value={newVenue.zones} onChange={e => setNewVenue({...newVenue, zones: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddVenue}>Save Venue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
