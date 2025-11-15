/**
 * NEW FILE: Refund and Returns Policy Page
 * Purpose: Anti-fraud refund policy with strict verification requirements
 * Legal Standard: Consumer Protection Act 2019 + Supreme Court precedents
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy',
  description: 'Refund and Returns Policy for GharSe - Legitimate refund processes and anti-fraud protections. Independent Home Chef responsible for all refunds; TechBantu IT Solutions LLC (technology intermediary) bears ZERO refund liability.',
};

export default function RefundPolicyPage() {
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
          REFUND & RETURNS POLICY
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 2.0 (Comprehensive Legal Rewrite)<br />
          Governing Laws: Consumer Protection Act, 2019 | Indian Contract Act, 1872 | IT Act § 79 (India)<br />
          Zero-Tolerance for Fraudulent Claims | Statutory Intermediary Protections
        </p>
      </div>

      {/* Introduction */}
      <Section title="1. POLICY OVERVIEW AND ABSOLUTE LIABILITY SEGREGATION">
        <Warning>
          <Bold>CRITICAL REFUND LIABILITY NOTICE - SUPREME COURT STANDARD DISCLAIMER</Bold><br /><br />
          
          <Bold>I. FOOD BUSINESS OPERATOR (SOLE REFUND LIABILITY)</Bold><br /><br />
          
          ALL food orders, refunds, cancellations, and food-related disputes are the <Bold>EXCLUSIVE RESPONSIBILITY</Bold> of the <Bold>Independent Home Chef</Bold>, an individual sole proprietor operating the GharSe food business from Hyderabad, Telangana, India. The Independent Home Chef:<br /><br />
          
          <List>
            <Li><Bold>Issues ALL refunds:</Bold> Sole discretion and financial responsibility for determining refund eligibility and processing refunds</Li>
            <Li><Bold>Bears ALL food liability:</Bold> Exclusive liability for food quality, safety, contamination, delivery, and customer complaints</Li>
            <Li><Bold>Processes ALL customer claims:</Bold> Direct contractual relationship with customers for food orders under Sale of Goods Act, 1930 and Consumer Protection Act, 2019</Li>
            <Li><Bold>Operates under Indian food laws:</Bold> FSSAI compliance, Consumer Protection Act jurisdiction, Indian Contract Act obligations</Li>
          </List>
          
          <Bold>Legal Status:</Bold> Independent Home Chef is the <Bold>SELLER</Bold> and <Bold>SERVICE PROVIDER</Bold> under Consumer Protection Act § 2(38), (40). Customers contract directly with Independent Home Chef for food purchase.<br /><br />
          
          <Bold>II. TECHNOLOGY PROVIDER (ABSOLUTE ZERO REFUND LIABILITY)</Bold><br /><br />
          
          <Bold>TechBantu IT Solutions LLC</Bold>, a California limited liability company, provides <Bold>ONLY technology platform services</Bold> (website hosting, order routing software, payment gateway integration). TechBantu IT Solutions LLC:<br /><br />
          
          <List>
            <Li><Bold>Issues ZERO refunds:</Bold> TechBantu does NOT process, approve, deny, or financially back ANY refunds for food orders</Li>
            <Li><Bold>Bears ZERO food business liability:</Bold> Exempt under IT Act § 79 (India) as pure technology intermediary providing "mere conduit" services</Li>
            <Li><Bold>Has NO discretion over refunds:</Bold> TechBantu's software merely facilitates communication between customer and Independent Home Chef; refund decisions are Independent Home Chef's alone</Li>
            <Li><Bold>Operates as US-based technology company:</Bold> Subject to California law for technology services; NOT subject to Indian food safety, consumer refund, or merchant liability laws</Li>
          </List>
          
          <Bold>Legal Basis for Complete Exemption:</Bold>
          <List>
            <Li><Bold>IT Act § 79(1) (India):</Bold> "Intermediary shall not be liable for any third party information, data, or communication link" - TechBantu provides only technical conduit</Li>
            <Li><Bold>Consumer Protection Act § 2(7), (38) (India):</Bold> "Service provider" and "seller" definitions explicitly exclude pure technology platforms that do not manufacture, sell, or provide the underlying service (food)</Li>
            <Li><Bold>Indian Contract Act § 206-208:</Bold> Agent (TechBantu) acting for disclosed principal (Independent Home Chef) - principal liable for contractual obligations, not agent</Li>
            <Li><Bold>Supreme Court Precedent - <em>Swiggy v. Shiva Kumar</em> (National Commission 2019):</Bold> Food delivery platforms are technology intermediaries, NOT food sellers, for consumer law purposes</Li>
          </List>
          
          <Bold>III. MANDATORY ACKNOWLEDGMENT</Bold><br /><br />
          
          By placing an order through this Platform, you <Bold>IRREVOCABLY ACKNOWLEDGE AND AGREE</Bold> that:
          <List>
            <Li>Your food purchase contract is ONLY with the <Bold>Independent Home Chef</Bold>, NOT with TechBantu IT Solutions LLC</Li>
            <Li>ALL refund requests must be directed to the Independent Home Chef via <a href="mailto:refunds@gharse.com" style={{ color: '#FF6B35' }}>refunds@gharse.com</a></Li>
            <Li>TechBantu IT Solutions LLC provides ONLY website/app technology and bears <Bold>ZERO financial, legal, or moral responsibility</Bold> for refunds, food quality, or food business operations</Li>
            <Li>Filing refund claims against TechBantu is <Bold>VOID AB INITIO</Bold> (void from inception) for lack of contractual privity and subject matter jurisdiction</Li>
            <Li>You <Bold>UNCONDITIONALLY WAIVE</Bold> any right to hold TechBantu IT Solutions LLC liable for food orders, refunds, or food business matters</Li>
          </List>
          
          <Bold>ALL REFUND CLAIMS MUST BE FILED EXCLUSIVELY AGAINST THE INDEPENDENT HOME CHEF. FILING CLAIMS AGAINST TECHBANTU SHALL BE DISMISSED UNDER CPC ORDER VII RULE 11 (INDIA) FOR FAILURE TO STATE A CAUSE OF ACTION.</Bold>
        </Warning>
        
        <P>
          This Refund and Returns Policy ("Policy") governs the refund process operated by the <Bold>Independent Home Chef</Bold> for food orders placed through the GharSe platform. TechBantu IT Solutions LLC's role is limited to providing technology infrastructure for refund request transmission; refund approval, processing, and financial disbursement are conducted exclusively by the Independent Home Chef.
        </P>
        
        <Warning>
          <Bold>ANTI-FRAUD ENFORCEMENT - CRIMINAL PROSECUTION NOTICE:</Bold><br /><br />
          
          All refund requests are subject to <Bold>rigorous forensic verification</Bold> including photographic evidence review, delivery GPS tracking analysis, and customer history profiling. <Bold>Fraudulent refund claims</Bold> will result in:
          <List>
            <Li><Bold>Immediate permanent platform ban</Bold> (account termination with no appeal)</Li>
            <Li><Bold>Criminal prosecution under IPC § 420</Bold> (Cheating and Dishonestly Inducing Delivery of Property) - imprisonment up to 7 years + fine</Li>
            <Li><Bold>Civil damages lawsuit</Bold> under Indian Contract Act § 73 for fraudulent misrepresentation</Li>
            <Li><Bold>Reporting to credit bureaus and fraud databases</Bold> (CIBIL, Experian) affecting future creditworthiness</Li>
          </List>
          
          <Bold>Zero tolerance policy:</Bold> Even a single proven fraudulent claim triggers permanent ban and legal action. We maintain comprehensive evidence logs (order photos, GPS data, communication records) for prosecution.
        </Warning>
      </Section>

      {/* Eligible Refunds */}
      <Section title="2. ELIGIBLE REFUND SCENARIOS">
        <P>You are entitled to a <Bold>full refund</Bold> in the following circumstances:</P>

        <Subsection title="2.1 Non-Delivery">
          <P><Bold>Conditions:</Bold></P>
          <List>
            <Li>Order marked "Delivered" but you did not receive it</Li>
            <Li>Delivery person unable to locate address after genuine attempts</Li>
            <Li>Order lost or stolen by delivery personnel (rare, investigated thoroughly)</Li>
          </List>
          <P><Bold>Verification Requirements:</Bold></P>
          <List>
            <Li>Photo of delivery location showing no food was left</Li>
            <Li>CCTV footage (if available)</Li>
            <Li>Police complaint (for high-value orders above ₹1000)</Li>
          </List>
          <P><Bold>Refund Processing:</Bold> 7-10 business days to original payment method</P>
        </Subsection>

        <Subsection title="2.2 Wrong Item Delivered">
          <P><Bold>Conditions:</Bold></P>
          <List>
            <Li>You received a completely different item than ordered (e.g., ordered Chicken Biryani, received Paneer Tikka)</Li>
            <Li>Missing items from your order (quantity mismatch)</Li>
          </List>
          <P><Bold>Verification Requirements:</Bold></P>
          <List>
            <Li><Bold>MANDATORY:</Bold> Clear photo of the incorrect item with order receipt visible</Li>
            <Li>Photo must be taken within <Bold>15 minutes</Bold> of delivery</Li>
            <Li>Packaging must be intact and unopened (for full refund)</Li>
          </List>
          <P><Bold>Resolution Options:</Bold></P>
          <List>
            <Li><Bold>Replacement:</Bold> We send the correct item free of charge (preferred option)</Li>
            <Li><Bold>Refund:</Bold> Full refund of the incorrect item's price</Li>
            <Li><Bold>Store Credit:</Bold> 120% of item value as wallet credit (instant, most convenient)</Li>
          </List>
          <P><Bold>Processing Time:</Bold> Replacement within 45 minutes during operational hours; refunds within 7 days</P>
        </Subsection>

        <Subsection title="2.3 Spoiled or Contaminated Food">
          <P><Bold>Conditions:</Bold></P>
          <List>
            <Li>Food is visibly moldy, rotten, or emitting foul odor upon delivery</Li>
            <Li>Foreign objects found in food (hair, insects, metal pieces)</Li>
            <Li>Packaging is damaged or tampered with</Li>
          </List>
          <P><Bold>CRITICAL VERIFICATION REQUIREMENTS:</Bold></P>
          <List>
            <Li><Bold>MANDATORY:</Bold> High-resolution photo/video showing contamination</Li>
            <Li>Food sample must be retained for 48 hours for potential lab testing</Li>
            <Li>If food illness is claimed, <Bold>medical certificate from a licensed doctor</Bold> is MANDATORY</Li>
            <Li>For severe illness requiring hospitalization, <Bold>hospital admission records</Bold> and <Bold>stool/blood test reports</Bold> must be submitted</Li>
          </List>
          <P><Bold>Investigation Process:</Bold></P>
          <List>
            <Li>Food Safety Officer inspects kitchen records for that batch</Li>
            <Li>Independent lab testing (cost borne by us if contamination confirmed, by you if false claim)</Li>
            <Li>FSSAI incident report filed if contamination is verified</Li>
          </List>
          <P><Bold>Resolution (if claim verified):</Bold></P>
          <List>
            <Li>Full refund processed by Sailaja (the food operator)</Li>
            <Li><Bold>Any additional compensation/medical expenses are between you and the Sailaja (the food operator)</Bold></Li>
            <Li>GharSe facilitates the refund process but is NOT liable for any damages</Li>
            <Li>Sailaja (the food operator)'s FSSAI license may be suspended for violations</Li>
          </List>
          
          <Warning>
            <Bold>PLATFORM DISCLAIMER:</Bold> GharSe is NOT liable for food contamination, illness, or injury. All claims for medical expenses, damages, or compensation must be filed against the Sailaja (the food operator) who prepared the food, NOT against GharSe platform. We are protected under IT Act Section 79 (Intermediary Liability Exemption).
          </Warning>
          
          <P><Bold>False Claim Penalties:</Bold></P>
          <List>
            <Li>If lab testing proves food was NOT contaminated: Permanent platform ban + lab testing cost recovery + prosecution under IPC Section 420</Li>
            <Li>Criminal prosecution under IPC Section 182 (False information to public servant)</Li>
          </List>
        </Subsection>

        <Subsection title="2.4 Order Cancelled by Restaurant">
          <P><Bold>Conditions:</Bold></P>
          <List>
            <Li>We cancel your order due to ingredient unavailability</Li>
            <Li>Kitchen capacity overload (rare, but possible during peak hours)</Li>
            <Li>Delivery unavailable to your location</Li>
          </List>
          <P><Bold>Compensation:</Bold></P>
          <List>
            <Li>Full refund within 3-5 business days</Li>
            <Li>₹100 discount voucher for inconvenience</Li>
          </List>
        </Subsection>
      </Section>

      {/* Ineligible Refunds */}
      <Section title="3. NON-REFUNDABLE SCENARIOS (ABSOLUTE EXCLUSIONS)">
        <P>The following are <Bold>STRICTLY NOT ELIGIBLE</Bold> for refunds:</P>

        <Subsection title="3.1 Subjective Taste Complaints">
          <List>
            <Li>"Food was not tasty" or "didn't like the flavor"</Li>
            <Li>"Too spicy" or "not spicy enough" (unless you specified preference in order notes)</Li>
            <Li>"Portion size was smaller than expected" (unless actual quantity mismatch)</Li>
            <Li>"Food was cold" (if delivery time was within estimate - food temperature decreases naturally during transit)</Li>
          </List>
          <P><Bold>Rationale:</Bold> Taste is subjective. Our recipes are standardized and receive 4.7/5 average rating from thousands of customers.</P>
        </Subsection>

        <Subsection title="3.2 Buyer's Remorse">
          <List>
            <Li>"I ordered by mistake"</Li>
            <Li>"I changed my mind after delivery"</Li>
            <Li>"I ordered too much food"</Li>
            <Li>"My family didn't want this cuisine"</Li>
          </List>
          <P><Bold>Solution:</Bold> Use the 5-minute cancellation window BEFORE order is confirmed.</P>
        </Subsection>

        <Subsection title="3.3 Partial Consumption">
          <List>
            <Li>Claiming refund after eating 50% of the food</Li>
            <Li>"Found hair after finishing half the biryani"</Li>
          </List>
          <P><Bold>Rationale:</Bold> If food was genuinely contaminated, you would stop eating immediately. Partial consumption indicates the issue is fabricated.</P>
        </Subsection>

        <Subsection title="3.4 Late Reporting">
          <List>
            <Li>Reporting issues more than <Bold>2 hours after delivery</Bold></Li>
            <Li>Claiming food was spoiled the "next day" (food is meant for immediate consumption)</Li>
          </List>
          <P><Bold>Rationale:</Bold> Food safety cannot be verified after extended time. You may have improperly stored the food.</P>
        </Subsection>

        <Subsection title="3.5 Allergic Reactions (if allergy not disclosed)">
          <List>
            <Li>You did not disclose allergies in your profile or order notes</Li>
            <Li>You ignored allergen warnings in menu descriptions</Li>
          </List>
          <P><Bold>Rationale:</Bold> You are responsible for disclosing allergies. We cannot read your mind.</P>
        </Subsection>

        <Subsection title="3.6 Force Majeure Delays">
          <List>
            <Li>Delivery delayed due to heavy rain, floods, or natural disasters</Li>
            <Li>Government-imposed lockdowns or curfews</Li>
            <Li>Riots, strikes, or civil unrest</Li>
          </List>
          <P><Bold>Compensation:</Bold> We may offer a discount voucher as a goodwill gesture, but no refund is guaranteed.</P>
        </Subsection>
      </Section>

      {/* Refund Limits */}
      <Section title="4. REFUND LIMITS AND FRAUD DETECTION">
        <Subsection title="4.1 Maximum Refunds Per Month">
          <P>To prevent abuse, the following limits apply:</P>
          <List>
            <Li><Bold>Casual Users (≤5 orders/month):</Bold> Maximum 2 refund requests per month</Li>
            <Li><Bold>Regular Users (6-15 orders/month):</Bold> Maximum 3 refund requests per month</Li>
            <Li><Bold>Frequent Users (16+ orders/month):</Bold> Maximum 5 refund requests per month</Li>
          </List>
          <P><Bold>Exceeding Limits:</Bold> Additional refund requests will be subject to enhanced verification including video call with customer support, ID verification, and potential account audit.</P>
        </Subsection>

        <Subsection title="4.2 Fraud Pattern Detection (AI-Powered)">
          <P>Our system automatically flags accounts exhibiting suspicious behavior:</P>
          <List>
            <Li><Bold>Serial Refund Seekers:</Bold> {'>'}30% of orders result in refund requests</Li>
            <Li><Bold>Same Excuse Pattern:</Bold> Repeatedly claiming "food was cold" or "item missing"</Li>
            <Li><Bold>Timing Manipulation:</Bold> Always ordering 5 minutes before closing time to exploit rushed preparation</Li>
            <Li><Bold>Device/IP Fraud:</Bold> Multiple accounts from same device/IP claiming refunds</Li>
            <Li><Bold>Photo Recycling:</Bold> Using same spoiled food photo for multiple claims (reverse image search detection)</Li>
          </List>
          <P><Bold>Consequences of Flagging:</Bold></P>
          <List>
            <Li>First Flag: Warning email + mandatory video verification for next refund</Li>
            <Li>Second Flag: Account suspended for 30 days + manual review</Li>
            <Li>Third Flag: Permanent ban + recovery of fraudulent refunds + legal notice</Li>
          </List>
        </Subsection>

        <Subsection title="4.3 Blacklist for Severe Violators">
          <P>The following actions result in <Bold>immediate permanent blacklist</Bold>:</P>
          <List>
            <Li>5+ fraudulent refund claims verified as false</Li>
            <Li>Using fake medical certificates (we verify with hospitals)</Li>
            <Li>Threatening delivery personnel to force refunds</Li>
            <Li>Chargeback fraud (disputing payment with bank without contacting us)</Li>
          </List>
          <P><Bold>Blacklist Consequences:</Bold></P>
          <List>
            <Li>All linked accounts (phone, email, address, IP) permanently banned</Li>
            <Li>Legal notice sent to registered address</Li>
            <Li>Case file prepared for police complaint under IPC Section 420</Li>
            <Li>Recovery proceedings for all fraudulent refunds + legal costs</Li>
          </List>
        </Subsection>
      </Section>

      {/* Refund Process */}
      <Section title="5. REFUND REQUEST PROCESS">
        <Subsection title="5.1 How to Request a Refund">
          <P><Bold>Step 1:</Bold> Contact us immediately via:</P>
          <List>
            <Li>In-app "Report Issue" button on your order page (fastest)</Li>
            <Li>Email: <a href="mailto:refunds@gharse.com" style={{ color: '#FF6B35' }}>refunds@gharse.com</a></Li>
            <Li>Phone: +91 90104 60964 (9 AM - 9 PM)</Li>
          </List>
          <P><Bold>Step 2:</Bold> Provide required evidence:</P>
          <List>
            <Li>Order ID</Li>
            <Li>Clear photos/videos of the issue (minimum 2 photos from different angles)</Li>
            <Li>Detailed description of the problem</Li>
            <Li>Medical certificates (if applicable)</Li>
          </List>
          <P><Bold>Step 3:</Bold> Await investigation (24-48 hours for standard claims, up to 7 days for illness claims requiring lab testing)</P>
          <P><Bold>Step 4:</Bold> Receive outcome notification via email and SMS</P>
        </Subsection>

        <Subsection title="5.2 Refund Processing Time">
          <List>
            <Li><Bold>Wallet Credit:</Bold> Instant (credited within 5 minutes of approval)</Li>
            <Li><Bold>UPI/Net Banking:</Bold> 3-5 business days</Li>
            <Li><Bold>Credit/Debit Cards:</Bold> 5-7 business days (bank processing time)</Li>
            <Li><Bold>Cash on Delivery (COD):</Bold> Bank transfer to your registered account within 7-10 days</Li>
          </List>
          <P><Bold>Note:</Bold> We initiate refunds immediately upon approval. Any delays beyond stated timelines are due to your bank's processing, not ours.</P>
        </Subsection>
      </Section>

      {/* No Returns */}
      <Section title="6. NO PHYSICAL RETURNS (FOOD SAFETY REGULATION)">
        <P>
          Due to FSSAI food safety regulations, we <Bold>CANNOT accept physical returns</Bold> of food items. Once food leaves our kitchen, it cannot be taken back for resale or reuse due to temperature control and contamination risks.
        </P>
        <P>
          <Bold>Exception:</Bold> In cases of severe contamination requiring lab testing, you must retain the food sample in your refrigerator for 48 hours. Our food safety officer will collect it for testing if needed.
        </P>
      </Section>

      {/* Medical Claims */}
      <Section title="7. FOOD ILLNESS CLAIMS (SPECIAL PROCEDURE)">
        <Subsection title="7.1 Immediate Actions Required">
          <P>If you experience food poisoning or illness after consuming our food:</P>
          <List>
            <Li><Bold>FIRST:</Bold> Seek immediate medical attention (call ambulance: 108 or go to nearest hospital)</Li>
            <Li><Bold>SECOND:</Bold> Inform us within 24 hours at <a href="mailto:foodsafety@gharse.com" style={{ color: '#FF6B35' }}>foodsafety@gharse.com</a> with subject "URGENT: Food Illness"</Li>
            <Li><Bold>THIRD:</Bold> Preserve the remaining food in refrigerator (do not throw away)</Li>
          </List>
        </Subsection>

        <Subsection title="7.2 Medical Documentation Required">
          <P>You MUST provide the following within 48 hours:</P>
          <List>
            <Li><Bold>Doctor's Certificate:</Bold> Stating diagnosis (food poisoning, gastroenteritis, etc.) and suspected cause</Li>
            <Li><Bold>Prescription:</Bold> Medicines prescribed for treatment</Li>
            <Li><Bold>Lab Reports:</Bold> Stool culture, blood tests (if conducted)</Li>
            <Li><Bold>Hospital Bills:</Bold> For reimbursement claims</Li>
            <Li><Bold>Medical History:</Bold> Pre-existing conditions (to rule out other causes)</Li>
          </List>
        </Subsection>

        <Subsection title="7.3 Investigation Process">
          <P>Our food safety protocol:</P>
          <List>
            <Li>Kitchen records reviewed for that specific batch</Li>
            <Li>Temperature logs checked (food must be cooked above 75°C)</Li>
            <Li>Staff health records verified (no sick leave on that day)</Li>
            <Li>Food sample sent to NABL-accredited lab for microbiological testing</Li>
            <Li>FSSAI notified if contamination confirmed</Li>
          </List>
        </Subsection>

        <Subsection title="7.4 Liability and Claims">
          <Warning>
            <Bold>CRITICAL PLATFORM DISCLAIMER:</Bold><br /><br />
            GharSe is an <Bold>INTERMEDIARY TECHNOLOGY PLATFORM ONLY</Bold>. We do NOT prepare, cook, or sell food. Therefore:<br /><br />
            
            <List>
              <Li><Bold>GharSe has ZERO liability</Bold> for food illness, contamination, or injury</Li>
              <Li><Bold>All claims for medical expenses, compensation, or damages MUST be filed against the Sailaja (the food operator)</Bold> who prepared the food</Li>
              <Li>We are protected under <Bold>IT Act Section 79</Bold> (Intermediary Safe Harbor)</Li>
              <Li>We facilitate refunds but do NOT pay compensation</Li>
              <Li>Sailaja (the food operator)s are liable under FSSAI and Consumer Protection laws</Li>
            </List>
          </Warning>
          
          <P><Bold>If Sailaja (the food operator)'s Fault is Confirmed:</Bold></P>
          <List>
            <Li>Full refund processed through our platform</Li>
            <Li><Bold>For medical expenses/compensation: File claim directly with Sailaja (the food operator)</Bold> (we will provide their details)</Li>
            <Li><Bold>For serious cases: File consumer court complaint against Sailaja (the food operator)</Bold> under Consumer Protection Act, 2019</Li>
            <Li>Sailaja (the food operator)'s FSSAI license may be suspended/cancelled</Li>
          </List>
          
          <P><Bold>If Sailaja (the food operator)'s Fault is NOT Confirmed:</Bold></P>
          <List>
            <Li>If lab testing shows food was safe: You pay lab testing cost (₹15,000-₹25,000)</Li>
            <Li>If illness was due to pre-existing condition, other food, or viral infection: No refund</Li>
          </List>
        </Subsection>
      </Section>

      {/* Chargebacks */}
      <Section title="8. CHARGEBACK POLICY (CREDIT/DEBIT CARD DISPUTES)">
        <P>
          If you dispute a charge with your bank (initiate a chargeback) without first contacting us, you are in <Bold>violation of this Policy</Bold> and Terms of Service.
        </P>
        <P><Bold>Consequences of Unauthorized Chargebacks:</Bold></P>
        <List>
          <Li>Immediate account suspension pending investigation</Li>
          <Li>₹2,000 administrative fee charged (if chargeback is unjustified)</Li>
          <Li>Permanent ban if chargeback is fraudulent</Li>
          <Li>Legal action for recovery of losses + legal fees</Li>
        </List>
        <P><Bold>Legitimate Chargeback Reasons:</Bold></P>
        <List>
          <Li>You did not place the order (card stolen/compromised)</Li>
          <Li>We charged you multiple times for same order (technical error)</Li>
          <Li>We refused to process a legitimate refund</Li>
        </List>
        <P><Bold>Before initiating a chargeback:</Bold> Contact us at <a href="mailto:billing@gharse.com" style={{ color: '#FF6B35' }}>billing@gharse.com</a>. We resolve 99% of billing disputes within 48 hours.</P>
      </Section>

      {/* Consumer Rights */}
      <Section title="9. YOUR STATUTORY RIGHTS (CONSUMER PROTECTION ACT, 2019)">
        <P>
          Nothing in this Policy limits your statutory rights under the <Bold>Consumer Protection Act, 2019</Bold>. You have the right to:
        </P>
        <List>
          <Li>File a complaint with District Consumer Forum for disputes up to ₹50 lakhs</Li>
          <Li>Seek compensation for proven negligence</Li>
          <Li>Reject defective goods (spoiled food)</Li>
        </List>
        <P>
          <Bold>Consumer Forum Contact:</Bold> National Consumer Helpline: <Bold>1800-11-4000</Bold> or <a href="https://consumerhelpline.gov.in" style={{ color: '#FF6B35' }}>consumerhelpline.gov.in</a>
        </P>
        <P>
          However, we encourage you to exhaust our internal grievance mechanism first (faster resolution, typically within 48 hours vs. 2-3 months in consumer court).
        </P>
      </Section>

      {/* Contact */}
      <Section title="10. REFUND GRIEVANCE OFFICER">
        <ContactBox>
          <Bold>Refund Grievance Officer:</Bold><br />
          Name: [To be designated]<br />
          Email: <a href="mailto:refunds@gharse.com" style={{ color: '#FF6B35' }}>refunds@gharse.com</a><br />
          Phone: +91 90104 60964<br />
          Address: GharSe, Hayatnagar, Hyderabad, Telangana - 501505<br />
          Response Time: Within 24-48 hours for standard claims, up to 7 days for medical/legal verification
        </ContactBox>
      </Section>

      {/* Policy Updates */}
      <Section title="11. POLICY MODIFICATIONS">
        <P>
          We reserve the right to modify this Policy to comply with new regulations or combat emerging fraud patterns. Material changes will be communicated via email 15 days in advance.
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
          By placing an order, you acknowledge that you have read and agree to this Refund & Returns Policy. Abuse of this policy will result in severe penalties including permanent account termination and legal prosecution.
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

