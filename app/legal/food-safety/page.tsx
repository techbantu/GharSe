/**
 * NEW FILE: Food Safety & Liability Disclaimer Page
 * Purpose: FSSAI compliance, allergen warnings, vulnerable population protections
 * Legal Standard: Food Safety and Standards Act, 2006 + Consumer Protection Act, 2019
 * Last Updated: January 13, 2025
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Food Safety & Liability',
  description: 'Food Safety and Liability Disclaimer for GharSe - FSSAI compliance, allergen warnings, and health protections. Independent Home Chef bears ALL food safety liability; TechBantu IT Solutions LLC (technology intermediary) bears ZERO food safety liability.',
};

export default function FoodSafetyPage() {
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
          FOOD SAFETY & LIABILITY DISCLAIMER
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: 500,
        }}>
          Effective Date: January 13, 2025 | Version 2.0 (Comprehensive Legal Rewrite)<br />
          Governing Laws: Food Safety and Standards Act, 2006 | Consumer Protection Act, 2019 | IT Act § 79 (India)<br />
          FSSAI Registration: 23625028002731 | Valid Until: 23 June 2027<br />
          Registered Food Business: Bantu'S kitchen | Operating Brand: GharSe | Proprietor: Sailaja
        </p>
      </div>

      {/* Platform Disclaimer */}
      <Section title="1. ABSOLUTE FOOD SAFETY LIABILITY SEGREGATION - SUPREME COURT STANDARD">
        <Warning>
          <Bold>CRITICAL FOOD SAFETY LIABILITY NOTICE - EXHAUSTIVE STATUTORY PROTECTIONS</Bold><br /><br />
          
          <Bold>I. FOOD BUSINESS OPERATOR (SOLE AND EXCLUSIVE FOOD SAFETY LIABILITY)</Bold><br /><br />
          
          ALL food preparation, food safety compliance, FSSAI licensing, hygiene standards, allergen management, contamination prevention, and food-related health liabilities are the <Bold>ABSOLUTE AND EXCLUSIVE RESPONSIBILITY</Bold> of <Bold>Bantu'S kitchen</Bold>, a petty food retailer (snacks/tea shop) registered as an individual sole proprietorship operated by Sailaja from a registered home kitchen located at Plot no 17, Road no 3, Padmalaya Nagar, Hayathnagar, Pedda Amberpet (Kalan), Hayathnagar, Rangareddy, Telangana - 501505, India.<br /><br />
          
          The Food Business Operator (Bantu'S kitchen):<br /><br />
          
          <List>
            <Li><Bold>Holds FSSAI Registration:</Bold> 23625028002731 issued under Food Safety and Standards Act, 2006, § 31 - MANDATORY registration for food business operators (petty retailer category, valid until 23 June 2027)</Li>
            <Li><Bold>Business Category:</Bold> Petty Retailer of snacks/tea shops under Category "16 - Prepared Foods" (as per FSSAI registration certificate)</Li>
            <Li><Bold>Annual Turnover Limit:</Bold> Operates under petty food business registration with annual turnover up to ₹12 Lakhs only (FSSAI regulation)</Li>
            <Li><Bold>Bears ALL food safety liability:</Bold> Sole legal entity responsible under FSSAI Act for food contamination, foodborne illness, allergic reactions, foreign object presence, improper cooking, cross-contamination, expired ingredients, and ALL health consequences arising from food consumption</Li>
            <Li><Bold>Maintains kitchen hygiene:</Bold> Exclusive responsibility for compliance with Food Safety and Standards (Licensing and Registration) Regulations, 2011, Schedule 4 (General Hygiene and Sanitary Practices)</Li>
            <Li><Bold>Sources ingredients:</Bold> Sole responsibility for ingredient quality, supplier vetting, expiration date monitoring, storage conditions, and cold chain maintenance</Li>
            <Li><Bold>Manages allergen disclosure:</Bold> Required to disclose ALL allergens under Food Safety and Standards (Packaging and Labelling) Regulations, 2011; failure to disclose triggers FSSAI § 59 penalties (imprisonment up to 7 years)</Li>
            <Li><Bold>Subject to FSSAI enforcement:</Bold> Food Safety Officers may inspect kitchen, seize samples, suspend operations, or prosecute for violations under FSSAI §§ 63-68 (criminal penalties including imprisonment up to life + fines up to ₹10 lakhs)</Li>
          </List>
          
          <Bold>Legal Status:</Bold> Bantu'S kitchen is the <Bold>"FOOD BUSINESS OPERATOR" (FBO)</Bold> under FSSAI Act § 3(1)(o), bearing ALL statutory food safety obligations.<br /><br />
          
          <Bold>II. TECHNOLOGY PROVIDER (ABSOLUTE ZERO FOOD SAFETY LIABILITY)</Bold><br /><br />
          
          <Bold>TechBantu IT Solutions LLC</Bold>, a California limited liability company with ZERO physical presence in India for food operations, provides <Bold>ONLY software-as-a-service (SaaS) technology</Bold> to the Independent Home Chef. TechBantu IT Solutions LLC:<br /><br />
          
          <List>
            <Li><Bold>Holds NO FSSAI license:</Bold> TechBantu is NOT a Food Business Operator under FSSAI Act; operates ONLY as technology provider exempt from food licensing requirements</Li>
            <Li><Bold>Bears ZERO food safety liability:</Bold> Categorically exempt under IT Act § 79 as "intermediary" providing "mere conduit" services; FSSAI Act obligations apply ONLY to food operators, NOT technology platforms</Li>
            <Li><Bold>Does NOT handle food:</Bold> TechBantu has NO kitchens, NO food handlers, NO food preparation equipment, NO ingredient sourcing, NO cooking operations, NO food storage facilities</Li>
            <Li><Bold>Has NO food safety control:</Bold> TechBantu's software cannot prevent contamination, ensure hygiene, verify ingredient quality, or control cooking processes - these are Independent Home Chef's exclusive responsibilities</Li>
            <Li><Bold>Operates as US-based technology company:</Bold> Subject to California and US law for technology services; NOT subject to Indian FSSAI regulations, Consumer Protection Act food liability, or food safety criminal penalties</Li>
          </List>
          
          <Bold>Legal Basis for Absolute Exemption (Supreme Court Standard):</Bold>
          <List>
            <Li><Bold>IT Act § 79(1) (India):</Bold> "Intermediary shall not be liable for any third party information, data, or communication link made available or hosted by him" - TechBantu provides ONLY technical infrastructure, NOT food services</Li>
            <Li><Bold>FSSAI Act § 3(1)(o):</Bold> "Food Business Operator" defined as person conducting food business - TechBantu does NOT conduct food business; Independent Home Chef is the sole FBO</Li>
            <Li><Bold>Consumer Protection Act § 2(38), (40):</Bold> "Service provider" and "seller" exclude pure technology intermediaries that do not provide underlying service (food)</Li>
            <Li><Bold>Indian Contract Act § 206-208:</Bold> Agent (TechBantu) acting for disclosed principal (Independent Home Chef) - principal liable for tortious acts, not agent</Li>
            <Li><Bold>Supreme Court Precedent - <em>Shreya Singhal v. Union of India</em> (2015) 5 SCC 1:</Bold> Intermediaries under IT Act § 79 cannot be held liable for third-party content/services unless they have actual knowledge and fail to remove offensive content - food safety is Independent Home Chef's third-party service, NOT TechBantu's</Li>
          </List>
          
          <Bold>III. MANDATORY CONSUMER ACKNOWLEDGMENT AND LIABILITY WAIVER</Bold><br /><br />
          
          By ordering food through this Platform, you <Bold>IRREVOCABLY AND UNCONDITIONALLY ACKNOWLEDGE, AGREE, AND COVENANT</Bold> that:<br /><br />
          
          <List>
            <Li>Your food is prepared EXCLUSIVELY by <Bold>Bantu'S kitchen</Bold>, who bears SOLE LIABILITY for food safety, quality, hygiene, and health consequences</Li>
            <Li>TechBantu IT Solutions LLC is a <Bold>pure technology platform provider</Bold> with ZERO involvement in food preparation, food safety, or food business operations</Li>
            <Li>You <Bold>EXPRESSLY WAIVE, RELEASE, AND FOREVER DISCHARGE</Bold> TechBantu IT Solutions LLC from ANY AND ALL claims, demands, damages, liabilities, losses, costs, or expenses arising from food consumption, including but not limited to food poisoning, allergic reactions, choking, burns, contamination-related illness, hospitalization, long-term health complications, disability, or death</Li>
            <Li>Any food safety complaints, FSSAI violations, health injury claims, or food-related lawsuits MUST be filed EXCLUSIVELY against Bantu'S kitchen in Hyderabad, Telangana, India</Li>
            <Li>Filing food safety claims against TechBantu IT Solutions LLC is <Bold>VOID AB INITIO</Bold> for lack of subject matter jurisdiction under FSSAI Act (TechBantu is not FBO) and failure to state a cause of action under CPC Order VII Rule 11</Li>
          </List>
          
          <Bold>WARNING - CRIMINAL PENALTIES FOR FRIVOLOUS CLAIMS:</Bold><br /><br />
          
          Filing baseless food safety claims against TechBantu IT Solutions LLC, despite this exhaustive disclaimer, may constitute:
          <List>
            <Li><Bold>IPC § 211:</Bold> False charge of offense made with intent to injure (imprisonment up to 2 years)</Li>
            <Li><Bold>Contempt of Court:</Bold> If claim proceeds despite lack of jurisdiction (Contempt of Courts Act, 1971)</Li>
            <Li><Bold>CPC § 35A:</Bold> Compensatory costs for frivolous litigation imposed on plaintiff</Li>
          </List>
          
          <Bold>UNEQUIVOCAL FINAL STATEMENT: ALL FOOD SAFETY LIABILITY RESTS EXCLUSIVELY WITH BANTU'S KITCHEN UNDER FSSAI ACT, 2006. TECHBANTU IT SOLUTIONS LLC BEARS ABSOLUTE ZERO FOOD SAFETY LIABILITY UNDER ANY THEORY OF LAW (STATUTORY, CONTRACTUAL, TORTIOUS, OR VICARIOUS).</Bold>
        </Warning>
      </Section>
      
      {/* FSSAI Compliance */}
      <Section title="2. PARTNER RESTAURANT FSSAI COMPLIANCE">
        <P>
          Bantu'S kitchen, the food operator registered on our platform, holds a valid <Bold>FSSAI (Food Safety and Standards Authority of India) Registration</Bold> as mandated by the Food Safety and Standards Act, 2006. Bantu'S kitchen complies with:
        </P>
        <List>
          <Li><Bold>Food Safety and Standards Act, 2006</Bold></Li>
          <Li><Bold>Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011</Bold></Li>
          <Li><Bold>Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011</Bold></Li>
          <Li><Bold>Food Safety and Standards (Packaging and Labelling) Regulations, 2011</Bold></Li>
        </List>
        <P>
          Our kitchen undergoes regular inspections by FSSAI-designated Food Safety Officers. Inspection reports are available upon request (subject to confidentiality clauses).
        </P>
      </Section>

      {/* Hygiene Standards */}
      <Section title="2. FOOD PREPARATION AND HYGIENE STANDARDS">
        <Subsection title="2.1 Kitchen Sanitation">
          <P>Our kitchen maintains the following hygiene protocols:</P>
          <List>
            <Li><Bold>Temperature Control:</Bold> All food cooked to minimum 75°C (165°F) to kill pathogens</Li>
            <Li><Bold>Cold Chain:</Bold> Refrigerated ingredients stored at 4°C or below; frozen items at -18°C</Li>
            <Li><Bold>Cross-Contamination Prevention:</Bold> Separate cutting boards for vegetarian/non-vegetarian items</Li>
            <Li><Bold>Hand Hygiene:</Bold> Staff wash hands every 30 minutes and after handling raw meat/poultry</Li>
            <Li><Bold>Equipment Sanitization:</Bold> All utensils and surfaces sanitized with approved food-grade disinfectants</Li>
            <Li><Bold>Pest Control:</Bold> Monthly pest control audits (no chemicals used during food preparation)</Li>
          </List>
        </Subsection>

        <Subsection title="2.2 Staff Health Monitoring">
          <P>All kitchen staff undergo:</P>
          <List>
            <Li><Bold>Annual Medical Checkups:</Bold> Blood tests, stool culture, chest X-ray (tuberculosis screening)</Li>
            <Li><Bold>Daily Health Screening:</Bold> Temperature checks before shift; any illness reported immediately</Li>
            <Li><Bold>Food Handler Training:</Bold> FSSAI-certified food safety training (renewed annually)</Li>
            <Li><Bold>Personal Protective Equipment:</Bold> Hairnets, gloves, aprons, masks worn at all times</Li>
          </List>
          <P>
            <Bold>Zero-Tolerance Policy:</Bold> Staff with diarrhea, vomiting, fever, or open wounds are NOT allowed in kitchen until medical clearance.
          </P>
        </Subsection>

        <Subsection title="2.3 Ingredient Sourcing">
          <P>We source ingredients from:</P>
          <List>
            <Li><Bold>Verified Suppliers:</Bold> All vendors FSSAI-licensed with traceability records</Li>
            <Li><Bold>Quality Checks:</Bold> Visual inspection of all deliveries; rejection of expired or damaged goods</Li>
            <Li><Bold>Storage Rotation:</Bold> FIFO (First In, First Out) to minimize waste and expiry risk</Li>
            <Li><Bold>Local Sourcing:</Bold> 80% of vegetables sourced from local farms (fresher, lower carbon footprint)</Li>
          </List>
        </Subsection>
      </Section>

      {/* Allergen Warnings */}
      <Section title="3. ALLERGEN DISCLOSURE AND WARNINGS">
        <Warning>
          <Bold>CRITICAL ALLERGEN WARNING:</Bold> It is YOUR responsibility to inform us of any food allergies or dietary restrictions in your user profile or order notes. We make reasonable efforts to accommodate allergies, but CANNOT GUARANTEE 100% cross-contamination prevention in a shared kitchen environment.
        </Warning>

        <Subsection title="3.1 Common Allergens Present in Kitchen">
          <P>Our kitchen handles the following major allergens (as per FSSAI guidelines):</P>
          <List>
            <Li><Bold>Dairy:</Bold> Milk, butter, ghee, paneer, yogurt, cream</Li>
            <Li><Bold>Gluten:</Bold> Wheat flour (in naan, roti, breading)</Li>
            <Li><Bold>Tree Nuts:</Bold> Cashews, almonds (used in gravies and desserts)</Li>
            <Li><Bold>Peanuts:</Bold> Peanut oil (used for frying in some items)</Li>
            <Li><Bold>Soy:</Bold> Soy sauce (in Indo-Chinese dishes)</Li>
            <Li><Bold>Eggs:</Bold> Used in certain breaded items and baked goods</Li>
            <Li><Bold>Fish & Shellfish:</Bold> Not currently used, but may be introduced in future menu items</Li>
          </List>
          <P>
            <Bold>Cross-Contact Risk:</Bold> Despite separate utensils, trace amounts of allergens may be present in all dishes due to shared kitchen space, oil reuse, and airborne particles.
          </P>
        </Subsection>

        <Subsection title="3.2 Your Responsibility (Non-Negotiable)">
          <P>If you have food allergies, you MUST:</P>
          <List>
            <Li><Bold>Disclose Allergies:</Bold> Add to "Dietary Restrictions" in your profile</Li>
            <Li><Bold>Specify in Order Notes:</Bold> Write "SEVERE NUT ALLERGY" or similar in order special instructions</Li>
            <Li><Bold>Call Before Ordering:</Bold> For life-threatening allergies (anaphylaxis risk), call +91 90104 60964 to speak with our chef</Li>
            <Li><Bold>Carry EpiPen:</Bold> If you have severe allergies, keep emergency medication on hand</Li>
          </List>
        </Subsection>

        <Subsection title="3.3 Liability Exclusion for Undisclosed Allergies">
          <P>
            We are <Bold>NOT LIABLE</Bold> for allergic reactions if:
          </P>
          <List>
            <Li>You did not disclose the allergy in your profile or order notes</Li>
            <Li>You ignored allergen warnings in menu item descriptions</Li>
            <Li>You consumed an item clearly marked "Contains Nuts" or "Contains Dairy"</Li>
          </List>
          <P>
            <Bold>Legal Basis:</Bold> Doctrine of Contributory Negligence (Consumer Protection Act, 2019, Section 2(11)). If your failure to disclose allergies contributed to the harm, our liability is reduced or eliminated.
          </P>
        </Subsection>
      </Section>

      {/* Vulnerable Populations */}
      <Section title="4. SPECIAL WARNINGS FOR VULNERABLE POPULATIONS">
        <Subsection title="4.1 Pregnant Women">
          <Warning>
            <Bold>PREGNANCY WARNING:</Bold> If you are pregnant, consult your obstetrician before consuming the following:
            <List>
              <Li><Bold>Spicy Foods:</Bold> May cause heartburn, gastric distress, or preterm labor (in high-risk pregnancies)</Li>
              <Li><Bold>Undercooked Eggs:</Bold> Risk of salmonella (we cook eggs well-done, but risk exists)</Li>
              <Li><Bold>Certain Spices:</Bold> Fenugreek, asafoetida (hing) in large quantities may stimulate uterine contractions</Li>
              <Li><Bold>High-Sodium Items:</Bold> May worsen pregnancy-related hypertension</Li>
            </List>
          </Warning>
          <P>
            <Bold>Recommendation:</Bold> Choose mild, vegetarian dishes. Avoid raw/undercooked items. Stay hydrated.
          </P>
        </Subsection>

        <Subsection title="4.2 Elderly Persons (65+ Years)">
          <Warning>
            <Bold>ELDERLY CAUTION:</Bold> Older adults should be aware of:
            <List>
              <Li><Bold>Choking Hazards:</Bold> Items with bones (chicken, mutton) - chew carefully</Li>
              <Li><Bold>Digestive Sensitivity:</Bold> Spicy foods may aggravate GERD, ulcers, or IBS</Li>
              <Li><Bold>Sodium Content:</Bold> High-sodium items may worsen hypertension or kidney disease</Li>
              <Li><Bold>Medication Interactions:</Bold> Grapefruit juice (if offered) interacts with statins and blood pressure meds</Li>
            </List>
          </Warning>
          <P>
            <Bold>Recommendation:</Bold> Choose soft, mildly spiced dishes. Request "low salt" in order notes. Chew slowly.
          </P>
        </Subsection>

        <Subsection title="4.3 Immunocompromised Individuals">
          <P>
            If you have a weakened immune system due to:
          </P>
          <List>
            <Li>HIV/AIDS</Li>
            <Li>Cancer chemotherapy</Li>
            <Li>Organ transplant (on immunosuppressants)</Li>
            <Li>Autoimmune diseases (on steroids)</Li>
          </List>
          <P>
            <Bold>AVOID:</Bold>
          </P>
          <List>
            <Li>Raw or undercooked meats (risk of parasites/bacteria)</Li>
            <Li>Unwashed raw vegetables in salads (E. coli risk)</Li>
            <Li>Dairy products if lactose intolerant (diarrhea weakens immune system further)</Li>
          </List>
          <P>
            <Bold>Recommendation:</Bold> Stick to fully cooked, hot items. Reheat food to 75°C before consumption.
          </P>
        </Subsection>

        <Subsection title="4.4 Children Under 5 Years">
          <Warning>
            <Bold>PARENTAL GUIDANCE:</Bold> Young children are at higher risk for:
            <List>
              <Li><Bold>Choking:</Bold> Avoid giving items with bones, hard nuts, or whole grapes</Li>
              <Li><Bold>Food Poisoning:</Bold> Children dehydrate faster; seek medical help if vomiting/diarrhea persists {'>'}6 hours</Li>
              <Li><Bold>Allergies:</Bold> First-time exposure to allergens (nuts, shellfish) should be in presence of a doctor</Li>
              <Li><Bold>Spice Intolerance:</Bold> Child's digestive system is immature; avoid very spicy items</Li>
            </List>
          </Warning>
          <P>
            <Bold>Note:</Bold> While we allow orders for children, parents must supervise consumption. We are not responsible for parental negligence.
          </P>
        </Subsection>

        <Subsection title="4.5 Persons with Chronic Diseases">
          <P>If you have any of the following conditions, consult your doctor before ordering:</P>
          <List>
            <Li><Bold>Diabetes:</Bold> Our dishes may contain hidden sugars (in sauces, marinades). Check nutritional info.</Li>
            <Li><Bold>Heart Disease:</Bold> High-fat items (butter chicken, biryani with ghee) may worsen cholesterol</Li>
            <Li><Bold>Kidney Disease:</Bold> High-protein items (paneer, chicken) may overload kidneys. Choose low-protein options.</Li>
            <Li><Bold>Liver Disease:</Bold> Avoid fried foods and high-fat dishes (burden on liver metabolism)</Li>
            <Li><Bold>Celiac Disease:</Bold> We use wheat flour extensively; cross-contamination risk is HIGH. Consider not ordering.</Li>
          </List>
        </Subsection>
      </Section>

      {/* Delivery & Storage */}
      <Section title="5. FOOD TEMPERATURE AND STORAGE AFTER DELIVERY">
        <Subsection title="5.1 Our Responsibility (Until Delivery)">
          <P>We ensure:</P>
          <List>
            <Li><Bold>Hot Foods:</Bold> Packed at minimum 65°C (149°F) in insulated containers</Li>
            <Li><Bold>Cold Foods:</Bold> Refrigerated items transported in cooling bags with ice packs</Li>
            <Li><Bold>Delivery Time:</Bold> Maximum 45 minutes from kitchen to your door (temperature maintained)</Li>
            <Li><Bold>Tamper-Proof Packaging:</Bold> Sealed bags to prevent contamination during transit</Li>
          </List>
        </Subsection>

        <Subsection title="5.2 Your Responsibility (After Delivery)">
          <P>
            Once food is delivered, <Bold>YOU</Bold> are responsible for proper handling:
          </P>
          <List>
            <Li><Bold>Consume Immediately:</Bold> Food is meant for immediate consumption (within 2 hours of delivery)</Li>
            <Li><Bold>Refrigerate Leftovers:</Bold> If not eating immediately, refrigerate within 2 hours at 4°C or below</Li>
            <Li><Bold>Reheat Properly:</Bold> Reheat to 75°C (microwave 2-3 minutes on high) before eating leftovers</Li>
            <Li><Bold>Discard After 24 Hours:</Bold> Do NOT consume food that has been sitting at room temperature {'>'}2 hours or refrigerated {'>'}24 hours</Li>
          </List>
          <P>
            <Bold>We are NOT LIABLE for:</Bold>
          </P>
          <List>
            <Li>Food poisoning if you ate food that was left out overnight</Li>
            <Li>Spoilage if you stored food in a non-functional refrigerator</Li>
            <Li>Contamination if you reheated food in unclean utensils</Li>
          </List>
        </Subsection>
      </Section>

      {/* Food Illness Protocol */}
      <Section title="6. FOOD ILLNESS REPORTING PROTOCOL">
        <Subsection title="6.1 Immediate Actions (If You Feel Sick)">
          <P><Bold>Symptoms of Food Poisoning (appear within 2-48 hours):</Bold></P>
          <List>
            <Li>Nausea, vomiting, diarrhea</Li>
            <Li>Abdominal cramps, fever</Li>
            <Li>Dehydration (dry mouth, dizziness, reduced urination)</Li>
          </List>
          <P><Bold>What to Do:</Bold></P>
          <List>
            <Li><Bold>FIRST:</Bold> Seek medical attention immediately (call 108 for ambulance or visit nearest hospital)</Li>
            <Li><Bold>SECOND:</Bold> Inform us within 24 hours at <a href="mailto:foodsafety@gharse.app" style={{ color: '#FF6B35' }}>foodsafety@gharse.app</a> with subject "URGENT: Food Illness"</Li>
            <Li><Bold>THIRD:</Bold> Preserve remaining food in refrigerator (do NOT throw away - needed for lab testing)</Li>
            <Li><Bold>FOURTH:</Bold> Obtain medical certificate from treating doctor stating suspected cause</Li>
          </List>
        </Subsection>

        <Subsection title="6.2 Investigation Process">
          <P>Once you report illness, we will:</P>
          <List>
            <Li><Bold>Within 6 Hours:</Bold> Contact you to gather details (what you ate, when symptoms started, others affected)</Li>
            <Li><Bold>Within 24 Hours:</Bold> Inspect kitchen records for that batch (temperature logs, ingredient expiry)</Li>
            <Li><Bold>Within 48 Hours:</Bold> Send food safety officer to collect food sample for lab testing</Li>
            <Li><Bold>Within 7 Days:</Bold> Receive lab report (microbiological culture, toxin screening)</Li>
            <Li><Bold>Within 10 Days:</Bold> Final determination and compensation decision</Li>
          </List>
        </Subsection>

        <Subsection title="6.3 Compensation (If Our Fault Confirmed)">
          <P>Refer to Refund Policy (Section 7.4) for detailed compensation structure:</P>
          <List>
            <Li>Minor illness: ₹5,000 + medical bills up to ₹25,000</Li>
            <Li>Hospitalization: Up to ₹5,00,000 (case-by-case basis)</Li>
          </List>
        </Subsection>

        <Subsection title="6.4 Not Our Fault (No Compensation)">
          <P>We are NOT liable if illness was caused by:</P>
          <List>
            <Li><Bold>Pre-Existing Conditions:</Bold> You have chronic gastritis, IBS, or Crohn's disease</Li>
            <Li><Bold>Other Food Sources:</Bold> You ate at multiple places; cannot prove our food caused it</Li>
            <Li><Bold>Improper Storage:</Bold> You left food unrefrigerated for 8 hours</Li>
            <Li><Bold>Viral Infection:</Bold> Lab tests show norovirus or rotavirus (not food-related)</Li>
            <Li><Bold>Alcohol Consumption:</Bold> You drank heavily and got gastritis (not food poisoning)</Li>
          </List>
          <P>
            <Bold>Lab Testing Cost:</Bold> If tests prove food was safe, you pay lab fees (₹15,000-₹25,000).
          </P>
        </Subsection>
      </Section>

      {/* Liability Cap */}
      <Section title="7. PLATFORM LIABILITY DISCLAIMER">
        <Warning>
          <Bold>ABSOLUTE ZERO LIABILITY FOR BANTU'S KITCHEN PLATFORM:</Bold><br /><br />
          
          GharSe is a <Bold>TECHNOLOGY INTERMEDIARY ONLY</Bold>. We have <Bold>ZERO LIABILITY</Bold> for:<br /><br />
          
          <List>
            <Li>Food quality, safety, contamination, or spoilage</Li>
            <Li>Food-related illness, injury, allergic reactions, or death</Li>
            <Li>Medical expenses, hospitalization costs, or treatment fees</Li>
            <Li>Loss of income, business opportunities, or any consequential damages</Li>
            <Li>Emotional distress, mental anguish, or pain and suffering</Li>
            <Li>Third-party claims (if you share food with others)</Li>
          </List>
          
          <Bold>ALL LIABILITY RESTS WITH THE PARTNER RESTAURANT/CHEF WHO PREPARED THE FOOD.</Bold>
        </Warning>
        
        <P>
          <Bold>Where to File Claims:</Bold>
        </P>
        <List>
          <Li><Bold>For Refunds:</Bold> Contact the Sailaja (the food operator) through our platform</Li>
          <Li><Bold>For Medical Expenses/Compensation:</Bold> File claim directly with Sailaja (the food operator) (FSSAI-licensed entity)</Li>
          <Li><Bold>For Legal Action:</Bold> File consumer court complaint against Sailaja (the food operator) under Consumer Protection Act, 2019</Li>
          <Li><Bold>For FSSAI Violations:</Bold> Report Sailaja (the food operator) to FSSAI (we will provide their license details)</Li>
        </List>
        
        <P>
          <Bold>Platform's Role:</Bold> We facilitate communication and refund processing only. We do NOT assume any liability for the Sailaja (the food operator)'s actions or food safety violations.
        </P>
      </Section>

      {/* Emergency Contact */}
      <Section title="8. EMERGENCY CONTACTS">
        <ContactBox>
          <Bold>Food Safety Officer:</Bold><br />
          Name: [To be designated]<br />
          Emergency Hotline: +91 90104 60964 (24/7)<br />
          Email: <a href="mailto:foodsafety@gharse.app" style={{ color: '#FF6B35' }}>foodsafety@gharse.app</a><br />
          <br />
          <Bold>In Case of Emergency (Medical):</Bold><br />
          Ambulance: <Bold>108</Bold> (Government Emergency Services)<br />
          Poison Control: <Bold>1800-425-5025</Bold> (AIIMS Delhi, 24/7)<br />
          <br />
          <Bold>FSSAI Consumer Helpline:</Bold><br />
          Toll-Free: <Bold>1800-112-100</Bold> (Complaints against food businesses)<br />
          Website: <a href="https://www.fssai.gov.in" style={{ color: '#FF6B35' }}>www.fssai.gov.in</a>
        </ContactBox>
      </Section>

      {/* Regulatory Compliance */}
      <Section title="9. REGULATORY INSPECTIONS AND TRANSPARENCY">
        <P>
          As a responsible food business, we:
        </P>
        <List>
          <Li><Bold>Welcome FSSAI Inspections:</Bold> Surprise audits conducted quarterly</Li>
          <Li><Bold>Display Hygiene Rating:</Bold> FSSAI hygiene rating (when implemented) will be displayed on website</Li>
          <Li><Bold>Incident Reporting:</Bold> Any foodborne illness outbreak (≥2 customers) reported to FSSAI within 24 hours</Li>
          <Li><Bold>Recall Protocol:</Bold> If a contaminated batch is identified, immediate recall and customer notification</Li>
        </List>
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
          By placing an order, you acknowledge that you have read and understood these food safety warnings and liability disclaimers. If you have allergies, chronic diseases, or are in a vulnerable population, you assume additional risk by ordering. When in doubt, consult your doctor before consuming our food.
        </P>
        <P style={{ fontSize: '14px', color: '#6B7280', marginBottom: 0 }}>
          Last Updated: January 13, 2025 | Version 1.0 | FSSAI License: [To be filled] | Effective Immediately
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

