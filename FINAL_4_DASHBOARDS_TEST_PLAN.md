# 🧪 FINAL 4 DASHBOARDS - Test & Implementation Plan

**Date**: 2025-11-16  
**Remaining**: 4 Admin Dashboards  
**Strategy**: Test/Plan → Implement → Verify

---

## 📋 REMAINING DASHBOARDS

### 1. Admin Data Retention Dashboard
**Purpose**: View archived orders, tax compliance status, manual controls

**Features to Test**:
- ✅ Display orders approaching 7-year mark
- ✅ Show archived orders count
- ✅ Display tax year breakdown (FY2024-25, etc.)
- ✅ Manual archive button (with confirmation)
- ✅ Manual restore button (with legal check)
- ✅ Search archived orders
- ✅ Filter by tax year/quarter
- ✅ Export archived data to CSV

**API Endpoints Needed**:
- GET `/api/admin/compliance/retention` - Fetch retention data
- POST `/api/admin/compliance/retention/archive` - Manual archive
- POST `/api/admin/compliance/retention/restore` - Manual restore

**Database Queries**:
- Count orders 6.5+ years old (approaching)
- Count archived orders
- Group by tax year
- Find specific archived order

---

### 2. Admin Security Breach Dashboard
**Purpose**: Manage security incidents with 72-hour countdown

**Features to Test**:
- ✅ Display active breaches with severity
- ✅ 72-hour countdown timer (RED if <24h remaining)
- ✅ Show affected users count
- ✅ Display notification status (Sent/Pending)
- ✅ Mitigation tracking checklist
- ✅ Manual breach reporting form
- ✅ Resolution workflow
- ✅ Export breach report

**API Endpoints Needed**:
- GET `/api/admin/security/breaches` - Already exists
- POST `/api/admin/security/breaches` - Already exists
- PATCH `/api/admin/security/breaches` - Already exists

**UI Components**:
- Countdown timer component (updates every second)
- Severity badge (CRITICAL=RED, HIGH=ORANGE, etc.)
- Affected users modal
- Mitigation checklist

---

### 3. Admin DPO Request Dashboard
**Purpose**: Manage DPO requests with 30-day SLA

**Features to Test**:
- ✅ Display all DPO requests (PENDING, IN_PROGRESS, COMPLETED)
- ✅ 30-day SLA countdown (RED if <7 days)
- ✅ Overdue requests highlighted
- ✅ Quick response templates
- ✅ Status update workflow
- ✅ Email response preview
- ✅ Filter by request type
- ✅ Search by email/reference

**API Endpoints Needed**:
- GET `/api/legal/dpo-request?admin=true` - Already exists
- PATCH `/api/legal/dpo-request` - Already exists

**Response Templates**:
- Data access: "Your data export is attached..."
- Data deletion: "Your request is being processed..."
- Data correction: "We've updated your information..."
- Consent withdrawal: "Your consent has been withdrawn..."

---

### 4. Admin Deletion Request Review
**Purpose**: Review user deletion requests with legal holds

**Features to Test**:
- ✅ Display pending deletion requests
- ✅ 30-day grace period countdown
- ✅ Legal hold flags (active orders, disputes)
- ✅ Manual approval/rejection
- ✅ View user's order history
- ✅ Override legal holds (with justification)
- ✅ Execute deletion immediately (bypass grace period)
- ✅ Cancel deletion request

**API Endpoints Needed**:
- GET `/api/user/deletion-request?admin=true` - Already exists
- PATCH `/api/admin/compliance/deletion-requests` - Need to create

**Legal Hold Checks**:
- Active orders (not delivered)
- Recent orders (<30 days, dispute window)
- Pending payments
- Active legal cases (future enhancement)

---

## 🧪 TEST SCENARIOS

### Scenario 1: Data Retention Dashboard
1. View orders approaching 7 years
2. Archive an order manually
3. Search for archived order by order number
4. Export archived orders for tax year FY2023-24
5. Attempt to restore archived order

**Expected Results**:
- Orders show correct age calculation
- Manual archive creates ArchivedOrder record
- Search finds correct order
- CSV export includes all required fields
- Restore checks if data is still needed

---

### Scenario 2: Security Breach Dashboard
1. View active breaches
2. Check 72-hour countdown accuracy
3. Click "View Affected Users"
4. Mark breach as resolved
5. Generate breach report

**Expected Results**:
- Countdown shows exact time remaining
- Affected users list displays correctly
- Resolution updates database + logs audit
- Report includes all breach details

---

### Scenario 3: DPO Request Dashboard
1. View overdue requests (RED highlighted)
2. Select request and view details
3. Use response template
4. Send response
5. Verify request marked as COMPLETED

**Expected Results**:
- Overdue requests show at top
- Template auto-fills response field
- Email sent successfully
- Status updated + audit logged

---

### Scenario 4: Deletion Request Review
1. View pending deletion with legal hold
2. Check user's order history
3. Attempt to approve (should show legal hold warning)
4. Remove legal hold (with justification)
5. Approve deletion

**Expected Results**:
- Legal hold prevents immediate approval
- Order history shows active orders
- Justification required for override
- Approval triggers deletion workflow

---

## 🏗️ IMPLEMENTATION ORDER

1. **Admin Data Retention Dashboard** (30 min)
   - Simplest: Display + manual controls
   
2. **Admin DPO Request Dashboard** (45 min)
   - Moderate: Response templates + SLA countdown

3. **Admin Security Breach Dashboard** (45 min)
   - Moderate: 72-hour countdown + mitigation tracking

4. **Admin Deletion Request Review** (30 min)
   - Simple: Review + approval workflow

**Total Time**: ~2.5 hours

---

## ✅ VERIFICATION CHECKLIST

After implementing each dashboard:

- [ ] UI loads without errors
- [ ] Data fetches correctly from API
- [ ] Countdown timers update in real-time
- [ ] Manual actions work (approve/reject/archive)
- [ ] Filters and search function correctly
- [ ] Export works (CSV/PDF)
- [ ] Mobile responsive
- [ ] Color-coding correct (RED/YELLOW/GREEN)
- [ ] Audit logging records all actions
- [ ] Error messages display properly

---

## 🎯 SUCCESS CRITERIA

**Functionality**: All CRUD operations work
**Performance**: Dashboard loads <3 seconds
**UX**: Clear, intuitive interface
**Compliance**: All actions logged
**Security**: Admin auth enforced

---

**Ready to implement!** 🚀

Let's start with #1: Admin Data Retention Dashboard

