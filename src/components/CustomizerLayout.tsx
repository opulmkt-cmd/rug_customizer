import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CustomizerLayout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine current page
  const getCurrentPage = () => {
    if (currentPath.includes('/customize/design')) return 'design';
    if (currentPath.includes('/customize/preview')) return 'preview';
    if (currentPath.includes('/customize/details')) return 'details';
    if (currentPath.includes('/customize/checkout')) return 'checkout';
    return 'design';
  };

  const currentPage = getCurrentPage();

  // Page sequence for navigation
  const pages = [
    { id: 'design', label: 'Design', path: '/customize/design' },
    { id: 'preview', label: 'Preview', path: '/customize/preview' },
    { id: 'details', label: 'Details', path: '/customize/details' },
    { id: 'checkout', label: 'Checkout', path: '/customize/checkout' },
  ];

  const currentIndex = pages.findIndex(p => p.id === currentPage);
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Customizer Header/Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #ddd' }}>
            {pages.map((page) => (
              <Link
                key={page.id}
                to={page.path}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: currentPage === page.id ? '2px solid #EFBB76' : 'none',
                  cursor: 'pointer',
                  fontWeight: currentPage === page.id ? 600 : 500,
                  fontSize: '14px',
                  color: currentPage === page.id ? '#333' : '#999',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                }}
              >
                {page.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Buttons */}
      <div style={{ background: 'white', borderTop: '1px solid #e5e5e5', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          {prevPage ? (
            <Link
              to={prevPage.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.background = 'white';
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
              Back
            </Link>
          ) : (
            <div />
          )}

          {nextPage ? (
            <Link
              to={nextPage.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#EFBB76',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.background = '#DBA762';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.background = '#EFBB76';
              }}
            >
              Next
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </Link>
          ) : (
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as any).style.background = '#333';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as any).style.background = '#000';
              }}
            >
              Complete Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
