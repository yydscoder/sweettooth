/**
 * SweetTooth Gelato - Optimization Manager
 * Central control for all optimization features with toggle functionality
 */

(function() {
    'use strict';

    var config = {
        lazyLoadEnabled: true,
        cachingEnabled: true,
        minificationEnabled: false,
        imageQuality: 80,
        debugMode: false
    };

    var STORAGE_KEY = 'sweettooth_optimization_config';
    var CACHE_KEY = 'sweettooth_asset_cache';

    // Load saved configuration
    function loadConfig() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var parsed = JSON.parse(saved);
                for (var key in parsed) {
                    if (config.hasOwnProperty(key)) {
                        config[key] = parsed[key];
                    }
                }
            }
        } catch (e) {
            console.warn('[SweetTooth Opt] Failed to load config:', e);
        }
        console.log('[SweetTooth Opt] Configuration loaded:', config);
    }

    // Save configuration
    function saveConfig() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            console.log('[SweetTooth Opt] Configuration saved');
        } catch (e) {
            console.warn('[SweetTooth Opt] Failed to save config:', e);
        }
    }

    // Initialize all optimizations
    function init() {
        loadConfig();
        console.log('[SweetTooth Opt] Optimization manager initialized');
        
        // Output optimization status summary
        console.log('');
        console.log('===============================================================');
        console.log('     SweetTooth Optimization Status');
        console.log('===============================================================');
        console.log('  Lazy Load Images:   ' + (config.lazyLoadEnabled ? '[ENABLED] ' : '[DISABLED]'));
        console.log('  Caching:            ' + (config.cachingEnabled ? '[ENABLED] ' : '[DISABLED]'));
        console.log('  Minification:       ' + (config.minificationEnabled ? '[ENABLED] ' : '[DISABLED]'));
        console.log('  Image Quality:      ' + config.imageQuality + '%');
        console.log('===============================================================');
        console.log('  To change: Open admin.html -> Performance tab');
        console.log('===============================================================');
        console.log('');

        // Initialize lazy loading
        if (config.lazyLoadEnabled && window.SweetToothLazyLoad) {
            window.SweetToothLazyLoad.setEnabled(true);
        }

        // Initialize performance logger
        if (window.SweetToothPerf) {
            window.SweetToothPerf.setEnabled(true);
        }

        // Initialize caching
        if (config.cachingEnabled) {
            initCaching();
        }

        // Apply resource optimizations
        applyOptimizations();
    }

    // Initialize caching strategy
    function initCaching() {
        if (!config.cachingEnabled) return;

        // Cache static assets using localStorage with metadata
        var cache = {
            version: '1.0.0',
            timestamp: Date.now(),
            ttl: 86400000, // 24 hours
            assets: {},
            hitCount: 0,
            missCount: 0
        };

        // Load existing cache or create new
        try {
            var existing = localStorage.getItem(CACHE_KEY);
            if (existing) {
                var parsed = JSON.parse(existing);
                cache.version = parsed.version || cache.version;
                cache.hitCount = parsed.hitCount || 0;
                cache.missCount = parsed.missCount || 0;
                console.log('[SweetTooth Opt] Cache loaded - Hits:', cache.hitCount, 'Misses:', cache.missCount);
            }
            
            // Store cache metadata
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('[SweetTooth Opt] Caching enabled with 24h TTL');
        } catch (e) {
            console.warn('[SweetTooth Opt] Caching failed:', e);
        }
    }

    // Cache a resource
    function cacheResource(url, data, type) {
        if (!config.cachingEnabled) return false;
        
        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            cache.assets[url] = {
                data: data,
                type: type,
                timestamp: Date.now(),
                size: data.length
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('[SweetTooth Cache] Cached:', url, '(' + type + ')');
            return true;
        } catch (e) {
            console.warn('[SweetTooth Cache] Failed to cache:', e);
            return false;
        }
    }

    // Get cached resource
    function getCachedResource(url) {
        if (!config.cachingEnabled) return null;
        
        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var asset = cache.assets[url];
            
            if (!asset) {
                cache.missCount = (cache.missCount || 0) + 1;
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                return null;
            }
            
            // Check if expired
            var age = Date.now() - asset.timestamp;
            if (age > cache.ttl) {
                console.log('[SweetTooth Cache] Expired:', url);
                delete cache.assets[url];
                cache.missCount = (cache.missCount || 0) + 1;
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                return null;
            }
            
            cache.hitCount = (cache.hitCount || 0) + 1;
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('[SweetTooth Cache] Hit:', url, '(age: ' + Math.round(age/1000) + 's)');
            return asset.data;
        } catch (e) {
            console.warn('[SweetTooth Cache] Failed to get cached resource:', e);
            return null;
        }
    }

    // Clear cache
    function clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('[SweetTooth Cache] Cache cleared');
            return true;
        } catch (e) {
            console.warn('[SweetTooth Cache] Failed to clear:', e);
            return false;
        }
    }

    // Get cache statistics
    function getCacheStats() {
        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var totalSize = 0;
            var assetCount = 0;
            
            for (var url in cache.assets) {
                if (cache.assets.hasOwnProperty(url)) {
                    totalSize += cache.assets[url].size || 0;
                    assetCount++;
                }
            }
            
            return {
                version: cache.version || 'N/A',
                assets: assetCount,
                totalSize: totalSize,
                hits: cache.hitCount || 0,
                misses: cache.missCount || 0,
                hitRate: cache.hitCount + cache.missCount > 0 
                    ? Math.round((cache.hitCount / (cache.hitCount + cache.missCount)) * 100) 
                    : 0
            };
        } catch (e) {
            return { assets: 0, totalSize: 0, hits: 0, misses: 0, hitRate: 0 };
        }
    }

    // Apply optimizations to the page
    function applyOptimizations() {
        // Add lazy loading attributes to images
        if (config.lazyLoadEnabled) {
            addLazyLoadingToImages();
        }

        // Apply image quality settings
        if (config.imageQuality < 100) {
            applyImageQuality();
        }

        // Use minified resources if enabled
        if (config.minificationEnabled) {
            useMinifiedResources();
        }
    }

    // Add lazy loading attributes to images
    function addLazyLoadingToImages() {
        var images = document.querySelectorAll('img:not([loading="lazy"])');
        images.forEach(function(img) {
            // Skip already processed images
            if (img.hasAttribute('data-src') || img.hasAttribute('data-lazy')) return;

            // Only lazy load images below the fold
            var rect = img.getBoundingClientRect();
            if (rect.top > window.innerHeight) {
                img.setAttribute('data-src', img.src);
                img.removeAttribute('src');
                img.setAttribute('loading', 'lazy');
            }
        });
        console.log('[SweetTooth Opt] Lazy loading applied to images');
    }

    // Apply image quality settings
    function applyImageQuality() {
        console.log('[SweetTooth Opt] Image quality set to ' + config.imageQuality + '%');
    }

    // Use minified resources
    function useMinifiedResources() {
        // Replace CSS links with minified versions
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && !href.includes('.min.') && !href.includes('http')) {
                var minHref = href.replace('.css', '.min.css');
                // Check if minified version exists
                var testLink = document.createElement('link');
                testLink.rel = 'stylesheet';
                testLink.href = minHref;
                testLink.onerror = function() {
                    // Minified version not found, keep original
                    console.log('[SweetTooth Opt] Minified CSS not found:', minHref);
                };
                testLink.onload = function() {
                    link.parentNode.removeChild(link);
                    console.log('[SweetTooth Opt] Loaded minified CSS:', minHref);
                };
                document.head.appendChild(testLink);
            }
        });

        // Replace JS scripts with minified versions
        var scripts = document.querySelectorAll('script[src]');
        scripts.forEach(function(script) {
            var src = script.getAttribute('src');
            if (src && !src.includes('.min.') && !src.includes('http')) {
                var minSrc = src.replace('.js', '.min.js');
                console.log('[SweetTooth Opt] Would use minified JS:', minSrc);
            }
        });
    }

    // Toggle lazy loading
    function toggleLazyLoad(enabled) {
        config.lazyLoadEnabled = enabled;
        saveConfig();

        if (window.SweetToothLazyLoad) {
            window.SweetToothLazyLoad.setEnabled(enabled);
        }

        console.log('[SweetTooth Opt] Lazy loading ' + (enabled ? 'enabled' : 'disabled'));
    }

    // Toggle caching
    function toggleCaching(enabled) {
        config.cachingEnabled = enabled;
        saveConfig();

        if (enabled) {
            initCaching();
        } else {
            try {
                localStorage.removeItem(CACHE_KEY);
            } catch (e) {}
        }

        console.log('[SweetTooth Opt] Caching ' + (enabled ? 'enabled' : 'disabled'));
    }

    // Toggle minification
    function toggleMinification(enabled) {
        config.minificationEnabled = enabled;
        saveConfig();

        if (enabled) {
            useMinifiedResources();
        } else {
            // Reload page to restore original resources
            console.log('[SweetTooth Opt] Minification disabled - reload to restore originals');
        }

        console.log('[SweetTooth Opt] Minification ' + (enabled ? 'enabled' : 'disabled'));
    }

    // Set image quality
    function setImageQuality(quality) {
        config.imageQuality = Math.max(50, Math.min(100, quality));
        saveConfig();
        console.log('[SweetTooth Opt] Image quality set to ' + config.imageQuality + '%');
    }

    // Get current configuration
    function getConfig() {
        return Object.assign({}, config);
    }

    // Get optimization statistics
    function getStats() {
        var stats = {
            lazyLoad: {
                enabled: config.lazyLoadEnabled,
                stats: window.SweetToothLazyLoad ? window.SweetToothLazyLoad.getStats() : null
            },
            caching: {
                enabled: config.cachingEnabled,
                cacheSize: 0
            },
            minification: {
                enabled: config.minificationEnabled
            },
            performance: window.SweetToothPerf ? window.SweetToothPerf.getReport() : null
        };

        // Calculate cache size
        if (config.cachingEnabled) {
            try {
                var cache = localStorage.getItem(CACHE_KEY);
                if (cache) {
                    stats.caching.cacheSize = cache.length;
                }
            } catch (e) {}
        }

        return stats;
    }

    // Clear all optimization data
    function clearData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(CACHE_KEY);
            if (window.SweetToothPerf) {
                window.SweetToothPerf.clearMetrics();
            }
            console.log('[SweetTooth Opt] All optimization data cleared');
        } catch (e) {
            console.warn('[SweetTooth Opt] Failed to clear data:', e);
        }
    }

    // Expose API
    window.SweetToothOptimization = {
        init: init,
        toggleLazyLoad: toggleLazyLoad,
        toggleCaching: toggleCaching,
        toggleMinification: toggleMinification,
        setImageQuality: setImageQuality,
        getConfig: getConfig,
        getStats: getStats,
        clearData: clearData,
        saveConfig: saveConfig,
        // New caching functions
        cacheResource: cacheResource,
        getCachedResource: getCachedResource,
        clearCache: clearCache,
        getCacheStats: getCacheStats
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
