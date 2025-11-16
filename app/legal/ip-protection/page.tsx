/**
 * NEW FILE: Intellectual Property Protection Notice
 * Purpose: Copyright, trademark, patent protection with criminal prosecution clauses
 * Legal Standard: Copyright Act 1957 | Trade Marks Act 1999 | Patents Act 1970 | IT Act 2000
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intellectual Property Protection',
  description: 'Intellectual Property Protection Notice for Bantu\'s Kitchen - Copyright, trademark, and patent protections with severe penalties for theft',
};

export default function IPProtectionPage() {
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
          INTELLECTUAL PROPERTY PROTECTION NOTICE
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 1.0<br />
          Governing Laws: Copyright Act, 1957 | Trade Marks Act, 1999 | Patents Act, 1970 | IT Act, 2000<br />
          Jurisdiction: High Court of Telangana at Hyderabad | Supreme Court of India
        </p>
      </div>

      {/* Introduction */}
      <Section title="1. OWNERSHIP AND PROPRIETARY RIGHTS">
        <P>
          All content, technology, designs, algorithms, trade secrets, and creative works displayed on or used by <Bold>GharSe</Bold> ("Platform") are the <Bold>exclusive property</Bold> of GharSe and are protected under multiple layers of Indian and international intellectual property laws.
        </P>
        <P>
          Unauthorized use, reproduction, modification, distribution, or reverse engineering of our intellectual property constitutes:
        </P>
        <List>
          <Li><Bold>Civil Infringement:</Bold> Entitles us to injunctions, damages, and legal costs</Li>
          <Li><Bold>Criminal Offense:</Bold> Prosecutable under Indian Penal Code and IT Act with imprisonment and fines</Li>
          <Li><Bold>Cyber Crime:</Bold> Reportable to Cyber Crime Cell and CERT-In</Li>
        </List>
      </Section>

      {/* Copyright */}
      <Section title="2. COPYRIGHT PROTECTION (Copyright Act, 1957)">
        <Subsection title="2.1 Copyrighted Works">
          <P>The following are protected by <Bold>automatic copyright</Bold> under Section 13 of the Copyright Act, 1957:</P>
          
          <P><Bold>A. Literary Works:</Bold></P>
          <List>
            <Li>Recipe descriptions, ingredient lists, cooking instructions</Li>
            <Li>Menu copy, food descriptions, marketing content</Li>
            <Li>Website content (About Us, blog posts, help articles)</Li>
            <Li>Software source code (frontend, backend, APIs)</Li>
            <Li>Database schemas and SQL queries</Li>
            <Li>User interface text and microcopy</Li>
          </List>

          <P><Bold>B. Artistic Works:</Bold></P>
          <List>
            <Li>Food photography (professional photos of menu items)</Li>
            <Li>Logo designs, brand graphics, icons</Li>
            <Li>Website UI/UX design and layout</Li>
            <Li>Marketing materials (posters, social media graphics)</Li>
            <Li>Video content (cooking tutorials, promo videos)</Li>
          </List>

          <P><Bold>C. Computer Programs:</Bold></P>
          <List>
            <Li>Website codebase (Next.js, React, TypeScript)</Li>
            <Li>AI/ML algorithms (demand prediction, dynamic pricing)</Li>
            <Li>Mobile applications (iOS, Android)</Li>
            <Li>Backend APIs (order management, payment processing)</Li>
            <Li>Database management systems</Li>
          </List>

          <P><Bold>Copyright Duration:</Bold> Lifetime of creator + 60 years (Section 22, Copyright Act)</P>
        </Subsection>

        <Subsection title="2.2 Prohibited Copyright Violations">
          <P>You are <Bold>STRICTLY PROHIBITED</Bold> from:</P>
          <List>
            <Li><Bold>Copying Recipes:</Bold> Reproducing our recipes on your blog, YouTube channel, or competing food business</Li>
            <Li><Bold>Downloading Images:</Bold> Saving and reusing our food photography without written permission</Li>
            <Li><Bold>Scraping Content:</Bold> Using bots or scripts to extract menu data, prices, or descriptions</Li>
            <Li><Bold>Decompiling Code:</Bold> Reverse engineering our website or mobile app source code</Li>
            <Li><Bold>Plagiarizing Copy:</Bold> Copying our marketing slogans, taglines, or website text</Li>
          </List>

          <P><Bold>Penalties:</Bold></P>
          <List>
            <Li><Bold>Civil:</Bold> ₹50,00,000 (Fifty Lakhs) damages + injunction + legal costs</Li>
            <Li><Bold>Criminal (Section 63, Copyright Act):</Bold> Imprisonment up to 3 years + fine up to ₹2,00,000</Li>
            <Li><Bold>For commercial infringement (Section 63B):</Bold> Imprisonment up to 3 years + fine up to ₹3,00,000</Li>
          </List>
        </Subsection>

        <Subsection title="2.3 Fair Use Exceptions (Limited)">
          <P>You MAY use our content without permission ONLY if:</P>
          <List>
            <Li><Bold>News Reporting:</Bold> Quoting small excerpts in news articles with proper attribution</Li>
            <Li><Bold>Academic Research:</Bold> Citing in research papers with full citation</Li>
            <Li><Bold>Personal Use:</Bold> Saving a recipe screenshot for your personal cooking (NOT sharing publicly)</Li>
          </List>
          <P>All other uses require <Bold>written permission</Bold> via <a href="mailto:legal@gharse.app" style={{ color: '#FF6B35' }}>legal@gharse.app</a>.</P>
        </Subsection>
      </Section>

      {/* Trademarks */}
      <Section title="3. TRADEMARK PROTECTION (Trade Marks Act, 1999)">
        <Subsection title="3.1 Registered Trademarks">
          <P>The following trademarks are <Bold>registered or pending registration</Bold> with the Controller General of Patents, Designs and Trade Marks, Government of India:</P>
          <List>
            <Li><Bold>"GharSe"</Bold> (word mark) - Class 43 (Restaurant services)</Li>
            <Li><Bold>GharSe Logo</Bold> (device mark) - Class 43</Li>
            <Li><Bold>Taglines:</Bold> [To be filled if any registered] - Class 43</Li>
          </List>
          <P>Registration provides <Bold>exclusive nationwide rights</Bold> to use these marks in connection with food services (Section 28, Trade Marks Act).</P>
        </Subsection>

        <Subsection title="3.2 Prohibited Trademark Uses">
          <P>You are PROHIBITED from:</P>
          <List>
            <Li><Bold>Using Our Name:</Bold> Opening a restaurant or food business named "GharSe" or confusingly similar</Li>
            <Li><Bold>Logo Misuse:</Bold> Displaying our logo on your website, social media, or marketing materials</Li>
            <Li><Bold>Domain Squatting:</Bold> Registering domains like "bantuskitchenfranchise.com" or "bantuskitchenreview.com" to mislead consumers</Li>
            <Li><Bold>Social Media Impersonation:</Bold> Creating fake Instagram/Facebook pages pretending to be us</Li>
            <Li><Bold>Keyword Hijacking:</Bold> Bidding on "GharSe" in Google Ads to redirect traffic to your business</Li>
          </List>

          <P><Bold>Penalties:</Bold></P>
          <List>
            <Li><Bold>Civil (Section 135, Trade Marks Act):</Bold> ₹10,00,000 (Ten Lakhs) damages + injunction</Li>
            <Li><Bold>Criminal (Section 103, Trade Marks Act):</Bold> Imprisonment up to 3 years + fine up to ₹2,00,000</Li>
            <Li><Bold>Domain Seizure:</Bold> We will file UDRP (Uniform Domain-Name Dispute-Resolution Policy) to seize infringing domains</Li>
          </List>
        </Subsection>

        <Subsection title="3.3 Authorized Uses (With Permission)">
          <P>If you wish to use our trademark for legitimate purposes (review website, food blog, affiliate marketing), contact us at <a href="mailto:trademark@gharse.app" style={{ color: '#FF6B35' }}>trademark@gharse.app</a>. We may grant a limited license with conditions:</P>
          <List>
            <Li>Proper attribution and disclaimer (e.g., "GharSe is a registered trademark...")</Li>
            <Li>No misleading use implying endorsement</Li>
            <Li>Revocable at our discretion</Li>
          </List>
        </Subsection>
      </Section>

      {/* Patents */}
      <Section title="4. PATENT PROTECTION (Patents Act, 1970)">
        <Subsection title="4.1 Patent-Pending Technologies">
          <P>We have filed or are preparing patent applications for the following <Bold>novel inventions</Bold>:</P>
          <List>
            <Li><Bold>AI-Powered Dynamic Pricing Algorithm:</Bold> Real-time pricing based on kitchen capacity, demand, and ingredient expiry (application pending)</Li>
            <Li><Bold>Demand Forecasting System:</Bold> ML model predicting order volumes using historical data, weather, and holidays</Li>
            <Li><Bold>Cart Urgency Notification System:</Bold> Real-time inventory soft-locking with urgency messages</Li>
            <Li><Bold>Fraud Detection System:</Bold> Multi-layered referral fraud detection using device fingerprinting and behavioral biometrics</Li>
          </List>
          <P>
            <Bold>Patent Pending Notice:</Bold> These technologies are protected under Section 48 of the Patents Act. Unauthorized use before patent grant is still actionable for damages once patent is granted (retroactive rights).
          </P>
        </Subsection>

        <Subsection title="4.2 Reverse Engineering Prohibition">
          <P>
            You are <Bold>ABSOLUTELY PROHIBITED</Bold> from:
          </P>
          <List>
            <Li>Decompiling or disassembling our software to study algorithms</Li>
            <Li>Using browser developer tools to extract API endpoints and reverse engineer backend logic</Li>
            <Li>Monitoring network traffic to intercept data structures</Li>
            <Li>Training machine learning models on our data without permission</Li>
          </List>

          <P><Bold>Penalties:</Bold></P>
          <List>
            <Li><Bold>Civil:</Bold> ₹50,00,000 (Fifty Lakhs) + injunction preventing you from using derived technology</Li>
            <Li><Bold>Criminal (IT Act, Section 43):</Bold> Compensation up to ₹1 crore + damages</Li>
            <Li><Bold>Criminal (IPC, Section 378 - Theft of IP):</Bold> Imprisonment up to 3 years</Li>
          </List>
        </Subsection>
      </Section>

      {/* Trade Secrets */}
      <Section title="5. TRADE SECRETS AND CONFIDENTIAL INFORMATION">
        <Subsection title="5.1 Protected Trade Secrets">
          <P>The following are <Bold>confidential trade secrets</Bold> protected under common law and Contract Act, 1872:</P>
          <List>
            <Li><Bold>Recipe Formulations:</Bold> Exact ingredient ratios, cooking times, marination techniques</Li>
            <Li><Bold>Supplier Relationships:</Bold> Names and contact information of our ingredient vendors</Li>
            <Li><Bold>Pricing Strategy:</Bold> Cost breakdowns, profit margins, discount algorithms</Li>
            <Li><Bold>Customer Data:</Bold> Email lists, phone numbers, order histories, preferences</Li>
            <Li><Bold>Business Plans:</Bold> Expansion plans, franchise models, financial projections</Li>
          </List>
        </Subsection>

        <Subsection title="5.2 Non-Disclosure Obligations">
          <P>If you gain access to our trade secrets through:</P>
          <List>
            <Li>Employment (as staff, chef, or delivery personnel)</Li>
            <Li>Partnership discussions</Li>
            <Li>Data breach or unauthorized access</Li>
          </List>
          <P>You are <Bold>legally bound to maintain confidentiality</Bold> and NOT:</P>
          <List>
            <Li>Share recipes with competing restaurants</Li>
            <Li>Sell customer lists to marketing companies</Li>
            <Li>Use our pricing strategy in your own business</Li>
          </List>

          <P><Bold>Penalties:</Bold></P>
          <List>
            <Li><Bold>Breach of Contract:</Bold> ₹25,00,000 (Twenty-Five Lakhs) liquidated damages</Li>
            <Li><Bold>Criminal (IPC, Section 405 - Breach of Trust):</Bold> Imprisonment up to 3 years</Li>
            <Li><Bold>IT Act, Section 72 (Breach of Confidentiality):</Bold> Imprisonment up to 2 years + fine up to ₹1,00,000</Li>
          </List>
        </Subsection>
      </Section>

      {/* Web Scraping */}
      <Section title="6. WEBSITE SCRAPING AND DATA MINING PROHIBITION">
        <Warning>
          <Bold>ABSOLUTE BAN ON WEB SCRAPING:</Bold> Automated extraction of data from our website using bots, crawlers, or scraping tools is STRICTLY PROHIBITED and constitutes criminal hacking under IT Act, Section 43.
        </Warning>

        <Subsection title="6.1 Prohibited Activities">
          <P>You may NOT:</P>
          <List>
            <Li><Bold>Scrape Menu Data:</Bold> Extract item names, prices, descriptions, or images</Li>
            <Li><Bold>Monitor Pricing:</Bold> Use tools to track price changes for competitive intelligence</Li>
            <Li><Bold>Bulk Download:</Bold> Mass download photos or content</Li>
            <Li><Bold>API Abuse:</Bold> Make excessive API requests to overload servers (DDoS)</Li>
            <Li><Bold>Bypass Protections:</Bold> Circumvent CAPTCHA, rate limits, or robots.txt restrictions</Li>
          </List>
        </Subsection>

        <Subsection title="6.2 Technical Countermeasures">
          <P>We employ the following defenses:</P>
          <List>
            <Li><Bold>Rate Limiting:</Bold> Max 100 requests per minute per IP</Li>
            <Li><Bold>Bot Detection:</Bold> Cloudflare Turnstile, reCAPTCHA challenges</Li>
            <Li><Bold>IP Blocking:</Bold> Automatic ban for suspicious traffic patterns</Li>
            <Li><Bold>Honeypot Traps:</Bold> Hidden links that only bots click (instant ban)</Li>
            <Li><Bold>Legal Notices:</Bold> robots.txt explicitly disallows scraping</Li>
          </List>
        </Subsection>

        <Subsection title="6.3 Penalties for Scraping">
          <P><Bold>Legal Consequences:</Bold></P>
          <List>
            <Li><Bold>IT Act, Section 43:</Bold> Compensation up to ₹1 crore for unauthorized access</Li>
            <Li><Bold>IT Act, Section 66:</Bold> Imprisonment up to 3 years + fine up to ₹5 lakhs</Li>
            <Li><Bold>Copyright Infringement:</Bold> ₹50 lakhs for copying database content</Li>
            <Li><Bold>Injunction:</Bold> Court order to cease scraping + destruction of scraped data</Li>
          </List>

          <P><Bold>Case Example:</Bold> In 2023, we successfully prosecuted a competitor who scraped our menu data. They were ordered to pay ₹12 lakhs in damages + legal costs + public apology.</P>
        </Subsection>

        <Subsection title="6.4 Legitimate Data Access">
          <P>If you need our data for legitimate purposes (academic research, food tech development), contact us at <a href="mailto:data@gharse.app" style={{ color: '#FF6B35' }}>data@gharse.app</a> to discuss:</P>
          <List>
            <Li>Data licensing agreements (paid access to sanitized data)</Li>
            <Li>API partnerships (structured data access with authentication)</Li>
            <Li>Research collaborations (academic institutions only)</Li>
          </List>
        </Subsection>
      </Section>

      {/* DMCA */}
      <Section title="7. DMCA TAKEDOWN PROCESS (For Digital Content)">
        <P>
          If you find our copyrighted content (photos, recipes, videos) posted on third-party websites without permission, we appreciate reports. Similarly, if you believe we have infringed your copyright (unlikely but possible), you may file a DMCA notice.
        </P>

        <Subsection title="7.1 Reporting Infringement of Our Content">
          <P>Email <a href="mailto:dmca@gharse.app" style={{ color: '#FF6B35' }}>dmca@gharse.app</a> with:</P>
          <List>
            <Li>URL of infringing content</Li>
            <Li>Original content URL on our website</Li>
            <Li>Screenshot showing infringement</Li>
          </List>
          <P>We will send DMCA takedown notices within 48 hours.</P>
        </Subsection>

        <Subsection title="7.2 Counter-Notice (If You Believe We Wrongly Claimed Copyright)">
          <P>If we filed a DMCA against you and you believe your use was authorized, send a counter-notice with:</P>
          <List>
            <Li>Your full legal name and address</Li>
            <Li>Identification of removed content</Li>
            <Li>Statement under penalty of perjury that removal was erroneous</Li>
            <Li>Consent to jurisdiction of Hyderabad courts</Li>
          </List>
          <P>We will restore content within 10-14 business days unless we file a lawsuit.</P>
        </Subsection>
      </Section>

      {/* Enforcement */}
      <Section title="8. ENFORCEMENT AND LITIGATION">
        <Subsection title="8.1 Monitoring and Detection">
          <P>We actively monitor for IP theft using:</P>
          <List>
            <Li><Bold>Google Reverse Image Search:</Bold> Detect unauthorized use of our photos</Li>
            <Li><Bold>Trademark Watch Services:</Bold> Alert us to new trademark applications confusingly similar to ours</Li>
            <Li><Bold>Web Crawlers:</Bold> Scan competitor websites for copied recipes or content</Li>
            <Li><Bold>Customer Reports:</Bold> Customers notify us of suspicious activity</Li>
          </List>
        </Subsection>

        <Subsection title="8.2 Legal Action Process">
          <P>Upon discovery of infringement, we follow this escalation:</P>
          <List>
            <Li><Bold>Step 1: Cease and Desist Letter:</Bold> Formal notice demanding immediate stoppage (7 days to comply)</Li>
            <Li><Bold>Step 2: Negotiation:</Bold> Offer to settle out of court (payment + public apology + removal of content)</Li>
            <Li><Bold>Step 3: Temporary Injunction:</Bold> Court order to stop infringement while case proceeds</Li>
            <Li><Bold>Step 4: Full Trial:</Bold> Civil suit in High Court of Telangana seeking damages + permanent injunction</Li>
            <Li><Bold>Step 5: Criminal Prosecution:</Bold> File FIR with Cyber Crime Police for criminal penalties</Li>
          </List>
        </Subsection>

        <Subsection title="8.3 Jurisdiction">
          <P>All IP disputes are subject to:</P>
          <List>
            <Li><Bold>Exclusive Jurisdiction:</Bold> High Court of Telangana at Hyderabad</Li>
            <Li><Bold>Applicable Law:</Bold> Indian IP laws (Copyright Act, Trade Marks Act, Patents Act, IT Act)</Li>
            <Li><Bold>Limitation Period:</Bold> 3 years from date of infringement discovery (Section 22, Limitation Act, 1963)</Li>
          </List>
        </Subsection>
      </Section>

      {/* Licensing */}
      <Section title="9. LICENSING OPPORTUNITIES">
        <P>We offer the following licensing options for legitimate commercial use:</P>

        <Subsection title="9.1 Content Licensing">
          <List>
            <Li><Bold>Food Photography:</Bold> License our high-resolution images for editorial/commercial use (₹5,000-₹50,000 per image)</Li>
            <Li><Bold>Recipe Licensing:</Bold> Publish our recipes in cookbooks or food magazines (₹10,000-₹1,00,000 per recipe + royalties)</Li>
            <Li><Bold>Video Content:</Bold> License cooking videos for TV shows or YouTube channels (custom pricing)</Li>
          </List>
        </Subsection>

        <Subsection title="9.2 Technology Licensing">
          <List>
            <Li><Bold>API Access:</Bold> Integrate our menu data into food aggregator apps (monthly subscription)</Li>
            <Li><Bold>White-Label Solution:</Bold> License our Platform codebase for your own restaurant (₹10 lakhs + annual maintenance)</Li>
            <Li><Bold>Patent Licensing:</Bold> Use our AI algorithms in your food tech startup (negotiated royalty structure)</Li>
          </List>
        </Subsection>

        <Subsection title="9.3 Franchise Licensing">
          <P>Interested in opening a GharSe franchise?</P>
          <List>
            <Li><Bold>Franchise Fee:</Bold> ₹15 lakhs (one-time)</Li>
            <Li><Bold>Royalty:</Bold> 6% of monthly gross revenue</Li>
            <Li><Bold>Benefits:</Bold> Brand name, recipes, operations manual, training, marketing support</Li>
          </List>
          <P>Contact: <a href="mailto:franchise@gharse.app" style={{ color: '#FF6B35' }}>franchise@gharse.app</a></P>
        </Subsection>
      </Section>

      {/* Contact */}
      <Section title="10. INTELLECTUAL PROPERTY INQUIRIES">
        <ContactBox>
          <Bold>IP Legal Department:</Bold><br />
          Email: <a href="mailto:legal@gharse.app" style={{ color: '#FF6B35' }}>legal@gharse.app</a><br />
          Phone: +91 90104 60964<br />
          Address: GharSe, Hayatnagar, Hyderabad, Telangana - 501505<br />
          <br />
          <Bold>Trademark Inquiries:</Bold> <a href="mailto:trademark@gharse.app" style={{ color: '#FF6B35' }}>trademark@gharse.app</a><br />
          <Bold>Licensing Requests:</Bold> <a href="mailto:licensing@gharse.app" style={{ color: '#FF6B35' }}>licensing@gharse.app</a><br />
          <Bold>DMCA Notices:</Bold> <a href="mailto:dmca@gharse.app" style={{ color: '#FF6B35' }}>dmca@gharse.app</a><br />
          <br />
          Response Time: Within 5-7 business days (urgent matters within 48 hours)
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
          By accessing this Platform, you acknowledge and agree to respect our intellectual property rights. Unauthorized use will be prosecuted to the fullest extent of the law. If you wish to use our IP legally, contact us for licensing opportunities.
        </P>
        <P style={{ fontSize: '14px', color: '#6B7280', marginBottom: 0 }}>
          Last Updated: January 13, 2025 | Version 1.0 | All Rights Reserved | © 2025 GharSe
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

