/**
 * SweetTooth Gelato - Form Validation Module
 * 
 * Comprehensive client-side form validation with proper error handling.
 * Includes email, phone, card number (Luhn), CVV, and expiry date validation and others as time goes on. 
 */
(function() {
    'use strict';

    // Validation rules
    var ValidationRules = {
        // Email validation using regex
        email: function(value) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'Email is required' };
            }
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) {
                return { valid: false, message: 'Please enter a valid email address' };
            }
            return { valid: true, message: '' };
        },

        // Phone validation (Malaysian format)
        phone: function(value) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'Phone number is required' };
            }
            // Remove spaces, dashes, and parentheses
            var cleaned = value.replace(/[\s\-\(\)]/g, '');
            // Malaysian phone: starts with +60 or 60 or 0, followed by 9-10 digits
            var phoneRegex = /^(\+60|60|0)?[1-9][0-9]{8,9}$/;
            if (!phoneRegex.test(cleaned)) {
                return { valid: false, message: 'Please enter a valid Malaysian phone number' };
            }
            return { valid: true, message: '' };
        },

        // Card number validation (Luhn algorithm)
        cardNumber: function(value) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'Card number is required' };
            }
            // Remove spaces and dashes
            var cleaned = value.replace(/[\s\-]/g, '');
            // Check if only digits
            if (!/^\d+$/.test(cleaned)) {
                return { valid: false, message: 'Card number must contain only digits' };
            }
            // Check length (13-19 digits)
            if (cleaned.length < 13 || cleaned.length > 19) {
                return { valid: false, message: 'Card number must be 13-19 digits' };
            }
            // Luhn algorithm
            var sum = 0;
            var isEven = false;
            for (var i = cleaned.length - 1; i >= 0; i--) {
                var digit = parseInt(cleaned.charAt(i), 10);
                if (isEven) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }
                sum += digit;
                isEven = !isEven;
            }
            if (sum % 10 !== 0) {
                return { valid: false, message: 'Invalid card number' };
            }
            return { valid: true, message: '' };
        },

        // CVV validation
        cvv: function(value, cardType) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'CVV is required' };
            }
            var cleaned = value.replace(/[\s\-]/g, '');
            // American Express has 4 digits, others have 3
            var isAmex = cardType === 'amex' || /^3[47]/.test(cardType);
            var expectedLength = isAmex ? 4 : 3;
            if (!/^\d+$/.test(cleaned)) {
                return { valid: false, message: 'CVV must contain only digits' };
            }
            if (cleaned.length !== expectedLength) {
                return { valid: false, message: 'CVV must be ' + expectedLength + ' digits' };
            }
            return { valid: true, message: '' };
        },

        // Expiry date validation
        expiryDate: function(value) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'Expiry date is required' };
            }
            // Accept MM/YY or MM/YYYY format
            var expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;
            if (!expiryRegex.test(value.trim())) {
                return { valid: false, message: 'Use MM/YY format' };
            }
            var parts = value.trim().split('/');
            var month = parseInt(parts[0], 10);
            var year = parseInt(parts[1], 10);
            // Convert 2-digit year to 4-digit
            if (year < 100) {
                year += 2000;
            }
            // Check if card is expired
            var now = new Date();
            var currentYear = now.getFullYear();
            var currentMonth = now.getMonth() + 1;
            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                return { valid: false, message: 'Card has expired' };
            }
            return { valid: true, message: '' };
        },

        // Required field validation
        required: function(value, fieldName) {
            if (!value || value.trim() === '') {
                return { valid: false, message: (fieldName || 'This field') + ' is required' };
            }
            return { valid: true, message: '' };
        },

        // Minimum length validation
        minLength: function(value, min, fieldName) {
            if (!value || value.length < min) {
                return { valid: false, message: (fieldName || 'This field') + ' must be at least ' + min + ' characters' };
            }
            return { valid: true, message: '' };
        },

        // Address validation (basic)
        address: function(value) {
            if (!value || value.trim() === '') {
                return { valid: false, message: 'Address is required' };
            }
            if (value.trim().length < 10) {
                return { valid: false, message: 'Please enter a complete address' };
            }
            return { valid: true, message: '' };
        },

        // Name validation
        name: function(value, fieldName) {
            if (!value || value.trim() === '') {
                return { valid: false, message: (fieldName || 'Name') + ' is required' };
            }
            if (value.trim().length < 2) {
                return { valid: false, message: (fieldName || 'Name') + ' must be at least 2 characters' };
            }
            // Check for only special characters
            if (!/[a-zA-Z]/.test(value)) {
                return { valid: false, message: (fieldName || 'Name') + ' must contain letters' };
            }
            return { valid: true, message: '' };
        }
    };

    // Detect card type from number
    function detectCardType(cardNumber) {
        var cleaned = cardNumber.replace(/[\s\-]/g, '');
        if (/^4/.test(cleaned)) return 'visa';
        if (/^5[1-5]/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        if (/^6(?:011|5)/.test(cleaned)) return 'discover';
        return 'unknown';
    }

    // Format card number with spaces
    function formatCardNumber(value) {
        var cleaned = value.replace(/\D/g, '');
        var formatted = '';
        for (var i = 0; i < cleaned.length && i < 19; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += cleaned.charAt(i);
        }
        return formatted;
    }

    // Format expiry date
    function formatExpiryDate(value) {
        var cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        return cleaned;
    }

    // Validate a single field
    function validateField(fieldName, value, extraParams) {
        if (ValidationRules[fieldName]) {
            return ValidationRules[fieldName](value, extraParams);
        }
        return { valid: true, message: '' };
    }

    // Validate entire form
    function validateForm(formId, rules) {
        var form = document.getElementById(formId);
        if (!form) {
            return { valid: false, errors: [{ field: 'form', message: 'Form not found' }] };
        }

        var errors = [];
        var results = {};

        for (var fieldName in rules) {
            var fieldRules = rules[fieldName];
            var field = form.querySelector('[name="' + fieldName + '"]');
            var value = field ? field.value : '';
            var fieldValid = true;
            var fieldMessages = [];

            // Handle array of rules or single rule
            var rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

            for (var i = 0; i < rulesArray.length; i++) {
                var rule = rulesArray[i];
                var ruleName = typeof rule === 'string' ? rule : rule.rule;
                var ruleParams = typeof rule === 'object' ? rule.params : undefined;

                var result = validateField(ruleName, value, ruleParams);
                if (!result.valid) {
                    fieldValid = false;
                    fieldMessages.push(result.message);
                }
            }

            results[fieldName] = {
                valid: fieldValid,
                messages: fieldMessages,
                value: value
            };

            if (!fieldValid) {
                errors.push({
                    field: fieldName,
                    messages: fieldMessages
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            fields: results
        };
    }

    // Show field error
    function showFieldError(field, message) {
        if (!field) return;
        
        // Remove existing error
        hideFieldError(field);

        // Add error class
        field.classList.add('field-error');
        
        // Create error message element
        var errorEl = document.createElement('div');
        errorEl.className = 'field-error-message';
        errorEl.style.color = '#f44336';
        errorEl.style.fontSize = '12px';
        errorEl.style.marginTop = '4px';
        errorEl.textContent = message;
        
        // Insert after field
        if (field.parentNode) {
            field.parentNode.insertBefore(errorEl, field.nextSibling);
        }
    }

    // Hide field error
    function hideFieldError(field) {
        if (!field) return;
        
        field.classList.remove('field-error');
        
        // Remove existing error message
        var parent = field.parentNode;
        if (parent) {
            var errorEl = parent.querySelector('.field-error-message');
            if (errorEl) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }
    }

    // Clear all form errors
    function clearFormErrors(form) {
        if (!form) return;
        
        var errorFields = form.querySelectorAll('.field-error');
        for (var i = 0; i < errorFields.length; i++) {
            hideFieldError(errorFields[i]);
        }
        
        var errorMessages = form.querySelectorAll('.field-error-message');
        for (var j = 0; j < errorMessages.length; j++) {
            if (errorMessages[j].parentNode) {
                errorMessages[j].parentNode.removeChild(errorMessages[j]);
            }
        }
    }

    // Validate and show errors for form
    function validateAndShowErrors(formId, rules) {
        var result = validateForm(formId, rules);
        var form = document.getElementById(formId);
        
        clearFormErrors(form);

        if (!result.valid) {
            for (var i = 0; i < result.errors.length; i++) {
                var error = result.errors[i];
                var field = form.querySelector('[name="' + error.field + '"]');
                if (field) {
                    showFieldError(field, error.messages[0]);
                }
            }
            
            // Focus first error field
            var firstErrorField = form.querySelector('.field-error');
            if (firstErrorField) {
                firstErrorField.focus();
            }
        }

        return result;
    }

    // Export to window
    window.SweetToothValidation = {
        validateField: validateField,
        validateForm: validateForm,
        validateAndShowErrors: validateAndShowErrors,
        showFieldError: showFieldError,
        hideFieldError: hideFieldError,
        clearFormErrors: clearFormErrors,
        detectCardType: detectCardType,
        formatCardNumber: formatCardNumber,
        formatExpiryDate: formatExpiryDate,
        rules: ValidationRules
    };

    console.log('[SweetTooth Validation] Form validation module loaded');
})();
