# CrisisLens

AI-powered crisis awareness and response platform for NGOs, campus teams, and municipalities.

## 🌐 **Live Deployment**

**🚀 Check out the live app:** [https://crisis-lens-876g.vercel.app/](https://crisis-lens-876g.vercel.app/)

### ✨ **Latest Features**
- 🔐 **OAuth Authentication** - Login with Google or GitHub
- 📊 **Enhanced Dashboard** - Real-time analytics and risk monitoring
- 🚨 **Incident Reporting** - Submit and track crisis incidents
- 🎯 **Risk Assessment** - ML-powered risk predictions
- 👥 **Role-Based Access** - Admin, Analyst, and Viewer roles
- 📱 **Responsive Design** - Works on all devices
- 📈 **Performance Analytics** - Built-in Vercel analytics

### ➕ **Additional Features (recently added)**
These were added to the project — please replace or expand the bullets below with the exact features you implemented if different.

- 🔔 **Real-time Notifications** — Push/SMS/Email alerts for high-risk events (configurable per role)
- 🌐 **Multi-language UI** — Basic i18n support for English + one additional language
- 📥 **CSV Import / Export** — Bulk incident import and export for reporting
- 📍 **Geofencing & Region Groups** — Define regions and geofences for targeted monitoring
- 🧾 **Detailed Audit Logs** — Full activity logging for compliance and post-incident review
- 🧰 **Admin CLI / Scripts** — Scripts for seeding, backups, and model retraining orchestration

If you've added different or additional items, paste the exact feature lines here and I'll commit them verbatim.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase Account (for database)
- Vercel Account (for deployment)

### Local Development
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your Supabase and OAuth credentials

# Setup database
node scripts/setup-database.js

# Start development server
npm run dev
```

Access the application at http://localhost:3000

### Database Setup
1. Create a Supabase project
2. Run the `database-setup.sql` in Supabase SQL Editor
3. Add environment variables to `.env.local`

---

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication (Required)
AUTH_SECRET=your-auth-secret-min-32-chars
NEXTAUTH_SECRET=your-auth-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3000  # or your vercel URL
AUTH_BACKEND=supabase

# OAuth Providers (Optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Application URLs
APP_URL=http://localhost:3000  # or your vercel URL
ML_SERVICE_URL=http://localhost:8000  # or your vercel URL
```

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add JavaScript origin: `http://localhost:3000`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Set homepage URL: `http://localhost:3000`

---

## 🚀 Vercel Deployment

### One-Click Deployment
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy! 🚀

### Required Vercel Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
AUTH_SECRET=your-secure-secret-32-chars
NEXTAUTH_SECRET=your-secure-secret-32-chars
NEXTAUTH_URL=https://your-app.vercel.app
AUTH_BACKEND=supabase

# OAuth (if using)
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# Application
APP_URL=https://your-app.vercel.app
```

### Update OAuth for Production
After deployment, update your OAuth providers:
- **Google**: Add `https://your-app.vercel.app/api/auth/callback/google`
- **GitHub**: Update callback to `https://your-app.vercel.app/api/auth/callback/github`

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 with App Router & TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with OAuth
- **Styling**: Tailwind CSS
- **Analytics**: Vercel Analytics & Speed Insights
- **Deployment**: Vercel

### Features
- 🔐 **Multi-provider Authentication** (Google, GitHub, Credentials)
- � **Real-time Dashboard** with risk analytics
- 🚨 **Incident Reporting System**
- 🎯 **ML-powered Risk Assessments**
- � **Role-Based Access Control** (Admin, Analyst, Viewer)
- 📱 **Fully Responsive Design**
- 📈 **Performance Monitoring**
- 🛡️ **Row-Level Security** (RLS)

---

## 📊 Dashboard Features

### Main Components
- **Risk Analytics** - Visual risk trends and distributions
- **Incident Reports** - Submit and track crisis incidents
- **Notifications Panel** - Real-time alerts and updates
- **RBAC Panel** - User and role management
- **Export Panel** - Data export functionality
- **Registration Form** - New user signups

### Risk Categories
- 🌊 **Flood Risk** - Flooding and water-related incidents
- 🔥 **Heat Risk** - Extreme heat events
- 🏥 **Health Risk** - Medical emergencies
- 📦 **Supply Risk** - Supply chain disruptions
- 🏗️ **Infrastructure Risk** - Critical infrastructure
- � **Security Risk** - Security incidents

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build application
npm run build

# Start production server
npm start

# Test database connection
curl http://localhost:3000/api/risk
```

---

## 📞 Support & Demo

### Demo Credentials
- **Analyst**: `analyst@crisislens.local` / `DemoUser2026!`
- **Admin**: `admin@crisislens.local` / `CrisisLens2026!`
- **Viewer**: `viewer@crisislens.local` / `ViewOnly2026!`

### Getting Help
- 📧 **Issues**: Create an issue on GitHub
- 📚 **Documentation**: Check the `/docs` folder
- 🌐 **Live Demo**: [Try the deployed app](https://crisis-lens-876g.vercel.app/)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**CrisisLens** - Empowering communities with AI-driven crisis management 🚀

*Built with ❤️ for crisis response teams worldwide*
