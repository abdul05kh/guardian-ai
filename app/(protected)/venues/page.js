'use client';
export default function VenuesPage() {
  const venues = [
    { name: 'Grand Hyatt Mumbai', type: 'Hotel', capacity: 800, zones: 5, status: 'active' },
    { name: 'Wankhede Stadium', type: 'Stadium', capacity: 33000, zones: 5, status: 'active' },
    { name: 'BKC Convention Center', type: 'Convention', capacity: 2000, zones: 5, status: 'active' },
  ];
  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>Registered Venues</h2>
        <button className="btn btn-primary">➕ Add Venue</button>
      </div>
      <div className="content-grid cols-3">
        {venues.map(v => (
          <div key={v.name} className="card" style={{ cursor: 'pointer' }}>
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
      </div>
    </div>
  );
}
