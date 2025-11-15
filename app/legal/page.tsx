/**
 * NEW FILE: Legal Documents Index Page
 * Purpose: Central hub for all legal documents with easy navigation
 */

'use client';

import Link from 'next/link';
import { Shield, FileText, RotateCcw, Users, Utensils, Copyright } from 'lucide-react';

// CSS styles for hover effects
const hoverStyles = `
  .back-button {
    display: inline-block;
    margin-top: 32px;
    padding: 12px 24px;
    background-color: #FFFFFF;
    color: #FF6B35;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    transition: transform 0.2s;
  }

  .back-button:hover {
    transform: scale(1.05);
  }

  .doc-card {
    display: block;
    background-color: #FFFFFF;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    text-decoration: none;
    transition: all 0.3s;
    border: 2px solid transparent;
  }

  .doc-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    border-color: #FF6B35;
  }
`;

interface LegalDoc {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
}

const legalDocuments: LegalDoc[] = [
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal data under DPDPA 2023, GDPR, and CCPA',
    url: '/legal/privacy-policy',
    icon: <Shield size={32} />,
    badge: 'DPDPA 2023',
  },
  {
    title: 'Terms of Service',
    description: 'Legal agreement governing your use of Bantu\'s Kitchen platform and services',
    url: '/legal/terms-of-service',
    icon: <FileText size={32} />,
    badge: 'Required',
  },
  {
    title: 'Refund & Returns Policy',
    description: 'Guidelines for refunds, returns, and our anti-fraud protection measures',
    url: '/legal/refund-policy',
    icon: <RotateCcw size={32} />,
    badge: 'Important',
  },
  {
    title: 'Referral Program Terms',
    description: 'Rules and rewards for our referral program with fraud prevention policies',
    url: '/legal/referral-terms',
    icon: <Users size={32} />,
    badge: 'Earn Rewards',
  },
  {
    title: 'Food Safety & Liability',
    description: 'FSSAI compliance, allergen warnings, and food safety protocols',
    url: '/legal/food-safety',
    icon: <Utensils size={32} />,
    badge: 'FSSAI',
  },
  {
    title: 'Intellectual Property Protection',
    description: 'Copyright, trademark, and patent protections for our recipes and technology',
    url: '/legal/ip-protection',
    icon: <Copyright size={32} />,
    badge: 'Protected',
  },
];

export default function LegalIndexPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <style dangerouslySetInnerHTML={{ __html: hoverStyles }} />
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #F77F00 100%)',
        padding: '80px 24px',
        color: '#FFFFFF',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            marginBottom: '24px',
          }}>
            <Shield size={40} color="#FFFFFF" />
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 800,
            marginBottom: '16px',
            lineHeight: 1.2,
          }}>
            Legal Documents
          </h1>
          <p style={{
            fontSize: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            opacity: 0.95,
            lineHeight: 1.6,
          }}>
            Complete transparency on how we protect your rights, data, and ensure a safe, secure platform
          </p>
          <Link href="/" className="back-button">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Documents Grid */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
        }}>
          {legalDocuments.map((doc, index) => (
            <Link
              key={index}
              href={doc.url}
              className="doc-card"
            >
              {/* Icon and Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F77F00 100%)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                }}>
                  {doc.icon}
                </div>
                {doc.badge && (
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#FFF5F0',
                    color: '#FF6B35',
                    borderRadius: '16px',
                    border: '1px solid #FFE6D9',
                  }}>
                    {doc.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '12px',
              }}>
                {doc.title}
              </h2>

              {/* Description */}
              <p style={{
                fontSize: '16px',
                lineHeight: '24px',
                color: '#6B7280',
                marginBottom: '24px',
              }}>
                {doc.description}
              </p>

              {/* Read More Link */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#FF6B35',
                fontWeight: 600,
                fontSize: '16px',
              }}>
                <span>Read Full Document</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Info */}
        <div style={{
          marginTop: '80px',
          padding: '32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          borderLeft: '4px solid #FF6B35',
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '16px',
          }}>
            Important Information
          </h3>
          <ul style={{
            fontSize: '16px',
            lineHeight: '28px',
            color: '#4B5563',
            paddingLeft: '24px',
          }}>
            <li style={{ marginBottom: '12px' }}>
              <strong>Last Updated:</strong> January 13, 2025 | All documents are at version 1.0
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Mandatory Acceptance:</strong> You must accept all legal documents before using our platform
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Age Requirement:</strong> You must be 18 years or older to use GharSe
            </li>
            <li style={{ marginBottom: '12px' }}>
              <strong>Questions?</strong> Contact our legal team at <a href="mailto:legal@bantuskitchen.com" style={{ color: '#FF6B35', textDecoration: 'none', fontWeight: 600 }}>legal@bantuskitchen.com</a>
            </li>
            <li>
              <strong>Jurisdiction:</strong> All disputes subject to courts in Hyderabad, Telangana, India
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

