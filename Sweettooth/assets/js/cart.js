// SweetTooth Gelato - Shared Cart
// localStorage-persistent, works on all pages.

// Performance metrics
var CART_LOAD_START = performance.now();

// Default product catalog (in cents to avoid floating point issues)
// This is merged with CMS products if available
// Images are stored locally in Images/ folder with exact file names
var DEFAULT_PRODUCT_CATALOG = {
    // Original 18 flavors
    'Mangosteen Sorbet': { price: 1500, image: 'Images/MangosteenSorbet.png' },
    'Madagascar Vanilla': { price: 1500, image: 'Images/MadagascarVanilla.png' },
    'Seasonal Fruit Medley': { price: 1500, image: 'Images/SeasonalFruitMedley.png' },
    'Shun Special': { price: 1600, image: 'Images/ShunSpecial.png' },
    'Belgian Chocolate': { price: 1600, image: 'Images/BelgianChocolate.png' },
    'Japanese Matcha': { price: 1600, image: 'Images/JapaneseMatcha.png' },
    'Premium Durian': { price: 1800, image: 'Images/PremiumDurian.png' },
    'Salted Caramel': { price: 1600, image: 'Images/SaltedCaramel.png' },
    'Strawberry Cream': { price: 1500, image: 'Images/StrawberryCream.png' },
    'Pistachio': { price: 1700, image: 'Images/Pistachio.png' },
    'Tiramisu': { price: 1600, image: 'Images/Tiramisu.png' },
    'Lemon Sorbet': { price: 1400, image: 'Images/LemonSorbet.png' },
    'Chocolate Chip': { price: 1500, image: 'Images/ChocolateChip.png' },
    'Coconut Sorbet': { price: 1400, image: 'Images/CoconutSorbet.png' },
    'Hazelnut': { price: 1700, image: 'Images/Hazelnut.png' },
    'Raspberry Sorbet': { price: 1500, image: 'Images/RaspberrySorbet.png' },
    'Vanilla Bean': { price: 1500, image: 'Images/VanillaBean.png' },
    'Dark Chocolate': { price: 1600, image: 'Images/DarkChocolate.png' },
    // Additional 32 flavors
    'Almond Crunch': { price: 1600, image: 'Images/AlmondCrunch.png' },
    'Blueberry Cheesecake': { price: 1700, image: 'Images/BlueberryCheesecake.png' },
    'Cookies and Cream': { price: 1600, image: 'Images/CookiesAndCream.png' },
    'Dragon Fruit': { price: 1800, image: 'Images/DragonFruit.png' },
    'Earl Grey Tea': { price: 1500, image: 'Images/EarlGreyTea.png' },
    'Fig and Honey': { price: 1700, image: 'Images/FigAndHoney.png' },
    'Ginger Spice': { price: 1500, image: 'Images/GingerSpice.png' },
    'Horchata': { price: 1500, image: 'Images/Horchata.png' },
    'Irish Coffee': { price: 1700, image: 'Images/IrishCoffee.png' },
    'Jackfruit Delight': { price: 1600, image: 'Images/JackfruitDelight.png' },
    'Kiwi Lime': { price: 1500, image: 'Images/KiwiLime.png' },
    'Lavender Honey': { price: 1700, image: 'Images/LavenderHoney.png' },
    'Mango Sticky Rice': { price: 1600, image: 'Images/MangoStickyRice.png' },
    'Nutella Swirl': { price: 1700, image: 'Images/NutellaSwirl.png' },
    'Orange Blossom': { price: 1500, image: 'Images/OrangeBlossom.png' },
    'Peach Melba': { price: 1600, image: 'Images/PeachMelba.png' },
    'Quince Paste': { price: 1600, image: 'Images/QuincePaste.png' },
    'Rocky Road': { price: 1700, image: 'Images/RockyRoad.png' },
    'Saffron Rose': { price: 1900, image: 'Images/SaffronRose.png' },
    'Thai Tea': { price: 1500, image: 'Images/ThaiTea.png' },
    'Ube Purple Yam': { price: 1700, image: 'Images/UbePurpleYam.png' },
    'Valrhona Chocolate': { price: 1800, image: 'Images/ValrhonaChocolate.png' },
    'Watermelon Mint': { price: 1400, image: 'Images/WatermelonMint.png' },
    'Yuzu Citrus': { price: 1700, image: 'Images/YuzuCitrus.png' },
    'Zabaione': { price: 1600, image: 'Images/Zabaione.png' },
    'Apple Pie': { price: 1600, image: 'Images/ApplePie.png' },
    'Banana Foster': { price: 1600, image: 'Images/BananaFoster.png' },
    'Cherry Garcia': { price: 1700, image: 'Images/CherryGarcia.png' },
    'Date Walnut': { price: 1600, image: 'Images/DateWalnut.png' },
    'Espresso Fudge': { price: 1600, image: 'Images/EspressoFudge.png' },
    'Butter Pecan': { price: 1700, image: 'Images/ButterPecan.png' },
    'Black Sesame': { price: 1600, image: 'Images/BlackSesame.png' }
};

