'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const PAGE_TITLES = {
  '/dashboard': { title: 'IntelDashboard™', subtitle: 'Real-time intelligence command center' },
  '/assets': { title: 'AssetSentinel™', subtitle: 'Digital asset protection & monitoring' },
  '/detections': { title: 'Infringement Detections', subtitle: 'Real-time violation tracking' },
  '/dmca': { title: 'DMCA Notices', subtitle: 'Automated takedown management' },
  '/crisis': { title: 'CrisisCommand™', subtitle: 'AI-powered emergency response' },
  '/venues': { title: 'Venue Management', subtitle: 'Registered venue configurations' },
  '/audit': { title: 'TrustLedger™', subtitle: 'Cryptographic audit trail' },
  '/settings': { title: 'Settings', subtitle: 'Platform configuration' },
};

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageInfo = PAGE_TITLES[pathname] || { title: 'Guardian AI', subtitle: '' };
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-btn mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: 'none' }}
        >
          ☰
        </button>
        <div>
          <div className="header-title">{pageInfo.title}</div>
          <div className="header-subtitle">{pageInfo.subtitle}</div>
        </div>
      </div>
      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span className="status-dot active"></span>
          <span style={{ fontSize: '12px', color: 'var(--success-glow)', fontWeight: 500 }}>System Online</span>
        </div>
        <button className="header-btn" title="Search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🔍
        </button>
        <button
          className="header-btn"
          title="Notifications"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          🔔
          <span className="notification-dot"></span>
        </button>
      </div>

      {/* Mobile menu button styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
