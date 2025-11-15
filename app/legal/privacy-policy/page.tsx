/**
 * NEW FILE: Privacy Policy Page
 * Purpose: DPDPA 2023 + GDPR + CCPA Compliant Privacy Policy
 * Legal Standard: Supreme Court of India + EU + California standards
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for GharSe - Data Protection and Privacy Rights under DPDPA 2023, GDPR, and CCPA. Dual data controllers: Independent Home Chef (food business data) and TechBantu IT Solutions LLC (technology services data).',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '48px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px', borderBottom: '3px solid #FF6B35', paddingBottom: '24px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: '#111827',
          marginBottom: '16px',
        }}>
          PRIVACY POLICY
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 2.0 (Comprehensive Legal Rewrite)<br />
          Governing Laws: Digital Personal Data Protection Act, 2023 (India) | GDPR (EU) | CCPA (California, USA) | IT Act 2000 § 43A, 72A (India)
        </p>
      </div>

      {/* Introduction */}
      <Section title="1. INTRODUCTION AND DUAL DATA CONTROLLER STRUCTURE">
        <Warning>
          <Bold>CRITICAL PRIVACY NOTICE - DUAL DATA CONTROLLER FRAMEWORK</Bold><br /><br />
          
          This Privacy Policy governs data collection, processing, and storage by <Bold>TWO INDEPENDENT DATA CONTROLLERS</Bold> with <Bold>NO joint data processing, NO shared databases, NO data partnership</Bold>:
        </Warning>
        
        <Subsection title="1.1 Independent Home Chef (Food Business Data Controller)">
          <P>
            The <Bold>Independent Home Chef</Bold>, an individual sole proprietor operating the GharSe food business from Hayatnagar, Hyderabad, Telangana, India, acts as <Bold>DATA FIDUCIARY</Bold> (under DPDPA 2023) / <Bold>DATA CONTROLLER</Bold> (under GDPR/CCPA) for:
          </P>
          <List>
            <Li><Bold>Food order data:</Bold> Order details, food preferences, dietary restrictions, delivery instructions</Li>
            <Li><Bold>Culinary profile data:</Bold> Taste preferences, favorite dishes, allergen information, spice tolerance</Li>
            <Li><Bold>Food business customer relationship data:</Bold> Customer service interactions, complaints, feedback, refund requests</Li>
            <Li><Bold>Delivery logistics data:</Bold> Delivery addresses, phone numbers (for delivery coordination), delivery timing preferences</Li>
          </List>
          <P>
            <Bold>Legal Basis for Processing:</Bold> Contract performance (DPDPA § 2(1)(h), GDPR Art. 6(1)(b)) - necessary to fulfill food orders and provide customer service.
          </P>
          <P>
            <Bold>Data Location:</Bold> India (primary), with cloud storage in India-based data centers for food business operations.
          </P>
        </Subsection>
        
        <Subsection title="1.2 TechBantu IT Solutions LLC (Technology Platform Data Controller)">
          <P>
            <Bold>TechBantu IT Solutions LLC</Bold>, a California limited liability company with principal place of business in California, USA, acts as <Bold>INDEPENDENT DATA CONTROLLER</Bold> for:
          </P>
          <List>
            <Li><Bold>Technical infrastructure data:</Bold> IP addresses, browser fingerprints, device information, session logs, API calls</Li>
            <Li><Bold>Account authentication data:</Bold> Hashed passwords, login timestamps, security tokens, two-factor authentication data</Li>
            <Li><Bold>Payment processing facilitation data:</Bold> Payment gateway transaction IDs, tokenized payment methods (NOT full card details - see Section 2.2)</Li>
            <Li><Bold>Platform usage analytics:</Bold> Page views, click patterns, performance metrics, error logs, A/B test data</Li>
            <Li><Bold>Legal compliance data:</Bold> Consent records, data access requests (DPDPA/GDPR/CCPA), privacy settings</Li>
          </List>
          <P>
            <Bold>Legal Basis for Processing:</Bold> Legitimate interest (GDPR Art. 6(1)(f), CCPA business purpose) - necessary for platform security, fraud prevention, service improvement, and legal compliance.
          </P>
          <P>
            <Bold>Data Location:</Bold> United States (primary), with use of US-based cloud infrastructure (AWS/Google Cloud) complying with US data protection standards.
          </P>
        </Subsection>
        
        <Subsection title="1.3 Critical Boundary Rule - NO Joint Data Processing">
          <P>
            <Bold>STRICTLY PROHIBITED:</Bold> There is <Bold>NO joint data processing agreement, NO shared customer database, NO data partnership</Bold> between TechBantu IT Solutions LLC and the Independent Home Chef.
          </P>
          <P>
            Each entity:
          </P>
          <List>
            <Li>Operates as <Bold>independent data controller</Bold> for its respective data categories</Li>
            <Li>Maintains <Bold>separate data storage systems</Bold> (no unified customer profile across both entities)</Li>
            <Li>Bears <Bold>independent legal liability</Bold> for data breaches or privacy violations within its control</Li>
            <Li>Processes data <Bold>only for its specific business purposes</Bold> (food operations vs. technology services)</Li>
          </List>
          <P>
            <Bold>Data Sharing Limited to Operational Necessity:</Bold> TechBantu provides technology platform that routes order data to Independent Home Chef for fulfillment. This constitutes <Bold>data transmission for service provision</Bold>, NOT joint processing. TechBantu acts as <Bold>mere conduit</Bold> (IT Act § 79), similar to an email service provider transmitting messages.
          </P>
        </Subsection>
        
        <Subsection title="1.4 Statutory Compliance Framework">
          <P>
            This Policy is formulated in strict compliance with:
          </P>
          <List>
            <Li><Bold>Digital Personal Data Protection Act, 2023 (DPDPA 2023)</Bold> - Primary governing law for Indian users; Independent Home Chef and TechBantu each act as "Data Fiduciary" under § 2(1)(i)</Li>
            <Li><Bold>Information Technology Act, 2000, § 43A</Bold> - Compensation for failure to protect sensitive personal data</Li>
            <Li><Bold>Information Technology Act, 2000, § 72A</Bold> - Criminal penalty for disclosure of personal information (imprisonment up to 3 years)</Li>
            <Li><Bold>Information Technology (Reasonable Security Practices) Rules, 2011</Bold> - Mandatory security standards for data protection</Li>
            <Li><Bold>General Data Protection Regulation (GDPR)</Bold> - For users in the European Economic Area (extraterritorial application under Art. 3(2))</Li>
            <Li><Bold>California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA)</Bold> - For California residents; TechBantu complies as California-based entity</Li>
            <Li><Bold>Consumer Protection Act, 2019, § 2(47)</Bold> - Unfair trade practices definition includes privacy violations</Li>
          </List>
        </Subsection>
        
        <Subsection title="1.5 Mandatory Acceptance and Consent">
          <P>
            By accessing or using this Platform, you ("User," "Customer," "Data Principal," "you," "your") hereby <Bold>irrevocably acknowledge and consent</Bold> that you have read, understood, and agree to be bound by this Privacy Policy.
          </P>
          <P>
            <Bold>Withdrawal of Consent:</Bold> Under DPDPA 2023 § 6, you have the right to withdraw consent for non-essential data processing at any time by contacting <a href="mailto:privacy@gharse.com" style={{ color: '#FF6B35' }}>privacy@gharse.com</a>. However, withdrawal may limit your ability to use certain Platform features or food ordering services.
          </P>
          <P>
            <Bold>Mandatory Rejection:</Bold> If you do not agree to this Policy, you <Bold>MUST immediately cease</Bold> using our services and delete your account. Continued use constitutes explicit consent under DPDPA 2023 § 6(1).
          </P>
        </Subsection>
      </Section>

      {/* Data Collection */}
      <Section title="2. DATA COLLECTED AND PURPOSE">
        <Subsection title="2.1 Personal Identification Information">
          <P>We collect the following data when you create an account or place an order:</P>
          <List>
            <Li><Bold>Full Name</Bold> - For order processing and delivery</Li>
            <Li><Bold>Email Address</Bold> - For order confirmations, receipts, and account recovery</Li>
            <Li><Bold>Phone Number</Bold> - For order updates and delivery coordination</Li>
            <Li><Bold>Delivery Address</Bold> - For fulfillment of food delivery services</Li>
            <Li><Bold>Date of Birth</Bold> (Optional) - For age verification and birthday offers</Li>
          </List>
          <P><Bold>Legal Basis (DPDPA 2023, Section 2(1)(h)):</Bold> Contract performance and legitimate business interest.</P>
        </Subsection>

        <Subsection title="2.2 Payment Information">
          <P>We collect payment data through PCI-DSS compliant third-party processors:</P>
          <List>
            <Li>Payment method type (Credit Card, Debit Card, UPI, Net Banking, Cash on Delivery)</Li>
            <Li>Last 4 digits of card (for transaction reference only)</Li>
            <Li>Transaction ID and payment gateway response</Li>
          </List>
          <Warning>
            <Bold>CRITICAL SECURITY NOTICE:</Bold> We do NOT store complete credit/debit card numbers, CVV codes, or banking passwords. All payment processing is handled by encrypted third-party gateways (Stripe, Razorpay) compliant with PCI-DSS Level 1 standards.
          </Warning>
        </Subsection>

        <Subsection title="2.3 Technical and Usage Data">
          <P>Automatically collected for security and service improvement:</P>
          <List>
            <Li><Bold>IP Address</Bold> - For fraud detection and geographic service restrictions</Li>
            <Li><Bold>Browser Type and Version</Bold> - For compatibility optimization</Li>
            <Li><Bold>Device Information</Bold> - Operating system, screen resolution, device fingerprint</Li>
            <Li><Bold>Cookies and Session Data</Bold> - For maintaining login sessions (see Section 5)</Li>
            <Li><Bold>Order History</Bold> - For personalized recommendations and customer service</Li>
            <Li><Bold>Browsing Behavior</Bold> - Pages viewed, time spent, items added to cart (analytics only)</Li>
          </List>
          <P><Bold>Legal Basis (GDPR Article 6(1)(f)):</Bold> Legitimate interest in security and fraud prevention.</P>
        </Subsection>

        <Subsection title="2.4 Biometric Data (PROHIBITED)">
          <P>
            We do NOT collect fingerprints, facial recognition data, iris scans, or any other biometric identifiers as defined under DPDPA 2023, Section 2(1)(c). Any future collection will require explicit opt-in consent with detailed notice.
          </P>
        </Subsection>

        <Subsection title="2.5 Children's Data (ABSOLUTE PROHIBITION)">
          <P>
            Users below 18 years of age are <Bold>STRICTLY PROHIBITED</Bold> from creating accounts or using this Platform. We do not knowingly collect data from minors. If we discover that a minor has provided data, we will <Bold>immediately delete</Bold> such data within 48 hours of discovery and notify the registered email (if provided).
          </P>
          <P>
            <Bold>Penalty for Violation:</Bold> Any adult who knowingly provides false age information to create an account for a minor will be subject to account termination and potential legal action under Section 14 of DPDPA 2023.
          </P>
        </Subsection>
      </Section>

      {/* Data Usage */}
      <Section title="3. HOW WE USE YOUR DATA">
        <P>Your data is processed exclusively for the following purposes:</P>
        <List>
          <Li><Bold>Order Fulfillment:</Bold> Processing, preparing, and delivering your food orders</Li>
          <Li><Bold>Payment Processing:</Bold> Facilitating secure transactions and generating invoices</Li>
          <Li><Bold>Customer Support:</Bold> Responding to inquiries, complaints, and refund requests</Li>
          <Li><Bold>Service Improvement:</Bold> Analyzing usage patterns to enhance menu, pricing, and delivery times</Li>
          <Li><Bold>Marketing Communications:</Bold> Sending promotional offers (with opt-out option)</Li>
          <Li><Bold>Legal Compliance:</Bold> Tax reporting, food safety audits, and regulatory filings</Li>
          <Li><Bold>Fraud Prevention:</Bold> Detecting suspicious activity, duplicate accounts, and payment fraud</Li>
        </List>
        <P>
          <Bold>AI/ML Processing:</Bold> We use artificial intelligence for order demand prediction, dynamic pricing, and personalized recommendations. No automated decisions are made that significantly affect your rights without human review.
        </P>
      </Section>

      {/* Data Sharing */}
      <Section title="4. DATA SHARING AND THIRD-PARTY DISCLOSURE">
        <Subsection title="4.1 Third-Party Service Providers">
          <P>We share limited data with trusted partners under strict confidentiality agreements:</P>
          <List>
            <Li><Bold>Payment Gateways:</Bold> Stripe, Razorpay (only transaction data)</Li>
            <Li><Bold>Email Service:</Bold> Resend, SendGrid (for transactional emails only)</Li>
            <Li><Bold>SMS Service:</Bold> Twilio, MSG91 (for order updates)</Li>
            <Li><Bold>Cloud Hosting:</Bold> Vercel, Supabase (encrypted data storage)</Li>
            <Li><Bold>Analytics:</Bold> Google Analytics (anonymized data only)</Li>
          </List>
          <P>
            All third parties are contractually bound to GDPR Article 28 (Data Processing Agreements) and DPDPA 2023 Section 8 (obligations of data processors).
          </P>
        </Subsection>

        <Subsection title="4.2 Legal Disclosures">
          <P>We may disclose your data without consent in the following circumstances:</P>
          <List>
            <Li>Court orders or subpoenas from competent jurisdiction</Li>
            <Li>Law enforcement requests under Section 69 of IT Act, 2000</Li>
            <Li>Food safety investigations by FSSAI or health authorities</Li>
            <Li>Tax audits by Income Tax Department or GST authorities</Li>
            <Li>Emergency situations involving imminent harm to life or property</Li>
          </List>
        </Subsection>

        <Subsection title="4.3 No Sale of Personal Data">
          <P>
            We <Bold>DO NOT</Bold> sell, rent, or trade your personal data to third parties for marketing purposes. This is a non-negotiable commitment.
          </P>
        </Subsection>
      </Section>

      {/* Cookies */}
      <Section title="5. COOKIES AND TRACKING TECHNOLOGIES">
        <P>We use cookies (small text files) for:</P>
        <List>
          <Li><Bold>Essential Cookies:</Bold> Login sessions, cart persistence (cannot be disabled)</Li>
          <Li><Bold>Analytics Cookies:</Bold> Usage statistics (can be disabled via browser settings)</Li>
          <Li><Bold>Marketing Cookies:</Bold> Retargeting ads (opt-out available)</Li>
        </List>
        <P>
          Cookie lifespan: Session cookies expire when you close your browser. Persistent cookies remain for up to 1 year.
        </P>
        <P>
          <Bold>How to Disable:</Bold> Go to your browser settings → Privacy → Cookies → Block third-party cookies. Note: Disabling essential cookies will break website functionality.
        </P>
      </Section>

      {/* Data Storage */}
      <Section title="6. DATA STORAGE, SECURITY, AND RETENTION">
        <Subsection title="6.1 Storage Location">
          <P>
            Your data is stored on servers located in <Bold>India and the United States</Bold>. We comply with cross-border data transfer requirements under DPDPA 2023, Section 16 (notified countries only).
          </P>
        </Subsection>

        <Subsection title="6.2 Security Measures">
          <P>We implement industry-standard security controls:</P>
          <List>
            <Li><Bold>Encryption:</Bold> TLS 1.3 for data in transit, AES-256 for data at rest</Li>
            <Li><Bold>Access Controls:</Bold> Role-based access, multi-factor authentication for admins</Li>
            <Li><Bold>Audit Logs:</Bold> All data access logged and monitored for 180 days</Li>
            <Li><Bold>Penetration Testing:</Bold> Annual security audits by third-party experts</Li>
            <Li><Bold>Password Hashing:</Bold> bcrypt with salt (no plain-text storage)</Li>
          </List>
        </Subsection>

        <Subsection title="6.3 Data Retention">
          <P>We retain your data as follows:</P>
          <List>
            <Li><Bold>Active Accounts:</Bold> Retained until account deletion request</Li>
            <Li><Bold>Deleted Accounts:</Bold> Anonymized after 30 days, logs retained for 7 years (tax compliance)</Li>
            <Li><Bold>Order History:</Bold> 7 years (Income Tax Act, 1961, Section 44AA)</Li>
            <Li><Bold>Payment Records:</Bold> 10 years (Reserve Bank of India guidelines)</Li>
          </List>
        </Subsection>

        <Subsection title="6.4 Data Breach Notification">
          <P>
            In the event of a data breach affecting your personal information, we will notify you within <Bold>72 hours</Bold> via email and prominently on our website, as required by DPDPA 2023, Section 8(6).
          </P>
        </Subsection>
      </Section>

      {/* User Rights */}
      <Section title="7. YOUR LEGAL RIGHTS (DPDPA 2023 & GDPR)">
        <P>You have the following enforceable rights:</P>
        <List>
          <Li><Bold>Right to Access (Section 11, DPDPA):</Bold> Request a copy of all data we hold about you (provided within 15 days)</Li>
          <Li><Bold>Right to Correction:</Bold> Update inaccurate or incomplete data via your account settings</Li>
          <Li><Bold>Right to Erasure ("Right to be Forgotten"):</Bold> Request deletion of your account and data (subject to legal retention requirements)</Li>
          <Li><Bold>Right to Data Portability (GDPR Article 20):</Bold> Receive your data in machine-readable format (JSON/CSV)</Li>
          <Li><Bold>Right to Withdraw Consent:</Bold> Opt-out of marketing emails at any time</Li>
          <Li><Bold>Right to Nominate (DPDPA Section 11):</Bold> Nominate a person to exercise your rights in case of death or incapacity</Li>
          <Li><Bold>Right to Grievance Redressal:</Bold> File complaints with our Data Protection Officer (see Section 11)</Li>
        </List>
        <P>
          <Bold>How to Exercise:</Bold> Email <a href="mailto:privacy@gharse.com" style={{ color: '#FF6B35' }}>privacy@gharse.com</a> with subject line "Data Rights Request" along with proof of identity (government ID).
        </P>
      </Section>

      {/* Marketing */}
      <Section title="8. MARKETING AND PROMOTIONAL COMMUNICATIONS">
        <P>
          We may send promotional offers, discount coupons, and new menu updates via:
        </P>
        <List>
          <Li>Email (max 2 per week)</Li>
          <Li>SMS (max 1 per week)</Li>
          <Li>WhatsApp (only if you opt-in)</Li>
          <Li>Push Notifications (mobile app only)</Li>
        </List>
        <P>
          <Bold>Opt-Out:</Bold> Click "Unsubscribe" in any email, reply STOP to SMS, or disable notifications in account settings. Transactional messages (order confirmations, delivery updates) cannot be disabled.
        </P>
      </Section>

      {/* Updates */}
      <Section title="9. POLICY UPDATES AND MODIFICATIONS">
        <P>
          We reserve the right to modify this Policy to comply with new laws or business practices. Material changes will be notified via:
        </P>
        <List>
          <Li>Email notification to registered users (30 days advance notice)</Li>
          <Li>Prominent banner on website homepage</Li>
          <Li>Requirement to accept updated terms on next login</Li>
        </List>
        <P>
          Continued use after the effective date constitutes acceptance. If you disagree, you must delete your account before the effective date.
        </P>
      </Section>

      {/* International Users */}
      <Section title="10. INTERNATIONAL USERS (EU & CALIFORNIA)">
        <Subsection title="10.1 GDPR Rights (EU Users)">
          <P>If you are in the EEA, you have additional rights:</P>
          <List>
            <Li>Right to lodge a complaint with your local Data Protection Authority</Li>
            <Li>Right to object to automated decision-making (Article 22)</Li>
            <Li>Right to data portability (export your data)</Li>
          </List>
          <P>EU Representative: [Contact to be designated if required]</P>
        </Subsection>

        <Subsection title="10.2 CCPA Rights (California Users)">
          <P>California residents have rights under CCPA:</P>
          <List>
            <Li>Right to know what personal information is collected</Li>
            <Li>Right to know if data is sold (we do NOT sell data)</Li>
            <Li>Right to deletion (with legal exceptions)</Li>
            <Li>Right to opt-out of sale (not applicable - we don't sell)</Li>
            <Li>Right to non-discrimination for exercising rights</Li>
          </List>
          <P>California Contact: <a href="mailto:privacy@gharse.com" style={{ color: '#FF6B35' }}>privacy@gharse.com</a></P>
        </Subsection>
      </Section>

      {/* Contact */}
      <Section title="11. DATA PROTECTION OFFICER & GRIEVANCE REDRESSAL">
        <P><Bold>Data Protection Officer (DPO):</Bold></P>
        <ContactBox>
          Name: [To be designated]<br />
          Email: <a href="mailto:dpo@gharse.com" style={{ color: '#FF6B35' }}>dpo@gharse.com</a><br />
          Phone: +91 90104 60964<br />
          Address: GharSe, Hayatnagar, Hyderabad, Telangana - 501505<br />
          Response Time: Within 15 business days
        </ContactBox>

        <P style={{ marginTop: '24px' }}><Bold>Escalation to Regulatory Authorities:</Bold></P>
        <P>If unsatisfied with our response, you may file a complaint with:</P>
        <List>
          <Li><Bold>Data Protection Board of India</Bold> (under DPDPA 2023) - [Website to be notified]</Li>
          <Li><Bold>Indian Computer Emergency Response Team (CERT-In)</Bold> - <a href="https://www.cert-in.org.in" style={{ color: '#FF6B35' }}>www.cert-in.org.in</a></Li>
        </List>
      </Section>

      {/* Penalties */}
      <Section title="12. PENALTIES FOR VIOLATION">
        <Warning>
          <Bold>LEGAL CONSEQUENCES OF MISUSE:</Bold>
          <List>
            <Li>Providing false information: ₹10,00,000 (Ten Lakhs) penalty + account termination</Li>
            <Li>Unauthorized access to others' accounts: Criminal prosecution under IPC Section 420 + IT Act Section 66C (imprisonment up to 3 years)</Li>
            <Li>Data theft or leakage: ₹50,00,000 (Fifty Lakhs) + imprisonment under Section 72A of IT Act</Li>
          </List>
        </Warning>
      </Section>

      {/* Governing Law */}
      <Section title="13. GOVERNING LAW AND JURISDICTION">
        <P>
          This Policy is governed by the laws of India. Any disputes arising out of or relating to this Policy shall be subject to the <Bold>exclusive jurisdiction of courts in Hyderabad, Telangana, India</Bold>.
        </P>
        <P>
          This Policy is effective as of the date first written above and supersedes all prior privacy statements.
        </P>
      </Section>

      {/* Acceptance */}
      <div style={{
        marginTop: '48px',
        padding: '24px',
        backgroundColor: '#FFF5F0',
        borderLeft: '4px solid #FF6B35',
        borderRadius: '8px',
      }}>
        <P style={{ fontWeight: 600, color: '#111827' }}>
          By using GharSe, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy in its entirety.
        </P>
      </div>
    </div>
  );
}

// Reusable styled components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '24px',
        paddingBottom: '12px',
        borderBottom: '2px solid #E5E7EB',
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '16px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: '16px',
      lineHeight: '28px',
      color: '#4B5563',
      marginBottom: '16px',
      ...style,
    }}>
      {children}
    </p>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 600, color: '#111827' }}>{children}</strong>;
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{
      paddingLeft: '24px',
      marginBottom: '16px',
    }}>
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{
      fontSize: '16px',
      lineHeight: '28px',
      color: '#4B5563',
      marginBottom: '8px',
    }}>
      {children}
    </li>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: '24px',
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: '#FEF2F2',
      borderLeft: '4px solid #EF4444',
      borderRadius: '8px',
    }}>
      <div style={{
        fontSize: '16px',
        lineHeight: '28px',
        color: '#991B1B',
      }}>
        {children}
      </div>
    </div>
  );
}

function ContactBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: '16px',
      padding: '20px',
      backgroundColor: '#F0F9FF',
      borderRadius: '8px',
      border: '1px solid #BFDBFE',
      fontSize: '16px',
      lineHeight: '28px',
      color: '#1E40AF',
    }}>
      {children}
    </div>
  );
}

