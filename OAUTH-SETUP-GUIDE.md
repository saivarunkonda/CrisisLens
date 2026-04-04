# 🔐 OAuth Setup Guide for CrisisLens
## Google & GitHub Authentication Integration

### ✅ **OAuth Status: ALREADY IMPLEMENTED**

CrisisLens already has full OAuth support built-in! Here's how to configure it:

---

## 🚀 **Quick Setup Steps**

### **Step 1: Google OAuth Setup**

#### **1. Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** and **Google People API**

#### **2. Create OAuth Credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://crisislens-prod.vercel.app/api/auth/callback/google
   ```
5. Save and note your **Client ID** and **Client Secret**

### **Step 2: GitHub OAuth Setup**

#### **1. Create GitHub OAuth App**
1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **"New OAuth App"**
3. Fill in details:
   - **Application name**: CrisisLens
   - **Homepage URL**: `https://crisislens-prod.vercel.app`
   - **Authorization callback URL**: `https://crisislens-prod.vercel.app/api/auth/callback/github`
4. Register and note your **Client ID** and **Client Secret**

---

## 🔧 **Environment Variables Configuration**

### **For Local Development (.env.local)**
```bash
# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Core Auth (already configured)
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-auth-secret
```

### **For Production (Vercel Environment Variables)**
```bash
# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# GitHub OAuth
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Production Auth
NEXTAUTH_URL=https://crisislens-prod.vercel.app
AUTH_SECRET=your-auth-secret
```

---

## 🎯 **OAuth Features Already Built**

### **🔗 Supported Providers**
- ✅ **Google OAuth** - Full Google account integration
- ✅ **GitHub OAuth** - GitHub account integration  
- ✅ **Credentials** - Demo accounts for testing

### **👥 Role-Based Access Control**
```typescript
// Automatic role assignment based on email domains
const roleForEmail = (email: string): Role => {
  const domain = email.toLowerCase().split("@")[1];
  
  // Admin domains
  if (["admin.crisislens.local", "crisislens.com"].includes(domain)) {
    return "admin";
  }
  
  // Analyst domains
  if (["analyst.crisislens.local", "staff.crisislens.com"].includes(domain)) {
    return "analyst";
  }
  
  // Default to viewer for everyone else
  return "viewer";
};
```

### **🛡️ Security Features**
- ✅ **JWT sessions** with 8-hour expiration
- ✅ **Role-based authorization** (Admin/Analyst/Viewer)
- ✅ **Protected routes** with middleware
- ✅ **OAuth state validation**
- ✅ **CSRF protection**

---

## 🌐 **Login Experience**

### **🔴 Demo Accounts (Always Available)**
```
Admin:   admin@crisislens.local     / CrisisLens2026!
Analyst: analyst@crisislens.local   / DemoUser2026!
Viewer:  viewer@crisislens.local    / ViewOnly2026!
```

### **🔵 OAuth Login Options**
When OAuth is configured, users see:

1. **"Continue with Google"** button
2. **"Continue with GitHub"** button  
3. **"Or email"** separator
4. **Traditional email/password** form

### **📱 Mobile Responsive**
- OAuth buttons work on all devices
- Touch-friendly interface
- Dark mode support

---

## 🔄 **OAuth Flow Diagram**

```
User Clicks "Google" or "GitHub"
        ↓
Redirect to OAuth Provider
        ↓
User Authenticates with Provider
        ↓
Provider Redirects to CrisisLens
        ↓
CrisisLens Validates OAuth Code
        ↓
Create/Update User Account
        ↓
Assign Role Based on Email Domain
        ↓
Create JWT Session
        ↓
Redirect to Dashboard
```

---

## 🛠️ **Advanced Configuration**

### **Custom Role Mapping**
Edit `src/lib/rbac.ts` to customize role assignments:

```typescript
export const roleForEmail = (email: string): Role => {
  const domain = email.toLowerCase().split("@")[1];
  
  // Add your organization domains here
  if (["yourcompany.com", "admin.yourcompany.com"].includes(domain)) {
    return "admin";
  }
  
  if (["staff.yourcompany.com"].includes(domain)) {
    return "analyst";
  }
  
  return "viewer";
};
```

### **Custom OAuth Scopes**
The current setup uses default scopes. For more permissions, modify `src/auth.ts`:

```typescript
Google({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/userinfo.email"
    }
  }
})
```

---

## 🔍 **Testing OAuth**

### **Local Testing**
1. Add OAuth credentials to `.env.local`
2. Run `npm run dev`
3. Visit `http://localhost:3000/login`
4. Click OAuth buttons to test

### **Production Testing**
1. Add OAuth credentials to Vercel environment variables
2. Deploy to Vercel
3. Visit `https://crisislens-prod.vercel.app/login`
4. Test OAuth login

### **Debugging**
Check browser console for OAuth errors:
- **Invalid redirect URI** - Check callback URLs
- **Client ID/Secret mismatch** - Verify credentials
- **Scope issues** - Check API permissions

---

## 🎊 **OAuth Benefits**

### **🚀 User Experience**
- **One-click login** - No password management
- **Trusted providers** - Users already have accounts
- **Profile data** - Auto-populate user information
- **Mobile friendly** - Works on all devices

### **🔒 Security Benefits**
- **No password storage** - Providers handle security
- **Multi-factor authentication** - Provider's 2FA
- **Session management** - Provider handles token refresh
- **Reduced attack surface** - No password breaches

### **📊 Analytics & Integration**
- **User demographics** - Get profile data
- **Single sign-on** - Integrate with existing systems
- **Audit trail** - Provider login history
- **Compliance** - SOC2, GDPR ready

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Invalid redirect_uri" Error**
```bash
# Make sure these URLs are added to OAuth provider:
http://localhost:3000/api/auth/callback/google
https://crisislens-prod.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/github  
https://crisislens-prod.vercel.app/api/auth/callback/github
```

#### **"Client ID/Secret Invalid"**
```bash
# Double-check environment variables:
echo $AUTH_GOOGLE_ID
echo $AUTH_GOOGLE_SECRET
echo $AUTH_GITHUB_ID
echo $AUTH_GITHUB_SECRET
```

#### **OAuth Buttons Not Showing**
```bash
# Check if environment variables are set:
# In Next.js, use NEXT_PUBLIC_ prefix for client-side access
# Or check server-side in the auth configuration
```

---

## 🎯 **Production Checklist**

Before going live with OAuth:

- [ ] Google OAuth app created and configured
- [ ] GitHub OAuth app created and configured  
- [ ] Redirect URIs added for both environments
- [ ] Environment variables set in Vercel
- [ ] Test OAuth flow end-to-end
- [ ] Verify role assignment works
- [ ] Test logout functionality
- [ ] Check mobile responsiveness
- [ ] Verify error handling

---

## 🎉 **OAuth Ready!**

Your CrisisLens already has:
- ✅ **Full OAuth implementation** 
- ✅ **Google & GitHub providers**
- ✅ **Role-based access control**
- ✅ **Production-ready security**
- ✅ **Mobile-responsive UI**

**Just add your OAuth credentials and you're ready to go!** 🚀

The OAuth system is fully implemented and waiting for your credentials. Users can choose between:
1. **OAuth login** (Google/GitHub) - Modern, secure
2. **Demo accounts** - For testing and admin access
