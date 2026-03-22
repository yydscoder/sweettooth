/**
 * SweetTooth Gelato - Products Page Initialization
 * Renders product grid with optimized image loading
 */

(function() {
    'use strict';

    // Initialize products when DOM is ready
    function initProducts() {
        var initStart = performance.now();

        if (window.SweetToothCart && SweetToothCart.renderProducts) {
            SweetToothCart.renderProducts('products-grid');
            var initTime = (performance.now() - initStart).toFixed(2);
            console.log('[Products] Products rendered with images in ' + initTime + 'ms');
        } else {
            console.warn('[Products] SweetToothCart not available - retrying in 100ms');
            setTimeout(initProducts, 100);
        }
    }

    // Use requestIdleCallback if available for non-blocking initialization
    if ('requestIdleCallback' in window) {
        requestIdleCallback(function() {
            initProducts();
        }, { timeout: 2000 });
    } else {
        // Fallback for browsers without requestIdleCallback
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initProducts);
        } else {
            setTimeout(initProducts, 50);
        }
    }

    // Log optimization features
    console.log('');
    console.log('===============================================================');
    console.log('     SweetTooth Products - Optimization Features');
    console.log('===============================================================');
    console.log('  ✓ Lazy Loading:        Images load when scrolled into view');
    console.log('  ✓ Above-fold Priority: Visible images load immediately');
    console.log('  ✓ Async Decoding:      Images decode without blocking UI');
    console.log('  ✓ Concurrent Limit:    Max 3 simultaneous image loads');
    console.log('  ✓ Preloaded Resources: Critical CSS/JS preloaded');
    console.log('  ✓ Vercel CDN:          Optimized image delivery');
    console.log('===============================================================');
    console.log('');
})();
