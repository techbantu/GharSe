# ⚡ MIGRATION QUICK START - 15 Minutes to Production

## 🎯 **5-Step Migration Process**

### **Step 1: Get Supabase URL** (5 min)
```
1. Go to https://supabase.com
2. Create project → Save password!
3. Settings → Database → Connection String → URI
4. Copy: postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

### **Step 2: Update .env** (1 min)
```env
# Comment out SQLite
# DATABASE_URL="file:./prisma/dev.db"

# Add Supabase (paste your URL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### **Step 3: Create Tables** (2 min)
```bash
npm run prisma:generate
npm run db:push
```

### **Step 4: Migrate Data** (5 min)
```bash
npm run migrate:to-supabase
```

### **Step 5: Test** (2 min)
```bash
npm run dev
# Login and verify your data is there!
```

---

## ✅ **Success Checklist**

- [ ] Supabase project created
- [ ] DATABASE_URL updated in .env
- [ ] Tables created (db:push)
- [ ] Data migrated (migrate:to-supabase)
- [ ] Application tested and working
- [ ] Backup created automatically

---

## 🔄 **Rollback (If Needed)**

```bash
# 1. Edit .env - switch back to SQLite
DATABASE_URL="file:./prisma/dev.db"

# 2. Edit prisma/schema.prisma
provider = "sqlite"  # Change from postgresql

# 3. Regenerate
npm run prisma:generate

# 4. Restart
npm run dev
```

---

## 📊 **What Gets Migrated**

✅ All Chefs
✅ All Menu Items (45 items)
✅ All Customers (with passwords)
✅ All Orders (complete history)
✅ All Order Items
✅ All Payments
✅ All Receipts
✅ All Terms & Conditions
✅ All Referrals

**NOTHING IS LOST!**

---

## 🎯 **Key Points**

1. **Prisma IS for production** - It's not just a dev tool!
2. **Your SQLite data is safe** - Migration only copies, never deletes
3. **Automatic backup** - Created before migration starts
4. **Validation included** - Verifies all data transferred correctly
5. **Easy rollback** - Can switch back to SQLite anytime

---

## 💡 **Pro Tips**

- **Keep your SQLite backup** - Don't delete `prisma/dev.db`
- **Test thoroughly** - Check all features before deploying
- **Update production env vars** - Vercel/Netlify need the new DATABASE_URL
- **Monitor Supabase** - Free tier has limits (500MB, plenty for most apps)

---

## 🆘 **Common Issues**

### **Error: Can't connect to database**
```bash
# Check your connection string format
# Should be: postgresql://postgres:PASSWORD@HOST:5432/postgres
# Make sure password is correct!
```

### **Error: Tables already exist**
```bash
# If you ran db:push multiple times, that's okay
# The migration script will add data to existing tables
```

### **Error: Migration failed midway**
```bash
# Don't worry! Your SQLite is safe
# Check the error message
# Fix the issue and run again
# The script is idempotent (safe to run multiple times)
```

---

## 📞 **Need Help?**

Read the full guide: `PRODUCTION_MIGRATION_GUIDE.md`

---

**Ready? Let's go! 🚀**

```bash
npm run migrate:to-supabase
```

