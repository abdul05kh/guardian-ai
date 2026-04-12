'use client';
export default function DMCAPage() {
  return (
    <div className="page-content">
      <div className="card">
        <div className="card-header"><h3 className="card-title">⚖️ DMCA Notice Management</h3></div>
        <div className="card-body">
          <div className="empty-state">
            <div className="empty-icon">📬</div>
            <div className="empty-title">DMCA notices appear here</div>
            <div className="empty-desc">Generate DMCA notices from the Detections page by clicking the DMCA button on any confirmed infringement.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
