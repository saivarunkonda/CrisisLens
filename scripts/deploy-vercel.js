#!/usr/bin/env node

/**
 * CrisisLens Vercel Deployment Script
 * Prepares and deploys to Vercel with all configurations
 */

require('dotenv').config({ path: '.env.local' });

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🚀 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function checkEnvironment() {
  log('Checking environment configuration...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AUTH_SECRET'
  ];
  
  const optional = [
    'OPENWEATHER_API_KEY',
    'EMERGENCY_API_KEY',
    'NEWS_API_KEY',
    'SOCIAL_MEDIA_API_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  let missing = [];
  let missingOptional = [];
  
  required.forEach(env => {
    if (!process.env[env]) {
      missing.push(env);
    }
  });
  
  optional.forEach(env => {
    if (!process.env[env]) {
      missingOptional.push(env);
    }
  });
  
  if (missing.length > 0) {
    error(`Missing required environment variables:\n${missing.join('\n')}`);
  }
  
  if (missingOptional.length > 0) {
    log(`⚠️  Missing optional environment variables (system will use mock data):\n${missingOptional.join('\n')}`);
  }
  
  log('✅ Environment configuration validated');
}

function buildApplication() {
  log('Building CrisisLens for production...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Application built successfully');
  } catch (err) {
    error('Build failed');
  }
}

function createVercelConfig() {
  log('Creating Vercel configuration...');
  
  const config = {
    version: 2,
    name: "crisislens",
    builds: [
      {
        src: "package.json",
        use: "@vercel/next"
      }
    ],
    env: {
      "NEXT_PUBLIC_SUPABASE_URL": process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "SUPABASE_SERVICE_ROLE_KEY": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "AUTH_SECRET": process.env.AUTH_SECRET,
      "STRIPE_PUBLISHABLE_KEY": process.env.STRIPE_PUBLISHABLE_KEY || "",
      "STRIPE_SECRET_KEY": process.env.STRIPE_SECRET_KEY || "",
      "OPENWEATHER_API_KEY": process.env.OPENWEATHER_API_KEY || "",
      "EMERGENCY_API_KEY": process.env.EMERGENCY_API_KEY || "",
      "NEWS_API_KEY": process.env.NEWS_API_KEY || "",
      "SOCIAL_MEDIA_API_KEY": process.env.SOCIAL_MEDIA_API_KEY || "",
      "EMERGENCY_API_URL": process.env.EMERGENCY_API_URL || "https://api.emergency-services.gov",
      "SOCIAL_MEDIA_API_URL": process.env.SOCIAL_MEDIA_API_URL || "https://api.social-monitor.com",
      "AWS_REGION": process.env.AWS_REGION || "us-east-1",
      "S3_BUCKET": process.env.S3_BUCKET || "crisislens-training-data",
      "ML_SERVICE_URL": process.env.ML_SERVICE_URL || ""
    },
    functions: {
      "src/app/api/**/*.ts": {
        maxDuration: 30
      }
    },
    rewrites: [
      {
        source: "/api/ml/:path*",
        destination: "/api/ml/:path*"
      },
      {
        source: "/api/external-data/:path*",
        destination: "/api/external-data/:path*"
      },
      {
        source: "/api/(.*)",
        destination: "/api/$1"
      }
    ],
    headers: [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization"
          }
        ]
      }
    ],
    regions: ["iad1"],
    framework: "nextjs",
    installCommand: "npm ci",
    buildCommand: "npm run build",
    outputDirectory: ".next"
  };
  
  fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
  log('✅ Vercel configuration created');
}

function setupDatabase() {
  log('Setting up database schema...');
  
  try {
    if (fs.existsSync('scripts/setup-database.js')) {
      execSync('node scripts/setup-database.js', { stdio: 'inherit' });
      log('✅ Database setup completed');
    } else {
      log('⚠️  Database setup script not found, skipping...');
    }
  } catch (err) {
    log('⚠️  Database setup failed, continuing anyway...');
  }
}

function testDeployment() {
  log('Testing deployment configuration...');
  
  try {
    // Test if the build works
    execSync('npm run build', { stdio: 'pipe' });
    log('✅ Build test passed');
    
    // Test if critical files exist
    const criticalFiles = [
      'src/app/page.tsx',
      'src/app/dashboard/page.tsx',
      'src/app/api/risk/route.ts',
      'src/lib/database-simple.ts',
      'src/lib/ml-pipeline.ts',
      'src/lib/external-apis.ts'
    ];
    
    criticalFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        throw new Error(`Critical file missing: ${file}`);
      }
    });
    
    log('✅ All critical files present');
    
  } catch (err) {
    error(`Deployment test failed: ${err.message}`);
  }
}

function generateDeploymentManifest() {
  log('Generating deployment manifest...');
  
  const manifest = {
    deployment: {
      timestamp: new Date().toISOString(),
      version: require('./package.json').version,
      commit: execSync('git rev-parse HEAD').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      environment: 'production'
    },
    features: {
      database: 'supabase',
      ml: 'real_machine_learning',
      external_apis: true,
      realtime: 'websocket',
      authentication: 'nextauth',
      deployment: 'vercel'
    },
    configuration: {
      external_apis: {
        weather: !!process.env.OPENWEATHER_API_KEY,
        emergency: !!process.env.EMERGENCY_API_KEY,
        news: !!process.env.NEWS_API_KEY,
        social: !!process.env.SOCIAL_MEDIA_API_KEY
      },
      database: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      ml_service: {
        configured: !!process.env.ML_SERVICE_URL
      }
    },
    endpoints: [
      '/api/risk',
      '/api/report',
      '/api/ml/predict',
      '/api/ml/train',
      '/api/external-data',
      '/api/auth/[...nextauth]'
    ]
  };
  
  fs.writeFileSync('deployment-manifest.json', JSON.stringify(manifest, null, 2));
  log('✅ Deployment manifest generated');
}

function deployToVercel() {
  log('Deploying to Vercel...');
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'pipe' });
    
    // Deploy to Vercel
    execSync('vercel --prod', { stdio: 'inherit' });
    
    log('✅ Successfully deployed to Vercel');
    log('🌐 Your CrisisLens is now live at: https://crisislens.vercel.app');
    
  } catch (err) {
    error('Vercel deployment failed');
  }
}

function main() {
  log('🚀 Starting CrisisLens Vercel Deployment...\n');
  
  try {
    checkEnvironment();
    createVercelConfig();
    setupDatabase();
    testDeployment();
    generateDeploymentManifest();
    buildApplication();
    deployToVercel();
    
    log('\n🎉 CrisisLens deployment completed successfully!');
    log('\n📋 Next Steps:');
    log('1. Visit https://crisislens.vercel.app');
    log('2. Test login with demo accounts');
    log('3. Configure external API keys in Vercel dashboard');
    log('4. Monitor the application performance');
    log('5. Set up custom domain if needed');
    
    log('\n🔗 Useful Links:');
    log('- Vercel Dashboard: https://vercel.com/dashboard');
    log('- Supabase Dashboard: https://supabase.com/dashboard');
    log('- GitHub Repository: https://github.com/saivarunkonda/CrisisLens');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironment,
  buildApplication,
  createVercelConfig,
  deployToVercel
};