// Product catalog - merged from default and CMS
var PRODUCT_CATALOG = {};
var PRODUCT_IMAGES = {};

// Initialize product catalog from CMS if available
function initProductCatalog() {
    // Start with default catalog
    for (var key in DEFAULT_PRODUCT_CATALOG) {
        var item = DEFAULT_PRODUCT_CATALOG[key];
        if (typeof item === 'object' && item.price) {
            PRODUCT_CATALOG[key] = item.price;
            if (item.image) {
                PRODUCT_IMAGES[key] = item.image;
            }
        } else {
            PRODUCT_CATALOG[key] = item;
        }
    }

    // Merge with CMS products if available
    if (window.SweetToothConfig && typeof SweetToothConfig.getCMSData === 'function') {
        try {
            var cmsData = SweetToothConfig.getCMSData();
            if (cmsData && cmsData.products) {
                for (var name in cmsData.products) {
                    var product = cmsData.products[name];
                    if (product && product.price) {
                        PRODUCT_CATALOG[name] = product.price;
                        if (product.image) {
                            PRODUCT_IMAGES[name] = product.image;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[Cart] Failed to load CMS products:', e);
        }
    }
}

// Initialize catalog immediately
initProductCatalog();

// Debug logging (disabled by default for production)
var CART_DEBUG = false;
function cartLog() {
    if (!CART_DEBUG || !window.console || !console.log) return;
    console.log.apply(console, arguments);
}
cartLog('[Cart] PRODUCT_IMAGES loaded:', Object.keys(PRODUCT_IMAGES).length, 'images');
cartLog('[Cart] First 5 images:', Object.keys(PRODUCT_IMAGES).slice(0, 5).map(function(k) { return k + ': ' + PRODUCT_IMAGES[k]; }));

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
                        quantity: (function(qty) {
                            var parsed = parseInt(qty, 10);
                            return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
                        })(item.quantity)
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

    var opStart = performance.now();

    // Get trusted price - ignore the priceHint from DOM (prevents manipulation from dev tools or anyone unauthorized/scriptkiddies)
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
    
    var opTime = (performance.now() - opStart).toFixed(2);
    console.log('[SweetTooth Cart] ADD:', productName, '| Qty:', cart.find(function(i) { return i.product === productName; })?.quantity || 1, '| Op time:', opTime, 'ms');
    
    showCartNotification(productName + ' added to cart!');
}

// Remove item from cart
function removeFromCart(productName) {
    var opStart = performance.now();
    
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
    
    var opTime = (performance.now() - opStart).toFixed(2);
    console.log('[SweetTooth Cart] REMOVE:', productName, '| Op time:', opTime, 'ms');
    
    if (removed) {
        showCartNotification(productName + ' removed from cart!');
    }
}

// Update cart quantity in increments of 1, remove if the quantity drops to 0 or lower
function updateCartQuantity(productName, delta) {
    var opStart = performance.now();
    
    var oldQty = 0;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].product === productName) {
            oldQty = cart[i].quantity;
            cart[i].quantity += delta;
            if (cart[i].quantity <= 0) {
                cart.splice(i, 1);
                console.log('[SweetTooth Cart] QTY:', productName, '|', oldQty, '→', 'REMOVED', '| Op time:', (performance.now() - opStart).toFixed(2), 'ms');
                saveCart();
                renderCart();
                return;
            }
            break;
        }
    }
    saveCart();
    renderCart();

    var opTime = (performance.now() - opStart).toFixed(2);
    console.log('[Cart] QTY:', productName, '|', oldQty, '->', oldQty + delta, '| Op time:', opTime, 'ms');
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
        row.className = 'cart-item';
        row.innerHTML =
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + sanitizeHTML(item.product) + '</div>' +
              '<div class="cart-item-price">RM ' + centsToRM(item.priceCents) + ' each</div>' +
            '</div>' +
            '<div class="cart-item-controls">' +
              '<button class="cart-qty-btn cart-qty-minus" data-product="' + sanitizeHTML(item.product) + '" aria-label="Decrease quantity">−</button>' +
              '<span class="cart-qty-value">' + item.quantity + '</span>' +
              '<button class="cart-qty-btn cart-qty-plus" data-product="' + sanitizeHTML(item.product) + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<div class="cart-item-total">RM ' + centsToRM(itemTotalCents) + '</div>' +
            '<button class="cart-remove-btn" data-product="' + sanitizeHTML(item.product) + '" title="Remove" aria-label="Remove">×</button>';
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
    if (!d) return;
    d.classList.toggle('active');

    var icon = document.querySelector('.cart-icon');
    if (icon) {
        icon.setAttribute('aria-expanded', d.classList.contains('active') ? 'true' : 'false');
    }
}

