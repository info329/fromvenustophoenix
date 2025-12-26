# Vercel Deployment Guide for A&R Focus Forecast

## Quick Deploy (5 minutes)

### Prerequisites
- GitHub repository with the code
- Supabase account with project set up
- Vercel account

## Step-by-Step Deployment

### 1. Deploy to Vercel (2 minutes)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `info329/fromvenustophoenix`
4. Select the branch: `copilot/build-nextjs-mvp-autonomous`
5. Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

6. **Add Environment Variables** (click "Environment Variables"):

```bash
# Required Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional: SMTP Email (can add later)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=A&R Focus Forecast
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

7. Click **"Deploy"**
8. Wait for deployment to complete (~2-3 minutes)

### 2. Post-Deployment Setup (3 minutes)

Once deployed, Vercel will provide you with a URL like `https://your-app.vercel.app`

1. **Update Supabase Settings**:
   - Go to your Supabase project
   - Navigate to **Authentication > URL Configuration**
   - Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
   - Add redirect URLs:
     - `https://your-app.vercel.app/login`
     - `https://your-app.vercel.app/dashboard`
     - `https://your-app.vercel.app/**`

2. **Update Environment Variables**:
   - In Vercel, go to **Project Settings > Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
   - Redeploy if needed

3. **Verify Deployment**:
   - Visit your Vercel URL
   - Test sign up and login
   - Verify all pages load correctly

### 3. Create Admin User (1 minute)

1. Sign up through your deployed app
2. Go to Supabase **Table Editor**
3. Open the `profiles` table
4. Find your user row
5. Change `role` from `user` to `admin`
6. Now you can access `/admin` panel

## Important Notes

### Database Setup
Make sure you have already:
- ✅ Created Supabase project
- ✅ Run `scripts/schema.sql` in Supabase SQL Editor
- ✅ Run `npm run seed` locally to populate data

### Custom Domain (Optional)
1. Go to **Project Settings > Domains** in Vercel
2. Add your custom domain
3. Configure DNS as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Supabase redirect URLs

### Automatic Deployments
Vercel will automatically deploy when you:
- Push to the `copilot/build-nextjs-mvp-autonomous` branch
- Merge to main branch (if configured)

## Troubleshooting

### Build Fails
- Check environment variables are set
- Review build logs in Vercel dashboard
- Ensure all dependencies are in package.json

### Authentication Issues
- Verify Supabase URL and keys
- Check Site URL and redirect URLs in Supabase
- Ensure NEXT_PUBLIC_APP_URL matches your domain

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies are enabled
- Ensure schema is properly set up

## Environment Variables Checklist

Required for basic functionality:
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `NEXT_PUBLIC_APP_URL`

Optional (add later):
- [ ] SMTP configuration (for email features)
- [ ] Stripe keys (for payment features)

## Performance Optimization

Vercel automatically provides:
- ✅ Edge caching
- ✅ Image optimization
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions

## Monitoring

Access deployment analytics:
1. Go to Vercel dashboard
2. Click on your project
3. View **Analytics** tab

Track:
- Page views
- Response times
- Error rates
- Build times

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables

---

**Your app should now be live and production-ready! 🚀**

Access your deployment at: `https://your-app.vercel.app`
