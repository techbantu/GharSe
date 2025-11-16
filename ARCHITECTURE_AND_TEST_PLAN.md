# 🏗️ Architecture & Test Plan - Remaining Compliance Systems

## 🎯 Philosophy: Architecture → Testing → Implementation

**Why This Order?**
1. **Architecture** = Blueprint (prevents rework)
2. **Testing** = Validation (proves design works)
3. **Implementation** = Execution (builds validated design)

---

## 📊 Current System Analysis

### ✅ Authentication System (Existing)
- **User Auth**: JWT tokens + httpOnly cookies
- **Admin Auth**: Separate JWT system with role-based access
- **Session Management**: `UserSession` table with token hashing
- **Customer Model**: `prisma.customer` with `accountStatus` field

### ✅ Database Models (Existing)
- `Customer` - User accounts
- `Order` - Order tracking
- `Payment` - Payment records
- `UserSession` - Session tracking
- `LegalAcceptance` - Legal document acceptance ✅
- `SecurityBreach` - Breach tracking ✅
- `AuditLog` - Audit logging ✅
- `DPORequest` - DPO requests ✅
- `UserDeletionRequest` - Deletion requests ✅

---

## 🏗️ System Architecture Design

### **System 1: DPO Request System (HIGH PRIORITY)**

#### Architecture:
```
[Public Form] → [API] → [Database] → [Email] → [Admin Dashboard]
     ↓            ↓         ↓           ↓            ↓
  User Input   Validate  Save DPO   Auto-Ack   30-day SLA
                         Request     Email      Countdown
```

#### Data Flow:
1. User submits DPO request form (public page)
2. API validates input + creates `DPORequest` record
3. Auto-acknowledgment email sent within 24 hours
4. Admin dashboard shows request with SLA countdown
5. Daily cron checks for overdue requests (>30 days)
6. Admin responds → Updates status → Sends response email

#### Components:
- **Frontend**: `app/legal/dpo-request/page.tsx` (public form)
- **API**: `app/api/legal/dpo-request/route.ts` (POST)
- **Backend**: `lib/legal-compliance/dpo-requests.ts` (logic)
- **Email**: `lib/email/dpo-templates.ts` (ack + response)
- **Admin UI**: `app/admin/compliance/dpo-requests/page.tsx`
- **Cron**: Integrated into `scripts/compliance-cron.ts`

#### Test Cases:
1. ✅ Public form validation (required fields)
2. ✅ API creates DPO request in database
3. ✅ Auto-acknowledgment email sent <24 hours
4. ✅ SLA deadline = 30 days from request
5. ✅ Admin can view/respond to requests
6. ✅ Overdue requests trigger alerts
7. ✅ Response email sent to user
8. ✅ Audit log records all actions

---

### **System 2: Right to Erasure (HIGH PRIORITY)**

#### Architecture:
```
[User Dashboard] → [Request API] → [30-Day Grace Period] → [Auto-Execute]
                                            ↓
                                    [Legal Hold Check]
                                    (Active orders? Disputes?)
```

#### Data Flow:
1. User requests deletion from profile page
2. API checks legal holds (active orders, disputes, legal cases)
3. Creates `UserDeletionRequest` with `gracePeriodEnds` = +30 days
4. Confirmation email sent
5. During grace period: User can cancel
6. After 30 days: Daily cron auto-executes deletion
7. Anonymizes data (keeps order history for tax compliance)

#### Anonymization Strategy:
```typescript
// What gets deleted:
- Email (→ "deleted_user_<timestamp>@example.com")
- Name (→ "Deleted User")
- Phone (→ null)
- Address (→ null)
- Password (→ null)

// What gets retained (7-year tax compliance):
- Order IDs (linked to anonymized account)
- Payment records (anonymized)
- Transaction history (for audits)
```

#### Components:
- **Frontend**: `app/profile/data-rights/page.tsx` (user dashboard)
- **API**: `app/api/user/deletion-request/route.ts` (POST, DELETE)
- **Backend**: `lib/legal-compliance/deletion-workflow.ts` (logic)
- **Email**: `lib/email/deletion-templates.ts` (confirmation + cancellation)
- **Admin UI**: `app/admin/compliance/deletion-requests/page.tsx`
- **Cron**: Auto-execution in `scripts/compliance-cron.ts`

#### Test Cases:
1. ✅ User can request deletion when logged in
2. ✅ Legal hold check (rejects if active orders)
3. ✅ Grace period = 30 days from request
4. ✅ Confirmation email sent
5. ✅ User can cancel during grace period
6. ✅ After 30 days, data anonymized (not deleted)
7. ✅ Order history retained for tax compliance
8. ✅ Audit log records deletion
9. ✅ Admin can view/approve/reject requests