// Close cart dropdown when clicking outside
document.addEventListener('click', function(event) {
    var cartIcon = document.querySelector('.cart-icon');
    var dropdown = document.getElementById('cart-dropdown');
    
    if (cartIcon && dropdown && !cartIcon.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Validate cart and proceed to checkout
function proceedToCheckout() { console.log('[Cart] proceedToCheckout called');
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
    var initStart = performance.now();

    // Initialize cart state from localStorage
    cart = loadCart();
    renderCart();

    // Log cart initialization metrics
    var initTime = (performance.now() - initStart).toFixed(2);
    var cartLoadTime = (performance.now() - CART_LOAD_START).toFixed(2);

    console.log('[Cart] Initialized - Items:', cart.length, '| Init time:', initTime, 'ms');

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

        // Handle cart icon toggle (supports pages without inline onclick)
        // IMPORTANT: Only toggle if click is on cart-icon itself, NOT inside the dropdown
        var cartToggle = btn.closest ? btn.closest('.cart-icon') : null;
        var insideDropdown = btn.closest ? btn.closest('.cart-dropdown') : null;
        
        if (cartToggle && !insideDropdown) {
            e.stopPropagation();
            e.preventDefault();
            toggleCartDropdown();
            return;
        }

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
            if ((!cartIcon || !cartIcon.contains(e.target)) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        }
    }, true); // useCapture=true so we intercept BEFORE the card onclick fires
}

// Get product image from CMS
function getProductImage(productName) {
    return PRODUCT_IMAGES[productName] || null;
}

// Get all products from catalog
function getAllProducts() {
    var products = [];
    for (var name in PRODUCT_CATALOG) {
        products.push({
            name: name,
            price: PRODUCT_CATALOG[name],
            priceRM: (PRODUCT_CATALOG[name] / 100).toFixed(2),
            image: PRODUCT_IMAGES[name] || null
        });
    }
    return products;
}

// Convert product name to URL slug
function nameToSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
}

