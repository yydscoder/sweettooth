/**
 * SweetTooth Gelato - Environment Configuration
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to "config.js" (same directory)
 * 2. Fill in your actual API keys and secrets
 * 3. NEVER commit config.js to version control (it's in .gitignore)
 * 
 * Usage in HTML:
 * <script src="assets/js/config-loader.js"></script>
 * <script src="assets/js/config.js"></script>  <-- Your environment-specific config
 */

(function() {
    'use strict';

    // Environment-specific configuration
    // These values will be loaded into window.ENV
    window.ENV = {
        // ===========================================
        // MAPBOX (for maps in checkout.html)
        // Get your token at: https://mapbox.com
        // ===========================================
        MAPBOX_TOKEN: 'pk.eyJ1Ijoic3dlZXR0b290aDAyIiwiYSI6ImNtbTA2djN2eDAwb3MzZHB3bWNqbzZ2am8ifQ.-rMUDpQyTAsD_xImROFfyw',

        // ===========================================
        // WHATSAPP BUSINESS
        // Click-to-Chat phone number (format: country code + number, no + or spaces)
        // ===========================================
        WHATSAPP_PHONE_NUMBER: '601234567890',

        // ===========================================
        // API ENDPOINTS (for future backend)
        // ===========================================
        API_URL: 'http://localhost:3000',

        // ===========================================
        // FEATURE FLAGS
        // ===========================================
        ENABLE_ANALYTICS: false,
        ENABLE_LOGGING: true
    };

    console.log('[SweetTooth Config] Environment configuration loaded');
})();
