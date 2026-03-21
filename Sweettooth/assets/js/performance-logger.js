/**
 * SweetTooth Gelato - Performance Logger
 * Tracks and logs performance metrics
 */

(function() {
    'use strict';

    var config = {
        enabled: true,
        logToConsole: true,
        storageKey: 'sweettooth_perf_metrics'
    };

    var metrics = {
        pageLoadTime: 0,
        domContentLoaded: 0,
        firstContentfulPaint: 0,
        timeToInteractive: 0,
        resourceCount: 0,
        totalResourceSize: 0,
        imageCount: 0,
        lazyLoadedImages: 0
    };

    var startTime = performance.now();

    // Initialize performance tracking
    function init() {
        if (!config.enabled) {
            console.log('[SweetTooth Perf] Performance logging disabled');
            return;
        }

        console.log('[SweetTooth Perf] Performance logger initialized');

        // Track DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
            metrics.domContentLoaded = performance.now() - startTime;
            log('DOMContentLoaded', metrics.domContentLoaded.toFixed(2) + ' ms');
        });

        // Track page load
        window.addEventListener('load', function() {
            metrics.pageLoadTime = performance.now() - startTime;
            log('Page Load', metrics.pageLoadTime.toFixed(2) + ' ms');
            calculateResourceMetrics();
            saveMetrics();
            
            // Output comprehensive performance report to console
            setTimeout(function() {
                console.log('');
                console.log('===============================================================');
                console.log('     SweetTooth Performance Report');
                console.log('===============================================================');
                console.log('  Page Load Time:        ' + metrics.pageLoadTime.toFixed(2) + ' ms');
                console.log('  DOM Content Loaded:    ' + metrics.domContentLoaded.toFixed(2) + ' ms');
                console.log('  First Contentful Paint:' + metrics.firstContentfulPaint.toFixed(2) + ' ms');
                console.log('  Resources Loaded:      ' + metrics.resourceCount + ' files');
                console.log('  Total Data Transfer:   ' + formatBytes(metrics.totalResourceSize));
                console.log('  Images:                ' + metrics.imageCount);
                console.log('===============================================================');
                console.log('  Tip: Open admin.html -> Performance tab to see live metrics');
                console.log('===============================================================');
                console.log('');
            }, 500);
        });

        // Track First Contentful Paint using Performance API
        if (window.performance && performance.getEntriesByType) {
            var paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(function(entry) {
                if (entry.name === 'first-contentful-paint') {
                    metrics.firstContentfulPaint = entry.startTime;
                    log('First Contentful Paint', entry.startTime.toFixed(2) + ' ms');
                }
            });
        }

        // Track resources
        trackResources();
    }

    // Track resource loading
    function trackResources() {
        if (window.performance && performance.getEntriesByType) {
            var resources = performance.getEntriesByType('resource');
            metrics.resourceCount = resources.length;

            resources.forEach(function(resource) {
                if (resource.transferSize) {
                    metrics.totalResourceSize += resource.transferSize;
                }
                if (resource.initiatorType === 'img') {
                    metrics.imageCount++;
                }
            });

            log('Resources loaded', metrics.resourceCount + ' files, ' + formatBytes(metrics.totalResourceSize));
        }
    }

    // Calculate resource metrics after load
    function calculateResourceMetrics() {
        metrics.timeToInteractive = performance.now() - startTime;
        log('Time to Interactive', metrics.timeToInteractive.toFixed(2) + ' ms');
    }

    // Log performance message
    function log(label, value) {
        if (!config.enabled || !config.logToConsole) return;

        var timestamp = new Date().toLocaleTimeString();
        console.log('[SweetTooth Perf] [' + timestamp + '] ' + label + ': ' + value);
    }

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

    // Save metrics to localStorage
    function saveMetrics() {
        try {
            var data = {
                metrics: metrics,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            var existing = localStorage.getItem(config.storageKey);
            var history = existing ? JSON.parse(existing) : [];
            history.push(data);

            // Keep only last 100 entries
            if (history.length > 100) {
                history = history.slice(-100);
            }

            localStorage.setItem(config.storageKey, JSON.stringify(history));
            log('Metrics saved to storage', '');
        } catch (e) {
            console.warn('[SweetTooth Perf] Failed to save metrics:', e);
        }
    }

    // Get metrics from storage
    function getHistory() {
        try {
            var existing = localStorage.getItem(config.storageKey);
            return existing ? JSON.parse(existing) : [];
        } catch (e) {
            console.warn('[SweetTooth Perf] Failed to get history:', e);
            return [];
        }
    }

    // Get current metrics
    function getMetrics() {
        return Object.assign({}, metrics);
    }

    // Get performance report
    function getReport() {
        var history = getHistory();
        var pageViews = history.length;

        // Calculate averages
        var avgLoadTime = 0;
        var avgFCP = 0;
        if (history.length > 0) {
            var totalLoad = 0;
            var totalFCP = 0;
            history.forEach(function(entry) {
                if (entry.metrics) {
                    totalLoad += entry.metrics.pageLoadTime || 0;
                    totalFCP += entry.metrics.firstContentfulPaint || 0;
                }
            });
            avgLoadTime = totalLoad / history.length;
            avgFCP = totalFCP / history.length;
        }

        return {
            pageViews: pageViews,
            averageLoadTime: avgLoadTime.toFixed(2),
            averageFCP: avgFCP.toFixed(2),
            currentMetrics: metrics
        };
    }

    // Clear metrics
    function clearMetrics() {
        localStorage.removeItem(config.storageKey);
        console.log('[SweetTooth Perf] Metrics cleared');
    }

    // Enable/disable logging
    function setEnabled(enabled) {
        config.enabled = enabled;
        console.log('[SweetTooth Perf] Performance logging ' + (enabled ? 'enabled' : 'disabled'));
    }

    // Expose API
    window.SweetToothPerf = {
        init: init,
        log: log,
        getMetrics: getMetrics,
        getHistory: getHistory,
        getReport: getReport,
        clearMetrics: clearMetrics,
        setEnabled: setEnabled,
        isEnabled: function() { return config.enabled; },
        formatBytes: formatBytes
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
