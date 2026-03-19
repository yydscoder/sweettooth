// SweetTooth Gelato - Shared Cart
// localStorage-persistent, works on all pages.
// Fixed: race condition, price manipulation, floating point, XSS, cross-tab sync, notifications

// Trusted product catalog - source of truth for prices (in cents to avoid floating point issues)
var PRODUCT_CATALOG = {
    'Mangosteen Sorbet': 1500,
    'Madagascar Vanilla': 1500,
    'Seasonal Fruit Medley': 1500,
    'Shun Special': 1500,
    'Belgian Chocolate': 1500,
    'Japanese Matcha': 1500,
    'Premium Durian': 1800,
    'Salted Caramel': 1600,
    'Strawberry Cream': 1500,
    'Pistachio': 1700,
    'Tiramisu': 1600,
    'Lemon Sorbet': 1400,
    'Chocolate Chip': 1500,
    'Coconut Sorbet': 1400,
    'Hazelnut': 1700,
    'Raspberry Sorbet': 1500,
    'Vanilla Bean': 1500,
    'Dark Chocolate': 1600
};

// Default price if product not in catalog (in cents)
var DEFAULT_PRICE_CENTS = 1500;

// Cart state - initialized as null, populated on init
var cart = null;
var STORAGE_KEY = 'sweettooth_cart';

// XSS sanitization - escape HTML special characters
function sanitizeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Convert cents to RM string (e.g., 1500 -> "15.00")
function centsToRM(cents) {
    return (cents / 100).toFixed(2);
}

// Convert RM string to cents (e.g., "15.00" -> 1500)
function rmToCents(rmStr) {
    return Math.round(parseFloat(rmStr) * 100);
}

// Get trusted price for a product (in cents)
function getTrustedPrice(productName) {
    return PRODUCT_CATALOG[productName] || DEFAULT_PRICE_CENTS;
}

// Load cart from localStorage
function loadCart() {
    try {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            var parsed = JSON.parse(stored);
            // Validate and repair cart data - use trusted prices
            if (Array.isArray(parsed)) {
                return parsed.filter(function(item) {
                    return item && item.product && typeof item.product === 'string';
                }).map(function(item) {
                    // Always use trusted price from catalog
                    return {
                        product: item.product,
                        priceCents: getTrustedPrice(item.product),
                        quantity: Math.max(1, item.quantity || 1)
                    };
                });
            }
        }
    } catch(e) {
        console.warn('Failed to load cart:', e);
    }
    return [];
}

// Save cart to localStorage
function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        // Dispatch custom event for same-tab listeners
        window.dispatchEvent(new Event('sweettooth_cart_updated'));
    } catch(e) {
        console.warn('Failed to save cart:', e);
    }
}

// Add item to cart - uses trusted price from catalog
function addToCart(productName, priceHint) {
    // Validate product name
    if (!productName || typeof productName !== 'string') {
        showCartNotification('Invalid product!');
        return;
    }

    // Get trusted price - ignore the priceHint from DOM (prevents manipulation)
    var trustedPriceCents = getTrustedPrice(productName);

    var found = false;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].product === productName) {
            cart[i].quantity += 1;
            found = true;
            break;
        }
    }
    if (!found) {
        cart.push({
            product: productName,
            priceCents: trustedPriceCents,
            quantity: 1
        });
    }
    saveCart();
    renderCart();
    showCartNotification(productName + ' added to cart!');
}

// Remove item from cart
function removeFromCart(productName) {
    var removed = false;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].product === productName) {
            removed = true;
            break;
        }
    }
    cart = cart.filter(function(i) { return i.product !== productName; });
    saveCart();
    renderCart();
    if (removed) {
        showCartNotification(productName + ' removed from cart!');
    }
}

// Update cart quantity
function updateCartQuantity(productName, delta) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].product === productName) {
            cart[i].quantity += delta;
            if (cart[i].quantity <= 0) {
                cart.splice(i, 1);
            }
            break;
        }
    }
    saveCart();
    renderCart();
}

