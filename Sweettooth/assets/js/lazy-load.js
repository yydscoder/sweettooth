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
    var config = {
        enabled: configLoaded ? (savedConfig.lazyLoadEnabled !== false) : true,
        rootMargin: '50px',
        threshold: 0.01,
        placeholderColor: '#FFDC9F',
        fadeInDuration: 300
    };

    // Track loaded images with timestamps
    var loadedImages = [];
    var totalImages = 0;
    var observer = null;
    var loadTimes = []; // Track individual image load times
    var statsSaved = false; // Track if stats have been saved

    // Save stats to localStorage
    function saveStats() {
        var pageLoadTime = (performance.now() - pageLoadStart).toFixed(2);
        var cacheHitRate = cacheStats.hits + cacheStats.misses > 0
            ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
            : 0;

        // Calculate average image load time
        var avgLoadTime = 0;
        if (loadTimes.length > 0) {
            var totalTime = loadTimes.reduce(function(sum, item) { return sum + parseFloat(item.time); }, 0);
            avgLoadTime = (totalTime / loadTimes.length).toFixed(2);
        }

        // Count successful vs failed loads
        var successfulLoads = loadTimes.filter(function(item) { return !item.error; }).length;
        var failedLoads = loadTimes.filter(function(item) { return item.error; }).length;
        
        // Calculate deferred percentage
        var deferredPercent = totalImages > 0 ? Math.round(((totalImages - loadedImages.length) / totalImages) * 100) : 0;

        // Save stats to localStorage for admin panel to read
        var statsData = {
            total: totalImages,
            loaded: loadedImages.length,
            deferred: totalImages - loadedImages.length,
            deferredPercent: deferredPercent,
            successfulLoads: successfulLoads,
            failedLoads: failedLoads,
            avgLoadTime: avgLoadTime,
            pageLoadTime: pageLoadTime,
            cacheHitRate: cacheHitRate,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('sweettooth_lazyload_stats', JSON.stringify(statsData));
            statsSaved = true;
        } catch (e) {
            console.warn('[LazyLoad] Could not save stats to localStorage:', e);
        }
    }

    // Initialize lazy loading
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

        // Create intersection observer
        observer = new IntersectionObserver(onIntersection, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Observe all lazy-load images
        images.forEach(function(img) {
            observer.observe(img);
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

    // Load a lazy image with accurate timing
    function loadLazyImage(img) {
        var src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
        var bg = img.getAttribute('data-bg');
        var loadStart = performance.now();

        if (!src && !bg) return;

        // Skip if already loaded
        if (img.classList.contains('lazy-loaded')) return;

        if (bg) {
            // Handle background image
            img.style.backgroundImage = 'url(' + bg + ')';
            img.classList.add('lazy-loaded');
            loadedImages.push(img);
            var loadTime = (performance.now() - loadStart).toFixed(2);
            loadTimes.push({ src: bg, time: loadTime, timestamp: new Date().toISOString() });
            saveStats(); // Save stats after each load
            console.log('[SweetTooth LazyLoad] Background loaded: ' + bg + ' (' + loadTime + 'ms)');
        } else {
            // Handle regular image
            var originalSrc = img.src;

            // Set placeholder if no src
            if (!img.src || img.src === window.location.href) {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="' + config.placeholderColor + '" width="400" height="300"/%3E%3C/svg%3E';
            }

            // Create new image to preload
            var preloadImg = new Image();
            preloadImg.onload = function() {
                var loadTime = (performance.now() - loadStart).toFixed(2);
                img.src = src;
                img.classList.add('lazy-loaded');
                img.style.opacity = '0';
                setTimeout(function() {
                    img.style.transition = 'opacity ' + config.fadeInDuration + 'ms ease';
                    img.style.opacity = '1';
                }, 10);
                loadedImages.push(img);
                loadTimes.push({ src: src, time: loadTime, timestamp: new Date().toISOString() });
                saveStats(); // Save stats after each load
                console.log('[SweetTooth LazyLoad] Image loaded: ' + src + ' (' + loadTime + 'ms)');
            };
            preloadImg.onerror = function() {
                img.src = originalSrc;
                var loadTime = (performance.now() - loadStart).toFixed(2);
                loadTimes.push({ src: src, time: loadTime, error: true, timestamp: new Date().toISOString() });
                saveStats(); // Save stats even on error
                console.warn('[SweetTooth LazyLoad] Image failed to load: ' + src + ' (' + loadTime + 'ms)');
            };
            preloadImg.src = src;
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

    // Log statistics with accurate data and save to localStorage
    function logStats() {
        // Save final stats
        saveStats();

        var pageLoadTime = (performance.now() - pageLoadStart).toFixed(2);
        var cacheHitRate = cacheStats.hits + cacheStats.misses > 0
            ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)
            : 0;

        // Calculate average image load time
        var avgLoadTime = 0;
        if (loadTimes.length > 0) {
            var totalTime = loadTimes.reduce(function(sum, item) { return sum + parseFloat(item.time); }, 0);
            avgLoadTime = (totalTime / loadTimes.length).toFixed(2);
        }

        // Count successful vs failed loads
        var successfulLoads = loadTimes.filter(function(item) { return !item.error; }).length;
        var failedLoads = loadTimes.filter(function(item) { return item.error; }).length;
        
        // Calculate deferred percentage
        var deferredPercent = totalImages > 0 ? Math.round(((totalImages - loadedImages.length) / totalImages) * 100) : 0;

        console.log('');
        console.log('===============================================================');
        console.log('     SweetTooth Lazy Load Statistics');
        console.log('===============================================================');
        console.log('  Total Images:          ' + totalImages);
        console.log('  Loaded:                ' + loadedImages.length + ' (' + (totalImages > 0 ? Math.round((loadedImages.length / totalImages) * 100) : 0) + '%)');
        console.log('  Deferred:              ' + (totalImages - loadedImages.length) + ' (' + deferredPercent + '%)');
        console.log('  Successful Loads:      ' + successfulLoads);
        console.log('  Failed Loads:          ' + failedLoads);
        if (loadTimes.length > 0) {
            console.log('  Avg Load Time:       ' + avgLoadTime + 'ms');
        }
        console.log('  Page Load Time:        ' + pageLoadTime + 'ms');
        console.log('  Config Cache Hits:     ' + cacheStats.hits);
        console.log('  Config Cache Misses:   ' + cacheStats.misses);
        console.log('  Cache Hit Rate:        ' + cacheHitRate + '%');
        console.log('  ───────────────────────────────────────────────────────────');
        console.log('  Stats saved to localStorage for admin panel to read');
        console.log('===============================================================');
        console.log('');
    }

    // Get statistics - returns accurate real-time data
    function getStats() {
        var successfulLoads = loadTimes.filter(function(item) { return !item.error; }).length;
        var failedLoads = loadTimes.filter(function(item) { return item.error; }).length;
        var avgLoadTime = 0;
        if (loadTimes.length > 0) {
            var totalTime = loadTimes.reduce(function(sum, item) { return sum + parseFloat(item.time); }, 0);
            avgLoadTime = totalTime / loadTimes.length;
        }

        return {
            total: totalImages,
            loaded: loadedImages.length,
            deferred: totalImages - loadedImages.length,
            enabled: config.enabled,
            successfulLoads: successfulLoads,
            failedLoads: failedLoads,
            avgLoadTime: avgLoadTime.toFixed(2),
            loadTimes: loadTimes,
            cacheHits: cacheStats.hits,
            cacheMisses: cacheStats.misses
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
