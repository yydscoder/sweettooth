/**
 * SweetTooth Gelato - Lazy Load Images
 * Loads images only when they enter the viewport using Intersection Observer API
 */

(function() {
    'use strict';

    // Page load timing
    var pageLoadStart = performance.now();
    
    // Accurate cache stats - tracks actual localStorage operations
    var cacheStats = { hits: 0, misses: 0, operations: [] };

    // Load saved configuration from admin dashboard
    var savedConfig = {};
    var configLoaded = false;

    try {
        var stored = localStorage.getItem('sweettooth_optimization_config');
        if (stored) {
            savedConfig = JSON.parse(stored);
            configLoaded = true;
            cacheStats.hits++;
            cacheStats.operations.push({ type: 'config_load', result: 'hit', timestamp: Date.now() });
        } else {
            cacheStats.misses++;
            cacheStats.operations.push({ type: 'config_load', result: 'miss', timestamp: Date.now() });
        }
    } catch (e) {
        console.warn('[LazyLoad] Could not load config:', e);
        cacheStats.misses++;
        cacheStats.operations.push({ type: 'config_load', result: 'error', error: e.message, timestamp: Date.now() });
    }

    // Configuration - reads from admin dashboard settings
    // Optimized for Vercel: larger rootMargin preloads images before visible
    var config = {
        enabled: configLoaded ? (savedConfig.lazyLoadEnabled !== false) : true,
        rootMargin: '200px', // Increased from 50px - preload images 200px before viewport
        threshold: 0.01,
        placeholderColor: '#FFDC9F',
        fadeInDuration: 200, // Reduced from 300ms for faster perceived load
        maxConcurrentLoads: 3, // Limit concurrent image loads to prevent blocking
        priorityAboveFold: true // Load above-fold images immediately
    };

    // Track loaded images with timestamps
    var loadedImages = [];
    var totalImages = 0;
    var observer = null;
    var loadTimes = []; // Track individual image load times
    var pendingLoads = 0; // Track concurrent loads
    var loadQueue = []; // Queue for images waiting to load

    // Initialize lazy loading with priority loading for above-fold images
    function init() {
        if (!config.enabled) {
            loadAllImages();
            return;
        }

        // Disconnect existing observer if reinitializing
        if (observer) {
            observer.disconnect();
        }

        // Count total images
        var images = document.querySelectorAll('img[data-src], img[data-lazy]');
        totalImages = images.length;
        console.log('[SweetTooth LazyLoad] Found ' + totalImages + ' lazy-load images to observe');

        // Priority load: Load above-fold images immediately
        if (config.priorityAboveFold) {
            images.forEach(function(img, index) {
                var rect = img.getBoundingClientRect();
                if (rect.top < window.innerHeight && !img.classList.contains('lazy-loaded')) {
                    // Above fold - load immediately with priority
                    var src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
                    if (src) {
                        console.log('[SweetTooth LazyLoad] Priority loading above-fold image ' + (index + 1) + ': ' + src);
                        loadLazyImage(img);
                    }
                }
            });
        }

        // Create intersection observer with optimized rootMargin
        observer = new IntersectionObserver(onIntersection, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observe all lazy-load images that aren't already loaded
        images.forEach(function(img) {
            if (!img.classList.contains('lazy-loaded')) {
                observer.observe(img);
            }
        });

        // Also handle background images
        var lazyBackgrounds = document.querySelectorAll('[data-bg]');
        lazyBackgrounds.forEach(function(el) {
            observer.observe(el);
        });

        setTimeout(logStats, 1000);
    }

    // Intersection callback
    function onIntersection(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var target = entry.target;
                loadLazyImage(target);
                observer.unobserve(target);
            }
        });
    }

    // Load a lazy image with accurate timing, concurrent limiting, and async decoding
    function loadLazyImage(img) {
        var src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
        var bg = img.getAttribute('data-bg');
        var loadStart = performance.now();

        if (!src && !bg) return;

        // Skip if already loaded
        if (img.classList.contains('lazy-loaded')) return;

        // Check concurrent load limit
        if (pendingLoads >= config.maxConcurrentLoads) {
            // Queue this image for later loading
            loadQueue.push({ img: img, src: src, bg: bg, loadStart: loadStart });
            return;
        }

        pendingLoads++;

        if (bg) {
            // Handle background image
            img.style.backgroundImage = 'url(' + bg + ')';
            img.classList.add('lazy-loaded');
            loadedImages.push(img);
            var loadTime = (performance.now() - loadStart).toFixed(2);
            loadTimes.push({ src: bg, time: loadTime, timestamp: new Date().toISOString() });
            pendingLoads--;
            console.log('[SweetTooth LazyLoad] Background loaded: ' + bg + ' (' + loadTime + 'ms)');
            processQueue();
        } else {
            // Handle regular image with async decoding
            var originalSrc = img.src;

            // Set placeholder if no src
            if (!img.src || img.src === window.location.href) {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="' + config.placeholderColor + '" width="400" height="300"/%3E%3C/svg%3E';
            }

            // Create new image to preload with async decoding
            var preloadImg = new Image();
            preloadImg.decoding = 'async'; // Non-blocking decode
            preloadImg.fetchPriority = 'low'; // Low priority fetch
            
            preloadImg.onload = function() {
                var loadTime = (performance.now() - loadStart).toFixed(2);
                img.src = src;
                img.decoding = 'async'; // Also set on main image
                img.classList.add('lazy-loaded');
                img.style.opacity = '0';
                setTimeout(function() {
                    img.style.transition = 'opacity ' + config.fadeInDuration + 'ms ease';
                    img.style.opacity = '1';
                }, 10);
                loadedImages.push(img);
                loadTimes.push({ src: src, time: loadTime, timestamp: new Date().toISOString() });
                pendingLoads--;
                console.log('[SweetTooth LazyLoad] Image loaded: ' + src + ' (' + loadTime + 'ms)');
                processQueue();
            };
            preloadImg.onerror = function() {
                img.src = originalSrc;
                var loadTime = (performance.now() - loadStart).toFixed(2);
                loadTimes.push({ src: src, time: loadTime, error: true, timestamp: new Date().toISOString() });
                pendingLoads--;
                console.warn('[SweetTooth LazyLoad] Image failed to load: ' + src + ' (' + loadTime + 'ms)');
                processQueue();
            };
            preloadImg.src = src;
        }
    }

    // Process queued image loads
    function processQueue() {
        if (loadQueue.length > 0 && pendingLoads < config.maxConcurrentLoads) {
            var next = loadQueue.shift();
            // Small delay to prevent burst loading
            setTimeout(function() {
                loadLazyImage(next.img);
            }, 50);
        }
    }

    // Load all images immediately (when disabled)
    function loadAllImages() {
        var images = document.querySelectorAll('img[data-src], img[data-lazy]');
        images.forEach(function(img) {
            var src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
            if (src) {
                img.src = src;
                img.classList.add('lazy-loaded');
            }
        });

        var lazyBackgrounds = document.querySelectorAll('[data-bg]');
        lazyBackgrounds.forEach(function(el) {
            var bg = el.getAttribute('data-bg');
            if (bg) {
                el.style.backgroundImage = 'url(' + bg + ')';
                el.classList.add('lazy-loaded');
            }
        });

        loadedImages = Array.from(images);
    }

    // Log statistics with accurate data and performance summary
    function logStats() {
        var pageLoadTime = (performance.now() - pageLoadStart).toFixed(2);
        var cacheHitRate = cacheStats.hits + cacheStats.misses > 0
            ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
            : 0;

        // Calculate average image load time
        var avgLoadTime = 0;
        var minLoadTime = Infinity;
        var maxLoadTime = 0;
        if (loadTimes.length > 0) {
            var totalTime = loadTimes.reduce(function(sum, item) { return sum + parseFloat(item.time); }, 0);
            avgLoadTime = (totalTime / loadTimes.length).toFixed(2);
            loadTimes.forEach(function(item) {
                var time = parseFloat(item.time);
                if (time < minLoadTime) minLoadTime = time;
                if (time > maxLoadTime) maxLoadTime = time;
            });
            if (loadTimes.length === 0) minLoadTime = 0;
        }

        // Count successful vs failed loads
        var successfulLoads = loadTimes.filter(function(item) { return !item.error; }).length;
        var failedLoads = loadTimes.filter(function(item) { return item.error; }).length;

        // Estimate bandwidth saved (placeholder vs actual image)
        var estimatedBandwidthSaved = (totalImages - loadedImages.length) * 50; // ~50KB per image average

        console.log('');
        console.log('========================================================================');
        console.log('           SweetTooth Lazy Load Statistics');
        console.log('========================================================================');
        console.log('  IMAGES:');
        console.log('  ────────────────────────────────────────────────────────────────────');
        console.log('  Total Images:          ' + totalImages);
        console.log('  Loaded:                ' + loadedImages.length + ' (' + (totalImages > 0 ? Math.round((loadedImages.length / totalImages) * 100) : 0) + '%)');
        console.log('  Deferred:              ' + (totalImages - loadedImages.length) + ' (' + (totalImages > 0 ? Math.round(((totalImages - loadedImages.length) / totalImages) * 100) : 0) + '%)');
        console.log('  Successful Loads:      ' + successfulLoads);
        console.log('  Failed Loads:          ' + failedLoads);
        console.log('');
        console.log('  PERFORMANCE:');
        console.log('  ────────────────────────────────────────────────────────────────────');
        if (loadTimes.length > 0) {
            console.log('  Avg Load Time:         ' + avgLoadTime + 'ms');
            console.log('  Min Load Time:         ' + minLoadTime.toFixed(2) + 'ms');
            console.log('  Max Load Time:         ' + maxLoadTime.toFixed(2) + 'ms');
        }
        console.log('  Page Load Time:        ' + pageLoadTime + 'ms');
        console.log('  Concurrent Loads:      Max ' + config.maxConcurrentLoads);
        console.log('  Root Margin:           ' + config.rootMargin);
        console.log('');
        console.log('  OPTIMIZATION:');
        console.log('  ────────────────────────────────────────────────────────────────────');
        console.log('  Above-fold Priority:   ' + (config.priorityAboveFold ? 'Enabled' : 'Disabled'));
        console.log('  Async Decoding:        Enabled');
        console.log('  Est. Bandwidth Saved:  ~' + estimatedBandwidthSaved + 'KB (deferred images)');
        console.log('  Config Cache Hits:     ' + cacheStats.hits);
        console.log('  Config Cache Misses:   ' + cacheStats.misses);
        console.log('  Cache Hit Rate:        ' + cacheHitRate + '%');
        console.log('========================================================================');
        console.log('');
    }

    // Get statistics - returns accurate real-time data for dashboard
    function getStats() {
        var successfulLoads = loadTimes.filter(function(item) { return !item.error; }).length;
        var failedLoads = loadTimes.filter(function(item) { return item.error; }).length;
        var avgLoadTime = 0;
        var minLoadTime = 0;
        var maxLoadTime = 0;
        
        if (loadTimes.length > 0) {
            var totalTime = loadTimes.reduce(function(sum, item) { return sum + parseFloat(item.time); }, 0);
            avgLoadTime = totalTime / loadTimes.length;
            minLoadTime = Math.min.apply(null, loadTimes.map(function(item) { return parseFloat(item.time); }));
            maxLoadTime = Math.max.apply(null, loadTimes.map(function(item) { return parseFloat(item.time); }));
        }

        // Estimate bandwidth saved
        var estimatedBandwidthSaved = (totalImages - loadedImages.length) * 50;

        return {
            total: totalImages,
            loaded: loadedImages.length,
            deferred: totalImages - loadedImages.length,
            enabled: config.enabled,
            successfulLoads: successfulLoads,
            failedLoads: failedLoads,
            avgLoadTime: avgLoadTime.toFixed(2),
            minLoadTime: minLoadTime.toFixed(2),
            maxLoadTime: maxLoadTime.toFixed(2),
            loadTimes: loadTimes,
            cacheHits: cacheStats.hits,
            cacheMisses: cacheStats.misses,
            pendingLoads: pendingLoads,
            queueLength: loadQueue.length,
            estimatedBandwidthSaved: estimatedBandwidthSaved,
            config: {
                rootMargin: config.rootMargin,
                maxConcurrentLoads: config.maxConcurrentLoads,
                priorityAboveFold: config.priorityAboveFold
            }
        };
    }

    // Enable/disable lazy loading
    function setEnabled(enabled) {
        config.enabled = enabled;

        if (!enabled && observer) {
            observer.disconnect();
            loadAllImages();
        } else if (enabled) {
            init();
        }
    }

    // Set configuration
    function setConfig(newConfig) {
        for (var key in newConfig) {
            if (config.hasOwnProperty(key)) {
                config[key] = newConfig[key];
            }
        }
    }

    // Expose API
    window.SweetToothLazyLoad = {
        init: init,
        getStats: getStats,
        setEnabled: setEnabled,
        setConfig: setConfig,
        isEnabled: function() { return config.enabled; },
        loadAll: loadAllImages
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
