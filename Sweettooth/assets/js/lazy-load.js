/**
 * SweetTooth Gelato - Lazy Load Images
 * Loads images only when they enter the viewport using Intersection Observer API
 */

(function() {
    'use strict';

    // Load saved configuration from admin dashboard
    var savedConfig = {};
    var configLoaded = false;
    
    try {
        // Try optimization manager key first
        var stored = localStorage.getItem('sweettooth_optimization_config');
        if (stored) {
            savedConfig = JSON.parse(stored);
            configLoaded = true;
            console.log('[SweetTooth LazyLoad] Loaded from optimization_config:', savedConfig);
        }
        
        // Also check secure-config key
        if (!configLoaded) {
            stored = localStorage.getItem('sweettooth_config');
            if (stored) {
                var fullConfig = JSON.parse(stored);
                if (fullConfig && fullConfig.PERFORMANCE_SETTINGS) {
                    savedConfig = fullConfig.PERFORMANCE_SETTINGS;
                    configLoaded = true;
                    console.log('[SweetTooth LazyLoad] Loaded from secure_config:', savedConfig);
                }
            }
        }
    } catch (e) {
        console.warn('[SweetTooth LazyLoad] Could not load config:', e);
    }

    // Configuration - reads from admin dashboard settings
    var config = {
        enabled: configLoaded ? (savedConfig.lazyLoadEnabled !== false) : true,
        rootMargin: '50px',
        threshold: 0.01,
        placeholderColor: '#FFDC9F',
        fadeInDuration: 300
    };

    console.log('[SweetTooth LazyLoad] Final config:', config);
    console.log('[SweetTooth LazyLoad] Lazy load is:', config.enabled ? 'ENABLED' : 'DISABLED');

    // Track loaded images
    var loadedImages = [];
    var totalImages = 0;
    var observer = null;

    // Initialize lazy loading
    function init() {
        if (!config.enabled) {
            console.log('[SweetTooth LazyLoad] Disabled - loading all images immediately');
            loadAllImages();
            return;
        }

        console.log('[SweetTooth LazyLoad] Initialized with rootMargin:', config.rootMargin);

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
        
        // Log when significant changes occur
        if (loadedImages.length > 0 && loadedImages.length % 5 === 0) {
            console.log('[SweetTooth LazyLoad] Progress: ' + loadedImages.length + '/' + totalImages + ' images loaded (' + Math.round((loadedImages.length / totalImages) * 100) + '%)');
        }
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
                console.log('[SweetTooth LazyLoad] Image loaded:', src);
            };
            preloadImg.onerror = function() {
                console.warn('[SweetTooth LazyLoad] Failed to load:', src);
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
        console.log('[SweetTooth LazyLoad] All images loaded immediately (disabled mode)');
    }

    // Log statistics
    function logStats() {
        setTimeout(function() {
            console.log('[SweetTooth LazyLoad] Total images:', totalImages);
            console.log('[SweetTooth LazyLoad] Loaded images:', loadedImages.length);
            console.log('[SweetTooth LazyLoad] Deferred images:', totalImages - loadedImages.length);
            console.log('[SweetTooth LazyLoad] Deferral rate:', totalImages > 0 ? Math.round(((totalImages - loadedImages.length) / totalImages) * 100) + '%' : '0%');
            console.log('[SweetTooth LazyLoad] Performance impact: Images deferred will load as user scrolls, reducing initial page load time');
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
        console.log('[SweetTooth LazyLoad] ' + (enabled ? 'Enabled' : 'Disabled'));

        if (!enabled && observer) {
            // Disconnect observer and load all
            observer.disconnect();
            loadAllImages();
        } else if (enabled) {
            // Re-initialize
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
        console.log('[SweetTooth LazyLoad] Config updated:', config);
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
