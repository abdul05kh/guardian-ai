'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { section: 'COMMAND CENTER' },
  { href: '/dashboard', icon: '📊', label: 'IntelDashboard', badge: null },
  { section: 'PROTECTION' },
  { href: '/assets', icon: '🛡️', label: 'AssetSentinel', badge: null },
  { href: '/detections', icon: '🔍', label: 'Detections', badge: { count: '3', type: 'danger' } },
  { href: '/dmca', icon: '⚖️', label: 'DMCA Notices', badge: null },
  { section: 'CRISIS' },
  { href: '/crisis', icon: '🚨', label: 'CrisisCommand', badge: null },
  { href: '/venues', icon: '🏢', label: 'Venues', badge: null },
  { section: 'COMPLIANCE' },
  { href: '/audit', icon: '📋', label: 'TrustLedger', badge: { count: '✓', type: 'success' } },
  { section: 'SETTINGS' },
  { href: '/settings', icon: '⚙️', label: 'Settings', badge: null },
];

export default function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🛡</div>
        <div>
          <div className="logo-text">GUARDIAN AI</div>
        </div>
        <span className="logo-badge">v1.0</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => onToggle && window.innerWidth < 768 && onToggle()}
            >
              <span className="link-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className={`link-badge ${item.badge.type}`}>
                  {item.badge.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.displayName?.[0] || user.email?.[0] || '?'}
          </div>
          <div className="user-info">
            <div className="user-name">{user.displayName || 'User'}</div>
            <div className="user-role">{userProfile?.role || 'Admin'}</div>
          </div>
          <button
            className="btn-icon btn-ghost"
            onClick={logout}
            title="Sign out"
            style={{ fontSize: '14px', width: '32px', height: '32px', flexShrink: 0 }}
          >
            ↗
          </button>
        </div>
      )}
    </aside>
  );
}
