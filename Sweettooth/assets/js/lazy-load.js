/**
 * Lazy Loading Module for SweetTooth Gelato
 * Implements image lazy loading using Intersection Observer API
 * with performance logging for before/after comparison
 */

(function() {
    'use strict';

    // Configuration
    var config = {
        rootMargin: '50px', // Start loading 50px before element enters viewport
        threshold: 0.01,    // Trigger when 1% of image is visible
        placeholderClass: 'lazy-placeholder',
        loadedClass: 'lazy-loaded',
        imageSelector: 'img[data-src]',
        loggingEnabled: true,
        logPrefix: '[SweetTooth LazyLoad]'
    };

    // Metrics tracking
    var metrics = {
        totalImages: 0,
        loadedImages: 0,
        imagesSkipped: 0,
        observerStartTime: null,
        observerInitTime: null,
        totalLoadTime: 0
    };

    // Performance logging - Before optimization baseline
    function logBeforeOptimization() {
        if (!config.loggingEnabled) return;

        var images = document.querySelectorAll('img:not([loading="lazy"])');
        console.log(config.logPrefix + ' === BEFORE OPTIMIZATION BASELINE ===');
        console.log(config.logPrefix + ' Total images on page: ' + images.length);
        console.log(config.logPrefix + ' Images loading immediately (no lazy load): ' + images.length);
        console.log(config.logPrefix + ' Estimated initial page weight: Calculating...');

        var totalSize = 0;
        images.forEach(function(img) {
            var src = img.src || img.dataset.src;
            if (src) {
                // Estimate based on typical image sizes
                totalSize += 150; // Assume average 150KB per image
            }
        });
        console.log(config.logPrefix + ' Estimated initial image payload: ~' + totalSize + ' KB');
        console.log(config.logPrefix + ' =========================================');
    }

    // Intersection Observer callback
    function onIntersection(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }

    // Load a single image
    function loadImage(img) {
        var startTime = performance.now();
        var src = img.dataset.src;

        if (!src) return;

        // Add placeholder class
        img.classList.add(config.placeholderClass);

        // Create new image to preload
        var tempImg = new Image();
        tempImg.onload = function() {
            img.src = src;
            img.classList.remove(config.placeholderClass);
            img.classList.add(config.loadedClass);

            var loadTime = performance.now() - startTime;
            metrics.loadedImages++;
            metrics.totalLoadTime += loadTime;

            if (config.loggingEnabled) {
                console.log(config.logPrefix + ' Image loaded: ' + src.substring(0, 50) + '... (' + loadTime.toFixed(2) + 'ms)');
            }

            // Dispatch custom event for other scripts
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                bubbles: true,
                detail: { loadTime: loadTime }
            }));
        };

        tempImg.onerror = function() {
            img.classList.remove(config.placeholderClass);
            img.classList.add('lazy-error');
            console.warn(config.logPrefix + ' Failed to load: ' + src);
        };

        tempImg.src = src;
    }

    // Initialize lazy loading
    function init() {
        metrics.observerStartTime = performance.now();

        // Log before optimization state
        logBeforeOptimization();

        // Check for Intersection Observer support
        if (!('IntersectionObserver' in window)) {
            console.warn(config.logPrefix + ' IntersectionObserver not supported, loading all images immediately');
            // Fallback: load all images immediately
            var images = document.querySelectorAll(config.imageSelector);
            images.forEach(function(img) {
                var src = img.dataset.src;
                if (src) {
                    img.src = src;
                    metrics.loadedImages++;
                }
            });
            metrics.imagesSkipped = 0;
            return;
        }

        // Create observer
        var observer = new IntersectionObserver(onIntersection, {
            rootMargin: config.rootMargin,
            threshold: config.threshold
        });

        // Find all lazy-load images
        var images = document.querySelectorAll(config.imageSelector);
        metrics.totalImages = images.length;

        console.log(config.logPrefix + ' === LAZY LOADING INITIALIZED ===');
        console.log(config.logPrefix + ' Found ' + metrics.totalImages + ' images to lazy-load');

        // Start observing
        images.forEach(function(img) {
            // Check if image is already in viewport
            var rect = img.getBoundingClientRect();
            var isInViewport = (
                rect.top >= -config.rootMargin &&
                rect.left >= -config.rootMargin &&
                rect.bottom <= (window.innerHeight + parseInt(config.rootMargin)) &&
                rect.right <= (window.innerWidth + parseInt(config.rootMargin))
            );

            if (isInViewport) {
                // Load immediately if in viewport
                loadImage(img);
                metrics.imagesSkipped++; // Count as "skipped" lazy loading
            } else {
                // Otherwise observe
                observer.observe(img);
            }
        });

        metrics.observerInitTime = performance.now();

        console.log(config.logPrefix + ' Observer initialized in ' + (metrics.observerInitTime - metrics.observerStartTime).toFixed(2) + 'ms');
        console.log(config.logPrefix + ' Images in viewport (loaded immediately): ' + metrics.imagesSkipped);
        console.log(config.logPrefix + ' Images deferred (lazy loaded): ' + (metrics.totalImages - metrics.imagesSkipped));
        console.log(config.logPrefix + ' ======================================');
    }

    // Log after optimization results
    function logAfterOptimization() {
        if (!config.loggingEnabled) return;

        setTimeout(function() {
            console.log(config.logPrefix + ' === AFTER OPTIMIZATION RESULTS ===');
            console.log(config.logPrefix + ' Total images: ' + metrics.totalImages);
            console.log(config.logPrefix + ' Images loaded: ' + metrics.loadedImages);
            console.log(config.logPrefix + ' Average load time: ' + (metrics.loadedImages > 0 ? (metrics.totalLoadTime / metrics.loadedImages).toFixed(2) : 0) + 'ms');
            console.log(config.logPrefix + ' Total load time: ' + metrics.totalLoadTime.toFixed(2) + 'ms');

            // Calculate savings
            var deferredImages = metrics.totalImages - metrics.imagesSkipped;
            var estimatedSavings = deferredImages * 150; // ~150KB per image
            console.log(config.logPrefix + ' Images deferred: ' + deferredImages);
            console.log(config.logPrefix + ' Estimated initial payload savings: ~' + estimatedSavings + ' KB');
            console.log(config.logPrefix + ' ====================================');
        }, 2000); // Wait 2 seconds for most images to load
    }

    // Manual trigger for loading specific image
    function loadImageManual(img) {
        if (img && img.dataset.src) {
            loadImage(img);
        }
    }

    // Expose API globally
    window.SweetToothLazyLoad = {
        init: init,
        logAfter: logAfterOptimization,
        load: loadImageManual,
        getConfig: function() { return config; },
        getMetrics: function() { return metrics; }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        document.addEventListener('DOMContentLoaded', logAfterOptimization);
    } else {
        init();
        logAfterOptimization();
    }
})();
