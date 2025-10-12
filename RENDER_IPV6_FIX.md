# 🚨 CRITICAL FIX FOR RENDER IPv6 ISSUE

## THE PROBLEM:
Render is trying to connect via IPv6 which is blocked, causing `ENETUNREACH` errors.

## THE SOLUTION:
Use Supabase's Transaction Pooler connection string instead of direct connection.

---

## ✅ UPDATE THIS IN RENDER NOW:

Go to Render Dashboard → Your Service → Environment

### **Replace DATABASE_URL with this:**

```
DATABASE_URL=postgres://postgres.yjarmeecsensscrtiebh:haadheesheeraz-2004@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Key changes:**
- Host: `aws-0-us-east-1.pooler.supabase.com` (pooler, not direct)
- Port: `6543` (transaction mode)
- User: `postgres.yjarmeecsensscrtiebh` (with project ID)

---

## 📝 FULL RENDER ENVIRONMENT VARIABLES:

Keep these:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=watify_super_secret_jwt_key_2024_change_in_production_very_secure_token
JWT_EXPIRE=7d
CLIENT_URL=https://watify.vercel.app
```

**REPLACE DATABASE_URL with:**
```
DATABASE_URL=postgres://postgres.yjarmeecsensscrtiebh:haadheesheeraz-2004@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**You can DELETE these (not needed anymore):**
```
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
connection_string
```

The code will now use `DATABASE_URL` exclusively in production.

---

## 🧪 AFTER UPDATING:

1. Click Save in Render
2. Wait for automatic redeploy (~2 minutes)
3. Check logs - should see: "🔗 Using DATABASE_URL connection string for production"
4. Try login - should work! ✅

---

## 🎯 WHY THIS FIXES IT:

- Transaction pooler uses IPv4 (works on Render)
- Direct connection uses IPv6 (blocked on Render)
- Connection string format avoids DNS resolution issues
