/**
 * SweetTooth Gelato - Lazy Load Images
 * Loads images only when they enter the viewport using Intersection Observer API
 */

(function() {
    'use strict';

    // Page load timing
    var pageLoadStart = performance.now();
    var cacheStats = { hits: 0, misses: 0 };

    // Load saved configuration from admin dashboard
    var savedConfig = {};
    var configLoaded = false;

    try {
        var stored = localStorage.getItem('sweettooth_optimization_config');
        if (stored) {
            savedConfig = JSON.parse(stored);
            configLoaded = true;
            cacheStats.hits++;
        } else {
            cacheStats.misses++;
        }
    } catch (e) {
        console.warn('[LazyLoad] Could not load config:', e);
        cacheStats.misses++;
    }

    // Configuration - reads from admin dashboard settings
    var config = {
        enabled: configLoaded ? (savedConfig.lazyLoadEnabled !== false) : true,
        rootMargin: '50px',
        threshold: 0.01,
        placeholderColor: '#FFDC9F',
        fadeInDuration: 300
    };

    // Track loaded images
    var loadedImages = [];
    var totalImages = 0;
    var observer = null;

    // Initialize lazy loading
    function init() {
        if (!config.enabled) {
            loadAllImages();
            return;
        }

        // Count total images
        var images = document.querySelectorAll('img[data-src], img[data-lazy]');
        totalImages = images.length;

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

        logStats();
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

    // Load a lazy image
    function loadLazyImage(img) {
        var src = img.getAttribute('data-src') || img.getAttribute('data-lazy');
        var bg = img.getAttribute('data-bg');

        if (!src && !bg) return;

        // Skip if already loaded
        if (img.classList.contains('lazy-loaded')) return;

        if (bg) {
            // Handle background image
            img.style.backgroundImage = 'url(' + bg + ')';
            img.classList.add('lazy-loaded');
            loadedImages.push(img);
            console.log('[SweetTooth LazyLoad] Background loaded:', bg);
        } else {
            // Handle regular image
            var originalSrc = img.src;

            // Set placeholder
            if (!img.src || img.src === window.location.href) {
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="' + config.placeholderColor + '" width="400" height="300"/%3E%3C/svg%3E';
            }

            // Create new image to preload
            var preloadImg = new Image();
            preloadImg.onload = function() {
                img.src = src;
                img.classList.add('lazy-loaded');
                img.style.opacity = '0';
                setTimeout(function() {
                    img.style.transition = 'opacity ' + config.fadeInDuration + 'ms ease';
                    img.style.opacity = '1';
                }, 10);
                loadedImages.push(img);
            };
            preloadImg.onerror = function() {
                img.src = originalSrc;
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

    // Log statistics
    function logStats() {
        setTimeout(function() {
            var pageLoadTime = (performance.now() - pageLoadStart).toFixed(2);
            var cacheHitRate = cacheStats.hits + cacheStats.misses > 0 
                ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) 
                : 0;
            
            console.log('[LazyLoad] Total:', totalImages, '| Loaded:', loadedImages.length, '| Deferred:', totalImages - loadedImages.length);
            console.log('[Performance] Page load:', pageLoadTime, 'ms | Cache hits:', cacheStats.hits, '| Cache misses:', cacheStats.misses, '| Hit rate:', cacheHitRate + '%');
        }, 1000);
    }

    // Get statistics
    function getStats() {
        return {
            total: totalImages,
            loaded: loadedImages.length,
            deferred: totalImages - loadedImages.length,
            enabled: config.enabled
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
