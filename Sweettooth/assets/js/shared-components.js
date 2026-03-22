/**
 * SweetTooth Gelato - Shared Components Loader
 * Loads shared HTML components (header, footer) across all pages
 */

(function() {
    'use strict';

    // Load shared header
    function loadSharedHeader() {
        var headerContainer = document.getElementById('shared-header');
        if (!headerContainer) return;

        fetch('assets/components/header.html')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load header: ' + response.status);
                }
                return response.text();
            })
            .then(function(html) {
                headerContainer.innerHTML = html;
                // Reinitialize cart functionality after header is loaded
                if (window.SweetToothCart) {
                    setTimeout(function() {
                        SweetToothCart.renderCart && SweetToothCart.renderCart();
                    }, 50);
                }
            })
            .catch(function(error) {
                console.error('[Shared Components] Error loading header:', error);
                // Fallback: create minimal header
                headerContainer.innerHTML = createFallbackHeader();
            });
    }

    // Load shared footer
    function loadSharedFooter() {
        var footerContainer = document.getElementById('shared-footer');
        if (!footerContainer) return;

        fetch('assets/components/footer.html')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load footer: ' + response.status);
                }
                return response.text();
            })
            .then(function(html) {
                footerContainer.innerHTML = html;
            })
            .catch(function(error) {
                console.error('[Shared Components] Error loading footer:', error);
            });
    }

    // Create fallback header if component file fails to load
    function createFallbackHeader() {
        return '<header>' +
            '<div class="header-container blend-design">' +
                '<div class="logo">' +
                    '<a href="index.html">' +
                        '<img src="Images/SweetTooth+Logo.png" alt="SweetTooth Logo" style="height: 50px;">' +
                    '</a>' +
                '</div>' +
                '<nav>' +
                    '<ul>' +
                        '<li><a href="index.html">Home</a></li>' +
                        '<li><a href="our-story.html">Our Story</a></li>' +
                        '<li><a href="products.html">Flavors</a></li>' +
                        '<li><a href="blog.html">Blog</a></li>' +
                        '<li><a href="feed.html">Feed</a></li>' +
                        '<li><a href="events.html">Events</a></li>' +
                        '<li><a href="index.html#contact">Contact</a></li>' +
                    '</ul>' +
                '</nav>' +
                '<div class="cart-icon">' +
                    '<div class="cart-icon-wrapper" onclick="toggleCartDropdown()" style="display: flex; align-items: center; cursor: pointer;">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<circle cx="9" cy="21" r="1"></circle>' +
                            '<circle cx="20" cy="21" r="1"></circle>' +
                            '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
                        '</svg>' +
                        '<span class="cart-count" id="cart-count">0</span>' +
                    '</div>' +
                    '<div class="cart-dropdown" id="cart-dropdown">' +
                        '<div class="cart-header">' +
                            '<h3 class="dealerplate">Your Cart</h3>' +
                            '<span style="cursor: pointer;" onclick="event.stopPropagation(); toggleCartDropdown()">&times;</span>' +
                        '</div>' +
                        '<div class="cart-items-container" id="cart-items-container">' +
                            '<div class="empty-cart-message">' +
                                '<p>🛒 Cart is empty</p>' +
                                '<p style="font-size: 0.9rem; margin-top: 0.5rem;">Add some delicious gelato!</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="cart-items-filled" id="cart-items-filled" style="display: none; padding: 1rem;">' +
                            '<div id="cart-items-list"></div>' +
                            '<div class="cart-total">Total: RM<span id="cart-total">0.00</span></div>' +
                            '<button class="checkout-btn poppins-bold" onclick="event.stopPropagation(); proceedToCheckout()">Proceed to Checkout</button>' +
                            '<button class="view-cart-btn poppins-bold" onclick="event.stopPropagation(); window.location.href=\'products.html\'">View Full Cart</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</header>';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadSharedHeader();
            loadSharedFooter();
        });
    } else {
        loadSharedHeader();
        loadSharedFooter();
    }

    // Export for external use
    window.SweetToothComponents = {
        loadHeader: loadSharedHeader,
        loadFooter: loadSharedFooter
    };
})();
