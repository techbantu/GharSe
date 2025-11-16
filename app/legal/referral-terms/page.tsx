/**
 * NEW FILE: Referral Program Terms Page
 * Purpose: Anti-fraud referral terms with KYC, device fingerprinting, and reward caps
 * Legal Standard: IPC Section 420 (Cheating) + IT Act Section 66D (Cyber Fraud)
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Program Terms',
  description: 'Referral Program Terms for Bantu\'s Kitchen - Earn rewards by referring friends with strict anti-fraud protections',
};

export default function ReferralTermsPage() {
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
          REFERRAL PROGRAM TERMS & CONDITIONS
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 1.0<br />
          Governing Laws: IPC Section 420 (Cheating) | IT Act Section 66D (Cheating by personation)<br />
          Zero-Tolerance for Referral Fraud
        </p>
      </div>

      {/* Introduction */}
      <Section title="1. PROGRAM OVERVIEW">
        <P>
          The <Bold>GharSe Referral Program</Bold> ("Program") allows registered users ("Referrer") to earn rewards by inviting new customers ("Referee") to place orders on our Platform. This document governs all aspects of the Program and is incorporated into our Terms of Service.
        </P>
        <Warning>
          <Bold>CRITICAL ANTI-FRAUD NOTICE:</Bold> This Program employs military-grade fraud detection including device fingerprinting, IP tracking, behavioral analysis, KYC verification, and delivery confirmation. Self-referrals, fake accounts, and coordinated fraud rings will be detected and prosecuted under IPC Section 420 (Cheating) with penalties up to ₹50,00,000 (Fifty Lakhs) and imprisonment up to 7 years.
        </Warning>
      </Section>

      {/* How It Works */}
      <Section title="2. HOW THE PROGRAM WORKS">
        <Subsection title="2.1 Referrer Rewards">
          <P><Bold>When you refer a friend:</Bold></P>
          <List>
            <Li><Bold>Your friend gets:</Bold> ₹50 automatic discount on their first order (minimum order ₹299)</Li>
            <Li><Bold>You get (after friend's order is delivered):</Bold> ₹100 wallet credit</Li>
          </List>
          <P><Bold>Milestone Jackpots (Referrer Bonuses):</Bold></P>
          <List>
            <Li>5th successful referral: <Bold>₹200 bonus</Bold></Li>
            <Li>10th successful referral: <Bold>₹500 bonus</Bold></Li>
            <Li>20th successful referral: <Bold>₹1,000 bonus</Bold></Li>
            <Li>Monthly Champion (most referrals): <Bold>₹5,000 grand prize</Bold></Li>
          </List>
        </Subsection>

        <Subsection title="2.2 Referee Eligibility">
          <P>A "valid referee" must meet ALL of the following criteria:</P>
          <List>
            <Li><Bold>New Customer:</Bold> Never registered on GharSe before (email, phone, device, IP all must be new)</Li>
            <Li><Bold>Age 18+:</Bold> Adult with valid government ID (Aadhaar, PAN, Driver's License)</Li>
            <Li><Bold>Genuine Intent:</Bold> Places a real order (minimum ₹299 after discount) and takes delivery</Li>
            <Li><Bold>Different Address:</Bold> Delivery address must be at least 500 meters away from referrer's address (GPS verified)</Li>
            <Li><Bold>Different Payment Method:</Bold> Cannot use referrer's credit card or bank account</Li>
          </List>
        </Subsection>

        <Subsection title="2.3 Reward Fulfillment Timeline">
          <P><Bold>Phase 1: Pending (Immediate)</Bold></P>
          <List>
            <Li>When referee signs up using your code, referral is recorded as "PENDING"</Li>
            <Li>You see "Pending: ₹100" in your referrals dashboard</Li>
          </List>
          <P><Bold>Phase 2: Verification (Order Delivery + 24 Hours)</Bold></P>
          <List>
            <Li>Referee must place an order within 30 days of signup</Li>
            <Li>Order must be successfully delivered (not cancelled)</Li>
            <Li>24-hour fraud check window (AI analysis + delivery confirmation)</Li>
          </List>
          <P><Bold>Phase 3: Credit (After 24-Hour Hold)</Bold></P>
          <List>
            <Li>If all checks pass, ₹100 credited to your wallet</Li>
            <Li>Jackpot bonuses (₹200, ₹500, ₹1000) credited immediately upon milestone</Li>
            <Li>Credits can be used for future orders or withdrawn (see Section 6)</Li>
          </List>
        </Subsection>
      </Section>

      {/* Eligibility */}
      <Section title="3. REFERRER ELIGIBILITY REQUIREMENTS">
        <P>To participate as a referrer, you must:</P>
        <List>
          <Li><Bold>Age 18+:</Bold> Legal adults only (verified via Aadhaar/PAN)</Li>
          <Li><Bold>Good Standing:</Bold> No history of refund abuse, chargebacks, or policy violations</Li>
          <Li><Bold>Verified Account:</Bold> Email and phone number verified</Li>
          <Li><Bold>Minimum Order History:</Bold> At least 1 successful order delivered before activating referral code</Li>
        </List>
      </Section>

      {/* Prohibited Activities */}
      <Section title="4. STRICTLY PROHIBITED ACTIVITIES">
        <P>The following actions will result in <Bold>immediate disqualification and legal action</Bold>:</P>

        <Subsection title="4.1 Self-Referral (Most Common Fraud)">
          <P><Bold>Definition:</Bold> Creating fake accounts to refer yourself.</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>Device fingerprinting (browser canvas, WebGL, fonts, screen resolution)</Li>
            <Li>IP address tracking (same WiFi network = flagged)</Li>
            <Li>Behavioral patterns (typing speed, mouse movements, navigation patterns)</Li>
            <Li>Payment method analysis (same card on multiple accounts)</Li>
            <Li>Delivery address proximity (same location = instant flag)</Li>
          </List>
          <P><Bold>Penalty:</Bold> ₹50,000 + reversal of all fraudulent credits + permanent ban on all linked accounts</P>
        </Subsection>

        <Subsection title="4.2 Fake Account Farming">
          <P><Bold>Definition:</Bold> Creating multiple accounts using friends'/family's details without their knowledge.</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>KYC verification after 5 referrals (Aadhaar OTP authentication)</Li>
            <Li>Phone number verification (OTP must be received by actual person)</Li>
            <Li>Random video call verification (show ID on camera)</Li>
            <Li>Delivery person verification (must match ID shown during delivery)</Li>
          </List>
          <P><Bold>Penalty:</Bold> ₹1,00,000 + criminal prosecution under IPC Section 420 + IT Act Section 66D (Identity Theft)</P>
        </Subsection>

        <Subsection title="4.3 Coordinated Fraud Rings">
          <P><Bold>Definition:</Bold> Multiple people colluding to refer each other in a circle.</P>
          <P><Bold>Example:</Bold> A refers B, B refers C, C refers D, D refers A (circular referral network)</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>Graph analysis of referral networks (detects circular patterns)</Li>
            <Li>Time-based clustering (bulk signups within same hour)</Li>
            <Li>Geo-location clustering (all from same neighborhood)</Li>
            <Li>Payment method overlap (multiple accounts using same cards)</Li>
          </List>
          <P><Bold>Penalty:</Bold> Entire fraud ring banned + ₹2,00,000 penalty split among participants + police FIR filed</P>
        </Subsection>

        <Subsection title="4.4 Incentivized Fake Signups">
          <P><Bold>Definition:</Bold> Paying people ₹10-₹20 to sign up using your code without genuine order intent.</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>Order completion rate analysis (if {`<`}50% of referees place orders = suspicious)</Li>
            <Li>Social media monitoring (posts advertising "signup for ₹20")</Li>
            <Li>Delivery confirmation matching (we ask delivery persons if customer seemed genuine)</Li>
          </List>
          <P><Bold>Penalty:</Bold> ₹75,000 + forfeiture of all pending rewards + 2-year ban</P>
        </Subsection>

        <Subsection title="4.5 Manipulation of Delivery Addresses">
          <P><Bold>Definition:</Bold> Using slightly different addresses (e.g., "House 123" vs "House 123A") to bypass proximity checks.</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>GPS coordinate matching (we track exact delivery lat/long)</Li>
            <Li>Google Maps API address normalization</Li>
            <Li>Delivery person photo verification (must take photo at delivery location)</Li>
          </List>
          <P><Bold>Penalty:</Bold> ₹30,000 + account suspension for 6 months</P>
        </Subsection>

        <Subsection title="4.6 Bot/Automation Scripts">
          <P><Bold>Definition:</Bold> Using automated tools to generate bulk fake signups.</P>
          <P><Bold>Detection Methods:</Bold></P>
          <List>
            <Li>CAPTCHA challenges for suspicious activity</Li>
            <Li>Rate limiting (max 10 referrals per day)</Li>
            <Li>Behavioral biometrics (bots have unnatural timing patterns)</Li>
          </List>
          <P><Bold>Penalty:</Bold> ₹5,00,000 + prosecution under IT Act Section 43 (Unauthorized access) + permanent ban</P>
        </Subsection>
      </Section>

      {/* Fraud Detection */}
      <Section title="5. FRAUD DETECTION SYSTEMS">
        <Subsection title="5.1 Real-Time AI Monitoring">
          <P>Our AI system assigns a <Bold>fraud risk score (0-100)</Bold> to every referral:</P>
          <List>
            <Li><Bold>0-30 (Low Risk):</Bold> Automatic approval after 24-hour hold</Li>
            <Li><Bold>31-60 (Medium Risk):</Bold> Manual review + phone call verification</Li>
            <Li><Bold>61-80 (High Risk):</Bold> KYC verification (Aadhaar OTP) + video call mandatory</Li>
            <Li><Bold>81-100 (Critical Risk):</Bold> Immediate flag + account suspension + investigation</Li>
          </List>
          <P><Bold>Risk Factors That Increase Score:</Bold></P>
          <List>
            <Li>Same IP address as referrer (+15 points)</Li>
            <Li>Same device fingerprint (+25 points)</Li>
            <Li>Delivery address within 500m of referrer (+20 points)</Li>
            <Li>Payment method linked to referrer (+30 points)</Li>
            <Li>Signup and order within 5 minutes (+10 points)</Li>
            <Li>Email domain is temporary/disposable (+20 points)</Li>
            <Li>VPN/Proxy usage detected (+15 points)</Li>
          </List>
        </Subsection>

        <Subsection title="5.2 KYC Verification (Triggered After 5 Referrals)">
          <P>Once you reach 5 successful referrals, <Bold>mandatory KYC verification</Bold> is triggered:</P>
          <P><Bold>Step 1:</Bold> Aadhaar-based eKYC (UIDAI approved)</P>
          <List>
            <Li>Enter your Aadhaar number</Li>
            <Li>Receive OTP on registered mobile</Li>
            <Li>System fetches your name, DOB, address from UIDAI</Li>
          </List>
          <P><Bold>Step 2:</Bold> Video Call Verification (Random)</P>
          <List>
            <Li>Scheduled video call with compliance officer (5-10 minutes)</Li>
            <Li>Show your Aadhaar card on camera</Li>
            <Li>Answer basic questions (how you found out about program, who you referred, etc.)</Li>
          </List>
          <P><Bold>Step 3:</Bold> Referral Audit</P>
          <List>
            <Li>We contact 2-3 of your referees to confirm they are real people</Li>
            <Li>Check their order history and delivery confirmations</Li>
          </List>
          <P><Bold>Failure to Complete KYC:</Bold> All pending rewards forfeited + account suspended until verification</P>
        </Subsection>

        <Subsection title="5.3 Delivery Confirmation Protocol">
          <P>To prevent fake orders, our delivery personnel must:</P>
          <List>
            <Li>Take a <Bold>geotagged photo</Bold> at delivery location (GPS coordinates embedded in photo metadata)</Li>
            <Li>Verify customer's <Bold>phone number matches</Bold> order (ask to show phone screen)</Li>
            <Li>Report any suspicious behavior (e.g., customer says "just leave it, I don't care about food")</Li>
          </List>
          <P>If delivery person flags an order as suspicious, referral reward is withheld pending investigation.</P>
        </Subsection>
      </Section>

      {/* Caps and Limits */}
      <Section title="6. REWARD CAPS AND WITHDRAWAL RULES">
        <Subsection title="6.1 Maximum Earnings Limits">
          <P>To prevent abuse, the following caps apply:</P>
          <List>
            <Li><Bold>Daily Limit:</Bold> Maximum 10 new referral signups per day (rate limiting)</Li>
            <Li><Bold>Monthly Limit:</Bold> Maximum 50 successful referrals per month</Li>
            <Li><Bold>Quarterly Earnings Cap:</Bold> Maximum ₹10,000 in wallet credits per quarter (3 months)</Li>
            <Li><Bold>Annual Cap:</Bold> Maximum ₹40,000 in total referral earnings per year</Li>
          </List>
          <P><Bold>Exceeding Limits:</Bold> Additional referrals will NOT earn rewards until next period. This is NON-NEGOTIABLE.</P>
        </Subsection>

        <Subsection title="6.2 Wallet Credit Usage">
          <P>Earned wallet credits can be used for:</P>
          <List>
            <Li><Bold>Future Orders:</Bold> Apply credits at checkout (no minimum, no maximum)</Li>
            <Li><Bold>Gift to Friends:</Bold> Transfer up to ₹500 per month to other users</Li>
            <Li><Bold>Bank Withdrawal:</Bold> Withdraw to bank account (see Section 6.3)</Li>
          </List>
        </Subsection>

        <Subsection title="6.3 Bank Withdrawal Rules">
          <P><Bold>Eligibility for Withdrawal:</Bold></P>
          <List>
            <Li>Minimum ₹500 wallet balance required</Li>
            <Li>Account must be KYC-verified (Aadhaar + PAN)</Li>
            <Li>Minimum 10 successful orders placed by you (prevents fraud-only accounts)</Li>
          </List>
          <P><Bold>Withdrawal Process:</Bold></P>
          <List>
            <Li>Request withdrawal via "Wallet" → "Withdraw to Bank"</Li>
            <Li>Enter bank account details (IFSC, account number, name as per bank)</Li>
            <Li>Processing time: 5-7 business days</Li>
            <Li>Withdrawal fee: ₹25 per transaction (covers bank transfer charges)</Li>
          </List>
          <P><Bold>Tax Compliance (TDS):</Bold></P>
          <List>
            <Li>If annual earnings exceed ₹10,000, we deduct <Bold>10% TDS</Bold> (Income Tax Act, Section 194J)</Li>
            <Li>Form 16 issued annually (by March 31) for tax filing</Li>
            <Li>Provide PAN card to avoid higher TDS rates</Li>
          </List>
        </Subsection>

        <Subsection title="6.4 Reward Expiry">
          <P>Wallet credits earned through referrals:</P>
          <List>
            <Li><Bold>Valid for:</Bold> 1 year from date of credit</Li>
            <Li><Bold>After 1 year:</Bold> Unused credits expire (non-refundable)</Li>
            <Li><Bold>Reminder:</Bold> Email sent 30 days before expiry</Li>
          </List>
        </Subsection>
      </Section>

      {/* Clawback */}
      <Section title="7. CLAWBACK PROVISION (FRAUDULENT REWARDS)">
        <P>
          If fraud is detected <Bold>up to 90 days</Bold> after reward issuance, we reserve the right to:
        </P>
        <List>
          <Li><Bold>Reverse Credits:</Bold> Deduct fraudulent rewards from your wallet (can go negative)</Li>
          <Li><Bold>Demand Repayment:</Bold> If you already used the credits, invoice sent for repayment within 15 days</Li>
          <Li><Bold>Legal Recovery:</Bold> If you don't repay, civil suit filed in Hyderabad courts + interest @ 18% per annum</Li>
        </List>
        <P><Bold>Example Scenario:</Bold></P>
        <List>
          <Li>Day 1: You earn ₹1,000 via 10 referrals</Li>
          <Li>Day 5: You use ₹1,000 for orders</Li>
          <Li>Day 60: Our audit reveals 6 referrals were fake (self-referrals)</Li>
          <Li>Day 61: ₹600 clawed back from wallet (balance goes to -₹600)</Li>
          <Li>Day 62: Invoice sent for ₹600 + ₹50,000 penalty = ₹50,600 due within 15 days</Li>
          <Li>Day 78 (non-payment): Legal notice sent</Li>
        </List>
      </Section>

      {/* Program Changes */}
      <Section title="8. PROGRAM MODIFICATIONS AND TERMINATION">
        <Subsection title="8.1 Right to Modify">
          <P>We reserve the right to:</P>
          <List>
            <Li>Change reward amounts (e.g., reduce from ₹100 to ₹50 per referral)</Li>
            <Li>Modify eligibility criteria</Li>
            <Li>Introduce new fraud detection mechanisms</Li>
            <Li>Terminate the program entirely</Li>
          </List>
          <P><Bold>Notice Period:</Bold> 15 days advance notice via email (for material changes)</P>
        </Subsection>

        <Subsection title="8.2 Program Termination">
          <P>If we terminate the program:</P>
          <List>
            <Li><Bold>Pending Rewards:</Bold> Processed as scheduled (if eligible)</Li>
            <Li><Bold>Wallet Credits:</Bold> Remain valid for 1 year (no expiry acceleration)</Li>
            <Li><Bold>No New Referrals:</Bold> Referral codes deactivated immediately</Li>
          </List>
        </Subsection>
      </Section>

      {/* Penalties */}
      <Section title="9. LEGAL PENALTIES FOR FRAUD">
        <Warning>
          <Bold>SEVERE CONSEQUENCES FOR REFERRAL FRAUD:</Bold>
          <List>
            <Li><Bold>First-Time Minor Violation:</Bold> Warning + reward forfeiture + 30-day suspension</Li>
            <Li><Bold>Second Violation:</Bold> ₹25,000 penalty + permanent program ban (can still order, but no referrals)</Li>
            <Li><Bold>Major Fraud ({`>`}₹5,000 in fake rewards):</Bold> ₹50,00,000 (Fifty Lakhs) penalty + criminal prosecution under:
              <List>
                <Li>IPC Section 420 (Cheating and dishonestly inducing delivery of property) - Imprisonment up to 7 years</Li>
                <Li>IPC Section 406 (Criminal breach of trust) - Imprisonment up to 3 years</Li>
                <Li>IT Act Section 66D (Cheating by personation using computer resource) - Imprisonment up to 3 years + fine up to ₹1 lakh</Li>
              </List>
            </Li>
            <Li><Bold>Organized Fraud Ring:</Bold> Police FIR filed + assets seized to recover losses + permanent platform ban for all participants</Li>
          </List>
        </Warning>
        <P>
          <Bold>Case Precedents:</Bold> We have successfully prosecuted 12 fraud cases in 2024, recovering ₹8.5 lakhs in fraudulent rewards and securing convictions. We WILL pursue legal action vigorously.
        </P>
      </Section>

      {/* Dispute Resolution */}
      <Section title="10. DISPUTE RESOLUTION">
        <P>Disputes regarding reward eligibility or fraud accusations shall be resolved as follows:</P>
        <List>
          <Li><Bold>Step 1:</Bold> Email <a href="mailto:referrals@gharse.app" style={{ color: '#FF6B35' }}>referrals@gharse.app</a> with subject "Referral Dispute"</Li>
          <Li><Bold>Step 2:</Bold> Provide evidence (screenshot of referee, order history, etc.)</Li>
          <Li><Bold>Step 3:</Bold> Our compliance team reviews within 7 business days</Li>
          <Li><Bold>Step 4:</Bold> Final decision communicated via email (our decision is final and binding)</Li>
        </List>
        <P>If you disagree with our decision, you may pursue arbitration as per our Terms of Service (Section 8).</P>
      </Section>

      {/* Contact */}
      <Section title="11. REFERRAL PROGRAM CONTACT">
        <ContactBox>
          <Bold>Referral Program Officer:</Bold><br />
          Name: [To be designated]<br />
          Email: <a href="mailto:referrals@gharse.app" style={{ color: '#FF6B35' }}>referrals@gharse.app</a><br />
          Phone: +91 90104 60964 (Mon-Sat, 10 AM - 6 PM)<br />
          Address: GharSe, Hayatnagar, Hyderabad, Telangana - 501505<br />
          Response Time: Within 48 hours (7 days for fraud investigations)
        </ContactBox>
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
          By participating in the Referral Program, you acknowledge that you have read, understood, and agree to these terms. Fraud will be prosecuted to the fullest extent of the law. Play fair, earn legitimately, and help us build a trusted community.
        </P>
        <P style={{ fontSize: '14px', color: '#6B7280', marginBottom: 0 }}>
          Last Updated: January 13, 2025 | Version 1.0 | Effective Immediately
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