---

### **System 3: Central Compliance Dashboard (CRITICAL)**

#### Architecture:
```
[Admin Dashboard] 
     ↓
[Real-Time Metrics API]
     ↓
Aggregates data from:
- LegalAcceptance (acceptance rate)
- DPORequest (pending count, SLA status)
- SecurityBreach (active incidents)
- UserDeletionRequest (pending deletions)
- ArchivedOrder (retention stats)
- ComplianceAlert (active alerts)
```

#### Metrics to Display:
1. **Legal Acceptance**
   - Total acceptances today/week/month
   - Current version adoption rate
   - Outdated acceptances requiring re-acceptance

2. **DPO Requests**
   - Open requests: 5
   - Overdue (>30 days): 2 🔴
   - Due in <7 days: 3 🟡
   - Average response time: 18 days

3. **Security Breaches**
   - Active incidents: 1 🔴
   - 72-hour deadline countdown
   - Unnotified breaches: 0
   - Resolved this month: 3

4. **Data Retention**
   - Orders approaching 7-year mark: 45
   - Archived orders: 1,234
   - Next retention check: 2 AM IST tomorrow

5. **Deletion Requests**
   - Pending (in grace period): 3
   - Ready for execution: 1
   - Legal holds: 0

6. **FSSAI Licenses**
   - Expiring in <30 days: 0
   - Expired: 0 ✅

#### Components:
- **Frontend**: `app/admin/compliance/page.tsx` (dashboard)
- **API**: `app/api/admin/compliance/stats/route.ts` (metrics)
- **Backend**: `lib/compliance/dashboard-stats.ts` (aggregation)

#### Test Cases:
1. ✅ Dashboard loads all metrics <3 seconds
2. ✅ Real-time updates (refresh every 30s)
3. ✅ Color-coded alerts (RED/YELLOW/GREEN)
4. ✅ SLA countdowns accurate
5. ✅ Links to detailed views work
6. ✅ Mobile responsive

---

### **System 4: Real-Time Compliance Alerts (CRITICAL)**

#### Architecture:
```
[Event Triggers] → [Alert Creator] → [ComplianceAlert DB] → [Admin UI]
     ↓                                                             ↓
- Breach detected                                          Toast notifications
- DPO overdue                                             Alert dashboard
- License expiring                                        Email alerts
- Retention due
```

#### Alert Priority System:
```typescript
type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

CRITICAL: Requires immediate action (breach detected, license expired)
HIGH: Requires action soon (DPO overdue, approaching deadline)
MEDIUM: Attention needed (license expiring in 30 days)
LOW: Informational (retention check completed)
```

#### Components:
- **Backend**: `lib/compliance/alert-manager.ts` (alert creation)
- **API**: `app/api/admin/compliance/alerts/route.ts` (GET/PATCH)
- **Frontend**: `components/admin/ComplianceAlerts.tsx` (UI)

#### Test Cases:
1. ✅ Alert created when breach detected
2. ✅ CRITICAL alerts show red
3. ✅ Overdue DPO requests trigger HIGH alert
4. ✅ License expiry triggers alerts at 90/30/7 days
5. ✅ Admin can dismiss alerts
6. ✅ Dismissed alerts don't reappear

---

## 🧪 Testing Strategy

### **Phase 1: Unit Testing (Component Level)**
```typescript
// Example: DPO Request Creation
describe('DPO Request System', () => {
  test('Creates request with valid data', async () => {
    const request = await createDPORequest({
      email: 'test@example.com',
      requestType: 'DATA_ACCESS',
      description: 'I want to see my data',
    });
    
    expect(request.id).toBeDefined();
    expect(request.dueDate).toBe(+30 days from now);
    expect(request.status).toBe('PENDING');
  });
  
  test('Sends auto-acknowledgment email', async () => {
    // Mock email service
    // Verify email sent within 24 hours
  });
  
  test('Detects overdue requests', async () => {
    // Create request with past due date
    const overdue = await checkOverdueRequests();
    expect(overdue.length).toBeGreaterThan(0);
  });
});
```

### **Phase 2: Integration Testing (API Level)**
```bash
# Manual API testing
curl -X POST http://localhost:3000/api/legal/dpo-request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "requestType": "DATA_ACCESS",
    "description": "Test request"
  }'

# Expected: 201 Created + auto-ack email sent
```

### **Phase 3: End-to-End Testing (User Flow)**
1. **DPO Request Flow**:
   - Visit `/legal/dpo-request`
   - Fill form → Submit
   - Check email for acknowledgment
   - Admin logs in → Sees request
   - Admin responds → User gets response email

