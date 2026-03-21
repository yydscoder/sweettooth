/**
 * SweetTooth Gelato - WhatsApp Widget
 * Shared WhatsApp chat widget for all pages
 */
(function() {
    'use strict';

    // WhatsApp widget HTML
    var widgetHTML = 
        '<div id="whatsapp-chatbox" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">' +
            '<div id="whatsapp-button" style="display: flex; flex-direction: column; align-items: flex-end;">' +
                '<button id="whatsapp-toggle" style="background-color: #25D366; border: none; border-radius: 50%; width: 60px; height: 60px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="white">' +
                        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.456-18.294a11.82 11.82 0 00-8.456-3.513c-6.502.003-11.78 5.281-11.78 11.785 0 2.258.633 4.376 1.758 6.184L1.356 23.9l6.305-1.654a11.88 11.88 0 006.188 1.76 11.816 11.816 0 0010.645-6.314 11.904 11.904 0 00-3.04-13.698"/>' +
                    '</svg>' +
                '</button>' +
            '</div>' +
            '<div id="whatsapp-window" style="display: none; width: 350px; height: 450px; background-color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 10px; flex-direction: column; overflow: hidden;">' +
                '<div style="background-color: #075E54; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">' +
                    '<h4 style="margin: 0;">SweetTooth Support</h4>' +
                    '<button id="close-whatsapp" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>' +
                '</div>' +
                '<div id="chat-messages" style="flex: 1; padding: 1rem; overflow-y: auto; background-color: #E5DDD5;">' +
                    '<div style="background-color: white; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; max-width: 80%;">' +
                        '<p style="margin: 0; font-size: 0.9rem;">Hi! Welcome to SweetTooth Gelato. How can we help you today?</p>' +
                        '<span style="font-size: 0.7rem; color: #999; display: block; margin-top: 0.25rem;">SweetTooth</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding: 0.75rem; background-color: #F0F0F0; display: flex; gap: 0.5rem;">' +
                    '<input type="text" id="whatsapp-message" placeholder="Type a message..." style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 20px; outline: none; font-family: inherit;">' +
                    '<button id="send-whatsapp" style="background-color: #075E54; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">' +
                            '<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    // Initialize WhatsApp widget
    function initWhatsAppWidget() {
        // Check if widget already exists
        if (document.getElementById('whatsapp-chatbox')) {
            return;
        }

        // Add widget HTML to body
        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        // Get elements
        var whatsappToggle = document.getElementById('whatsapp-toggle');
        var whatsappWindow = document.getElementById('whatsapp-window');
        var closeWhatsapp = document.getElementById('close-whatsapp');
        var sendWhatsapp = document.getElementById('send-whatsapp');
        var whatsappMessage = document.getElementById('whatsapp-message');

        if (!whatsappToggle || !whatsappWindow) return;

        // Toggle chat window
        whatsappToggle.addEventListener('click', function() {
            if (whatsappWindow.style.display === 'none' || whatsappWindow.style.display === '') {
                whatsappWindow.style.display = 'flex';
                whatsappMessage.focus();
            } else {
                whatsappWindow.style.display = 'none';
            }
        });

        // Close button
        if (closeWhatsapp) {
            closeWhatsapp.addEventListener('click', function() {
                whatsappWindow.style.display = 'none';
            });
        }

        // Send message function
        function sendMessage() {
            var message = whatsappMessage.value.trim();
            if (!message) return;

            // Get phone number from config or use default
            var phoneNumber = '601234567890';
            if (window.SweetToothConfig && SweetToothConfig.WHATSAPP_PHONE_NUMBER) {
                phoneNumber = SweetToothConfig.WHATSAPP_PHONE_NUMBER;
            }

            // Encode message for URL
            var encodedMessage = encodeURIComponent(message);
            var whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + encodedMessage;

            // Open WhatsApp
            window.open(whatsappUrl, '_blank');

            // Clear and close
            whatsappMessage.value = '';
            whatsappWindow.style.display = 'none';

            // Track click
            trackWhatsAppClick();
        }

        // Send on button click
        if (sendWhatsapp) {
            sendWhatsapp.addEventListener('click', sendMessage);
        }

        // Send on Enter key
        if (whatsappMessage) {
            whatsappMessage.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        // Track WhatsApp click analytics
        function trackWhatsAppClick() {
            if (window.SweetToothConfig && SweetToothConfig.trackEvent) {
                SweetToothConfig.trackEvent('whatsapp_click', {
                    timestamp: Date.now()
                });
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhatsAppWidget);
    } else {
        initWhatsAppWidget();
    }

    // Export
    window.SweetToothWhatsApp = {
        init: initWhatsAppWidget
    };

    console.log('[SweetTooth WhatsApp] Widget loaded');
})();
