/**
 * Performance Logger for SweetTooth Gelato
 * Tracks and logs performance metrics before/after optimizations
 */

(function() {
    'use strict';

    // Logger configuration
    var config = {
        enabled: true,
        logPrefix: '[SweetTooth Perf]',
        storageKey: 'sweettooth_perf_logs'
    };

    // Performance metrics storage
    var metrics = {
        startTime: null,
        domContentLoaded: null,
        windowLoaded: null,
        resourceTimings: [],
        customTimings: {},
        memoryUsage: null
    };

    // Initialize logger
    function init() {
        if (!config.enabled) return;

        metrics.startTime = performance.now();

        // Track DOM events
        document.addEventListener('DOMContentLoaded', function() {
            metrics.domContentLoaded = performance.now();
            logMetric('DOMContentLoaded', metrics.domContentLoaded);
        });

        window.addEventListener('load', function() {
            metrics.windowLoaded = performance.now();
            logMetric('Window Load', metrics.windowLoaded);
            logFullReport();
        });

        // Collect resource timings
        if (window.performance && performance.getEntriesByType) {
            metrics.resourceTimings = performance.getEntriesByType('resource');
        }

        // Track memory usage (Chrome only)
        if (performance.memory) {
            metrics.memoryUsage = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize
            };
        }

        console.log(config.logPrefix + ' Performance logger initialized');
    }

    // Log individual metric
    function logMetric(name, value) {
        console.log(config.logPrefix + ' ' + name + ': ' + value.toFixed(2) + 'ms');
    }

    // Mark custom timing point
    function mark(name) {
        if (!config.enabled) return;
        metrics.customTimings[name] = performance.now();
        console.log(config.logPrefix + ' Mark: ' + name);
    }

    // Measure between two marks
    function measure(startMark, endMark, name) {
        if (!config.enabled) return null;
        var start = metrics.customTimings[startMark];
        var end = metrics.customTimings[endMark] || performance.now();
        if (start === undefined) {
            console.warn(config.logPrefix + ' Start mark not found: ' + startMark);
            return null;
        }
        var duration = end - start;
        logMetric(name || (startMark + ' to ' + endMark), duration);
        return duration;
    }

    // Get resource loading summary
    function getResourceSummary() {
        if (!metrics.resourceTimings.length) return 'No resource timings available';

        var summary = {
            totalResources: metrics.resourceTimings.length,
            totalSize: 0,
            byType: {}
        };

        metrics.resourceTimings.forEach(function(resource) {
            var size = resource.transferSize || 0;
            summary.totalSize += size;

            var type = resource.initiatorType || 'unknown';
            if (!summary.byType[type]) {
                summary.byType[type] = { count: 0, size: 0 };
            }
            summary.byType[type].count++;
            summary.byType[type].size += size;
        });

        return summary;
    }

    // Log full performance report
    function logFullReport() {
        if (!config.enabled) return;

        console.group(config.logPrefix + ' === PERFORMANCE REPORT ===');

        // Page load times
        console.log(config.logPrefix + ' Page Load Metrics:');
        console.log(config.logPrefix + '   - Time to Interactive: ' + metrics.domContentLoaded.toFixed(2) + 'ms');
        console.log(config.logPrefix + '   - Full Page Load: ' + metrics.windowLoaded.toFixed(2) + 'ms');

        // Resource summary
        var resourceSummary = getResourceSummary();
        console.log(config.logPrefix + ' Resource Summary:');
        if (typeof resourceSummary === 'object') {
            console.log(config.logPrefix + '   - Total Resources: ' + resourceSummary.totalResources);
            console.log(config.logPrefix + '   - Total Transfer Size: ' + (resourceSummary.totalSize / 1024).toFixed(2) + ' KB');

            for (var type in resourceSummary.byType) {
                if (resourceSummary.byType.hasOwnProperty(type)) {
                    var item = resourceSummary.byType[type];
                    console.log(config.logPrefix + '   - ' + type + ': ' + item.count + ' files, ' + (item.size / 1024).toFixed(2) + ' KB');
                }
            }
        }

        // Memory usage
        if (metrics.memoryUsage) {
            console.log(config.logPrefix + ' Memory Usage:');
            console.log(config.logPrefix + '   - JS Heap: ' + (metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB');
        }

        // Navigation timing
        if (window.performance && performance.timing) {
            var timing = performance.timing;
            console.log(config.logPrefix + ' Navigation Timing:');
            console.log(config.logPrefix + '   - DNS Lookup: ' + (timing.domainLookupEnd - timing.domainLookupStart) + 'ms');
            console.log(config.logPrefix + '   - TCP Connection: ' + (timing.connectEnd - timing.connectStart) + 'ms');
            console.log(config.logPrefix + '   - Time to First Byte: ' + (timing.responseStart - timing.requestStart) + 'ms');
            console.log(config.logPrefix + '   - DOM Processing: ' + (timing.domComplete - timing.domLoading) + 'ms');
        }

        console.groupEnd();

        // Store logs for later analysis
        storeLogs();
    }

    // Store logs in localStorage
    function storeLogs() {
        try {
            var logs = {
                timestamp: new Date().toISOString(),
                domContentLoaded: metrics.domContentLoaded,
                windowLoaded: metrics.windowLoaded,
                resourceCount: metrics.resourceTimings.length,
                customTimings: metrics.customTimings
            };

            var existingLogs = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
            existingLogs.push(logs);

            // Keep only last 10 logs
            if (existingLogs.length > 10) {
                existingLogs = existingLogs.slice(-10);
            }

            localStorage.setItem(config.storageKey, JSON.stringify(existingLogs));
        } catch (e) {
            console.warn(config.logPrefix + ' Failed to store logs:', e);
        }
    }

    // Get optimization comparison data
    function getComparisonData() {
        try {
            var logs = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
            return logs;
        } catch (e) {
            return [];
        }
    }

    // Clear stored logs
    function clearLogs() {
        localStorage.removeItem(config.storageKey);
        console.log(config.logPrefix + ' Logs cleared');
    }

    // Expose API globally
    window.SweetToothPerf = {
        init: init,
        mark: mark,
        measure: measure,
        logReport: logFullReport,
        getComparisonData: getComparisonData,
        clearLogs: clearLogs,
        getConfig: function() { return config; }
    };

    // Auto-initialize
    init();
})();
