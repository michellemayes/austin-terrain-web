# Deployment Guide

## Deploying to Vercel

### Quick Deploy

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Austin 3D Terrain Generator"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

### Important Configuration

#### Function Timeout

The terrain generation API requires extended execution time. The `vercel.json` file is already configured with:

```json
{
  "functions": {
    "app/api/generate-terrain/route.ts": {
      "maxDuration": 300
    }
  }
}
```

**Note**: 300 seconds (5 minutes) requires **Vercel Pro** plan. On the free plan, the limit is 10 seconds for serverless functions, which may not be sufficient for complex terrain generation.

#### Environment Variables

If you need to add API keys or configuration:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add any required variables
4. Redeploy for changes to take effect

### Performance Considerations

#### For Production Use

1. **Caching Strategy**
   - Implement Redis or similar for job status storage (currently using in-memory Map)
   - Add caching for frequently requested areas

2. **File Storage**
   - Current implementation stores files in `/public/terrain`
   - Consider using external storage (S3, Vercel Blob) for production
   - Implement automatic cleanup of old files

3. **Processing Optimization**
   - For large areas, consider implementing a queue system
   - Use background workers for heavy processing
   - Add progress streaming for better UX

#### Monitoring

Add monitoring for:
- API response times
- File generation success/failure rates
- Storage usage
- Error tracking (e.g., Sentry)

### Alternative Deployment Options

#### Netlify

1. Push to Git repository
2. Connect to Netlify
3. Update `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"

   [functions]
     node_bundler = "esbuild"
   ```

#### Self-Hosted

```bash
# Build the application
npm run build

# Start the production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "austin-terrain" -- start
```

### Post-Deployment Checklist

- [ ] Test terrain generation with various area sizes
- [ ] Verify all three export formats (PNG, GLB, STL) work correctly
- [ ] Check that file downloads work properly
- [ ] Test on mobile devices
- [ ] Verify WMS imagery loading
- [ ] Monitor API function execution times
- [ ] Set up error tracking
- [ ] Configure automatic cleanup for old terrain files

### Troubleshooting

#### Function Timeout Errors

If you see timeout errors:
1. Upgrade to Vercel Pro for 300s timeout
2. Reduce output resolution in `lib/terrainProcessor.ts`
3. Implement job queue with webhook callbacks

#### WMS Connection Issues

If imagery fails to load:
1. Check CORS settings
2. Verify WMS endpoint is accessible
3. Test WMS URL manually in browser
4. Check Vercel function logs

#### Large File Handling

If downloads fail:
1. Consider implementing streaming downloads
2. Use Vercel Blob or external storage for large files
3. Add file size warnings in UI

### Cost Estimation (Vercel Pro)

- **Function executions**: ~300s per terrain generation
- **Bandwidth**: Depends on usage
- **Storage**: Generated files should be cleaned up regularly

Estimated cost for moderate usage (~100 generations/month): $20-40/month

