// Mock API for SweetTooth Gelato Checkout
// In production, this would be replaced with actual API calls to payment gateway

class SweetToothAPI {
    constructor() {
        // Mock data for demonstration
        this.orders = [];
        this.nextOrderId = 1;
        
        // Shop coordinates (Bandar Utama)
        this.shopCoordinates = {
            lat: 3.1390,
            lng: 101.6150
        };
        
        // Delivery zone rules
        this.deliveryZones = [
            { radiusKm: 10, fee: 10, description: 'Within 10km radius of Bandar Utama' },
            { radiusKm: Infinity, fee: 20, description: 'Outside 10km radius of Bandar Utama' }
        ];
    }
    
    // Place order - simulates calling external payment provider
    async placeOrder(orderData) {
        // Simulate API call delay
        await this.delay(1500);
        
        // Validate required fields
        if (!orderData.customer || !orderData.customer.name || 
            !orderData.customer.phone || !orderData.customer.email ||
            !orderData.deliveryAddress || !orderData.items || orderData.items.length === 0) {
            throw new Error('Invalid order data: missing required fields');
        }
        
        // Server-side validation of delivery fee (prevents client-side manipulation)
        const validatedDeliveryFee = this.validateDeliveryFee(
            orderData.deliveryAddress.coordinates,
            orderData.deliveryFee
        );
        
        // Generate order ID
        const orderId = `ST-${this.nextOrderId.toString().padStart(4, '0')}`;
        this.nextOrderId++;
        
        // Create order object with validated delivery fee
        const order = {
            id: orderId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            customer: orderData.customer,
            deliveryAddress: orderData.deliveryAddress,
            items: orderData.items,
            subtotal: orderData.subtotal,
            deliveryFee: validatedDeliveryFee, // Use server-validated fee
            total: orderData.subtotal + validatedDeliveryFee,
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes || '',
            // Security audit trail
            security: {
                clientFeeSubmitted: orderData.deliveryFee,
                serverFeeValidated: validatedDeliveryFee,
                feeValidation: validatedDeliveryFee === orderData.deliveryFee ? 'MATCH' : 'MISMATCH',
                timestamp: new Date().toISOString()
            }
        };
        
        // Store order (in real app, this would be saved to database)
        this.orders.push(order);
        
        return order;
    }
    
    // Validate delivery fee server-side to prevent manipulation
    validateDeliveryFee(userCoordinates, submittedFee) {
        if (!userCoordinates || !userCoordinates.lat || !userCoordinates.lng) {
            // If no coordinates provided, use fallback logic based on address keywords
            // In production, this would be handled by geocoding service
            return submittedFee; // Trust client for now in mock
        }
        
        // Calculate distance using Haversine formula
        const distanceKm = this.calculateDistance(
            this.shopCoordinates.lng, this.shopCoordinates.lat,
            userCoordinates.lng, userCoordinates.lat
        );
        
        // Apply zone rules
        let validatedFee = 20; // Default outside radius
        for (const zone of this.deliveryZones) {
            if (distanceKm <= zone.radiusKm) {
                validatedFee = zone.fee;
                break;
            }
        }
        
        return validatedFee;
    }
    
    // Haversine formula for accurate distance calculation
    calculateDistance(lng1, lat1, lng2, lat2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Get order by ID
    getOrder(orderId) {
        return this.orders.find(order => order.id === orderId);
    }
    
    // Get all orders
    getAllOrders() {
        return [...this.orders];
    }
    
    // Helper method to simulate API delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in checkout page
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SweetToothAPI;
} else {
    window.SweetToothAPI = SweetToothAPI;
}