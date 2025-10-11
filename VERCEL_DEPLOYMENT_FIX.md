# 🚀 DEPLOYMENT INSTRUCTIONS

## Issue You're Facing:
Your frontend is calling `http://localhost:5001` instead of your deployed Render backend because the environment variable isn't set in Vercel.

---

## ✅ SOLUTION: Update Vercel Environment Variables

### Step 1: Get Your Render Backend URL
1. Go to your Render dashboard
2. Find your backend service
3. Copy the URL (e.g., `https://watify-backend.onrender.com`)

### Step 2: Configure Vercel
1. Go to https://vercel.com/dashboard
2. Select your **Watify** project
3. Click **Settings** → **Environment Variables**
4. Add the following variable:

```
Name: REACT_APP_API_BASE_URL
Value: https://your-backend-url.onrender.com
```

**IMPORTANT:** Replace `https://your-backend-url.onrender.com` with your ACTUAL Render backend URL!

### Step 3: Redeploy Frontend
1. In Vercel dashboard, go to **Deployments**
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## 🧪 HOW TO TEST

After redeployment:

1. **Open your Vercel URL** (e.g., https://watify.vercel.app)
2. **Open Browser DevTools** (F12)
3. **Go to Network tab**
4. **Try to login**
5. **Check the login request** - it should now call your Render URL, not localhost!

---

## 📋 COMPLETE ENVIRONMENT VARIABLES FOR VERCEL

Add ALL of these in Vercel → Settings → Environment Variables:

```
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
REACT_APP_API_TIMEOUT=30000
REACT_APP_APP_NAME=Watify
REACT_APP_VERSION=1.0.0
```

---

## 🔧 Alternative: Quick Test Locally

To test if everything works before deploying:

1. Update `frontend/.env`:
```
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
```

2. Restart your frontend:
```
cd frontend
npm start
```

3. Try to login - it should call the Render backend!

---

## ⚠️ Common Mistakes

1. **Forgetting to include `https://`** in the URL
2. **Including `/api` at the end** - DON'T do this, the code already adds it
3. **Not redeploying** after changing environment variables
4. **Using wrong URL** - make sure it's the Render backend URL, not Vercel frontend URL

---

## ✅ What It Should Look Like

**WRONG:**
```
Request URL: http://localhost:5001/api/auth/login
```

**CORRECT:**
```
Request URL: https://watify-backend.onrender.com/api/auth/login
```

---

## 🎯 Summary

1. ✅ Get Render backend URL
2. ✅ Add `REACT_APP_API_BASE_URL` in Vercel
3. ✅ Redeploy frontend in Vercel
4. ✅ Test login - should call Render backend!