2. **Deletion Request Flow**:
   - User logs in → Profile → Data Rights
   - Click "Delete My Account"
   - Confirm deletion → Grace period starts
   - Wait 30 days → Account anonymized
   - Verify order history retained

### **Phase 4: Performance Testing**
- Dashboard loads <3 seconds with 10,000 records
- API responses <500ms
- Cron jobs complete <5 minutes
- Email delivery <1 minute

### **Phase 5: Security Testing**
- ✅ CSRF protection on all forms
- ✅ Rate limiting on public endpoints
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React escaping)
- ✅ Auth checks on admin routes

---

## 📋 Implementation Checklist

### **Priority 1: DPO Request System**
- [ ] Backend: `lib/legal-compliance/dpo-requests.ts`
- [ ] API: `app/api/legal/dpo-request/route.ts`
- [ ] Email: `lib/email/dpo-templates.ts`
- [ ] Public Form: `app/legal/dpo-request/page.tsx`
- [ ] Admin Dashboard: `app/admin/compliance/dpo-requests/page.tsx`
- [ ] Cron Integration: Add to `scripts/compliance-cron.ts`
- [ ] Test: Manual + automated

### **Priority 2: Right to Erasure**
- [ ] Backend: `lib/legal-compliance/deletion-workflow.ts`
- [ ] API: `app/api/user/deletion-request/route.ts`
- [ ] Email: `lib/email/deletion-templates.ts`
- [ ] User Dashboard: `app/profile/data-rights/page.tsx`
- [ ] Admin Dashboard: `app/admin/compliance/deletion-requests/page.tsx`
- [ ] Cron Integration: Auto-execution
- [ ] Test: Anonymization + retention

### **Priority 3: Central Dashboard**
- [ ] Backend: `lib/compliance/dashboard-stats.ts`
- [ ] API: `app/api/admin/compliance/stats/route.ts`
- [ ] Frontend: `app/admin/compliance/page.tsx`
- [ ] Test: Load time + accuracy

### **Priority 4: Real-Time Alerts**
- [ ] Backend: `lib/compliance/alert-manager.ts`
- [ ] API: `app/api/admin/compliance/alerts/route.ts`
- [ ] Frontend: `components/admin/ComplianceAlerts.tsx`
- [ ] Test: Alert triggers + dismissal

### **Priority 5: Admin Dashboards**
- [ ] Audit Log Viewer
- [ ] Breach Management Dashboard
- [ ] Data Retention Dashboard

---

## 🎯 Success Criteria

### **Functional**
- ✅ All 11 pending TODO items implemented
- ✅ All test cases pass
- ✅ No console errors
- ✅ Responsive on mobile/tablet/desktop

### **Performance**
- ✅ Dashboard loads <3 seconds
- ✅ API responses <500ms
- ✅ Email delivery <1 minute
- ✅ Cron jobs <5 minutes

### **Legal Compliance**
- ✅ DPDPA 2023 § 12(2) (DPO 30-day SLA) ✅
- ✅ GDPR Article 17 (Right to Erasure) ✅
- ✅ GDPR Article 15 (Right to Access) ✅
- ✅ Complete audit trail for all actions ✅

### **User Experience**
- ✅ Clear error messages
- ✅ Loading states
- ✅ Confirmation dialogs
- ✅ Email notifications

---

## 📊 Estimated Timeline

1. **DPO Request System**: 2-3 hours
2. **Right to Erasure**: 2-3 hours
3. **Central Dashboard**: 1-2 hours
4. **Real-Time Alerts**: 1 hour
5. **Admin Dashboards**: 2-3 hours
6. **Testing & Fixes**: 1-2 hours

**Total**: 9-14 hours for complete implementation

---

## 🚀 Implementation Strategy

### **Step 1: Backend First (Core Logic)**
- Write all utility functions
- Test with console logs
- Verify database operations

### **Step 2: API Layer (Integration)**
- Create API endpoints
- Test with curl/Postman
- Verify request/response

### **Step 3: Frontend (User Interface)**
- Build forms and dashboards
- Connect to APIs
- Test user flows

### **Step 4: Email Templates**
- Design HTML emails
- Test delivery
- Verify content

### **Step 5: Testing**
- Manual testing of all flows
- Edge case testing
- Performance testing

### **Step 6: Documentation**
- Update admin guides
- Create user guides
- Document API endpoints

---

**Ready to implement with confidence!** 🎉

This architecture ensures:
1. ✅ Scalability (can handle growth)
2. ✅ Maintainability (clear separation of concerns)
3. ✅ Testability (each component testable)
4. ✅ Compliance (meets all legal requirements)
5. ✅ Performance (optimized queries, caching)

