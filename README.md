
# Sweettooth

Sweettooth is a full featured ice cream storefront built as my first serious step into web development and into working with real configuration and API keys. The site is designed to feel like a small but complete ecommerce experience where people can browse flavors, read about the brand, and purchase ice cream. It is both a portfolio project and a practical playground for learning how front end pages, data flows, and admin controls work together.

The customer experience covers the full journey from discovery to checkout, of which I have read about extensively and modelled Sweettooth after some examples that fit my vision goal. Visitors land on a rich home page with featured flavors and collections, then dive into dedicated product detail pages for each flavor. Every product page highlights descriptions, imagery, and purchase actions so the site feels like a real shop. A full cart and checkout flow supports selecting items, reviewing totals, and completing a purchase. The experience is supported by pages that build a brand story, including the About and Our Story pages, an Events page for community presence, and a blog with individual posts that highlight ingredients, seasonal releases, and behind the scenes updates. Reminder that some images will be blank, the product page is the only one with actual images. The rest in regards to the home page have been deliberately left empty as I do not have a reference picture for it but am considering to put a generated photo in order to complete the user experience. 

The project also includes a data and content layer that supports a modern storefront. The feed page represents an always on stream of updates, while blog and events pages are structured as their own content hubs. The API configuration file is templated in config.template.js so that sensitive keys can be provided locally while the rest of the site stays consistent across environments. This is part of my learning process around handling configuration safely, understanding how client side code uses keys, and practicing clean separation between content and settings.

Sweettooth includes an admin dashboard to control performance and diagnostics. The admin page is available at admin.html and is protected by a password for basic access control which is "Flavourtown123" . From there, performance options can be enabled or disabled to compare user experience and load behavior. One feature is image lazy loading using the Intersection Observer API so that off screen product images are only loaded when they are needed. Another feature is client side caching using localStorage so cart data, configuration, and performance metrics can persist for repeat visits and faster interactions. These features are intentionally visible in the admin so they can be tested and understood as part of the learning journey.


### Overview
The Sweettooth website implements *two core performance optimization techniques* (which are lazy loading and caching) with comprehensive metrics tracking. All optimizations can be toggled on/off via the Admin Dashboard to compare performance. This is for the FlavourTown optimization sidequest.

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

There are recorded demonstrations which I will need to compress and upload later.

Lazy loading in different window form factors

Smaller window
https://github.com/user-attachments/assets/f54fe38a-5730-42cc-96db-7be8e54a363e

Bigger window
https://github.com/user-attachments/assets/af6f6c07-4424-400d-a2b2-9522891b57c7


Caching demonstration

https://github.com/user-attachments/assets/d681678d-89a4-4ded-a721-6f07ca2dbe09



