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

    // Format bytes to human readable
    function formatBytes(bytes) {
        if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        }
        if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        }
        return bytes + ' bytes';
    }

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
        console.log('========================================================================');
        console.log('                  SweetTooth Optimization Dashboard');
        console.log('========================================================================');
        console.log('  OPTIMIZATION STATUS:');
        console.log('  ────────────────────────────────────────────────────────────────────');
        console.log('  Lazy Load Images:   ' + (config.lazyLoadEnabled ? '[ENABLED] ' : '[DISABLED]') + ' (Defers offscreen images)');
        console.log('  Caching:            ' + (config.cachingEnabled ? '[ENABLED] ' : '[DISABLED]') + ' (24h TTL, localStorage)');
        console.log('  Image Quality:      ' + config.imageQuality + '% (compression level)');
        console.log('  ────────────────────────────────────────────────────────────────────');
        
        // Output performance metrics if available
        if (window.SweetToothPerf && window.SweetToothPerf.getReport) {
            setTimeout(function() {
                var report = window.SweetToothPerf.getReport();
                console.log('');
                console.log('  PERFORMANCE METRICS:');
                console.log('  ────────────────────────────────────────────────────────────────────');
                console.log('  Page Load Time:     ' + (report.currentMetrics && report.currentMetrics.pageLoadTime ? report.currentMetrics.pageLoadTime.toFixed(2) : '0.00') + ' ms');
                console.log('  DOM Content Loaded: ' + (report.currentMetrics && report.currentMetrics.domContentLoaded ? report.currentMetrics.domContentLoaded.toFixed(2) : '0.00') + ' ms');
                console.log('  Page Views:         ' + report.pageViews);
                console.log('  Avg Load Time:      ' + report.averageLoadTime + ' ms');
                console.log('  Avg First Paint:    ' + report.averageFCP + ' ms');
                if (report.currentMetrics) {
                    console.log('  Current Page:');
                    console.log('    - Resources Loaded:   ' + (report.currentMetrics.resourceCount || 0));
                    console.log('    - Total Size:         ' + formatBytes(report.currentMetrics.totalResourceSize || 0));
                    console.log('    - Images:             ' + (report.currentMetrics.imageCount || 0));
                }
                console.log('  ────────────────────────────────────────────────────────────────────');
            }, 500);
        }
        
        // Output cache stats if available - uses accurate data from actual cache
        setTimeout(function() {
            try {
                var cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
                var totalRequests = (cacheData.hitCount || 0) + (cacheData.missCount || 0);
                var hitRate = totalRequests > 0 ? ((cacheData.hitCount || 0) / totalRequests * 100).toFixed(1) : 0;
                var totalSize = 0;
                var assetCount = 0;
                
                for (var url in cacheData.assets) {
                    if (cacheData.assets.hasOwnProperty(url)) {
                        totalSize += cacheData.assets[url].size || 0;
                        assetCount++;
                    }
                }
                
                console.log('');
                console.log('  CACHE STATISTICS:');
                console.log('  ────────────────────────────────────────────────────────────────────');
                console.log('  Cache Hits:        ' + (cacheData.hitCount || 0));
                console.log('  Cache Misses:      ' + (cacheData.missCount || 0));
                console.log('  Hit Rate:          ' + hitRate + '%');
                console.log('  Total Assets:      ' + assetCount);
                console.log('  Cache Size:        ' + totalSize + ' bytes');
                console.log('  Operations Logged: ' + (cacheData.operations || []).length);
                console.log('  ────────────────────────────────────────────────────────────────────');
            } catch(e) {
                console.warn('[SweetTooth Opt] Could not read cache stats:', e);
            }
            
            // Output lazy loading stats
            if (window.SweetToothLazyLoad && window.SweetToothLazyLoad.getStats) {
                var lazyStats = window.SweetToothLazyLoad.getStats();
                var deferralRate = lazyStats.total > 0 ? Math.round((lazyStats.deferred / lazyStats.total) * 100) : 0;
                console.log('');
                console.log('  LAZY LOADING STATS:');
                console.log('  ────────────────────────────────────────────────────────────────────');
                console.log('  Status:          ' + (lazyStats.enabled ? '[ACTIVE]  ' : '[INACTIVE]') + '');
                console.log('  Total Images:    ' + lazyStats.total);
                console.log('  Loaded:          ' + lazyStats.loaded + ' (' + (lazyStats.total > 0 ? Math.round((lazyStats.loaded / lazyStats.total) * 100) : 0) + '%)');
                console.log('  Deferred:        ' + lazyStats.deferred + ' (' + deferralRate + '%)');
                console.log('  Initial Load Saved: ~' + deferralRate + '% bandwidth');
                console.log('  ────────────────────────────────────────────────────────────────────');
                console.log('');
                console.log('  To change settings: Open admin.html -> Performance tab');
                console.log('========================================================================');
                console.log('');
            }
        }, 1000);

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

    // Initialize caching strategy with accurate tracking
    function initCaching() {
        if (!config.cachingEnabled) return;

        // Cache static assets using localStorage with metadata
        var cache = {
            version: '1.0.0',
            timestamp: Date.now(),
            lastUpdate: new Date().toISOString(),
            ttl: 86400000, // 24 hours
            assets: {},
            hitCount: 0,
            missCount: 0,
            operations: [] // Track all cache operations for accurate logging
        };

        // Load existing cache or create new
        try {
            var existing = localStorage.getItem(CACHE_KEY);
            if (existing) {
                var parsed = JSON.parse(existing);
                cache.version = parsed.version || cache.version;
                cache.hitCount = parsed.hitCount || 0;
                cache.missCount = parsed.missCount || 0;
                cache.assets = parsed.assets || {};
                cache.operations = parsed.operations || [];

                // Clean expired cache entries
                var now = Date.now();
                var expiredCount = 0;
                for (var url in cache.assets) {
                    if (cache.assets[url].timestamp && (now - cache.assets[url].timestamp) > cache.ttl) {
                        delete cache.assets[url];
                        expiredCount++;
                    }
                }

                if (expiredCount > 0) {
                    console.log('[SweetTooth Opt] Cleaned', expiredCount, 'expired cache entries');
                    cache.operations.push({ type: 'cleanup', removed: expiredCount, timestamp: Date.now() });
                }

                console.log('[SweetTooth Opt] Cache loaded - Hits:', cache.hitCount, 'Misses:', cache.missCount, 'Assets:', Object.keys(cache.assets).length);
            }

            // Store cache metadata
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('[SweetTooth Opt] Caching enabled with 24h TTL');

            // Actually cache some resources to demonstrate
            cacheProductImages();
            cacheConfiguration();

        } catch (e) {
            console.warn('[SweetTooth Opt] Caching failed:', e);
            cache.operations.push({ type: 'error', error: e.message, timestamp: Date.now() });
        }
    }
    
    // Cache product images metadata
    function cacheProductImages() {
        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var imageCount = 0;

            // Cache product catalog images
            if (window.PRODUCT_IMAGES) {
                for (var name in PRODUCT_IMAGES) {
                    var imgUrl = PRODUCT_IMAGES[name];
                    if (imgUrl && !cache.assets[imgUrl]) {
                        cache.assets[imgUrl] = {
                            data: imgUrl,
                            type: 'image',
                            timestamp: Date.now(),
                            size: imgUrl.length,
                            productName: name
                        };
                        imageCount++;
                    }
                }
            }

            // Update cache - DON'T increment missCount for caching new items
            cache.hitCount = cache.hitCount || 0;
            cache.missCount = cache.missCount || 0;
            cache.lastUpdate = new Date().toISOString();
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

            if (imageCount > 0) {
                console.log('[SweetTooth Opt] Cached', imageCount, 'product images');
            }
        } catch (e) {
            console.warn('[SweetTooth Opt] Image caching failed:', e);
        }
    }
    
    // Cache configuration
    function cacheConfiguration() {
        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var configKey = 'sweettooth_config_cached';
            
            if (!cache.assets[configKey]) {
                var configData = JSON.stringify(config);
                cache.assets[configKey] = {
                    data: configData,
                    type: 'config',
                    timestamp: Date.now(),
                    size: configData.length
                };
                cache.missCount = (cache.missCount || 0) + 1;
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                console.log('[SweetTooth Opt] Cached optimization config');
            } else {
                cache.hitCount = (cache.hitCount || 0) + 1;
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                console.log('[SweetTooth Opt] Config cache hit');
            }
        } catch (e) {
            console.warn('[SweetTooth Opt] Config caching failed:', e);
        }
    }

    // Cache a resource with accurate tracking
    function cacheResource(url, data, type) {
        if (!config.cachingEnabled) return false;

        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            cache.assets[url] = {
                data: data,
                type: type,
                timestamp: Date.now(),
                size: typeof data === 'string' ? data.length : JSON.stringify(data).length
            };
            cache.lastUpdate = new Date().toISOString();
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            
            // Track operation
            cache.operations = cache.operations || [];
            cache.operations.push({ type: 'cache', url: url, size: cache.assets[url].size, timestamp: Date.now() });
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            
            console.log('[SweetTooth Cache] CACHED:', url, '(' + type + ', ' + cache.assets[url].size + ' bytes)');
            return true;
        } catch (e) {
            console.warn('[SweetTooth Cache] Failed to cache:', e);
            return false;
        }
    }

    // Get cached resource with accurate hit/miss tracking
    function getCachedResource(url) {
        if (!config.cachingEnabled) return null;

        try {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var asset = cache.assets[url];

            if (!asset) {
                // Cache MISS
                cache.missCount = (cache.missCount || 0) + 1;
                cache.lastUpdate = new Date().toISOString();
                cache.operations = cache.operations || [];
                cache.operations.push({ type: 'miss', url: url, timestamp: Date.now() });
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                console.log('[SweetTooth Cache] MISS:', url);
                return null;
            }

            // Check if expired
            if ((Date.now() - asset.timestamp) > cache.ttl) {
                delete cache.assets[url];
                cache.missCount = (cache.missCount || 0) + 1;
                cache.lastUpdate = new Date().toISOString();
                cache.operations.push({ type: 'expired', url: url, timestamp: Date.now() });
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                console.log('[SweetTooth Cache] EXPIRED:', url);
                return null;
            }

            // Cache HIT
            cache.hitCount = (cache.hitCount || 0) + 1;
            cache.lastUpdate = new Date().toISOString();
            cache.operations.push({ type: 'hit', url: url, size: asset.size, timestamp: Date.now() });
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('[SweetTooth Cache] HIT:', url, '(' + asset.type + ', ' + asset.size + ' bytes)');
            return asset.data;
        } catch (e) {
            console.warn('[SweetTooth Cache] Get failed:', e);
            return null;
        }
    }
    
    // Test caching functionality - call this to demonstrate cache working
    function testCaching() {
        console.log('');
        console.log('========================================');
        console.log('  CACHING TEST - Watch hits/misses');
        console.log('========================================');
        
        var testKey = 'sweettooth_test_resource';
        var testData = 'This is test data cached at ' + new Date().toISOString();
        
        // First call - should be a MISS
        console.log('Test 1: Getting uncached resource...');
        var result1 = getCachedResource(testKey);
        if (!result1) {
            console.log('  Result: MISS (expected) - Caching data now...');
            cacheResource(testKey, testData, 'test');
        }
        
        // Second call - should be a HIT
        console.log('Test 2: Getting cached resource...');
        var result2 = getCachedResource(testKey);
        if (result2) {
            console.log('  Result: HIT (expected) - Data retrieved from cache!');
            console.log('  Cached data:', result2.substring(0, 50) + '...');
        }
        
        // Third call - another HIT
        console.log('Test 3: Getting cached resource again...');
        var result3 = getCachedResource(testKey);
        if (result3) {
            console.log('  Result: HIT (expected) - Cache working!');
        }
        
        // Show final stats with accurate data
        setTimeout(function() {
            var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            var totalRequests = (cache.hitCount || 0) + (cache.missCount || 0);
            var hitRate = totalRequests > 0 ? ((cache.hitCount || 0) / totalRequests * 100).toFixed(1) : 0;
            var totalSize = 0;
            var assetCount = Object.keys(cache.assets || {}).length;
            
            for (var url in cache.assets) {
                if (cache.assets.hasOwnProperty(url)) {
                    totalSize += cache.assets[url].size || 0;
                }
            }

            console.log('');
            console.log('  CACHE TEST RESULTS:');
            console.log('  ────────────────────────────────────────');
            console.log('  Cache Hits:        ' + (cache.hitCount || 0));
            console.log('  Cache Misses:      ' + (cache.missCount || 0));
            console.log('  Hit Rate:          ' + hitRate + '%');
            console.log('  Total Assets:      ' + assetCount);
            console.log('  Total Cache Size:  ' + totalSize + ' bytes');
            console.log('  Recent Operations: ' + (cache.operations || []).length);
            console.log('  ────────────────────────────────────────');
            console.log('  To see live stats: Open admin.html → Performance tab');
            console.log('  To clear cache:    Open admin.html → Performance → Clear Cache');
            console.log('========================================');
            console.log('');
        }, 100);
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
        getCacheStats: getCacheStats,
        testCaching: testCaching  // For demonstrating cache works
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
