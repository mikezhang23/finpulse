# FinPulse Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Supabase project with all tables and views created
- All environment variables ready

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest and fastest way to deploy Next.js apps, with zero configuration needed.

#### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FinPulse dashboard"
   ```

2. **Create GitHub Repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository (e.g., `finpulse`)
   - Don't initialize with README (you already have files)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/finpulse.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (easiest option)

2. **Import Your Repository**:
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose your `finpulse` repository
   - Click "Import"

3. **Configure Environment Variables**:
   - In the "Environment Variables" section, add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```
   - You can find these in your Supabase project settings

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

5. **Custom Domain** (Optional):
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain (e.g., `finpulse.yourdomain.com`)
   - Follow DNS configuration instructions

### Option 2: Deploy to Other Platforms

#### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in site settings

#### AWS Amplify
1. Connect repository
2. Auto-detects Next.js
3. Add environment variables
4. Deploy

#### Self-Hosted (VPS/Docker)
1. Build production: `npm run build`
2. Start server: `npm start`
3. Use PM2 or similar for process management
4. Set up Nginx reverse proxy
5. Configure SSL with Let's Encrypt

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Security Note**:
- ✅ `NEXT_PUBLIC_*` variables are safe to expose to the browser
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must remain secret (server-side only)
- Never commit `.env.local` to version control

## Post-Deployment Checklist

After deployment, verify:

- [ ] Dashboard loads at your deployment URL
- [ ] KPI cards display correct data
- [ ] All charts render properly
- [ ] Anomaly detection panel shows results
- [ ] Cost optimization panel displays
- [ ] Tables load transaction data
- [ ] Refresh button works
- [ ] Audit page loads
- [ ] No console errors
- [ ] Mobile responsive design works

## Continuous Deployment

### Automatic Deployments (Vercel)

Once connected to GitHub, Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Runs build checks before deploying

### Manual Deployments

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

## Performance Optimization

### Recommended Settings

1. **Enable Vercel Analytics** (optional):
   - Go to project settings
   - Enable Web Analytics
   - Monitor real user metrics

2. **Caching**:
   - Next.js automatically handles caching
   - Static assets cached at CDN edge
   - API routes cached with `Cache-Control` headers

3. **Image Optimization**:
   - Use Next.js `<Image>` component for images
   - Automatic WebP conversion
   - Responsive image serving

## Monitoring & Debugging

### Check Deployment Logs

**Vercel**:
- Go to deployment in Vercel dashboard
- Click "Logs" tab
- View build and runtime logs

### Common Issues

**Build Fails**:
- Check for TypeScript errors: `npm run build` locally
- Verify all dependencies in `package.json`
- Check Node.js version compatibility

**Database Connection Fails**:
- Verify Supabase URL and keys are correct
- Check if RLS policies allow access
- Ensure `fin_reader` role exists with permissions

**Slow Performance**:
- Review Supabase query performance
- Check if indexes exist on frequently queried columns
- Consider implementing caching for expensive queries

## Updating Your Deployment

1. **Make changes locally**
2. **Test locally**: `npm run dev`
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. **Vercel auto-deploys** your changes

## Rollback

If something goes wrong:

1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Find a previous working deployment
5. Click "..." → "Promote to Production"

## Security Best Practices

- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use environment variables for all secrets
- ✅ Enable Supabase RLS policies
- ✅ Use HTTPS only (Vercel provides this automatically)
- ✅ Set up proper CORS policies in Supabase
- ✅ Monitor for suspicious activity
- ✅ Regular security audits

## Cost Considerations

**Vercel Free Tier Includes**:
- Unlimited deployments
- 100 GB bandwidth/month
- Automatic HTTPS
- Preview deployments
- Analytics (basic)

**Supabase Free Tier Includes**:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50k monthly active users

**Upgrade if you need**:
- More bandwidth
- Custom domains
- Team collaboration
- Advanced analytics
- Dedicated support

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **FinPulse Issues**: Create an issue in your GitHub repo

## Backup & Recovery

1. **Database Backups**:
   - Supabase automatically backs up your database
   - Export data regularly for local backups
   - Keep SQL migration scripts in version control

2. **Code Backups**:
   - Code is backed up in GitHub
   - Vercel keeps deployment history
   - Consider enabling GitHub Actions for automated backups

## Next Steps

After successful deployment:

1. Set up monitoring alerts
2. Configure custom domain
3. Enable analytics
4. Share with stakeholders
5. Set up CI/CD pipeline for automated testing
6. Document any custom configuration
7. Create user documentation

---

**Deployment URL**: Update this after deployment
**Deployment Date**: Update this after deployment
**Deployed By**: Update this after deployment
