/**
 * NEW FILE: Terms of Service Page
 * Purpose: Comprehensive master agreement governing platform usage
 * Legal Standard: Indian Contract Act 1872 + Consumer Protection Act 2019
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for GharSe - Legal agreement governing platform usage, orders, and user obligations. Food business operated by Independent Home Chef; technology by TechBantu IT Solutions LLC.',
};

export default function TermsOfServicePage() {
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
          TERMS OF SERVICE
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 2.0 (Comprehensive Legal Rewrite)<br />
          Governing Laws: Indian Contract Act, 1872 | Consumer Protection Act, 2019 | IT Act § 79 (India) | California Corporations Code | FSSAI Regulations (Food Operator Only)<br />
          Food Business Operator: Bantu'S kitchen (FSSAI Reg: 23625028002731) | Technology Provider: TechBantu IT Solutions LLC<br />
          Jurisdiction: Hyderabad, Telangana, India (Food Disputes) | California, USA (Technology Disputes - TechBantu Discretion)
        </p>
      </div>

      {/* Introduction */}
      <Section title="1. AGREEMENT TO TERMS">
        <Warning>
          <Bold>CRITICAL JURISDICTIONAL NOTICE - PLATFORM STRUCTURE AND LIABILITY BOUNDARIES</Bold><br /><br />
          
          <Bold>I. FOOD BUSINESS OPERATOR (INDEPENDENT CONTRACTOR)</Bold><br /><br />
          
          The food business accessible through the GharSe brand and platform is <Bold>operated exclusively and independently by Bantu'S kitchen</Bold> ("Food Operator"), an individual sole proprietorship registered as a petty food retailer under FSSAI Registration Number 23625028002731, operated by Sailaja from Plot no 17, Road no 3, Padmalaya Nagar, Hayatnagar, Pedda Amberpet (Kalan), Hayathnagar, Rangareddy, Telangana - 501505, India. The Food Operator:<br /><br />
          
          <List>
            <Li><Bold>FSSAI Registration:</Bold> 23625028002731 (Petty Retailer - Prepared Foods category, valid until 23 June 2027, annual turnover limit ₹12 Lakhs)</Li>
            <Li>Operates as an <Bold>independent business entity</Bold>, NOT as an employee, agent, partner, franchisee, or joint venturer of TechBantu IT Solutions LLC</Li>
            <Li>Bears <Bold>sole and exclusive responsibility</Bold> for all food preparation, ingredient sourcing, cooking, packaging, food safety compliance, FSSAI licensing, delivery logistics, customer refunds, order cancellations, and food-related customer service</Li>
            <Li>Is the <Bold>sole liable party</Bold> under the Food Safety and Standards Act, 2006 (India), Consumer Protection Act, 2019 (India), and all applicable Indian food safety, consumer protection, and commercial laws</Li>
            <Li>Maintains independent control over menu pricing, food preparation methods, business hours, and all operational decisions</Li>
          </List>
          
          <Bold>II. TECHNOLOGY PROVIDER (PURE INTERMEDIARY - ZERO FOOD LIABILITY)</Bold><br /><br />
          
          <Bold>TechBantu IT Solutions LLC</Bold>, a limited liability company organized under the laws of the State of California, United States of America, with principal place of business in California, USA, provides <Bold>only software-as-a-service (SaaS) technology</Bold> to the Independent Home Chef. TechBantu IT Solutions LLC:<br /><br />
          
          <List>
            <Li>Operates as a <Bold>pure technology intermediary</Bold> protected under Section 79 of the Information Technology Act, 2000 (India) (Safe Harbor for Intermediaries) and, where applicable, 47 U.S.C. § 230 (Communications Decency Act) (US)</Li>
            <Li>Provides <Bold>only digital infrastructure</Bold>: website hosting, mobile application interface, backend database management, payment gateway integration, order routing software, and cloud computing services</Li>
            <Li><Bold>Does NOT participate in, control, supervise, or have any involvement</Bold> in food preparation, cooking, ingredient selection, food safety protocols, packaging, delivery operations, or food business management</Li>
            <Li><Bold>Has ZERO PRESENCE in India</Bold> for food operations purposes; maintains no kitchen facilities, employs no food handlers, holds no FSSAI licenses, and conducts no food-related activities in India or elsewhere</Li>
            <Li>Operates under a <Bold>commercial software licensing agreement</Bold> with the Food Operator, wherein TechBantu provides technology services for a fee, with no profit-sharing, partnership interest, or operational control over food business</Li>
          </List>
          
          <Bold>III. EXPLICIT STATUTORY PROTECTIONS AND LIABILITY CARVE-OUTS</Bold><br /><br />
          
          TechBantu IT Solutions LLC is <Bold>absolutely and categorically exempt</Bold> from ALL food-related liability pursuant to:<br /><br />
          
          <List>
            <Li><Bold>IT Act, 2000, § 79 (India)</Bold>: Intermediary liability exemption - "An intermediary shall not be liable for any third party information, data, or communication link made available or hosted by him" where intermediary functions as a mere conduit providing technical services</Li>
            <Li><Bold>Consumer Protection Act, 2019, § 2(7) (India)</Bold>: Definition of "deficiency in service" explicitly excludes technology platforms that do not manufacture, sell, or provide the underlying service (food)</Li>
            <Li><Bold>California Corporations Code § 17701.04</Bold>: Limited liability protection for LLC members from obligations of the entity</Li>
            <Li><Bold>International law principle of separate legal personality</Bold>: US-based technology company bears no liability for Indian food operator's independent business activities</Li>
          </List>
          
          <Bold>IV. ABSOLUTE LIABILITY PLACEMENT</Bold><br /><br />
          
          <Bold>ALL FOOD-RELATED LIABILITY—INCLUDING BUT NOT LIMITED TO FOOD SAFETY, QUALITY, CONTAMINATION, SPOILAGE, ALLERGENS, ILLNESS, INJURY, DEATH, CONSUMER COMPLAINTS, REFUNDS, AND REGULATORY VIOLATIONS—RESTS EXCLUSIVELY WITH THE INDEPENDENT HOME CHEF (FOOD OPERATOR), NOT TECHBANTU IT SOLUTIONS LLC.</Bold><br /><br />
          
          By using this Platform, you <Bold>irrevocably acknowledge and agree</Bold> that any claims, complaints, disputes, or legal actions related to food must be directed solely against the Independent Home Chef, and you <Bold>unconditionally waive</Bold> any right to hold TechBantu IT Solutions LLC liable for food operations.
        </Warning>
        
        <P>
          These Terms of Service ("Terms," "Agreement") constitute a legally binding contract between you ("User," "Customer," "you," "your") and the <Bold>Independent Home Chef</Bold> operating under the <Bold>GharSe</Bold> brand name ("Food Operator," "Chef," "Seller"), facilitated through technology services provided by <Bold>TechBantu IT Solutions LLC</Bold> ("Technology Provider," "Platform Provider," "TechBantu"), a California limited liability company. This Agreement is governed by the Indian Contract Act, 1872, Consumer Protection Act, 2019, and applicable California and US federal law where pertinent to technology services.
        </P>
        <P>
          By accessing, browsing, or placing an order on this Platform (website, mobile application, or any other digital interface), you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations.
        </P>
        <Warning>
          <Bold>MANDATORY ACCEPTANCE:</Bold> If you do not agree to these Terms, you are PROHIBITED from using this Platform. Continued use after modifications constitutes acceptance of updated Terms.
        </Warning>
      </Section>

      {/* Eligibility */}
      <Section title="2. ELIGIBILITY AND ACCOUNT CREATION">
        <Subsection title="2.1 Age Requirement (Non-Negotiable)">
          <P>
            Users must be <Bold>18 years of age or older</Bold> to create an account or place orders. We employ age verification mechanisms including:
          </P>
          <List>
            <Li>Government-issued ID verification (Aadhaar, PAN, Driver's License)</Li>
            <Li>Payment method authentication (credit/debit cards require adult accounts)</Li>
            <Li>Behavioral pattern analysis (AI-based fraud detection)</Li>
          </List>
          <P>
            <Bold>Penalty for False Age Declaration:</Bold> ₹2,00,000 (Two Lakhs) penalty + immediate account termination + legal action under IPC Section 420 (Cheating and dishonestly inducing delivery of property).
          </P>
        </Subsection>

        <Subsection title="2.2 Account Security">
          <P>You are solely responsible for:</P>
          <List>
            <Li>Maintaining confidentiality of your password and account credentials</Li>
            <Li>All activities that occur under your account, including unauthorized access</Li>
            <Li>Immediately notifying us of any suspected breach via <a href="mailto:security@gharse.com" style={{ color: '#FF6B35' }}>security@gharse.com</a></Li>
          </List>
          <P>
            We will NOT be liable for losses arising from unauthorized use of your account unless proven to be our direct negligence.
          </P>
        </Subsection>

        <Subsection title="2.3 Prohibited Account Activities">
          <P>The following are STRICTLY PROHIBITED and will result in immediate termination:</P>
          <List>
            <Li>Creating multiple accounts to abuse referral programs or coupons</Li>
            <Li>Using stolen credit cards or fraudulent payment methods</Li>
            <Li>Impersonating another person or entity</Li>
            <Li>Sharing accounts with minors (below 18 years)</Li>
            <Li>Automated bot/scraper access to place bulk orders</Li>
          </List>
        </Subsection>
      </Section>

      {/* Orders */}
      <Section title="3. ORDER PLACEMENT AND ACCEPTANCE">
        <Subsection title="3.1 Offer and Acceptance (Indian Contract Act, 1872)">
          <P>
            When you place an order, you make an <Bold>offer to purchase</Bold> under Section 2(a) of the Indian Contract Act. We reserve the right to accept or reject this offer at our sole discretion. An order is considered <Bold>accepted</Bold> only when:
          </P>
          <List>
            <Li>You receive an <Bold>Order Confirmation Email</Bold> with a unique Order ID</Li>
            <Li>Payment is successfully processed (for prepaid orders)</Li>
            <Li>The order passes our fraud detection systems</Li>
          </List>
          <P>
            <Bold>No Contract = No Obligation:</Bold> If we do not send a confirmation, no contract exists, and we are not obligated to fulfill the order.
          </P>
        </Subsection>

        <Subsection title="3.2 Pricing and Payment">
          <P><Bold>All prices are in Indian Rupees (₹) and include GST unless stated otherwise.</Bold></P>
          <P>We reserve the right to:</P>
          <List>
            <Li>Modify menu prices at any time without prior notice</Li>
            <Li>Implement dynamic pricing based on demand, kitchen capacity, or ingredient availability</Li>
            <Li>Charge delivery fees based on distance and order value</Li>
          </List>
          <P>
            <Bold>Price Guarantee:</Bold> Once your order is confirmed, the price is locked and will not change even if menu prices increase thereafter.
          </P>
        </Subsection>

        <Subsection title="3.3 Cancellation Window">
          <P>
            You may cancel an order <Bold>within 5 minutes</Bold> of placement for a full refund (prepaid orders only). After this window:
          </P>
          <List>
            <Li>Cancellation is subject to our approval (if food preparation has not started)</Li>
            <Li>If preparation has started, a <Bold>50% cancellation fee</Bold> applies to cover ingredient costs</Li>
            <Li>No cancellation allowed once order is marked "Out for Delivery"</Li>
          </List>
        </Subsection>

        <Subsection title="3.4 Delivery Estimates">
          <P>
            Estimated delivery times are <Bold>approximate</Bold> and not guaranteed. Delays may occur due to:
          </P>
          <List>
            <Li>High order volume during peak hours</Li>
            <Li>Adverse weather conditions (heavy rain, storms)</Li>
            <Li>Traffic congestion or road closures</Li>
            <Li>Government-imposed restrictions (lockdowns, curfews)</Li>
          </List>
          <P>
            <Bold>Late Delivery Compensation:</Bold> If delivery exceeds the estimated time by more than 30 minutes (excluding force majeure events), you will receive a ₹50 discount voucher for your next order.
          </P>
        </Subsection>
      </Section>

      {/* Prohibited Activities */}
      <Section title="4. PROHIBITED CONDUCT">
        <P>You shall NOT engage in the following activities:</P>
        <List>
          <Li><Bold>Fraudulent Orders:</Bold> Placing fake orders, providing false delivery addresses, or using stolen payment methods</Li>
          <Li><Bold>Abuse of Refund Policy:</Bold> Falsely claiming food is spoiled, not delivered, or incorrect to obtain refunds</Li>
          <Li><Bold>Harassment:</Bold> Abusive behavior towards delivery personnel or customer support staff</Li>
          <Li><Bold>Reverse Engineering:</Bold> Decompiling, scraping, or attempting to extract our algorithms, AI models, or source code</Li>
          <Li><Bold>Resale:</Bold> Purchasing food for commercial resale without written authorization</Li>
          <Li><Bold>Account Farming:</Bold> Creating multiple accounts to exploit promotional offers</Li>
        </List>
        <Warning>
          <Bold>PENALTIES FOR VIOLATIONS:</Bold>
          <List>
            <Li>First Offense: Warning + temporary account suspension (7 days)</Li>
            <Li>Second Offense: Permanent account termination + blacklist from future registration</Li>
            <Li>Severe Violations: ₹5,00,000 (Five Lakhs) penalty + criminal prosecution under IPC Section 420 (Cheating), Section 66C of IT Act (Identity Theft), and Section 66D (Cheating by personation using computer resources)</Li>
          </List>
        </Warning>
      </Section>

      {/* Food Safety */}
      <Section title="5. FOOD SAFETY AND ALLERGEN DISCLOSURE">
        <Subsection title="5.1 FSSAI Compliance">
          <P>
            We operate under a valid <Bold>FSSAI License</Bold> and comply with Food Safety and Standards Act, 2006. All food is prepared in hygienic conditions following mandated safety protocols.
          </P>
        </Subsection>

        <Subsection title="5.2 Allergen Responsibility">
          <P>
            It is YOUR responsibility to disclose food allergies and dietary restrictions in your user profile or order notes. We make reasonable efforts to accommodate, but <Bold>CANNOT GUARANTEE</Bold> cross-contamination prevention in shared kitchens.
          </P>
          <P>
            <Bold>CRITICAL WARNING:</Bold> If you have severe allergies (anaphylaxis risk), consult our menu directly or contact us before ordering. We are NOT liable for allergic reactions if you failed to disclose allergies.
          </P>
        </Subsection>

        <Subsection title="5.3 Vulnerable Populations">
          <P>
            Pregnant women, elderly persons (65+), immunocompromised individuals, and those with chronic illnesses should exercise caution when consuming:
          </P>
          <List>
            <Li>Raw or undercooked items (eggs, meat)</Li>
            <Li>Spicy foods (gastric distress risk)</Li>
            <Li>Dairy products (if lactose intolerant)</Li>
          </List>
          <P>Consult your physician before ordering if you have medical dietary restrictions.</P>
        </Subsection>
      </Section>

      {/* Liability */}
      <Section title="6. LIMITATION OF LIABILITY">
        <Warning>
          <Bold>ABSOLUTE ZERO LIABILITY FOR TECHBANTU IT SOLUTIONS LLC - STATUTORY INTERMEDIARY PROTECTIONS</Bold><br /><br />
          
          TechBantu IT Solutions LLC, operating as a <Bold>PURE TECHNOLOGY INTERMEDIARY</Bold> under IT Act § 79 (India) and 47 U.S.C. § 230 (US), is <Bold>CATEGORICALLY AND ABSOLUTELY EXEMPT</Bold> from ALL liability for:
          <List>
            <Li>Food quality, safety, preparation, contamination, spoilage, temperature control, or allergen management</Li>
            <Li>Food-related illness, injury, allergic reactions, anaphylaxis, hospitalization, or death</Li>
            <Li>Actions, omissions, negligence, or intentional misconduct of the Independent Home Chef in food operations</Li>
            <Li>Medical expenses, hospitalization costs, treatment fees, lost wages, or consequential damages arising from food consumption</Li>
            <Li>Regulatory violations by the Independent Home Chef under FSSAI, Consumer Protection Act, or any Indian food safety laws</Li>
            <Li>Delivery delays, order cancellations, refund disputes, or food business operational matters</Li>
            <Li>Third-party claims arising from Independent Home Chef's business activities</Li>
          </List>
          
          <Bold>Legal Basis for Exemption:</Bold>
          <List>
            <Li><Bold>IT Act § 79(1)</Bold>: "Intermediary not to be liable in certain cases" - TechBantu provides only technical conduit services</Li>
            <Li><Bold>Consumer Protection Act § 2(7)</Bold>: Technology platform providers who do not sell, manufacture, or provide the underlying service (food) are NOT "service providers" liable for deficiency</Li>
            <Li><Bold>California Corporations Code § 17701.04(a)</Bold>: LLC members and managers have no personal liability for LLC obligations</Li>
            <Li><Bold>Doctrine of Privity of Contract</Bold>: No contractual relationship exists between TechBantu and end customers regarding food services</Li>
          </List>
          
          <Bold>ALL FOOD-RELATED LIABILITY RESTS EXCLUSIVELY WITH THE INDEPENDENT HOME CHEF, NOT TECHBANTU IT SOLUTIONS LLC.</Bold>
        </Warning>
        
        <Subsection title="6.1 Platform Liability (Limited to Technology Services Only)">
          <P>
            Our ONLY liability is for failures of our technology platform itself (website downtime, payment processing errors). Maximum liability:
          </P>
          <List>
            <Li><Bold>For Payment Errors:</Bold> Refund of incorrectly charged amount only</Li>
            <Li><Bold>For Platform Technical Failures:</Bold> Maximum ₹1,000 compensation for proven losses due to OUR technical errors</Li>
            <Li><Bold>For Data Breaches:</Bold> As per DPDPA 2023 statutory limits (platform data only, not restaurant data)</Li>
          </List>
          <P>
            <Bold>We have ZERO liability for Partner Restaurant actions, food quality, or any food-related claims.</Bold>
          </P>
        </Subsection>

        <Subsection title="6.2 Exhaustive Exclusions of TechBantu Liability (Statutory and Contractual)">
          <P>TechBantu IT Solutions LLC is <Bold>ABSOLUTELY, CATEGORICALLY, AND IRREVOCABLY EXEMPT</Bold> from ALL liability for:</P>
          
          <P><Bold>A. Food-Related Claims (Covered by IT Act § 79 Intermediary Exemption):</Bold></P>
          <List>
            <Li><Bold>Food safety and quality:</Bold> Contamination, spoilage, foreign objects, bacterial/viral presence, chemical adulter ation, improper temperature control, cross-contamination, expired ingredients</Li>
            <Li><Bold>Health consequences:</Bold> Food poisoning, gastroenteritis, allergic reactions, anaphylactic shock, hospitalization, long-term illness, disability, death</Li>
            <Li><Bold>Regulatory violations:</Bold> FSSAI non-compliance, food safety violations, hygiene standard failures, unlicensed operations</Li>
            <Li><Bold>Preparation defects:</Bold> Undercooked food, improper handling, unsanitary conditions, allergen disclosure failures</Li>
          </List>
          
          <P><Bold>B. Food Operator's Business Operations (Independent Contractor Relationship):</Bold></P>
          <List>
            <Li><Bold>Operational decisions:</Bold> Menu pricing, ingredient selection, business hours, order acceptance/rejection, refund policies</Li>
            <Li><Bold>Delivery logistics:</Bold> Timing, route selection, packaging quality, delivery personnel conduct</Li>
            <Li><Bold>Customer service:</Bold> Order accuracy, customer complaints, refund processing, communication quality</Li>
            <Li><Bold>Employment matters:</Bold> Independent Home Chef's employees, contractors, or agents (TechBantu has NO employer-employee relationship)</Li>
          </List>
          
          <P><Bold>C. Third-Party Services and Force Majeure:</Bold></P>
          <List>
            <Li><Bold>Payment gateway failures:</Bold> Stripe, Razorpay, or other third-party payment processor errors</Li>
            <Li><Bold>Force majeure:</Bold> Acts of God, pandemics, war, terrorism, government orders, natural disasters</Li>
            <Li><Bold>Third-party claims:</Bold> Lawsuits by individuals who consumed food prepared by Independent Home Chef</Li>
          </List>
          
          <P><Bold>D. Consequential and Incidental Damages (Contractual Waiver):</Bold></P>
          <List>
            <Li>Loss of profits, business interruption, loss of business opportunity</Li>
            <Li>Emotional distress, mental anguish, pain and suffering</Li>
            <Li>Reputational harm, defamation, or loss of goodwill</Li>
            <Li>Punitive or exemplary damages under any theory of liability</Li>
          </List>
          
          <P><Bold>Legal Basis for Complete Exemption:</Bold></P>
          <List>
            <Li><Bold>IT Act § 79</Bold>: Technology intermediary providing mere conduit services bears no liability for third-party content or services</Li>
            <Li><Bold>Consumer Protection Act § 2(38)</Bold>: "Service provider" definition excludes pure technology platforms</Li>
            <Li><Bold>Indian Contract Act § 206-208</Bold>: Agent acting on behalf of disclosed principal (Independent Home Chef) - principal liable, not agent</Li>
            <Li><Bold>California Civil Code § 1714.45</Bold>: Service provider immunity from third-party food service claims</Li>
          </List>
          
          <P>
            <Bold>MANDATORY CLAIMS DIRECTION: ALL FOOD-RELATED, FOOD-BUSINESS, AND REGULATORY CLAIMS MUST BE FILED EXCLUSIVELY AGAINST THE INDEPENDENT HOME CHEF (FOOD OPERATOR), NOT TECHBANTU IT SOLUTIONS LLC. FILING CLAIMS AGAINST TECHBANTU SHALL BE DEEMED FRIVOLOUS AND SUBJECT TO SANCTIONS UNDER CPC ORDER VII Rule 11 (India) AND CALIFORNIA CCP § 128.5 (US).</Bold>
          </P>
        </Subsection>

        <Subsection title="6.3 Indemnification (You Agree Not to Sue TechBantu)">
          <P>
            You <Bold>UNCONDITIONALLY AGREE</Bold> to <Bold>indemnify, defend, and hold harmless</Bold> TechBantu IT Solutions LLC, its owners, directors, employees, contractors, and partners from ANY AND ALL claims, lawsuits, damages, losses, liabilities, costs, and expenses (including legal fees) arising from:
          </P>
          <List>
            <Li><Bold>ANY food-related claims:</Bold> food poisoning, contamination, allergic reactions, illness, injury, or death</Li>
            <Li><Bold>Food operator negligence:</Bold> Sailaja's poor hygiene, FSSAI violations, food safety failures</Li>
            <Li><Bold>Medical expenses:</Bold> hospital bills, treatment costs, lost wages due to food illness</Li>
            <Li>Your violation of these Terms</Li>
            <Li>Your fraudulent activities or false refund claims</Li>
            <Li>Your provision of false information or fake medical certificates</Li>
            <Li>Your infringement of third-party rights</Li>
            <Li><Bold>Any lawsuit you file against TechBantu</Bold> for food-related issues (you agree to pay legal costs if you lose)</Li>
          </List>
          <P>
            <Bold>BY USING THIS PLATFORM, YOU WAIVE YOUR RIGHT TO SUE TECHBANTU IT SOLUTIONS LLC FOR ANY FOOD-RELATED CLAIMS.</Bold> You agree that all such claims must be directed solely against Sailaja (the food operator).
          </P>
        </Subsection>
      </Section>

      {/* Intellectual Property */}
      <Section title="7. INTELLECTUAL PROPERTY RIGHTS - DUAL OWNERSHIP STRUCTURE">
        <Warning>
          <Bold>CRITICAL NOTICE: STRICT IP SEGREGATION - NO JOINT OWNERSHIP</Bold><br /><br />
          
          All intellectual property on this Platform is <Bold>strictly segregated</Bold> between two independent entities with <Bold>ZERO joint ownership, partnership, or co-created works</Bold>. There is <Bold>NO partnership, joint venture, or profit-sharing relationship</Bold> between TechBantu IT Solutions LLC and the Independent Home Chef.
        </Warning>
        
        <Subsection title="7.1 Independent Home Chef Intellectual Property (Food Business Assets)">
          <P>
            The following assets are the <Bold>sole and exclusive property of the Independent Home Chef</Bold>, with <Bold>NO ownership interest</Bold> held by TechBantu IT Solutions LLC:
          </P>
          <List>
            <Li><Bold>Recipes, formulations, and cooking methods:</Bold> Proprietary culinary creations protected under Indian Copyright Act, 1957 (as literary/artistic works) and common law trade secret protection</Li>
            <Li><Bold>Food photography and menu descriptions:</Bold> Visual and textual content created by or licensed to the Independent Home Chef</Li>
            <Li><Bold>Brand identity "GharSe" (food business context):</Bold> Trade name and associated goodwill in food services sector; Independent Home Chef has exclusive right to use in connection with food business operations</Li>
            <Li><Bold>Customer relationships and food business goodwill:</Bold> All customer data related to food preferences, order history, and culinary reputation vests in Independent Home Chef</Li>
            <Li><Bold>FSSAI license and regulatory approvals:</Bold> All food safety certifications, licenses, and regulatory permissions are held exclusively by Independent Home Chef</Li>
          </List>
          <P>
            <Bold>Legal Basis:</Bold> Copyright Act, 1957 (§ 13 - original literary, artistic works); Trade Marks Act, 1999 (§ 9 - unregistered trade name rights); Indian Penal Code § 378 (theft of trade secrets); common law doctrines of trade secret protection.
          </P>
        </Subsection>
        
        <Subsection title="7.2 TechBantu IT Solutions LLC Intellectual Property (Technology Assets)">
          <P>
            The following assets are the <Bold>sole and exclusive property of TechBantu IT Solutions LLC</Bold>, a California limited liability company, with <Bold>NO ownership interest</Bold> held by the Independent Home Chef:
          </P>
          <List>
            <Li><Bold>Proprietary software code and algorithms:</Bold> Source code, object code, backend logic, database schemas, API architecture, AI/ML algorithms (dynamic pricing, demand prediction, recommendation engines) protected under 17 U.S.C. § 102 (US Copyright Act) and Indian Copyright Act, 1957</Li>
            <Li><Bold>Platform UI/UX design and interface elements:</Bold> Visual design, user interface components, graphic elements, color schemes, layout structures protected as compilation works and design patents (where applicable)</Li>
            <Li><Bold>Technical infrastructure:</Bold> Domain names, hosting architecture, cloud computing resources, server configurations, CDN networks, SSL certificates</Li>
            <Li><Bold>Technology trademarks and service marks:</Bold> "TechBantu," "TechBantu IT Solutions," and associated technology-related branding (NOT food-related branding)</Li>
            <Li><Bold>Data analytics and business intelligence:</Bold> Aggregated platform usage data, technical performance metrics, system optimization algorithms (excluding customer personal data or food business information)</Li>
            <Li><Bold>Patents and patent applications:</Bold> Pending patent applications for novel technology inventions (if any) under Patents Act, 1970 (India) and 35 U.S.C. (US Patent Act)</Li>
          </List>
          <P>
            <Bold>Legal Basis:</Bold> 17 U.S.C. § 102 (US Copyright Act - software as literary work); 35 U.S.C. § 101 (patent protection for algorithms); California Uniform Trade Secrets Act (Cal. Civ. Code § 3426); Indian Copyright Act, 1957; Information Technology Act, 2000, § 43 (unauthorized access to computer systems - criminal penalties).
          </P>
        </Subsection>
        
        <Subsection title="7.3 Commercial Relationship - Software Licensing, NOT Partnership">
          <P>
            TechBantu IT Solutions LLC provides technology services to the Independent Home Chef under a <Bold>commercial software-as-a-service (SaaS) licensing agreement</Bold>. This is a <Bold>vendor-client relationship</Bold>, NOT a partnership, joint venture, franchise, or co-ownership arrangement.
          </P>
          <P>
            Key Terms of Technology Service Agreement:
          </P>
          <List>
            <Li><Bold>Service Model:</Bold> TechBantu licenses software on a subscription/service fee basis (NOT profit-sharing or revenue partnership)</Li>
            <Li><Bold>No Operational Control:</Bold> TechBantu has ZERO control, supervision, or involvement in food business operations, pricing, menu selection, or customer service</Li>
            <Li><Bold>Independent Contractor Status:</Bold> Independent Home Chef operates as independent business entity using TechBantu's technology tools (analogous to Shopify merchant using Shopify platform)</Li>
            <Li><Bold>Separate Legal Entities:</Bold> No joint liability, no agency relationship, no ostensible partnership under Indian Partnership Act, 1932</Li>
          </List>
        </Subsection>
        
        <Subsection title="7.4 Prohibited Uses and Severe Enforcement">
          <P>
            <Bold>STRICTLY PROHIBITED:</Bold> Users are absolutely prohibited from:
          </P>
          <List>
            <Li>Copying, reproducing, or reverse-engineering TechBantu's proprietary software, algorithms, or technical infrastructure</Li>
            <Li>Scraping website data, menu information, or customer data using automated tools or bots</Li>
            <Li>Using "GharSe" trademark or brand identity for competing food businesses</Li>
            <Li>Copying Independent Home Chef's recipes for commercial use</Li>
            <Li>Decompiling, disassembling, or attempting to derive source code from TechBantu's software</Li>
          </List>
          <Warning>
            <Bold>CRIMINAL AND CIVIL PENALTIES FOR IP THEFT (STRICTLY ENFORCED):</Bold>
            <List>
              <Li><Bold>Software/Algorithm Theft:</Bold> ₹50,00,000 (Fifty Lakhs) statutory damages + injunctive relief + criminal prosecution under IT Act § 43 (imprisonment up to 3 years) + IPC § 378 (theft) + California Penal Code § 502 (computer crimes)</Li>
              <Li><Bold>Website Data Scraping:</Bold> ₹25,00,000 (Twenty-Five Lakhs) + imprisonment up to 3 years under IT Act § 43 + civil damages for tortious interference with business</Li>
              <Li><Bold>Trademark Infringement:</Bold> ₹10,00,000 (Ten Lakhs) + criminal prosecution under Trade Marks Act, 1999 § 103-105 (imprisonment up to 3 years) + permanent injunction</Li>
              <Li><Bold>Recipe/Trade Secret Theft:</Bold> ₹15,00,000 (Fifteen Lakhs) + breach of confidence action under common law + unfair competition claims</Li>
            </List>
          </Warning>
          <P>
            <Bold>Jurisdiction for IP Claims:</Bold> TechBantu reserves the right to file IP infringement claims in California, USA (for software/technology IP) or Hyderabad, India (for broader claims), at TechBantu's sole discretion. Independent Home Chef reserves the right to file food business IP claims in Hyderabad, India.
          </P>
        </Subsection>
      </Section>

      {/* Dispute Resolution */}
      <Section title="8. GOVERNING LAW, JURISDICTION, AND DISPUTE RESOLUTION">
        <Warning>
          <Bold>CRITICAL: DUAL JURISDICTIONAL FRAMEWORK - SEGREGATED BY SUBJECT MATTER</Bold><br /><br />
          
          Given the international structure of this Platform (US technology provider + Indian food operator), governing law and jurisdiction are <Bold>strictly bifurcated by subject matter</Bold>:
        </Warning>
        
        <Subsection title="8.1 Governing Law - Bifurcated by Subject Matter">
          <P><Bold>A. Food Business Disputes (Governed Exclusively by Indian Law):</Bold></P>
          <List>
            <Li><Bold>Indian Contract Act, 1872:</Bold> Governs customer-Independent Home Chef food sale contracts</Li>
            <Li><Bold>Consumer Protection Act, 2019:</Bold> Governs consumer rights, refunds, deficiency in service, and food business disputes</Li>
            <Li><Bold>Food Safety and Standards Act, 2006:</Bold> Governs food safety, FSSAI compliance, and food operator liability (<Bold>applies ONLY to Independent Home Chef, NOT TechBantu</Bold>)</Li>
            <Li><Bold>Sale of Goods Act, 1930:</Bold> Governs food product quality, fitness for purpose, and merchant warranties</Li>
          </List>
          
          <P><Bold>B. Technology Services Disputes (Governed by California and US Law):</Bold></P>
          <List>
            <Li><Bold>California Corporations Code:</Bold> Governs TechBantu IT Solutions LLC's corporate structure and limited liability protections</Li>
            <Li><Bold>California Commercial Code:</Bold> Governs software licensing and technology service agreements</Li>
            <Li><Bold>17 U.S.C. (US Copyright Act):</Bold> Protects TechBantu's proprietary software and technology intellectual property</Li>
            <Li><Bold>47 U.S.C. § 230 (Communications Decency Act):</Bold> Federal intermediary immunity for technology platforms from third-party content/service liability</Li>
          </List>
          
          <P><Bold>C. Intermediary Protections (Dual Statutory Framework):</Bold></P>
          <List>
            <Li><Bold>IT Act § 79 (India):</Bold> TechBantu qualifies as "intermediary" exempt from liability for third-party food operations</Li>
            <Li><Bold>Information Technology (Intermediary Guidelines) Rules, 2021 (India):</Bold> TechBantu complies as intermediary providing technical hosting services</Li>
          </List>
        </Subsection>
        
        <Subsection title="8.2 Mandatory Exclusive Jurisdiction for Food Disputes">
          <P>
            <Bold>ALL FOOD-RELATED DISPUTES, CLAIMS, OR LEGAL ACTIONS</Bold> (including but not limited to food orders, quality, safety, delivery, refunds, cancellations, consumer complaints) shall be subject to the <Bold>EXCLUSIVE JURISDICTION</Bold> of the courts located in <Bold>Hyderabad, Telangana, India</Bold>.
          </P>
          <P>
            By placing an order, you <Bold>IRREVOCABLY AND UNCONDITIONALLY CONSENT</Bold> to the exclusive jurisdiction of Hyderabad courts and <Bold>EXPRESSLY WAIVE</Bold> any objection to venue, inconvenient forum, or lack of personal jurisdiction.
          </P>
          <P>
            <Bold>Forum Selection Clause:</Bold> This is a <Bold>mandatory forum selection clause</Bold> enforceable under Indian Contract Act § 28 and international comity principles recognized by Supreme Court of India in <em>ABC Laminart Pvt. Ltd. v. A.P. Agencies</em> (AIR 1989 SC 1239). Any action filed in a different jurisdiction shall be dismissed for improper venue.
          </P>
          <Warning>
            <Bold>ABSOLUTE BAR ON FOOD CLAIMS AGAINST TECHBANTU:</Bold><br /><br />
            
            <Bold>NO food-related claims</Bold> may be filed against TechBantu IT Solutions LLC in <Bold>ANY jurisdiction</Bold> (India, USA, or elsewhere). Such claims are <Bold>VOID AB INITIO</Bold> (void from inception) for lack of subject matter jurisdiction and failure to state a claim upon which relief can be granted.<br /><br />
            
            Filing frivolous food claims against TechBantu subjects the claimant to:
            <List>
              <Li><Bold>India:</Bold> Sanctions under CPC Order VII Rule 11 (rejection of plaint) + costs under Section 35A CPC</Li>
              <Li><Bold>USA (if filed in California):</Bold> Sanctions under California CCP § 128.5 (frivolous action penalties) + Federal Rule 11 sanctions (if filed in federal court)</Li>
            </List>
          </Warning>
        </Subsection>
        
        <Subsection title="8.3 California Jurisdiction for Technology Disputes Only">
          <P>
            Any disputes arising <Bold>solely and exclusively from TechBantu IT Solutions LLC's technology services</Bold> (e.g., software licensing disputes NOT related to food, intellectual property claims related to TechBantu's proprietary code, payment processing technology failures NOT related to food orders) may, at TechBantu's sole discretion, be subject to the jurisdiction of the courts in <Bold>California, United States of America</Bold>.
          </P>
          <P>
            <Bold>Critical Limitation:</Bold> This provision applies ONLY to pure technology disputes with NO connection to food operations.
          </P>
        </Subsection>

        <Subsection title="8.4 Amicable Resolution (First Step - Mandatory Good Faith Effort)">
          <P>
            Before initiating any legal action or arbitration, you <Bold>MUST</Bold> contact the Independent Home Chef's grievance officer at <a href="mailto:grievance@gharse.com" style={{ color: '#FF6B35' }}>grievance@gharse.com</a> to attempt good-faith resolution within <Bold>15 business days</Bold>.
          </P>
          <P>
            Failure to comply with this mandatory pre-litigation requirement may result in dismissal of claims under Indian Contract Act principles of good faith and fair dealing.
          </P>
        </Subsection>

        <Subsection title="8.5 Arbitration (Second Step - Optional Alternative to Litigation)">
          <P>
            If amicable resolution fails, parties <Bold>may mutually agree</Bold> to submit food-related disputes to <Bold>binding arbitration</Bold> under the Arbitration and Conciliation Act, 1996:
          </P>
          <List>
            <Li><Bold>Arbitration Venue:</Bold> Hyderabad, Telangana, India (exclusive)</Li>
            <Li><Bold>Governing Arbitration Law:</Bold> Arbitration and Conciliation Act, 1996 (as amended by Arbitration and Conciliation (Amendment) Act, 2015 and 2019)</Li>
            <Li><Bold>Language:</Bold> English</Li>
            <Li><Bold>Arbitrator:</Bold> Single arbitrator mutually appointed; if no agreement within 30 days, appointed by Chief Justice of Telangana High Court under Section 11</Li>
            <Li><Bold>Cost Allocation:</Bold> Each party bears own legal costs; arbitrator fees split equally unless arbitrator determines otherwise</Li>
            <Li><Bold>Award Finality:</Bold> Arbitration award is final and binding, enforceable under Section 36 of Arbitration Act (limited appeal rights under Section 34 - only for patent illegality, violation of public policy, or procedural irregularities)</Li>
          </List>
          <P>
            <Bold>Note:</Bold> Arbitration is NOT mandatory; parties may proceed directly to Hyderabad courts if preferred.
          </P>
        </Subsection>

        <Subsection title="8.6 Litigation (Third Step - Court Jurisdiction)">
          <P>
            If arbitration is not pursued or arbitration award is challenged, any legal action <Bold>MUST</Bold> be filed in the <Bold>courts of Hyderabad, Telangana, India</Bold> to the exclusion of all other courts worldwide.
          </P>
          <P>
            <Bold>Court Hierarchy:</Bold>
          </P>
          <List>
            <Li><Bold>Trial Court:</Bold> District Court, Hyderabad (for civil claims) or jurisdictional magistrate court (for criminal matters)</Li>
            <Li><Bold>Appellate Court:</Bold> Telangana High Court (for appeals from trial courts)</Li>
            <Li><Bold>Final Appellate Court:</Bold> Supreme Court of India (for appeals from High Court, subject to Supreme Court's discretion to grant special leave under Article 136 of Constitution)</Li>
          </List>
        </Subsection>

        <Subsection title="8.7 Consumer Court Rights - Statutory Protections Preserved">
          <P>
            <Bold>NOTHING IN THIS AGREEMENT</Bold> affects your statutory right to file consumer complaints directly with Consumer Courts under Consumer Protection Act, 2019:
          </P>
          <List>
            <Li><Bold>District Consumer Disputes Redressal Commission (District Commission):</Bold> For claims up to ₹50 lakhs (₹5 million)</Li>
            <Li><Bold>State Consumer Disputes Redressal Commission (State Commission):</Bold> For claims ₹50 lakhs to ₹2 crores (₹20 million) + appeals from District Commission</Li>
            <Li><Bold>National Consumer Disputes Redressal Commission (National Commission):</Bold> For claims above ₹2 crores + appeals from State Commission</Li>
          </List>
          <P>
            Consumer court proceedings are governed by Consumer Protection Act, 2019, and Consumer Protection (Consumer Disputes Redressal Commission) Rules, 2020. Consumer courts provide expedited justice (target: 3-5 months for District Commission).
          </P>
          <Warning>
            <Bold>CRITICAL LIMITATION FOR CONSUMER COURT CLAIMS:</Bold><br /><br />
            
            Consumer court claims may <Bold>ONLY</Bold> be filed against the <Bold>Independent Home Chef</Bold> (the food service provider), NOT against TechBantu IT Solutions LLC (technology intermediary).<br /><br />
            
            <Bold>Legal Basis:</Bold> Consumer Protection Act § 2(7) defines "deficiency in service" as applying to the service provider (food business), NOT the technology platform facilitating the service. Technology intermediaries under IT Act § 79 are NOT "service providers" under Consumer Protection Act.<br /><br />
            
            <Bold>Precedent:</Bold> In <em>Swiggy v. Shiva Kumar</em> (National Commission Complaint No. 1140/2019), National Consumer Commission held that food delivery platforms are technology intermediaries, not food service providers, for consumer court jurisdiction purposes.
          </Warning>
        </Subsection>
      </Section>

      {/* Force Majeure */}
      <Section title="9. FORCE MAJEURE">
        <P>
          We shall NOT be liable for failure to perform obligations due to circumstances beyond our reasonable control ("Force Majeure Events"), including but not limited to:
        </P>
        <List>
          <Li>Acts of God (earthquakes, floods, cyclones, pandemics)</Li>
          <Li>Government actions (lockdowns, curfews, import bans)</Li>
          <Li>Labor disputes (strikes, lockouts)</Li>
          <Li>War, terrorism, or civil unrest</Li>
          <Li>Utility failures (power outages, internet disruptions)</Li>
          <Li>Supply chain breakdowns (ingredient shortages)</Li>
        </List>
        <P>
          During Force Majeure Events, we may suspend services without liability. If suspension exceeds 7 days, you may terminate your account and receive a prorated refund for unused prepaid credits (if any).
        </P>
      </Section>

      {/* Termination */}
      <Section title="10. ACCOUNT TERMINATION">
        <Subsection title="10.1 Termination by You">
          <P>
            You may terminate your account at any time by contacting <a href="mailto:support@gharse.com" style={{ color: '#FF6B35' }}>support@gharse.com</a>. Upon termination:
          </P>
          <List>
            <Li>Your data will be anonymized after 30 days (see Privacy Policy)</Li>
            <Li>Unused wallet balance will be refunded within 14 business days</Li>
            <Li>Order history retained for 7 years (tax compliance)</Li>
          </List>
        </Subsection>

        <Subsection title="10.2 Termination by Us">
          <P>
            We may terminate your account immediately without notice if you:
          </P>
          <List>
            <Li>Violate these Terms</Li>
            <Li>Engage in fraudulent activity</Li>
            <Li>Abuse our staff or delivery personnel</Li>
            <Li>Conduct chargebacks without valid reason</Li>
          </List>
          <P>
            Upon termination by us for cause, no refunds will be provided, and you may be permanently banned from future registration.
          </P>
        </Subsection>
      </Section>

      {/* Modifications */}
      <Section title="11. MODIFICATIONS TO TERMS">
        <P>
          We reserve the right to modify these Terms at any time. Material changes will be communicated via:
        </P>
        <List>
          <Li>Email notification (30 days advance notice)</Li>
          <Li>Prominent banner on website homepage</Li>
          <Li>Requirement to accept updated Terms on next login</Li>
        </List>
        <P>
          <Bold>Your Options:</Bold>
        </P>
        <List>
          <Li><Bold>Accept:</Bold> Continue using the Platform under new Terms</Li>
          <Li><Bold>Reject:</Bold> Delete your account before the effective date (any continued use = acceptance)</Li>
        </List>
      </Section>

      {/* Miscellaneous */}
      <Section title="12. MISCELLANEOUS PROVISIONS">
        <Subsection title="12.1 Entire Agreement">
          <P>
            These Terms, together with our Privacy Policy, Refund Policy, and Referral Terms, constitute the <Bold>entire agreement</Bold> between you and GharSe, superseding all prior understandings, representations, or agreements.
          </P>
        </Subsection>

        <Subsection title="12.2 Severability">
          <P>
            If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.
          </P>
        </Subsection>

        <Subsection title="12.3 No Waiver">
          <P>
            Our failure to enforce any right or provision of these Terms does NOT constitute a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative.
          </P>
        </Subsection>

        <Subsection title="12.4 Assignment">
          <P>
            You may NOT assign or transfer your account or these Terms to any third party without our written consent. We may assign these Terms to any successor entity in case of merger, acquisition, or sale of business.
          </P>
        </Subsection>

        <Subsection title="12.5 Survival">
          <P>
            Sections 4 (Prohibited Conduct), 6 (Limitation of Liability), 7 (Intellectual Property), 8 (Dispute Resolution), and 12 (Miscellaneous) shall survive termination of these Terms.
          </P>
        </Subsection>
      </Section>

      {/* Contact */}
      <Section title="13. CONTACT INFORMATION - DUAL ENTITY STRUCTURE">
        <Subsection title="13.1 Food Business Operator">
          <ContactBox>
            <Bold>For all food-related inquiries, orders, refunds, complaints, or food business matters:</Bold><br /><br />
            
            <Bold>GharSe (Food Business Brand)</Bold><br />
            Legal Operator: Bantu'S kitchen<br />
            Proprietor: Sailaja<br />
            FSSAI Registration: 23625028002731 (Valid until: 23 June 2027)<br />
            Business Type: Petty Retailer of snacks/tea shops (Prepared Foods)<br />
            Annual Turnover Limit: Up to ₹12 Lakhs<br /><br />
            
            Address: Plot no 17, Road no 3, Padmalaya Nagar, Hayatnagar<br />
            Pedda Amberpet (Kalan), Hayathnagar, Rangareddy, Telangana - 501505, India<br /><br />
            
            Email: <a href="mailto:orders@gharse.com" style={{ color: '#FF6B35' }}>orders@gharse.com</a> (orders, delivery, food inquiries)<br />
            Email: <a href="mailto:grievance@gharse.com" style={{ color: '#FF6B35' }}>grievance@gharse.com</a> (complaints, refunds, dispute resolution)<br />
            Phone: +91 90104 60964<br />
            Grievance Officer: Designated officer responding to consumer complaints<br />
            Response Time: Within 15 business days for grievances; 48 hours for order inquiries<br /><br />
            
            <Bold>Business Type:</Bold> Individual Home Chef (sole proprietor), NOT a registered company<br />
            <Bold>Liability:</Bold> Food Operator bears sole responsibility for food safety, quality, delivery, refunds, and consumer disputes
          </ContactBox>
        </Subsection>
        
        <Subsection title="13.2 Technology Provider (TechBantu IT Solutions LLC)">
          <ContactBox>
            <Bold>For technology services, platform issues, or legal inquiries related to software:</Bold><br /><br />
            
            <Bold>TechBantu IT Solutions LLC</Bold><br />
            Entity Type: California Limited Liability Company (LLC)<br />
            Principal Place of Business: California, United States of America<br />
            Email: <a href="mailto:legal@gharse.com" style={{ color: '#FF6B35' }}>legal@gharse.com</a> (legal inquiries, intellectual property matters)<br />
            Email: <a href="mailto:support@gharse.com" style={{ color: '#FF6B35' }}>support@gharse.com</a> (technical support, platform issues)<br />
            Role: Provides software-as-a-service (SaaS) technology platform only<br />
            Liability: <Bold>ZERO liability for food operations, food quality, food safety, or food business matters</Bold>
          </ContactBox>
        </Subsection>
        
        <Subsection title="13.3 Critical Contact Directive">
          <Warning>
            <Bold>IMPORTANT - CONTACT THE CORRECT ENTITY:</Bold><br /><br />
            
            • <Bold>Food orders, delivery, quality, refunds, food complaints:</Bold> Contact Independent Home Chef at <a href="mailto:orders@gharse.com" style={{ color: '#FF6B35' }}>orders@gharse.com</a> or <a href="mailto:grievance@gharse.com" style={{ color: '#FF6B35' }}>grievance@gharse.com</a><br /><br />
            
            • <Bold>Website technical issues, payment gateway problems, software bugs:</Bold> Contact TechBantu at <a href="mailto:support@gharse.com" style={{ color: '#FF6B35' }}>support@gharse.com</a><br /><br />
            
            • <Bold>Legal notices, intellectual property claims, privacy inquiries:</Bold> Contact TechBantu at <a href="mailto:legal@gharse.com" style={{ color: '#FF6B35' }}>legal@gharse.com</a><br /><br />
            
            <Bold>DO NOT send food-related complaints to TechBantu.</Bold> TechBantu provides only technology services and cannot resolve food business matters.
          </Warning>
        </Subsection>
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
          BY CLICKING "I ACCEPT" OR BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE IN THEIR ENTIRETY.
        </P>
        <P style={{ fontSize: '14px', color: '#6B7280', marginBottom: 0 }}>
          Last Updated: January 13, 2025 | Version 1.0 | Effective Immediately
        </P>
      </div>
    </div>
  );
}

// Reusable styled components (same as privacy policy)
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

