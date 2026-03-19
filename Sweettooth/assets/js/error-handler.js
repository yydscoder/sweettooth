/**
 * SweetTooth Gelato - Error Handling & Retry Module
 * 
 * Provides robust error handling with exponential backoff retry logic
 * for API calls and other async operations.
 */
(function() {
    'use strict';

    // Default retry configuration
    var DEFAULT_CONFIG = {
        maxRetries: 3,
        initialDelay: 1000,      // 1 second
        maxDelay: 30000,         // 30 seconds
        backoffMultiplier: 2,    // Exponential backoff
        timeout: 30000,          // 30 second timeout
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        enableLogging: true
    };

    // Retry state tracking
    var retryState = {};

    // Logger
    function log(message, level) {
        if (DEFAULT_CONFIG.enableLogging) {
            var prefix = '[SweetTooth ErrorHandler]';
            switch (level) {
                case 'error':
                    console.error(prefix + ' ERROR:', message);
                    break;
                case 'warn':
                    console.warn(prefix + ' WARNING:', message);
                    break;
                default:
                    console.log(prefix, message);
            }
        }
    }

    // Sleep utility
    function sleep(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }

    // Calculate delay with exponential backoff and jitter
    function calculateDelay(attempt) {
        var exponentialDelay = DEFAULT_CONFIG.initialDelay * Math.pow(DEFAULT_CONFIG.backoffMultiplier, attempt);
        var cappedDelay = Math.min(exponentialDelay, DEFAULT_CONFIG.maxDelay);
        // Add random jitter (±25%) to prevent thundering herd
        var jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
        return Math.round(cappedDelay + jitter);
    }

    // Check if error is retryable
    function isRetryableError(error, status) {
        // Network errors are retryable
        if (error && (error.name === 'TypeError' || error.message.includes('network'))) {
            return true;
        }
        // HTTP status codes
        if (status && DEFAULT_CONFIG.retryableStatuses.indexOf(status) !== -1) {
            return true;
        }
        return false;
    }

    // Main retry function
    function withRetry(operation, options) {
        var config = Object.assign({}, DEFAULT_CONFIG, options);
        var operationId = config.operationId || 'op_' + Date.now();
        var attempt = 0;

        return new Promise(function(resolve, reject) {
            function execute() {
                attempt++;
                var startTime = Date.now();

                log('Executing operation "' + operationId + '" (attempt ' + attempt + '/' + (config.maxRetries + 1) + ')');

                // Create timeout promise
                var timeoutPromise = new Promise(function(_, rejectTimeout) {
                    setTimeout(function() {
                        rejectTimeout(new Error('Operation timed out after ' + config.timeout + 'ms'));
                    }, config.timeout);
                });

                // Race between operation and timeout
                Promise.race([
                    Promise.resolve().then(operation),
                    timeoutPromise
                ])
                .then(function(result) {
                    log('Operation "' + operationId + '" succeeded on attempt ' + attempt);
                    resolve(result);
                })
                .catch(function(error) {
                    var elapsed = Date.now() - startTime;
                    log('Operation "' + operationId + '" failed on attempt ' + attempt + ' after ' + elapsed + 'ms: ' + error.message, 'error');

                    // Check if we should retry
                    var status = error.status || error.code;
                    if (attempt <= config.maxRetries && isRetryableError(error, status)) {
                        var delay = calculateDelay(attempt - 1);
                        log('Retrying in ' + delay + 'ms...');

                        sleep(delay).then(execute);
                    } else {
                        log('Operation "' + operationId + '" failed after ' + attempt + ' attempts', 'error');
                        error.retryCount = attempt;
                        reject(error);
                    }
                });
            }

            execute();
        });
    }

    // Fetch wrapper with retry
    function fetchWithRetry(url, options, retryOptions) {
        var config = Object.assign({}, DEFAULT_CONFIG, retryOptions);

        return withRetry(function() {
            return fetch(url, options)
                .then(function(response) {
                    if (!response.ok) {
                        var error = new Error('HTTP ' + response.status + ': ' + response.statusText);
                        error.status = response.status;
                        error.response = response;
                        throw error;
                    }
                    return response;
                });
        }, Object.assign({ operationId: 'fetch_' + url }, config));
    }

    // Async function wrapper with retry
    function asyncWithRetry(asyncFn, retryOptions) {
        return withRetry(asyncFn, retryOptions);
    }

    // Error boundary for UI operations
    function withErrorBoundary(operation, fallback, errorHandler) {
        return Promise.resolve().then(operation)
            .catch(function(error) {
                log('Error boundary caught: ' + error.message, 'error');
                if (errorHandler) {
                    errorHandler(error);
                }
                return fallback;
            });
    }

    // Network status checker
    function checkNetworkStatus() {
        if ('onLine' in navigator) {
            return navigator.onLine;
        }
        return true; // Assume online if API not available
    }

    // Wait for network to be available
    function waitForNetwork(timeout) {
        return new Promise(function(resolve, reject) {
            if (checkNetworkStatus()) {
                resolve(true);
                return;
            }

            var timeoutId = setTimeout(function() {
                window.removeEventListener('online', onOnline);
                reject(new Error('Network unavailable after ' + timeout + 'ms'));
            }, timeout || 30000);

            function onOnline() {
                clearTimeout(timeoutId);
                window.removeEventListener('online', onOnline);
                resolve(true);
            }

            window.addEventListener('online', onOnline);
        });
    }

    // Queue for offline operations
    var offlineQueue = [];

    // Add operation to offline queue
    function queueForOffline(operation) {
        offlineQueue.push({
            operation: operation,
            timestamp: Date.now()
        });
        log('Operation queued for retry when online (queue size: ' + offlineQueue.length + ')');
    }

    // Process offline queue
    function processOfflineQueue() {
        if (!checkNetworkStatus()) {
            log('Cannot process offline queue - still offline');
            return Promise.resolve([]);
        }

        var results = [];
        var queueCopy = offlineQueue.slice();
        offlineQueue = [];

        return Promise.all(queueCopy.map(function(item, index) {
            return Promise.resolve().then(item.operation)
                .then(function(result) {
                    log('Offline queue item ' + index + ' completed successfully');
                    results.push({ success: true, result: result });
                    return { success: true, result: result };
                })
                .catch(function(error) {
                    log('Offline queue item ' + index + ' failed: ' + error.message, 'error');
                    results.push({ success: false, error: error });
                    // Re-queue failed items
                    offlineQueue.push(item);
                    return { success: false, error: error };
                });
        }));
    }

    // Get offline queue status
    function getOfflineQueueStatus() {
        return {
            count: offlineQueue.length,
            items: offlineQueue.map(function(item, index) {
                return {
                    index: index,
                    timestamp: item.timestamp,
                    age: Date.now() - item.timestamp
                };
            })
        };
    }

    // Clear offline queue
    function clearOfflineQueue() {
        offlineQueue = [];
        log('Offline queue cleared');
    }

    // Global error handler
    function setupGlobalErrorHandler() {
        window.addEventListener('error', function(event) {
            log('Global error: ' + event.message, 'error');
            log('At: ' + event.filename + ':' + event.lineno + ':' + event.colno, 'error');
        });

        window.addEventListener('unhandledrejection', function(event) {
            log('Unhandled promise rejection: ' + event.reason, 'error');
        });
    }

    // Network event listeners
    function setupNetworkListeners() {
        window.addEventListener('online', function() {
            log('Network connection restored');
            processOfflineQueue();
        });

        window.addEventListener('offline', function() {
            log('Network connection lost', 'warn');
        });
    }

    // Initialize
    function init() {
        setupGlobalErrorHandler();
        setupNetworkListeners();
        log('Error handling module initialized');
    }

    // Export to window
    window.SweetToothErrorHandler = {
        // Core functions
        withRetry: withRetry,
        fetchWithRetry: fetchWithRetry,
        asyncWithRetry: asyncWithRetry,
        withErrorBoundary: withErrorBoundary,

        // Network functions
        checkNetworkStatus: checkNetworkStatus,
        waitForNetwork: waitForNetwork,
        
        // Offline queue
        queueForOffline: queueForOffline,
        processOfflineQueue: processOfflineQueue,
        getOfflineQueueStatus: getOfflineQueueStatus,
        clearOfflineQueue: clearOfflineQueue,

        // Configuration
        setConfig: function(newConfig) {
            Object.assign(DEFAULT_CONFIG, newConfig);
            log('Configuration updated');
        },
        getConfig: function() {
            return Object.assign({}, DEFAULT_CONFIG);
        },

        // Utilities
        log: log,
        init: init
    };

    // Auto-initialize
    init();
})();
