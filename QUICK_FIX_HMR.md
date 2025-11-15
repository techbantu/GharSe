# 🔧 Quick Fix for HMR Errors

## If you see "module factory is not available" error:

### Step 1: Stop the dev server
Press `Ctrl+C` in your terminal to stop the running server.

### Step 2: Clear cache and restart
```bash
# Clear all caches
rm -rf .next .turbo node_modules/.cache

# Regenerate Prisma Client
npm run prisma:generate

# Restart dev server
npm run dev
```

### Step 3: Hard refresh browser
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

---

## Alternative: Use clean start script

```bash
npm run dev:clean
```

This automatically clears caches and restarts.

---

## If error persists:

1. **Close all browser tabs** with the app
2. **Clear browser cache** completely
3. **Restart terminal**
4. Run `npm run dev:clean` again

---

The error is caused by Turbopack/Next.js cache corruption. Clearing `.next` and `.turbo` folders fixes it.

