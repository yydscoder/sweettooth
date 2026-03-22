## Optimization

### Overview
The Sweettooth website implements **two core performance optimization techniques** (which are lazy loading and caching) with comprehensive metrics tracking. All optimizations can be toggled on/off via the Admin Dashboard to compare performance. This is for the FlavourTown optimization sidequest. The admin page can be accessed by typign in admin.html and then entering "Flavourtown123" as the password. 

### Optimization Technique 1: Image Lazy Loading

**What it does:** Defers loading of off-screen images until they enter the viewport using the Intersection Observer API.

**Implementation:**
- Created `assets/js/lazy-load.js` module with configurable options
- Uses `data-src` attributes to store image sources
- Implements smooth fade-in animation when images load
- Configurable root margin (50px) for preloading images before visible
- Integrated with cart.js to respect admin settings
- Uses Intersection Observer API for efficient viewport detection


**Toggle:** Admin Dashboard . Performance . Lazy Load Images

**How to Test:**
1. Open `admin.html` → Performance tab
2. Disable Lazy Load → Save → Hard refresh `products.html` (Ctrl+Shift+R)
3. Check console: `[SweetTooth LazyLoad] All images loaded immediately (disabled mode)`
4. Enable Lazy Load → Save → Hard refresh `products.html`
5. Check console: `[SweetTooth LazyLoad] Deferred images: 42` (with 50 products) or the dashboard on admin
6. Watch images load progressively as you scroll down the page

---

### Optimization Technique 2: Browser Caching

**What it does:** Stores cart data, configuration, and performance metrics in browser localStorage for faster repeat visits and reduced server requests.

**Implementation:**
- localStorage-based caching with 24-hour TTL
- Automatic cache management with size limits
- Cache invalidation on version changes
- Integrated with optimization manager
- Cross-tab synchronization via storage events
- Cache hit/miss tracking for performance analysis
**Toggle:** Admin Dashboard → Performance → Enable Caching

**How to Test:**
1. Open DevTools → Application → Local Storage → http://localhost:3000 or you can do the same thing on vercel
2. Look for `sweettooth_*` keys (cart, config, cache, perf_metrics)
3. Enable Caching in admin → Save → Reload page
4. Check localStorage for cached data
5. Make cart changes → Observe instant updates across tabs
6. Check console for cache hit/miss statistics

### Next Steps for Full Implementation or plans for production

1. **Build Pipeline:** Add Webpack/Gulp for automatic minification
2. **Service Worker:** Implement for offline caching
3. **Image CDN:** Use responsive images with srcset
4. **Code Splitting:** Split large JS bundles by route
5. **Critical CSS:** Inline above-fold CSS for faster FCP
