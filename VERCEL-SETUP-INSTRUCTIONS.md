# 🚀 Vercel Setup Instructions
## Deploy CrisisLens with Unique URL

### ✅ **GitHub Push Complete!**

Your CrisisLens production system has been successfully pushed to GitHub:
- **Repository**: https://github.com/saivarunkonda/CrisisLens
- **Commit**: 9767061 (Production system with ML + External APIs)
- **Status**: Ready for Vercel import

---

## 🌐 **Vercel Import Steps**

### **Step 1: Go to Vercel Dashboard**
1. Visit https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Choose **"saivarunkonda/CrisisLens"** from the list

### **Step 2: Configure Project**
1. **Project Name**: `crisislens-prod` (unique URL)
2. **Framework**: Next.js (auto-detected)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm ci`

### **Step 3: Environment Variables**
Add these in Vercel Project Settings:

#### **Required (Core)**
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AUTH_SECRET=your-auth-secret
```

#### **Optional (External APIs)**
```
OPENWEATHER_API_KEY=your-openweather-key
EMERGENCY_API_KEY=your-emergency-key
NEWS_API_KEY=your-news-key
SOCIAL_MEDIA_API_KEY=your-social-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
EMERGENCY_API_URL=https://api.emergency-services.gov
SOCIAL_MEDIA_API_URL=https://api.social-monitor.com
AWS_REGION=us-east-1
S3_BUCKET=crisislens-training-data
ML_SERVICE_URL=your-ml-service-url
```

### **Step 4: Deploy**
1. Click **"Deploy"**
2. Wait for build completion (2-3 minutes)
3. Your app will be live at: **https://crisislens-prod.vercel.app**

---

## 🔄 **Alternative: Vercel CLI Import**

### **Option 1: Quick CLI Setup**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Import project from GitHub
cd /path/to/CrisisLens
vercel

# Follow prompts:
# - Link to existing team? No
# - Which scope? Your username
# - Found project "saivarunkonda/CrisisLens"? Yes
# - What's your project's name? crisislens-prod
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### **Option 2: Automated Deploy**
```bash
# From project root
vercel --prod --name crisislens-prod
```

---

## 📋 **Project Configuration**

### **Vercel Configuration File**
```json
{
  "version": 2,
  "name": "crisislens-prod",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### **Expected URL**
- **Production**: https://crisislens-prod.vercel.app
- **Preview**: https://crisislens-prod-{git-branch}.vercel.app

---

## 🔧 **Post-Deployment Setup**

### **Step 1: Test Core Functionality**
1. Visit https://crisislens-prod.vercel.app
2. Test login with demo accounts:
   - **Admin**: admin@crisislens.local / CrisisLens2026!
   - **Analyst**: analyst@crisislens.local / CrisisLens2026!
   - **Viewer**: viewer@crisislens.local / CrisisLens2026!
3. Verify dashboard loads
4. Test incident reporting
5. Check risk calculations

### **Step 2: Configure External APIs (Optional)**
For full intelligence features, add API keys in Vercel dashboard:

#### **Weather Data (OpenWeatherMap)**
1. Sign up at https://openweathermap.org/api
2. Get API key
3. Add `OPENWEATHER_API_KEY` in Vercel settings

#### **News API**
1. Sign up at https://newsapi.org
2. Get API key
3. Add `NEWS_API_KEY` in Vercel settings

#### **Emergency Services**
1. Configure emergency service integration
2. Add `EMERGENCY_API_KEY` in Vercel settings

### **Step 3: Database Setup**
1. Visit Supabase dashboard
2. Run the SQL from `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security
4. Set up authentication providers

---

## 🚀 **CI/CD Integration**

### **Automatic Deployments**
Once imported, your CI/CD pipeline will work automatically:

1. **Push to main** → Auto-deploy to production
2. **Push to feature branch** → Create preview deployment
3. **Pull request** → Preview deployment for testing

### **GitHub Actions Integration**
The `.github/workflows/vercel-deploy.yml` will:
- ✅ Run tests and linting
- ✅ Build application
- ✅ Deploy to Vercel
- ✅ Run health checks
- ✅ Send deployment notifications

---

## 📊 **What You Get After Deployment**

### **🌐 Live Application**
- **URL**: https://crisislens-prod.vercel.app
- **Global CDN**: Edge network worldwide
- **Auto-scaling**: Serverless functions
- **HTTPS**: SSL certificate included

### **🎯 Production Features**
- **Real-time risk dashboard** with ML predictions
- **External intelligence** from weather, news, social media
- **Multi-user system** with role-based access
- **Incident reporting** with geospatial data
- **Real-time updates** via WebSocket
- **Anomaly detection** and early warnings

### **🔧 Management**
- **Vercel Dashboard**: Analytics, deployments, functions
- **GitHub Actions**: CI/CD pipeline monitoring
- **Supabase Dashboard**: Database management
- **Custom Domain**: Optional (crisislens.yourdomain.com)

---

## 🚨 **Troubleshooting**

### **Build Failures**
```bash
# Check Vercel build logs
# Verify environment variables
# Test locally: npm run build
```

### **Database Connection Issues**
```bash
# Verify Supabase URL and keys
# Check RLS policies
# Test database connection locally
```

### **External API Issues**
```bash
# Verify API keys are correct
# Check API rate limits
# Test API endpoints manually
```

### **Performance Issues**
```bash
# Check Vercel analytics
# Monitor function execution time
# Optimize database queries
```

---

## 🎯 **Success Checklist**

After deployment, verify:

- [ ] Application loads at https://crisislens-prod.vercel.app
- [ ] Login works with demo accounts
- [ ] Dashboard displays risk data
- [ ] Incident reporting functions
- [ ] ML predictions working
- [ ] Real-time updates active
- [ ] Mobile responsive design
- [ ] No console errors
- [ ] API endpoints responding
- [ ] Database connected

---

## 🎉 **Deployment Success!**

### **Your CrisisLens is Now:**
🌐 **Live globally** on Vercel edge network  
🤖 **Intelligent** with real ML predictions  
📡 **Real-time** with WebSocket updates  
🌤️ **Connected** to external data sources  
🔒 **Secure** with authentication and RLS  
📊 **Monitored** with CI/CD pipeline  

### **Production URL**: https://crisislens-prod.vercel.app

**🚀 Your intelligent crisis management system is now live and ready to save lives!** 🌟
