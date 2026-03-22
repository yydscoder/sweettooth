/**
 * SweetTooth Gelato - Secure Configuration Loader
 * 
 * This loader reads sensitive configuration from localStorage (set via admin dashboard)
 * instead of hardcoding in files. This prevents API tokens from being exposed in source code.
 * 
 * Admin can set values via /admin.html dashboard with password protection.
 */
(function() {
    'use strict';

    // Default configuration (non-sensitive defaults)
    var DEFAULT_CONFIG = {
        API_URL: 'http://localhost:3000',
        ENABLE_ANALYTICS: false,
        ENABLE_LOGGING: true,
        WHATSAPP_PHONE_NUMBER: '601234567890'
    };

    // Storage keys for sensitive config
    var STORAGE_KEYS = {
        MAPBOX_TOKEN: 'st_config_mapbox_token',
        ADMIN_PASSWORD_HASH: 'st_admin_password_hash',
        CMS_DATA: 'st_cms_data',
        ANALYTICS_DATA: 'st_analytics_data',
        PERFORMANCE_SETTINGS: 'st_performance_settings'
    };

    // Simple hash function for passwords (not cryptographically secure, but sufficient for client-side protection)
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Get config value from localStorage or default
    function getConfigValue(key, defaultValue) {
        try {
            var stored = localStorage.getItem(STORAGE_KEYS[key] || key);
            if (stored !== null) {
                // Try to parse JSON for complex values
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    return stored;
                }
            }
        } catch (e) {
            console.warn('[SecureConfig] Failed to read config for key:', key, e);
        }
        return defaultValue !== undefined ? defaultValue : DEFAULT_CONFIG[key];
    }

    // Set config value to localStorage
    function setConfigValue(key, value) {
        try {
            localStorage.setItem(STORAGE_KEYS[key] || key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('[SecureConfig] Failed to save config for key:', key, e);
            return false;
        }
    }

    // Get Mapbox token (sensitive - stored in localStorage)
    function getMapboxToken() {
        return getConfigValue('MAPBOX_TOKEN', '');
    }

    // Set Mapbox token
    function setMapboxToken(token) {
        return setConfigValue('MAPBOX_TOKEN', token);
    }

    // Get admin password hash
    function getAdminPasswordHash() {
        // Hardcoded password: Flavourtown123
        return simpleHash('Flavourtown123');
    }

    // Set admin password (disabled - password is hardcoded)
    function setAdminPassword(password) {
        console.warn('[SecureConfig] Password change disabled - using hardcoded password');
        return false;
    }

    // Verify admin password
    function verifyAdminPassword(password) {
        return password === 'Flavourtown123';
    }

    // Check if admin password is set
    function isAdminPasswordSet() {
        return true; // Always true since password is hardcoded
    }

    // Get CMS data
    function getCMSData() {
        return getConfigValue('CMS_DATA', {
            products: {},
            content: {
                testimonials: [],
                blogPosts: []
            }
        });
    }

    // Set CMS data
    function setCMSData(data) {
        return setConfigValue('CMS_DATA', data);
    }

    // Get analytics data
    function getAnalyticsData() {
        return getConfigValue('ANALYTICS_DATA', {
            pageViews: [],
            cartAdditions: 0,
            checkouts: 0,
            orders: 0
        });
    }

    // Set analytics data
    function setAnalyticsData(data) {
        return setConfigValue('ANALYTICS_DATA', data);
    }

    // Track analytics event
    function trackEvent(eventType, data) {
        var analytics = getAnalyticsData();
        analytics.pageViews.push({
            type: eventType,
            data: data,
            timestamp: Date.now()
        });
        // Keep only last 1000 events
        if (analytics.pageViews.length > 1000) {
            analytics.pageViews = analytics.pageViews.slice(-1000);
        }
        return setAnalyticsData(analytics);
    }

    // Get performance settings
    function getPerformanceSettings() {
        return getConfigValue('PERFORMANCE_SETTINGS', {
            enableLazyLoad: true,
            enableMinification: false,
            enableCaching: true,
            imageQuality: 80
        });
    }

    // Set performance settings
    function setPerformanceSettings(settings) {
        return setConfigValue('PERFORMANCE_SETTINGS', settings);
    }

    // Clear all sensitive data (logout)
    function clearSensitiveData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.MAPBOX_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
            return true;
        } catch (e) {
            console.error('[SecureConfig] Failed to clear sensitive data', e);
            return false;
        }
    }

    // Export to window.SweetToothConfig
    window.SweetToothConfig = {
        // Config values
        MAPBOX_TOKEN: getMapboxToken(),
        API_URL: getConfigValue('API_URL'),
        WHATSAPP_PHONE_NUMBER: getConfigValue('WHATSAPP_PHONE_NUMBER'),
        ENABLE_ANALYTICS: getConfigValue('ENABLE_ANALYTICS'),
        ENABLE_LOGGING: getConfigValue('ENABLE_LOGGING'),

        // Admin functions
        verifyAdminPassword: verifyAdminPassword,
        setAdminPassword: setAdminPassword,
        isAdminPasswordSet: isAdminPasswordSet,
        getAdminPasswordHash: getAdminPasswordHash,

        // Config management
        setMapboxToken: setMapboxToken,
        getMapboxToken: getMapboxToken,

        // CMS functions
        getCMSData: getCMSData,
        setCMSData: setCMSData,

        // Analytics functions
        getAnalyticsData: getAnalyticsData,
        setAnalyticsData: setAnalyticsData,
        trackEvent: trackEvent,

        // Performance functions
        getPerformanceSettings: getPerformanceSettings,
        setPerformanceSettings: setPerformanceSettings,

        // Utility
        clearSensitiveData: clearSensitiveData,
        getConfigValue: getConfigValue,
        setConfigValue: setConfigValue
    };

    // Also set window.ENV for backward compatibility
    window.ENV = {
        MAPBOX_TOKEN: window.SweetToothConfig.MAPBOX_TOKEN,
        API_URL: window.SweetToothConfig.API_URL,
        WHATSAPP_PHONE_NUMBER: window.SweetToothConfig.WHATSAPP_PHONE_NUMBER,
        ENABLE_ANALYTICS: window.SweetToothConfig.ENABLE_ANALYTICS,
        ENABLE_LOGGING: window.SweetToothConfig.ENABLE_LOGGING
    };

    console.log('[SweetTooth SecureConfig] Configuration loader initialized');
})();