// Render products to a container element
function renderProducts(containerId, options) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var products = getAllProducts();
    cartLog('[Cart] renderProducts: Rendering', products.length, 'products');
    cartLog('[Cart] First 3 products:', products.slice(0, 3).map(function(p) { return p.name + ' -> ' + p.image; }));
    
    var maxProducts = options && options.limit ? Math.min(options.limit, products.length) : products.length;

    container.innerHTML = '';

    for (var i = 0; i < maxProducts; i++) {
        var product = products[i];
        var card = document.createElement('div');
        card.className = 'product-card';

        var slug = nameToSlug(product.name);
        var productUrl = 'product-detail-' + slug + '.html';

        var imageHtml = '';
        if (product.image) {
            // Check if lazy loading is enabled in admin dashboard
            var lazyLoadEnabled = true;
            try {
                var stored = localStorage.getItem('sweettooth_optimization_config');
                if (stored) {
                    var optConfig = JSON.parse(stored);
                    lazyLoadEnabled = optConfig.lazyLoadEnabled !== false;
                }
            } catch (e) { console.warn('[Cart] Could not check lazy load setting:', e); }

            if (lazyLoadEnabled) {
                // Use lazy loading - image won't load until scrolled into view
                imageHtml = '<a href="' + productUrl + '"><img data-src="' + product.image + '" alt="' + sanitizeHTML(product.name) + '" style="width: 100%; height: 200px; object-fit: cover;" class="lazy-image"></a>';
            } else {
                // Load image immediately (lazy load disabled)
                imageHtml = '<a href="' + productUrl + '"><img src="' + product.image + '" alt="' + sanitizeHTML(product.name) + '" style="width: 100%; height: 200px; object-fit: cover;"></a>';
            }
        } else {
            imageHtml = '<a href="' + productUrl + '" style="text-decoration: none;"><div class="product-image"><div class="product-image-placeholder">[' + sanitizeHTML(product.name) + ']</div></div></a>';
        }

        card.innerHTML =
            imageHtml +
            '<div class="product-info">' +
                '<h3 class="dealerplate"><a href="' + productUrl + '" style="text-decoration: none; color: inherit;">' + sanitizeHTML(product.name) + '</a></h3>' +
                '<div class="product-price poppins-bold">RM ' + product.priceRM + ' per 100ml</div>' +
                '<button class="add-to-cart-btn poppins-bold" data-product="' + sanitizeHTML(product.name) + '" data-price="' + product.priceRM + '">Add to Cart</button>' +
            '</div>';

        container.appendChild(card);
    }
    
    cartLog('[Cart] Rendered ' + maxProducts + ' products with lazy loading images');

    // Cache all rendered products
    cacheRenderedProducts(products.slice(0, maxProducts));

    // Reinitialize lazy loader to pick up new images
    // This is critical - lazy loader needs to observe the newly created img elements
    if (window.SweetToothLazyLoad) {
        setTimeout(function() {
            // Disconnect existing observer and reinitialize with new images
            window.SweetToothLazyLoad.init();
            console.log('[SweetTooth Cart] Lazy loader reinitialized for ' + maxProducts + ' product images');
        }, 50);
    }
}

// Cache rendered products for offline access and faster loading
function cacheRenderedProducts(products) {
    if (!window.SweetToothOptimization || !window.SweetToothOptimization.cacheResource) return;

    try {
        // Cache each product's data
        products.forEach(function(product) {
            var productData = {
                name: product.name,
                price: product.price,
                priceRM: product.priceRM,
                image: product.image,
                cachedAt: new Date().toISOString()
            };
            var cacheKey = 'product_' + product.name.toLowerCase().replace(/\s+/g, '_');
            window.SweetToothOptimization.cacheResource(cacheKey, JSON.stringify(productData), 'product');
        });

        // Cache product list
        var productList = products.map(function(p) { return p.name; });
        window.SweetToothOptimization.cacheResource('sweettooth_product_list', JSON.stringify(productList), 'product_list');

        console.log('[SweetTooth Cart] Cached', products.length, 'products');
    } catch (e) {
        console.warn('[SweetTooth Cart] Failed to cache products:', e);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cartInit);
} else {
    cartInit();
}

// Export functions for external use
window.SweetToothCart = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateCartQuantity: updateCartQuantity,
    getProductImage: getProductImage,
    getAllProducts: getAllProducts,
    renderProducts: renderProducts,
    getCart: function() { return cart; },
    centsToRM: centsToRM
};

