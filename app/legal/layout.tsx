/**
 * NEW FILE: Legal Pages Layout
 * Purpose: Clean, readable layout for all legal documents
 * Design: Supreme Court-style professional presentation
 */

import Link from 'next/link';

// CSS styles for navigation hover effects
const navLinkStyles = `
  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #4B5563;
    text-decoration: none;
    padding: 12px 16px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: #FF6B35;
    border-bottom-color: #FF6B35;
  }
`;

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <style dangerouslySetInnerHTML={{ __html: navLinkStyles }} />
      {/* Header with Navigation */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FF6B35',
            textDecoration: 'none',
          }}>
            GharSe
          </Link>
          
          <Link href="/" style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#6B7280',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            transition: 'all 0.2s',
          }}>
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Legal Documents Navigation */}
      <nav style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        overflowX: 'auto',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          gap: '4px',
        }}>
          <NavLink href="/legal/privacy-policy">Privacy Policy</NavLink>
          <NavLink href="/legal/terms-of-service">Terms of Service</NavLink>
          <NavLink href="/legal/refund-policy">Refund Policy</NavLink>
          <NavLink href="/legal/referral-terms">Referral Terms</NavLink>
          <NavLink href="/legal/food-safety">Food Safety</NavLink>
          <NavLink href="/legal/ip-protection">IP Protection</NavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '48px 24px',
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        marginTop: '80px',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '13px',
            color: '#6B7280',
            marginBottom: '16px',
            lineHeight: '1.6',
          }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Food Business Operated By:</strong> Independent Home Chef<br />
              For food orders, complaints, refunds: <a href="mailto:orders@gharse.app" style={{ color: '#FF6B35', textDecoration: 'none' }}>orders@gharse.app</a>
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>Technology Provider:</strong> TechBantu IT Solutions LLC (California, USA)<br />
              For technical support, platform issues: <a href="mailto:support@gharse.app" style={{ color: '#FF6B35', textDecoration: 'none' }}>support@gharse.app</a>
            </p>
            <p>
              For legal inquiries: <a href="mailto:legal@gharse.app" style={{ color: '#FF6B35', textDecoration: 'none' }}>legal@gharse.app</a>
            </p>
          </div>
          <p style={{
            fontSize: '11px',
            color: '#9CA3AF',
            marginTop: '16px',
          }}>
            © 2025 GharSe. Food business operated by Independent Home Chef. Technology powered by TechBantu IT Solutions LLC.<br />
            All rights reserved. TechBantu IT Solutions LLC bears ZERO liability for food operations.<br />
            Last updated: January 2025 | Version 2.0 (Comprehensive Legal Rewrite)
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-link">
      {children}
    </Link>
  );
}

