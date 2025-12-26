# Deployment Guide

Complete guide for deploying A&R Focus Forecast to production.

## Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Database seeded with initial data
- [ ] Environment variables configured
- [ ] SMTP credentials obtained (optional)
- [ ] Domain name ready (optional)

## 1. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and region (AU for best performance)
4. Set strong database password
5. Wait for project to provision (~2 minutes)

### Run Database Schema

1. Navigate to SQL Editor in Supabase dashboard
2. Open `scripts/schema.sql` from your repository
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click "Run" to execute
6. Verify all tables created successfully

### Seed Database

1. Install dependencies locally if not done:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run seed script:
   ```bash
   npm run seed
   ```

4. Verify data in Supabase Table Editor

### Configure Authentication

1. Go to Authentication > Providers in Supabase
2. Enable Email provider (enabled by default)
3. (Optional) Configure email templates
4. (Optional) Enable Google OAuth:
   - Add Google OAuth credentials
   - Configure redirect URLs
5. Set site URL in Authentication > URL Configuration:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add production URL

### Configure Storage (Optional)

If you plan to store PDFs in Supabase Storage:

1. Go to Storage in Supabase
2. Create bucket named `reports`
3. Set bucket to private
4. Add RLS policies for user access

## 2. Vercel Deployment

### Initial Setup

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: (leave default)

### Environment Variables

Add these in Vercel project settings:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# SMTP (Optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=A&R Focus Forecast
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a preview URL
4. Test the deployment

### Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS:
   - Type: A or CNAME
   - Value: Provided by Vercel
4. Wait for DNS propagation (up to 48 hours)
5. Vercel auto-configures SSL certificate

## 3. Post-Deployment

### Create Admin User

1. Sign up through your deployed app
2. Go to Supabase > Table Editor > `profiles`
3. Find your user row
4. Change `role` from `user` to `admin`
5. Now you can access `/admin` panel

### Test Complete Flow

1. ✅ Sign up new account
2. ✅ Log in
3. ✅ Add a service
4. ✅ Complete questionnaire
5. ✅ View results
6. ✅ Download PDF
7. ✅ Access admin panel (with admin account)

### Monitor Performance

- Vercel Analytics: View in Vercel dashboard
- Supabase Logs: Check in Supabase dashboard
- Error tracking: Set up Sentry (optional)

## 4. SMTP Configuration (Optional)

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: Use App Password, not regular password

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.com
SMTP_PASSWORD=your_mailgun_password
```

## 5. Production Best Practices

### Security

1. ✅ Enable Supabase email confirmation
2. ✅ Set strong RLS policies
3. ✅ Use secure environment variables
4. ✅ Enable HTTPS (automatic with Vercel)
5. ✅ Regular security updates

### Performance

1. ✅ Enable Vercel Edge caching
2. ✅ Optimize images with Next.js Image
3. ✅ Use database indexes
4. ✅ Monitor API response times
5. ✅ Set up CDN for static assets

### Monitoring

1. Set up error tracking (Sentry, Bugsnag)
2. Enable Vercel Analytics
3. Monitor Supabase usage
4. Set up uptime monitoring
5. Review logs regularly

### Backup

1. ✅ Supabase automatic daily backups (Pro plan)
2. Manual backup: Export from Supabase
3. Version control for code
4. Document configuration

## 6. Updating the Application

### Code Updates

```bash
git pull origin main
npm install  # if dependencies changed
git add .
git commit -m "Update: description"
git push origin main
```

Vercel will automatically redeploy.

### Database Migrations

1. Write migration SQL
2. Test locally first
3. Backup production database
4. Run migration in Supabase SQL Editor
5. Verify changes
6. Update seed script if needed

### Rollback

If something goes wrong:

1. Go to Vercel Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"
4. Or use Vercel CLI:
   ```bash
   vercel rollback
   ```

## 7. Scaling

### Database

- Supabase auto-scales on Pro plan
- Monitor database size and connections
- Add indexes for slow queries
- Consider read replicas for heavy traffic

### Serverless Functions

- Vercel handles auto-scaling
- Monitor function execution times
- Optimize cold starts
- Consider Edge Functions for faster response

### Costs

**Supabase Free Tier**:
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users

**Supabase Pro** ($25/month):
- 8GB database
- 50GB bandwidth
- 100,000 monthly active users
- Daily backups

**Vercel Free Tier**:
- Unlimited deployments
- 100GB bandwidth
- Hobby projects

**Vercel Pro** ($20/month):
- Unlimited bandwidth
- Analytics
- Team features

## Troubleshooting

### Build Failures

1. Check build logs in Vercel
2. Verify all dependencies installed
3. Check TypeScript errors
4. Ensure environment variables set

### Database Connection Issues

1. Verify Supabase URL and keys
2. Check RLS policies
3. Review Supabase logs
4. Test connection locally

### PDF Generation Issues

1. Check @react-pdf/renderer logs
2. Verify data format
3. Test PDF route locally
4. Monitor serverless function timeout

### Email Issues

1. Verify SMTP credentials
2. Check firewall/port access
3. Test with simple email first
4. Review email provider logs

## Support

For deployment issues:
1. Check Vercel documentation
2. Review Supabase docs
3. Check GitHub issues
4. Contact support if needed

---

**Ready to deploy?** Follow this guide step by step and you'll have a production-ready application in under an hour!
