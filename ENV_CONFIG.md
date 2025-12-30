# Environment Variables Configuration

Your deployment URLs:
- **Backend:** https://recruitment-page.onrender.com
- **Frontend:** https://recruitment-alabty.netlify.app

---

## 🎨 Netlify Environment Variables

Go to: **Netlify Dashboard → Your Site → Site configuration → Environment variables**

Add this variable:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://recruitment-page.onrender.com` |

**Important:** NO trailing slash!

After adding, trigger a new deploy: **Deploys → Trigger deploy → Deploy site**

---

## 🚀 Render Environment Variables

Go to: **Render Dashboard → Your Service → Environment**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `MONGO_URI` | `mongodb+srv://username:password@cluster.mongodb.net/recruitment-db?retryWrites=true&w=majority` | Get from MongoDB Atlas |
| `CORS_ORIGINS` | `https://recruitment-alabty.netlify.app` | NO trailing slash |
| `CLIENT_URL` | `https://recruitment-alabty.netlify.app` | NO trailing slash |
| `JWT_SECRET` | Generate 32+ char secret | Use crypto.randomBytes(32) |
| `JWT_EXPIRES_IN` | `1d` | Token expiry |
| `KYC_BASE_URL` | `https://api.quickekyc.com/api/v1` | QuickeKYC API |
| `KYC_API_KEY` | Your actual API key | From QuickeKYC dashboard |
| `KYC_DEBUG` | `false` | Disable debug in production |
| `SMTP_HOST` | `mail.alabty.com` | Email server |
| `SMTP_PORT` | `465` | SMTP port |
| `SMTP_USER` | `no_reply@alabty.com` | SMTP username |
| `SMTP_PASS` | Your actual password | SMTP password |
| `SMTP_FROM` | `no_reply@alabty.com` | From email address |

---

## 🔑 Generate JWT Secret

Run this command locally to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

---

## 🗄️ MongoDB Atlas Setup

1. Go to: https://cloud.mongodb.com/
2. **Database → Network Access → Add IP Address**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. **Database → Database Access → Add New Database User**
   - Username: Choose a username
   - Password: Generate strong password
   - Role: Read and write to any database
5. **Database → Connect → Connect your application**
   - Copy connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your values
   - Use this as your `MONGO_URI`

---

## ✅ Verification Steps

### 1. Check Backend Health
Visit: https://recruitment-page.onrender.com/health

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-30T...",
  "environment": "production"
}
```

### 2. Check Frontend
Visit: https://recruitment-alabty.netlify.app

- App should load without errors
- Open DevTools → Console (should be no errors)
- Open DevTools → Network tab
- Try signup flow
- API calls should go to `https://recruitment-page.onrender.com`

### 3. Test Complete Flow
1. ✅ Signup with new account
2. ✅ Verify GST/PAN number
3. ✅ Fill business details
4. ✅ Request OTP
5. ✅ Verify OTP
6. ✅ Create password
7. ✅ Login
8. ✅ Test forgot password

---

## 🐛 Common Issues

### CORS Error
**Symptom:** Console shows `blocked by CORS policy`

**Fix:**
1. Verify `CORS_ORIGINS` in Render = `https://recruitment-alabty.netlify.app`
2. NO trailing slash
3. Service auto-redeploys after env var change

### API Connection Failed
**Symptom:** `Network error` or `Failed to fetch`

**Fix:**
1. Check `VITE_API_BASE_URL` in Netlify = `https://recruitment-page.onrender.com`
2. Trigger new deploy in Netlify after changing env vars
3. Check Render service is running (not sleeping)

### MongoDB Connection Error
**Symptom:** Backend logs show `MongoNetworkError`

**Fix:**
1. MongoDB Atlas → Network Access → Add `0.0.0.0/0`
2. Verify connection string format in `MONGO_URI`
3. Ensure password doesn't contain special characters (or URL encode them)

### Render Service Sleeping
**Symptom:** First request takes 30-60 seconds

**Info:** Free tier services sleep after 15 min inactivity. First request wakes it up.

**Solution:** Upgrade to Render paid plan ($7/month) for always-on service.

---

## 📝 Checklist Before Going Live

- [ ] All Netlify environment variables added
- [ ] All Render environment variables added
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] MongoDB network access configured
- [ ] MongoDB user created with correct permissions
- [ ] QuickeKYC API key is valid
- [ ] SMTP credentials are correct
- [ ] Tested backend health endpoint
- [ ] Tested frontend loads
- [ ] Tested complete signup flow
- [ ] Tested login
- [ ] Tested password reset
- [ ] No CORS errors in console
- [ ] No 404 or 500 errors

---

## 🎉 You're Ready!

Once all environment variables are configured and tests pass, your application is live and ready for users!

**URLs:**
- Frontend: https://recruitment-alabty.netlify.app
- Backend API: https://recruitment-page.onrender.com
