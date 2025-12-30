# Deployment Guide: Netlify (Frontend) + Render (Backend)

## 📋 Prerequisites

Before deploying, ensure you have:
- GitHub repository pushed with all latest code ✅
- Netlify account (sign up at https://netlify.com)
- Render account (sign up at https://render.com)
- MongoDB Atlas connection string
- QuickeKYC API key
- SMTP credentials for email

---

## 🎨 Part 1: Deploy Frontend to Netlify

### Step 1: Prepare Frontend for Deployment

1. **Create a `_redirects` file in `client/public/`:**
```bash
cd client/public
```

Create `_redirects` file with content:
```
/*    /index.html   200
```

This handles client-side routing for React Router.

### Step 2: Update Environment Variable Example

Your `client/.env.example` should have:
```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

### Step 3: Deploy to Netlify

**Option A: Deploy via Netlify UI**

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize
4. Select your repository: `recruitment-page`
5. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
6. Click **"Add environment variables"** and add:
   ```
   VITE_API_BASE_URL = https://your-backend.onrender.com
   ```
   (You'll update this after deploying backend)
7. Click **"Deploy site"**

**Option B: Deploy via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to client folder
cd client

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

### Step 4: Get Your Netlify URL

After deployment, Netlify will give you a URL like:
```
https://your-site-name.netlify.app
```

Save this URL - you'll need it for CORS configuration in backend!

---

## 🚀 Part 2: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Create `render.yaml` in project root:**

```yaml
services:
  - type: web
    name: recruitment-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
```

2. **Ensure `server/package.json` has start script:**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

### Step 2: Deploy to Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `recruitment-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables on Render

Click **"Environment"** tab and add these variables:

```env
# Server
PORT=4000
NODE_ENV=production

# MongoDB (Get from MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# CORS Origins (Add your Netlify URL)
CORS_ORIGINS=https://your-site-name.netlify.app

# Client URL (Your Netlify URL)
CLIENT_URL=https://your-site-name.netlify.app

# Auth
JWT_SECRET=your-random-secret-key-min-32-chars
JWT_EXPIRES_IN=1d

# KYC Provider
KYC_BASE_URL=https://api.quickekyc.com/api/v1
KYC_API_KEY=your-quickekyc-api-key-here
KYC_DEBUG=false

# Email/SMTP
SMTP_HOST=mail.alabty.com
SMTP_PORT=465
SMTP_USER=no_reply@alabty.com
SMTP_PASS=your-smtp-password
SMTP_FROM=no_reply@alabty.com
```

**Important:** Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Click **"Create Web Service"**

### Step 4: Get Your Render URL

After deployment, Render will give you a URL like:
```
https://recruitment-backend.onrender.com
```

---

## 🔗 Part 3: Connect Frontend to Backend

### Step 1: Update Netlify Environment Variable

1. Go to Netlify Dashboard → Your Site
2. Go to **"Site configuration"** → **"Environment variables"**
3. Update `VITE_API_BASE_URL`:
   ```
   VITE_API_BASE_URL = https://recruitment-backend.onrender.com
   ```
4. **Trigger a new deploy** (Deploys → Trigger deploy → Deploy site)

### Step 2: Update CORS on Render

1. Go to Render Dashboard → Your Service
2. Go to **"Environment"** tab
3. Update `CORS_ORIGINS` and `CLIENT_URL`:
   ```
   CORS_ORIGINS=https://your-site-name.netlify.app
   CLIENT_URL=https://your-site-name.netlify.app
   ```
4. Service will auto-redeploy

---

## ✅ Part 4: Verification & Testing

### 1. Test Backend

Visit: `https://recruitment-backend.onrender.com/health`

Should see: `{"status":"ok"}`

If you don't have a health endpoint, add this to `server/src/index.js`:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

### 2. Test Frontend

Visit: `https://your-site-name.netlify.app`

- Should load without errors
- Check browser console for errors
- Test signup flow
- Test GST/PAN verification
- Test OTP sending
- Test login

### 3. Check Network Requests

Open browser DevTools → Network tab:
- API calls should go to `https://recruitment-backend.onrender.com`
- Should NOT see CORS errors
- Should get proper responses

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error

**Error:** `Access to fetch at 'https://...' has been blocked by CORS policy`

**Solution:**
1. Check `CORS_ORIGINS` in Render includes your Netlify URL
2. Ensure no trailing slash in URLs
3. Redeploy backend after changing CORS

### Issue 2: API Connection Failed

**Error:** `Network error` or `Failed to fetch`

**Solution:**
1. Verify `VITE_API_BASE_URL` in Netlify environment variables
2. Check backend is running on Render (not sleeping)
3. Test backend health endpoint directly

### Issue 3: Render Service Sleeping

**Problem:** Free tier services sleep after 15 minutes of inactivity

**Solutions:**
- First request will wake it up (takes 30-60 seconds)
- Upgrade to paid plan for always-on
- Use a ping service like UptimeRobot to keep it awake

### Issue 4: Environment Variables Not Working

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Redeploy after adding/changing variables
3. For Vite (frontend), variables MUST start with `VITE_`

### Issue 5: MongoDB Connection Failed

**Error:** `MongoNetworkError` or `connection refused`

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production, add Render's IP addresses specifically

### Issue 6: Build Fails on Netlify

**Error:** `Build failed`

**Solution:**
1. Check build logs for specific error
2. Ensure all dependencies in `package.json`
3. Try building locally: `cd client && npm run build`
4. Check Node version compatibility

---

## 🔐 Security Checklist

Before going live:

- [ ] Strong JWT_SECRET (min 32 chars)
- [ ] Real SMTP credentials (not placeholders)
- [ ] MongoDB user has strong password
- [ ] QuickeKYC API key is valid
- [ ] CORS restricted to your Netlify domain only
- [ ] `KYC_DEBUG=false` in production
- [ ] `.env` files NOT committed to git
- [ ] MongoDB Network Access configured properly

---

## 📱 Custom Domain (Optional)

### For Netlify:
1. Go to **Domain settings** → **Add custom domain**
2. Follow Netlify's DNS configuration steps
3. SSL certificate auto-generated

### For Render:
1. Go to **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS with provided CNAME

---

## 🔄 Continuous Deployment

Both Netlify and Render support auto-deployment:

**Automatic:** Push to GitHub `main` branch → Auto deploys

**Manual:**
- Netlify: Dashboard → Deploys → Trigger deploy
- Render: Dashboard → Manual Deploy → Deploy latest commit

---

## 📊 Monitoring

### Netlify:
- Dashboard → Analytics (view traffic)
- Functions → View logs (if using functions)
- Deploys → View build logs

### Render:
- Dashboard → Logs (view application logs)
- Metrics → View performance
- Events → View deployment history

---

## 💰 Cost Breakdown

**Free Tier Limits:**

**Netlify:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic SSL
- ✅ Continuous deployment

**Render:**
- ✅ 750 hours/month (1 service always on)
- ⚠️ Sleeps after 15 min inactivity
- ✅ Free PostgreSQL (500MB)
- ✅ Automatic SSL

**Estimated for Production:**
- Netlify Pro: $19/month (more bandwidth)
- Render Starter: $7/month (always-on, no sleep)

---

## 🎉 You're Done!

Your application is now live:
- **Frontend:** `https://your-site-name.netlify.app`
- **Backend:** `https://recruitment-backend.onrender.com`

Share your deployed URL and start getting users! 🚀

---

## 📞 Support

If you encounter issues:
1. Check logs (Netlify → Deploys, Render → Logs)
2. Verify environment variables
3. Test each component separately
4. Check this guide's troubleshooting section

Good luck with your deployment! 🎊