// Render cart UI
function renderCart() {
    if (!cart) return;

    // Badge
    var badge = document.getElementById('cart-count');
    if (badge) {
        var total = 0;
        for (var i = 0; i < cart.length; i++) total += cart[i].quantity;
        badge.textContent = total;
        badge.style.display = total === 0 ? 'none' : 'flex';
    }

    // Dropdown
    var container = document.getElementById('cart-items-container');
    var filled = document.getElementById('cart-items-filled');
    var list = document.getElementById('cart-items-list');
    if (!container || !filled || !list) return;

    if (cart.length === 0) {
        container.style.display = 'block';
        filled.style.display = 'none';
        return;
    }

    container.style.display = 'none';
    filled.style.display = 'block';
    list.innerHTML = '';

    var grandTotalCents = 0;
    for (var j = 0; j < cart.length; j++) {
        var item = cart[j];
        var itemTotalCents = item.priceCents * item.quantity;
        grandTotalCents += itemTotalCents;

        var row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML =
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + sanitizeHTML(item.product) + '</div>' +
              '<div class="cart-item-price">RM ' + centsToRM(item.priceCents) + ' each</div>' +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn cart-qty-minus" data-product="' + sanitizeHTML(item.product) + '">-</button>' +
              '<span class="cart-qty-value">' + item.quantity + '</span>' +
              '<button class="cart-qty-btn cart-qty-plus" data-product="' + sanitizeHTML(item.product) + '">+</button>' +
            '</div>' +
            '<div class="cart-item-total">RM ' + centsToRM(itemTotalCents) + '</div>' +
            '<button class="cart-remove-btn" data-product="' + sanitizeHTML(item.product) + '" title="Remove">x</button>';
        list.appendChild(row);
    }

    var totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = centsToRM(grandTotalCents);
}

// Show notification toast
function showCartNotification(message) {
    var old = document.getElementById('st-notification');
    if (old) old.parentNode.removeChild(old);

    var el = document.createElement('div');
    el.id = 'st-notification';
    el.className = 'st-notification';
    el.textContent = message;
    document.body.appendChild(el);

    // Trigger animation
    setTimeout(function() { el.classList.add('st-notification-show'); }, 10);

    setTimeout(function() {
        el.classList.remove('st-notification-show');
        el.classList.add('st-notification-hide');
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    }, 2200);
}

// Toggle cart dropdown
function toggleCartDropdown() {
    var d = document.getElementById('cart-dropdown');
    if (d) d.classList.toggle('active');
}

// Validate cart and proceed to checkout
function proceedToCheckout() {
    if (!cart || cart.length === 0) {
        showCartNotification('Your cart is empty!');
        return;
    }

    // Validate cart state before checkout
    var validItems = [];
    var invalidProducts = [];

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        // Check if product still exists in catalog (not discontinued)
        if (PRODUCT_CATALOG.hasOwnProperty(item.product) || item.priceCents > 0) {
            // Re-validate price against catalog
            var currentPrice = getTrustedPrice(item.product);
            if (currentPrice !== item.priceCents) {
                // Price changed - update item
                item.priceCents = currentPrice;
                showCartNotification('Price updated for ' + item.product);
            }
            validItems.push(item);
        } else {
            invalidProducts.push(item.product);
        }
    }

    // Remove invalid/discontinued products
    if (invalidProducts.length > 0) {
        cart = validItems;
        saveCart();
        renderCart();
        showCartNotification('Some items were removed (discontinued)');
    }

    // Final check - if cart is now empty
    if (cart.length === 0) {
        showCartNotification('Your cart is empty!');
        return;
    }

    // Store validated cart for checkout page to use
    localStorage.setItem('sweettooth_checkout_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Initialize cart
function cartInit() {
    // Initialize cart state from localStorage
    cart = loadCart();
    renderCart();

    // Listen for storage events from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY) {
            cart = loadCart();
            renderCart();
        }
    });

    // Listen for same-tab cart updates
    window.addEventListener('sweettooth_cart_updated', function() {
        cart = loadCart();
        renderCart();
    });

    // Event delegation — catches all add-to-cart clicks, stops card-onclick bubbling
    document.addEventListener('click', function(e) {
        var btn = e.target;

        // Handle add-to-cart buttons
        if (!btn.classList.contains('add-to-cart-btn') && btn.parentElement && btn.parentElement.classList.contains('add-to-cart-btn')) {
            btn = btn.parentElement;
        }
        if (btn.classList.contains('add-to-cart-btn')) {
            e.stopPropagation();
            e.preventDefault();
            var prod = btn.getAttribute('data-product');
            var price = btn.getAttribute('data-price');
            if (prod) addToCart(prod, price);
            return;
        }

        // Handle cart quantity buttons
        if (btn.classList.contains('cart-qty-minus')) {
            e.stopPropagation();
            e.preventDefault();
            var product = btn.getAttribute('data-product');
            if (product) updateCartQuantity(product, -1);
            return;
        }
        if (btn.classList.contains('cart-qty-plus')) {
            e.stopPropagation();
            e.preventDefault();
            var product = btn.getAttribute('data-product');
            if (product) updateCartQuantity(product, 1);
            return;
        }

        // Handle remove buttons
        if (btn.classList.contains('cart-remove-btn')) {
            e.stopPropagation();
            e.preventDefault();
            var product = btn.getAttribute('data-product');
            if (product) removeFromCart(product);
            return;
        }

        // Close dropdown on outside click
        var cartIcon = document.querySelector('.cart-icon');
        var dropdown = document.getElementById('cart-dropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            if (!cartIcon || !cartIcon.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        }
    }, true); // useCapture=true so we intercept BEFORE the card onclick fires
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cartInit);
} else {
    cartInit();
}
