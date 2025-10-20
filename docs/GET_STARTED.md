# 🚀 Get Started with Austin 3D Terrain Generator

## Quick Start (2 minutes)

```bash
cd /Users/michelle/Documents/Repos/austin-terrain-web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Try It Out

1. **Draw on the map** - Use the polygon tool in the top-right corner
2. **Draw near downtown Austin** (30.27, -97.74) for best imagery results
3. **Click "Generate 3D Terrain"** - Watch the progress bar
4. **Use 3D viewer controls**:
   - ⏸️ Pause/▶️ Rotate - Toggle spinning
   - ⤢ Fullscreen - View in fullscreen mode
   - Mouse drag - Rotate view
   - Scroll - Zoom
5. **Download your files** - Get PNG, GLB, and STL formats

## Example Coordinates

Copy and paste into the "Enter Coordinates" tab:

**Downtown Austin (good imagery coverage):**
```
30.2672, -97.7431
30.2680, -97.7431
30.2680, -97.7420
30.2672, -97.7420
```

**Texas State Capitol:**
```
30.2747, -97.7403
30.2755, -97.7403
30.2755, -97.7390
30.2747, -97.7390
```

## What Works

✅ **Everything!** - Full end-to-end functionality:
- Interactive map with persistent polygons
- Real aerial imagery from TNRIS WMS
- 3D mesh generation with polygon masking
- Textured 3D models
- Interactive viewer with controls
- File downloads (PNG, GLB, STL)
- Responsive navigation
- Documentation page

⚠️ **Test Elevation Data** - Using synthetic terrain (smooth waves) instead of real LiDAR. The imagery is real though!

## Navigation

- **Generator** - Main page (create terrains)
- **Documentation** - Learn how it works, data sources, technical details
- **Mobile menu** - Tap hamburger icon (☰) on mobile devices

## Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

Then import into Vercel. **Note**: Requires Vercel Pro for 300-second function timeout.

## Tips

### For Best Results
- Draw polygons in **central Austin** for optimal imagery coverage
- Try areas around: UT campus, Capitol, Zilker Park, Downtown
- Keep polygons **moderately sized** (processing time increases with area)

### Imagery Coverage
- Best coverage: Austin city limits and immediate surroundings
- Some outer areas (Leander, far suburbs) may have limited imagery
- Small file sizes (< 10KB) indicate blank/transparent imagery

### 3D Viewer
- **Drag** to rotate the view
- **Scroll** to zoom in/out
- **Pause rotation** for easier inspection
- **Fullscreen** for detailed viewing
- Press **ESC** to exit fullscreen

## Troubleshooting

### Map Not Loading
- Wait a few seconds for Leaflet to load from CDN
- Check browser console for errors
- Refresh the page

### No Imagery on Terrain
- Area may be outside imagery coverage
- Try an area closer to downtown Austin
- Check terminal logs for WMS errors

### Generation Takes Long
- Larger areas require more processing
- Complex polygons take longer
- Wait for progress to reach 100%

## Documentation

- Visit `/docs` in the app for comprehensive documentation
- Or read the markdown files:
  - **[QUICKSTART.md](./QUICKSTART.md)** - Detailed guide
  - **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical details
  - **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

## What's Next

The app is production-ready for demos! For full production:
- Implement real DEM data pipeline (see ARCHITECTURE.md)
- Add Redis for job persistence
- Set up external file storage
- Configure rate limiting

---

**Built and ready to use!** 🎉

Visit the Documentation page in the app for detailed information about data sources, technical implementation, and future enhancements.
