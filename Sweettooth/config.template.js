/**
 * SweetTooth Gelato - Environment Configuration Template
 *
 * SECURITY NOTICE:
 * This template file is for reference ONLY. Do NOT fill in real API keys here.
 * 
 * To configure sensitive values securely:
 * 1. Visit /admin.html in your browser
 * 2. Set your admin password (first-time setup)
 * 3. Configure API tokens and settings via the dashboard
 * 4. Values are stored securely in browser localStorage
 *
 * Usage in HTML:
 * <script src="assets/js/secure-config.js"></script>
 * 
 * Access config via window.SweetToothConfig or window.ENV
 */

(function() {
    'use strict';

    console.warn('[SweetTooth Config] This is a TEMPLATE file. Use /admin.html to configure real values.');
    console.warn('[SweetTooth Config] Include assets/js/secure-config.js instead of this file.');

    // Placeholder for backward compatibility
    window.ENV = {
        MAPBOX_TOKEN: '',
        WHATSAPP_PHONE_NUMBER: '601234567890',
        API_URL: 'http://localhost:3000',
        ENABLE_ANALYTICS: false,
        ENABLE_LOGGING: true
    };
})();
