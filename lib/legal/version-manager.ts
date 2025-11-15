/**
 * NEW FILE: Legal Document Version Manager
 * Purpose: Centralized version management for all legal documents
 * Usage: Import getCurrentVersions() to get active document versions
 */

export interface LegalDocument {
  type: 'privacy' | 'terms' | 'refund' | 'referral' | 'food_safety' | 'ip_protection';
  version: string;
  title: string;
  url: string;
  effectiveFrom: Date;
  changelog?: string;
}

/**
 * Current active versions of all legal documents
 * Update these when publishing new versions
 */
export const CURRENT_LEGAL_VERSIONS: Record<string, LegalDocument> = {
  privacy: {
    type: 'privacy',
    version: '1.0',
    title: 'Privacy Policy',
    url: '/legal/privacy-policy',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial privacy policy - DPDPA 2023, GDPR, and CCPA compliant',
  },
  terms: {
    type: 'terms',
    version: '1.0',
    title: 'Terms of Service',
    url: '/legal/terms-of-service',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial terms of service governing platform usage',
  },
  refund: {
    type: 'refund',
    version: '1.0',
    title: 'Refund & Returns Policy',
    url: '/legal/refund-policy',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial refund policy with comprehensive anti-fraud measures',
  },
  referral: {
    type: 'referral',
    version: '1.0',
    title: 'Referral Program Terms',
    url: '/legal/referral-terms',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial referral terms with KYC verification and fraud detection',
  },
  food_safety: {
    type: 'food_safety',
    version: '1.0',
    title: 'Food Safety & Liability',
    url: '/legal/food-safety',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial food safety disclaimer - FSSAI compliant with allergen warnings',
  },
  ip_protection: {
    type: 'ip_protection',
    version: '1.0',
    title: 'Intellectual Property Protection',
    url: '/legal/ip-protection',
    effectiveFrom: new Date('2025-01-13'),
    changelog: 'Initial IP protection notice covering copyright, trademarks, and patents',
  },
};

/**
 * Get all current active legal document versions
 */
export function getCurrentVersions(): LegalDocument[] {
  return Object.values(CURRENT_LEGAL_VERSIONS);
}

/**
 * Get specific document version
 */
export function getDocumentVersion(type: string): LegalDocument | undefined {
  return CURRENT_LEGAL_VERSIONS[type];
}

/**
 * Check if a specific version is current
 */
export function isCurrentVersion(type: string, version: string): boolean {
  const current = CURRENT_LEGAL_VERSIONS[type];
  return current ? current.version === version : false;
}

/**
 * Format effective date for display
 */
export function formatEffectiveDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculate if user needs to re-accept (when versions change)
 */
export function needsReacceptance(
  acceptedDocuments: Array<{ type: string; version: string }>
): { needed: boolean; missing: LegalDocument[] } {
  const acceptedMap = new Map(
    acceptedDocuments.map(doc => [doc.type, doc.version])
  );

  const missing: LegalDocument[] = [];

  for (const [type, doc] of Object.entries(CURRENT_LEGAL_VERSIONS)) {
    const acceptedVersion = acceptedMap.get(type);
    if (!acceptedVersion || acceptedVersion !== doc.version) {
      missing.push(doc);
    }
  }

  return {
    needed: missing.length > 0,
    missing,
  };
}

/**
 * Get penalty amount for a specific violation type
 * Used for displaying in legal documents
 */
export const PENALTY_AMOUNTS = {
  // Refund fraud
  false_refund_claim: { inr: 50000, usd: 625 },
  medical_certificate_fraud: { inr: 100000, usd: 1250 },
  
  // Referral fraud
  self_referral: { inr: 50000, usd: 625 },
  fake_account_farming: { inr: 100000, usd: 1250 },
  coordinated_fraud_ring: { inr: 200000, usd: 2500 },
  
  // IP violations
  recipe_theft: { inr: 5000000, usd: 62500 },
  algorithm_theft: { inr: 5000000, usd: 62500 },
  trademark_infringement: { inr: 1000000, usd: 12500 },
  web_scraping: { inr: 2500000, usd: 31250 },
  
  // General violations
  false_age_declaration: { inr: 200000, usd: 2500 },
  unauthorized_account_sharing: { inr: 25000, usd: 312 },
};

/**
 * Format penalty amount for display
 */
export function formatPenalty(
  violationType: keyof typeof PENALTY_AMOUNTS,
  currency: 'INR' | 'USD' = 'INR'
): string {
  const amount = PENALTY_AMOUNTS[violationType];
  if (!amount) return 'Variable';

  const value = currency === 'INR' ? amount.inr : amount.usd;
  const symbol = currency === 'INR' ? '₹' : '$';

  // Format with commas (Indian or international system)
  if (currency === 'INR') {
    return `${symbol}${value.toLocaleString('en-IN')}`;
  } else {
    return `${symbol}${value.toLocaleString('en-US')}`;
  }
}

