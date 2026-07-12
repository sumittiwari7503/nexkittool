# Nexkittool v3 Setup Guide

## ✅ What's New in This Version
- Real Google Sign-In (GSI) integration
- Real email verification on signup
- Real password reset via email link
- Professional email templates from nexkittool@gmail.com
- nodemailer added to backend

---

## 🔴 Step 1: Gmail App Password (for sending emails)

1. Go to **myaccount.google.com** → Security
2. Enable **2-Step Verification** (if not already)
3. Search for **"App Passwords"** → Create one → Name: "Nexkittool"
4. Copy the **16-character password** (e.g. `abcd efgh ijkl mnop`)
5. Add to your `.env` file:
   ```
   GMAIL_USER=nexkittool@gmail.com
   GMAIL_APP_PASS=abcd efgh ijkl mnop
   ```

---

## 🔴 Step 2: Google Sign-In Client ID

1. Go to **console.cloud.google.com**
2. Create a project (or select existing)
3. APIs & Services → **Credentials** → Create → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins: add your domain
   - `http://localhost:3000` (for local testing)
   - `https://nexkittool.com` (for production)
6. Copy your **Client ID** (ends in `.apps.googleusercontent.com`)

**Then do TWO things:**

### A. Add to `.env`:
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### B. Add to `public/js/auth.js` (line 4):
```javascript
const GOOGLE_CLIENT_ID = '123456789-abc.apps.googleusercontent.com';
```

---

## 🔴 Step 3: Install & Run

```bash
npm install
cp .env.example .env
# Fill in your values in .env
node server.js
```

---

## ✅ Testing Checklist

- [ ] Sign up with email → receive verification email
- [ ] Click verify link → redirects to success page
- [ ] Log in with email/password → works
- [ ] Forgot password → receive reset email
- [ ] Click reset link → set new password → log in
- [ ] Google Sign-In button → Google popup → logged in
- [ ] Logout → nav resets

---

## 📁 File Summary

| File | What changed |
|------|-------------|
| `public/js/auth.js` | Full rewrite: Google GSI + real API calls |
| `backend/routes/auth.js` | Nodemailer + Google token verify + reset/verify routes |
| `reset-password.html` | New page for password reset |
| `package.json` | Added `nodemailer` |
| `.env.example` | Added all required env vars |

