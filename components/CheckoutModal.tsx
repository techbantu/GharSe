/**
 * NEW FILE: Checkout Modal - Order Placement Form
 * 
 * Purpose: Collects customer information, delivery details, and payment method.
 * Validates inputs and submits orders with comprehensive error handling.
 * 
 * Features: Multi-step form, real-time validation, order confirmation, and
 * email/SMS notification setup.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, CheckCircle, Clock, TruckIcon, XCircle, AlertCircle, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import CancelOrderModal from '@/components/admin/CancelOrderModal';
import PendingOrderModification from '@/components/PendingOrderModification';
import { Order, CustomerInfo, Address } from '@/types';
import { restaurantInfo } from '@/data/menuData';
import { retryWithBackoff } from '@/utils/retry';
import { playSuccessSound, playAlertSound } from '@/utils/notification-sound';
import { Result, Ok, Err, ValidationError, RateLimitError, TimeoutError, NetworkError, ServerError, RetriableError, PermanentError, AppError } from '@/utils/result';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, clearCart } = useCart();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'pending' | 'confirmation'>('form');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderCreatedAt, setOrderCreatedAt] = useState<Date | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>('PENDING_CONFIRMATION');
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryInstructions: '',
    specialInstructions: '',
    orderType: 'delivery' as 'delivery' | 'pickup',
    paymentMethod: 'cash-on-delivery' as 'cash-on-delivery' | 'card',
    paymentMethodDetails: '', // Specific gateway: "paytm", "form-b", "google-pay", "phonepe", etc.
    tip: 0, // Tip amount
    scheduledTime: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cleanup timer on unmount or modal close
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);
  
  // Reset timer when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimeRemaining(null);
    }
  }, [isOpen]);
  
  // Handle input changes with character filtering
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;
    
    // Filter input based on field type
    if (name === 'name') {
      // Name: Only letters, spaces, hyphens, apostrophes, and periods (for names like "Dr. John")
      // Allow Unicode letters for international names (Hindi, Arabic, etc.)
      filteredValue = value.replace(/[^a-zA-Z\s\-'\.\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0900-\u097F]/g, '');
    } else if (name === 'phone') {
      // GENIUS FIX: Indian Phone Number with fixed +91 prefix
      // The input field only shows the 10-digit number (without +91)
      // Extract only digits
      const digits = value.replace(/\D/g, '');
      
      // Limit to 10 digits only (India mobile numbers)
      const phoneDigits = digits.substring(0, 10);
      
      // Format as XXXXX XXXXX (input field shows only the number part)
      if (phoneDigits.length > 0) {
        if (phoneDigits.length <= 5) {
          filteredValue = phoneDigits;
        } else {
          filteredValue = `${phoneDigits.substring(0, 5)} ${phoneDigits.substring(5, 10)}`;
        }
      } else {
        filteredValue = '';
      }
      
      // Store full value with +91 prefix in formData
      const fullValue = phoneDigits.length > 0 
        ? (phoneDigits.length <= 5 
          ? `+91 ${phoneDigits}` 
          : `+91 ${phoneDigits.substring(0, 5)} ${phoneDigits.substring(5, 10)}`)
        : '+91 ';
      
      // Update formData with full value (for validation and submission)
      setFormData(prev => ({ ...prev, phone: fullValue }));
      return; // Early return to prevent double update
    } else if (name === 'zipCode') {
      // GENIUS FIX: PIN Code - Only numbers (6 digits for India)
      filteredValue = value.replace(/\D/g, '').substring(0, 6);
    } else if (name === 'city' || name === 'state') {
      // GENIUS FIX: City and State - Remove numbers, only allow letters, spaces, hyphens, apostrophes, periods
      filteredValue = value.replace(/[0-9]/g, '');
      console.log(`✅ Filtered ${name}:`, value, '→', filteredValue);
    }
    
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // GENIUS FIX: Handle phone input keydown - input field only shows digits, +91 is in prefix div
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow all normal editing - the input field only contains the 10-digit number
    // The +91 prefix is in a separate non-editable div, so no need to prevent deletion
  };
  
  // GENIUS FIX: Handle phone input focus to ensure +91 prefix is always present in formData
  const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure formData has +91 prefix (for validation)
    if (!formData.phone.startsWith('+91')) {
      const digits = formData.phone.replace(/\D/g, '').substring(0, 10);
      if (digits.length > 0) {
        const formatted = digits.length <= 5 
          ? `+91 ${digits}` 
          : `+91 ${digits.substring(0, 5)} ${digits.substring(5, 10)}`;
        setFormData(prev => ({ ...prev, phone: formatted }));
      } else {
        setFormData(prev => ({ ...prev, phone: '+91 ' }));
      }
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else {
      // Extract only digits from phone
      const phoneDigits = formData.phone.replace(/\D/g, '');
      
      // Check if it's a valid Indian number (should be exactly 10 digits after +91)
      if (phoneDigits.length < 10) {
        newErrors.phone = 'Phone must be 10 digits';
      } else if (phoneDigits.length > 12) {
        // More than 12 total (91 + 10 digits)
        newErrors.phone = 'Invalid phone number';
      } else {
        // Check if starts with valid Indian mobile prefix (6, 7, 8, 9)
        const mobileNumber = phoneDigits.length === 12 ? phoneDigits.substring(2) : phoneDigits;
        if (mobileNumber.length === 10 && !/^[6789]/.test(mobileNumber)) {
          newErrors.phone = 'Indian mobile numbers start with 6, 7, 8, or 9';
        }
      }
    }
    
    // Validate name: should not contain numbers
    if (formData.name.trim() && /\d/.test(formData.name)) {
      newErrors.name = 'Name cannot contain numbers';
    }
    
    // Payment method validation (always allow COD!)
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    
    if (formData.orderType === 'delivery') {
      if (!formData.street.trim()) newErrors.street = 'Street address is required';
      
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      } else if (/\d/.test(formData.city)) {
        // City cannot contain numbers
        newErrors.city = 'City name cannot contain numbers';
      } else if (!/^[a-zA-Z\s\-'.]+$/.test(formData.city)) {
        // City should only contain letters, spaces, hyphens, apostrophes, and periods
        newErrors.city = 'City name can only contain letters';
      }
      
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      } else if (/\d/.test(formData.state)) {
        // State cannot contain numbers
        newErrors.state = 'State name cannot contain numbers';
      } else if (!/^[a-zA-Z\s\-'.]+$/.test(formData.state)) {
        // State should only contain letters, spaces, hyphens, apostrophes, and periods
        newErrors.state = 'State name can only contain letters';
      }
      
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = 'PIN code is required';
      } else if (!/^\d{6}$/.test(formData.zipCode)) {
        // GENIUS FIX: PIN code must be exactly 6 digits
        newErrors.zipCode = 'PIN code must be 6 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit order with retry logic and proper error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Form submitted, validating...', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed:', errors);
      return;
    }
    
    if (cart.items.length === 0) {
      setErrors({ general: 'Your cart is empty!' });
      return;
    }
    
    console.log('✅ Validation passed, submitting order...');
    setIsSubmitting(true);
    
    try {
      // Create order payload
      const orderPayload = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        items: cart.items,
        pricing: {
          subtotal: cart.subtotal,
          tax: cart.tax,
          deliveryFee: cart.deliveryFee,
          discount: cart.discount || 0,
          tip: formData.tip || 0,
          total: cart.total + (formData.tip || 0),
          promoCode: cart.promoCode,
        },
        orderType: formData.orderType,
        paymentMethod: formData.paymentMethod,
        paymentMethodDetails: formData.paymentMethodDetails || undefined,
        deliveryAddress: formData.orderType === 'delivery' ? {
          street: formData.street,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: 'India',
          deliveryInstructions: formData.deliveryInstructions,
        } : undefined,
        specialInstructions: formData.specialInstructions || undefined,
      };
      
      // API call with retry logic
      const result = await retryWithBackoff(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // CRITICAL: Send auth cookies to link order to customer
              body: JSON.stringify(orderPayload),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (!response.ok) {
              // Classify errors based on status code
              if (response.status === 429) {
                return Err(new RateLimitError(data.error || 'Rate limit exceeded', data.retryAfter));
              }
              
              if (response.status >= 400 && response.status < 500) {
                return Err(new ValidationError(data.error || 'Validation failed', data.field));
              }
              
              if (response.status >= 500) {
                return Err(new RetriableError(data.error || 'Server error'));
              }
              
              return Err(new PermanentError(data.error || 'Request failed'));
            }
            
            if (!data.success) {
              return Err(new ValidationError(data.error || 'Order creation failed'));
            }
            
            return Ok(data.order) as Result<Order, AppError>;
            
          } catch (error) {
            clearTimeout(timeoutId);
            
            if (error instanceof Error && error.name === 'AbortError') {
              return Err(new TimeoutError('Request timed out after 10 seconds', 10000));
            }
            
            if (error instanceof TypeError) {
              return Err(new NetworkError('Network error. Check your internet connection.', error));
            }
            
            return Err(new ServerError('Unexpected error occurred', 500));
          }
        },
        {
          maxAttempts: 3,
          baseDelay: 500, // 500ms, 1s, 2s
          onRetry: (attempt) => {
            // Show retry indicator to user (could enhance with toast notification)
            console.log(`Retrying order submission (attempt ${attempt})...`);
          },
        }
      );
      
      if (result.isErr()) {
        // Handle errors gracefully
        const error = result.error;
        
        if (error instanceof ValidationError) {
          setErrors({
            [error.field || 'general']: error.message,
          });
          setIsSubmitting(false);
          return;
        }
        
        if (error instanceof RateLimitError) {
          setErrors({
            general: `Too many requests. Please wait ${error.retryAfter} seconds and try again.`,
          });
          setIsSubmitting(false);
          return;
        }
        
        // Network or server errors - show user-friendly message
        setErrors({
          general: error.message || 'Failed to create order. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Success - show confirmation
      const order = result.value;
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      const createdAt = new Date();
      setOrderCreatedAt(createdAt);
      
      // Store full order object
      setCurrentOrder(order);
      setOrderTotal(order.pricing.total);
      setOrderStatus('PENDING_CONFIRMATION');
      
      // DON'T clear cart yet - allow modifications during grace period
      // clearCart(); // Move this to after finalization
      
      // Go to pending modification step
      setStep('pending');
      
      // Play success sound for order confirmation
      try {
        playSuccessSound();
      } catch (error) {
        console.warn('Failed to play success sound:', error);
      }
      
      // Show success toast notification (green)
      toast.success('Order Confirmed!', `Order #${order.orderNumber} has been placed successfully.`);
      
    } catch (error) {
      console.error('Unexpected error in handleSubmit:', error);
      setErrors({
        general: 'An unexpected error occurred. Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset and close
  const handleClose = () => {
    // Clean up timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeRemaining(null);
    
    if (step === 'confirmation') {
      clearCart();
      setStep('form');
      setOrderNumber('');
      setOrderId('');
      setFormData({
        name: '',
        email: '',
        phone: '',
        street: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        deliveryInstructions: '',
        specialInstructions: '',
        orderType: 'delivery',
        paymentMethod: 'cash-on-delivery',
        scheduledTime: '',
      });
    }
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          [data-checkout-modal] {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          [data-checkout-form] {
            padding: 20px 16px !important;
            gap: 24px !important;
          }
          [data-checkout-header] {
            padding: 20px 16px !important;
          }
          [data-checkout-header] h2 {
            font-size: 1.5rem !important;
          }
          [data-address-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-contact-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-order-type] {
            gap: 8px !important;
            padding: 4px !important;
          }
          [data-order-type] button {
            padding: 16px 12px !important;
            font-size: 0.875rem !important;
          }
          [data-order-type] svg {
            width: 20px !important;
            height: 20px !important;
          }
          .checkout-container {
            padding: 0 !important;
          }
        }
        @media (min-width: 769px) {
          [data-contact-grid] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-address-grid] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center checkout-container" style={{ padding: '16px' }}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
          style={{ WebkitBackdropFilter: 'blur(8px)' }}
        />
        
        {/* Modal - Premium Card Design */}
        <div 
          data-checkout-modal
          style={{
            position: 'relative',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15)',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
        {step === 'form' ? (
          <>
            {/* Header - Premium Design */}
            <div 
              data-checkout-header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 32px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}
            >
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
                margin: 0
              }}>
                Checkout
              </h2>
              <button
                onClick={handleClose}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Form */}
            <form 
              onSubmit={handleSubmit} 
              style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 100px)',
                WebkitOverflowScrolling: 'touch'
              }}
              className="custom-scrollbar"
            >
              <div 
                data-checkout-form
                style={{ 
                  padding: '32px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '32px' 
                }}
              >
                {/* Order Type - Premium Segmented Control */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Order Type
                  </label>
                  <div 
                    data-order-type
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      background: '#F9FAFB',
                      padding: '6px',
                      borderRadius: '14px',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, orderType: 'delivery' }))}
                      style={{
                        padding: '20px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: formData.orderType === 'delivery'
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : 'transparent',
                        color: formData.orderType === 'delivery' ? 'white' : '#6B7280',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: formData.orderType === 'delivery'
                          ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.orderType !== 'delivery') {
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.orderType !== 'delivery') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <TruckIcon size={24} strokeWidth={2.5} />
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Delivery
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, orderType: 'pickup' }))}
                      style={{
                        padding: '20px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: formData.orderType === 'pickup'
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : 'transparent',
                        color: formData.orderType === 'pickup' ? 'white' : '#6B7280',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: formData.orderType === 'pickup'
                          ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.orderType !== 'pickup') {
                          e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.orderType !== 'pickup') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Clock size={24} strokeWidth={2.5} />
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Pickup
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Customer Information - Premium Design */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <User size={20} strokeWidth={2.5} style={{ color: '#f97316' }} />
                    Contact Information
                  </h3>
                  
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '8px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      pattern="[a-zA-Z\s\-'\.\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0900-\u097F]+"
                      inputMode="text"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `2px solid ${errors.name ? '#EF4444' : '#E5E7EB'}`,
                        fontSize: '0.9375rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                        color: '#1F2937',
                        background: 'white',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = errors.name ? '#EF4444' : '#f97316';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = errors.name ? '#EF4444' : '#E5E7EB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      onKeyPress={(e) => {
                        // Prevent numbers from being typed
                        if (/\d/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Ravi Kumar"
                    />
                    {errors.name && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.name}</p>}
                    {errors.general && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.general}</p>}
                    {errors.cart && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.cart}</p>}
                  </div>
                  
                  <div 
                    data-contact-grid
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(1, 1fr)',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: `2px solid ${errors.email ? '#EF4444' : '#E5E7EB'}`,
                          fontSize: '0.9375rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          color: '#1F2937',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = errors.email ? '#EF4444' : '#f97316';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = errors.email ? '#EF4444' : '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="ravi.kumar@example.com"
                      />
                      {errors.email && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Phone *
                      </label>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        {/* India Flag +91 Prefix (Fixed, Non-Editable) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '14px 12px',
                          background: '#F9FAFB',
                          borderTop: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderBottom: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderLeft: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderRight: 'none',
                          borderRadius: '12px 0 0 12px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: '#1F2937',
                          userSelect: 'none',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        {/* Phone Number Input (Editable) */}
                      <input
                        type="tel"
                        name="phone"
                          value={formData.phone.startsWith('+91') ? formData.phone.substring(4).trim() : formData.phone.replace(/[^\d\s]/g, '')}
                        onChange={handleChange}
                          onKeyDown={handlePhoneKeyDown}
                          onFocus={handlePhoneFocus}
                          maxLength={13}
                        inputMode="tel"
                        autoComplete="tel"
                        style={{
                            flex: 1,
                          padding: '14px 16px',
                            borderRadius: '0 12px 12px 0',
                          borderTop: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderBottom: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                          borderRight: `2px solid ${errors.phone ? '#EF4444' : '#E5E7EB'}`,
                            borderLeft: 'none',
                          fontSize: '0.9375rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, monospace',
                          color: '#1F2937',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none',
                          letterSpacing: '0.5px'
                        }}
                        onFocus={(e) => {
                            handlePhoneFocus(e);
                          e.currentTarget.style.borderColor = errors.phone ? '#EF4444' : '#f97316';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                            // Update border of prefix div
                            const prefixDiv = e.currentTarget.previousElementSibling as HTMLElement;
                            if (prefixDiv) {
                              prefixDiv.style.borderColor = errors.phone ? '#EF4444' : '#f97316';
                            }
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = errors.phone ? '#EF4444' : '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                            // Update border of prefix div
                            const prefixDiv = e.currentTarget.previousElementSibling as HTMLElement;
                            if (prefixDiv) {
                              prefixDiv.style.borderColor = errors.phone ? '#EF4444' : '#E5E7EB';
                            }
                            // Ensure +91 prefix is always present in formData
                            if (!formData.phone.startsWith('+91')) {
                              const digits = formData.phone.replace(/\D/g, '').substring(0, 10);
                              if (digits.length > 0) {
                                const formatted = digits.length <= 5 
                                  ? `+91 ${digits}` 
                                  : `+91 ${digits.substring(0, 5)} ${digits.substring(5, 10)}`;
                                setFormData(prev => ({ ...prev, phone: formatted }));
                              } else {
                                setFormData(prev => ({ ...prev, phone: '+91 ' }));
                              }
                            }
                          }}
                          placeholder="90104 60964"
                      />
                      </div>
                      {errors.phone && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.phone}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Delivery Address - Premium Design */}
                {formData.orderType === 'delivery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <MapPin size={20} strokeWidth={2.5} style={{ color: '#f97316' }} />
                      Delivery Address
                    </h3>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: `2px solid ${errors.street ? '#EF4444' : '#E5E7EB'}`,
                          fontSize: '0.9375rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          color: '#1F2937',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = errors.street ? '#EF4444' : '#f97316';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = errors.street ? '#EF4444' : '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="Flat No: 17, Padhmalayanagar Colony"
                      />
                      {errors.street && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.street}</p>}
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Apartment, Suite, etc.
                      </label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '2px solid #E5E7EB',
                          fontSize: '0.9375rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          color: '#1F2937',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f97316';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        placeholder="Road No: 03, Near Park"
                      />
                    </div>
                    
                    <div 
                      data-address-grid
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '8px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                        }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: `2px solid ${errors.city ? '#EF4444' : '#E5E7EB'}`,
                            fontSize: '0.9375rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                            color: '#1F2937',
                            background: 'white',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = errors.city ? '#EF4444' : '#f97316';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = errors.city ? '#EF4444' : '#E5E7EB';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onKeyPress={(e) => {
                            // PREVENT numbers from being typed in City field
                            if (/\d/.test(e.key)) {
                              e.preventDefault();
                              console.log('❌ Numbers are not allowed in City name');
                            }
                          }}
                          placeholder="Hayathnagar"
                        />
                        {errors.city && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.city}</p>}
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '8px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                        }}>
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: `2px solid ${errors.state ? '#EF4444' : '#E5E7EB'}`,
                            fontSize: '0.9375rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                            color: '#1F2937',
                            background: 'white',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = errors.state ? '#EF4444' : '#f97316';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = errors.state ? '#EF4444' : '#E5E7EB';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onKeyPress={(e) => {
                            // PREVENT numbers from being typed in State field
                            if (/\d/.test(e.key)) {
                              e.preventDefault();
                              console.log('❌ Numbers are not allowed in State name');
                            }
                          }}
                          placeholder="Telangana"
                        />
                        {errors.state && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.state}</p>}
                      </div>
                      
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '8px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                        }}>
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: `2px solid ${errors.zipCode ? '#EF4444' : '#E5E7EB'}`,
                            fontSize: '0.9375rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, monospace',
                            color: '#1F2937',
                            background: 'white',
                            transition: 'all 0.2s',
                            outline: 'none',
                            letterSpacing: '0.5px'
                          }}
                          onKeyDown={(e) => {
                            // GENIUS FIX: Only allow numbers, backspace, delete, arrow keys, tab
                            const allowedKeys = [
                              'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                              'Tab', 'Home', 'End'
                            ];
                            const isNumber = /^[0-9]$/.test(e.key);
                            const isAllowedKey = allowedKeys.includes(e.key);
                            const isCtrlA = e.ctrlKey && e.key === 'a';
                            const isCtrlC = e.ctrlKey && e.key === 'c';
                            const isCtrlV = e.ctrlKey && e.key === 'v';
                            const isCtrlX = e.ctrlKey && e.key === 'x';
                            
                            if (!isNumber && !isAllowedKey && !isCtrlA && !isCtrlC && !isCtrlV && !isCtrlX) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            // GENIUS FIX: Only allow pasting numbers
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const numbersOnly = pastedText.replace(/\D/g, '').substring(0, 6);
                            if (numbersOnly) {
                              setFormData(prev => ({ ...prev, zipCode: numbersOnly }));
                            }
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = errors.zipCode ? '#EF4444' : '#f97316';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = errors.zipCode ? '#EF4444' : '#E5E7EB';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          placeholder="501505"
                        />
                        {errors.zipCode && <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '6px', marginBottom: 0 }}>{errors.zipCode}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Delivery Instructions
                      </label>
                      <textarea
                        name="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '2px solid #E5E7EB',
                          fontSize: '0.9375rem',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          color: '#1F2937',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none',
                          resize: 'none',
                          minHeight: '100px',
                          lineHeight: '1.5'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#f97316';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        rows={3}
                        placeholder="Ring doorbell, leave at door, etc."
                      />
                    </div>
                  </div>
                )}
                
                {/* Payment Method - Premium Design */}
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <CreditCard size={20} strokeWidth={2.5} style={{ color: '#f97316' }} />
                    Payment Method
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        border: `2px solid ${formData.paymentMethod === 'cash-on-delivery' ? '#f97316' : '#E5E7EB'}`,
                        background: formData.paymentMethod === 'cash-on-delivery' ? 'rgba(249, 115, 22, 0.05)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.paymentMethod !== 'cash-on-delivery') {
                          e.currentTarget.style.borderColor = '#D1D5DB';
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.paymentMethod !== 'cash-on-delivery') {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash-on-delivery"
                        checked={formData.paymentMethod === 'cash-on-delivery'}
                        onChange={handleChange}
                        style={{
                          width: '20px',
                          height: '20px',
                          marginRight: '12px',
                          cursor: 'pointer',
                          accentColor: '#f97316'
                        }}
                      />
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Cash on Delivery
                      </span>
                    </label>
                    <label 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        border: `2px solid ${formData.paymentMethod === 'card' ? '#f97316' : '#E5E7EB'}`,
                        background: formData.paymentMethod === 'card' ? 'rgba(249, 115, 22, 0.05)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (formData.paymentMethod !== 'card') {
                          e.currentTarget.style.borderColor = '#D1D5DB';
                          e.currentTarget.style.background = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.paymentMethod !== 'card') {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                        style={{
                          width: '20px',
                          height: '20px',
                          marginRight: '12px',
                          cursor: 'pointer',
                          accentColor: '#f97316'
                        }}
                      />
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Credit/Debit Card
                      </span>
                    </label>
                  </div>
                  
                  {/* Payment Method Details - Show when card is selected */}
                  {formData.paymentMethod === 'card' && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        Payment Method Details (Optional)
                      </label>
                      <select
                        name="paymentMethodDetails"
                        value={formData.paymentMethodDetails}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.9375rem',
                          color: '#1F2937',
                          backgroundColor: 'white',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select payment method...</option>
                        <option value="paytm">Paytm</option>
                        <option value="form-b">Form B</option>
                        <option value="google-pay">Google Pay</option>
                        <option value="phonepe">PhonePe</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="stripe">Stripe</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="netbanking">Net Banking</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Tip Input */}
                  <div style={{ marginTop: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      marginBottom: '8px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Heart size={16} style={{ color: '#f97316' }} />
                        Tip (Optional)
                      </span>
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      {[50, 100, 200, 500].map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, tip: amount }));
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            border: `2px solid ${formData.tip === amount ? '#f97316' : '#E5E7EB'}`,
                            background: formData.tip === amount ? 'rgba(249, 115, 22, 0.1)' : 'white',
                            color: formData.tip === amount ? '#f97316' : '#4B5563',
                            fontWeight: formData.tip === amount ? 700 : 500,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                          }}
                        >
                          ₹{amount}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      name="tip"
                      value={formData.tip || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, tip: Math.max(0, value) }));
                      }}
                      placeholder="Enter custom tip amount"
                      min="0"
                      step="10"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.9375rem',
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                </div>
                
                {/* Order Summary - Premium Design */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: '20px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Order Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9375rem',
                      color: '#4B5563',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ fontWeight: 500 }}>Subtotal</span>
                      <span style={{
                        fontWeight: 700,
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        ₹{Math.round(cart.subtotal)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9375rem',
                      color: '#4B5563',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ fontWeight: 500 }}>Delivery Fee</span>
                      <span style={{
                        fontWeight: 700,
                        color: cart.deliveryFee === 0 ? '#10B981' : '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        {cart.deliveryFee === 0 ? 'FREE' : `₹${Math.round(cart.deliveryFee)}`}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9375rem',
                      color: '#4B5563',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ fontWeight: 500 }}>Tax (GST 5%)</span>
                      <span style={{
                        fontWeight: 700,
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                      }}>
                        ₹{Math.round(cart.tax)}
                      </span>
                    </div>
                    {formData.tip > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9375rem',
                        color: '#4B5563',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Heart size={14} style={{ color: '#10B981' }} />
                          Tip
                        </span>
                        <span style={{
                          fontWeight: 700,
                          color: '#10B981',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                        }}>
                          ₹{formData.tip}
                        </span>
                      </div>
                    )}
                    <div style={{
                      paddingTop: '16px',
                      borderTop: '2px solid #E5E7EB',
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#1F2937',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.01em'
                      }}>
                        Total
                      </span>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#f97316',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.02em'
                      }}>
                        ₹{Math.round(cart.total + (formData.tip || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Error Display - Show validation errors */}
              {Object.keys(errors).length > 0 && errors.general && (
                <div style={{
                  padding: '16px 32px',
                  background: '#FEE2E2',
                  borderTop: '1px solid #FECACA',
                  borderBottom: '1px solid #FECACA'
                }}>
                  <p style={{
                    color: '#991B1B',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    margin: 0
                  }}>
                    ⚠️ {errors.general}
                  </p>
                </div>
              )}

              {/* Submit Button - Premium Design */}
              <div style={{
                padding: '24px 32px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                background: 'linear-gradient(to bottom, #FFFFFF, #F9FAFB)',
                flexShrink: 0
              }}>
                <button
                  type="submit"
                  disabled={isSubmitting || cart.items.length === 0}
                  style={{
                    width: '100%',
                    background: isSubmitting 
                      ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                      : 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
                    color: 'white',
                    padding: '18px 32px',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '9999px',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Processing...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </form>
          </>
        ) : step === 'pending' && currentOrder ? (
          /* Pending Modification Screen - Grace Period */
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 100px)',
            WebkitOverflowScrolling: 'touch'
          }}>
            {(() => {
              try {
                console.log('[CheckoutModal] Rendering PendingOrderModification with order:', {
                  id: currentOrder.id,
                  orderNumber: currentOrder.orderNumber,
                  itemsCount: currentOrder.items?.length,
                  gracePeriodExpiresAt: currentOrder.gracePeriodExpiresAt,
                });
                
                if (!currentOrder.items || currentOrder.items.length === 0) {
                  return (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <p style={{ color: '#EF4444', marginBottom: '16px' }}>Error: Order has no items</p>
                      <button onClick={() => setStep('confirmation')} style={{
                        padding: '12px 24px',
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}>
                        Continue
                      </button>
                    </div>
                  );
                }
                
                return (
                  <PendingOrderModification
                    order={currentOrder}
                    onOrderUpdated={(updatedOrder) => {
                      setCurrentOrder(updatedOrder);
                      setOrderTotal(updatedOrder.pricing.total);
                    }}
                    onFinalized={() => {
                      // Order finalized, move to confirmation
                      clearCart();
                      setStep('confirmation');
                    }}
                    onBrowseMenu={() => {
                      // Close modal to browse menu (cart is still available)
                      onClose();
                    }}
                  />
                );
              } catch (error) {
                console.error('[CheckoutModal] Error rendering PendingOrderModification:', error);
                return (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ color: '#EF4444', marginBottom: '16px' }}>
                      Error loading order modification screen
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
                      {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                    <button onClick={() => setStep('confirmation')} style={{
                      padding: '12px 24px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}>
                      Skip to Confirmation
                    </button>
                  </div>
                );
              }
            })()}
          </div>
        ) : (
          /* Confirmation Screen - Premium Design (After Finalization) */
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 100px)',
            WebkitOverflowScrolling: 'touch'
          }}
          className="custom-scrollbar">
          <div style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            {/* Success Icon */}
            <div style={{
              width: '96px',
              height: '96px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              marginBottom: '8px'
            }}>
              <CheckCircle size={48} style={{ color: 'white' }} strokeWidth={2.5} />
            </div>
            
            {/* Success Message */}
            <div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#1F2937',
                marginBottom: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em'
              }}>
                Order Confirmed!
              </h2>
              <p style={{
                fontSize: '1.125rem',
                color: '#6B7280',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                marginBottom: '8px'
              }}>
                Thank you for your order, <span style={{ fontWeight: 700, color: '#1F2937' }}>{formData.name}</span>!
              </p>
            </div>
            
            {/* Order ID Card - Premium Design */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
              borderRadius: '16px',
              border: '2px solid #FED7AA',
              boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15)',
              marginBottom: '8px'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400E',
                fontWeight: 600,
                marginBottom: '12px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Order Details
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '10px',
                  border: '1px solid #FED7AA'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    fontWeight: 600,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    Order Number:
                  </span>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: '#f97316',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    {orderNumber}
                  </span>
                </div>
                {orderId && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #FED7AA'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6B7280',
                      fontWeight: 600,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                    }}>
                      Order ID:
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#374151',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      textAlign: 'right'
                    }}>
                      {orderId}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notification Info - Confirmation Messages */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              background: 'linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)',
              borderRadius: '16px',
              border: '2px solid #93C5FD',
              marginBottom: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#3B82F6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Mail size={18} color="white" />
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#1E3A8A',
                    fontWeight: 700,
                    marginBottom: '4px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    Email Confirmation Sent!
                  </p>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: '#1E40AF',
                    lineHeight: '1.5',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, monospace',
                    wordBreak: 'break-all'
                  }}>
                    {formData.email}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#10B981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={18} color="white" />
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#1E3A8A',
                    fontWeight: 700,
                    marginBottom: '4px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                  }}>
                    SMS Confirmation Sent!
                  </p>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: '#1E40AF',
                    lineHeight: '1.5',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, monospace'
                  }}>
                    {formData.phone}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Estimated Time */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '20px',
              background: '#F0FDF4',
              borderRadius: '12px',
              border: '1px solid #86EFAC',
              marginBottom: '8px'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#065F46',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
              }}>
                Estimated Ready Time:
              </p>
              <p style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#16A34A',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em'
              }}>
                30-40 minutes
              </p>
            </div>
            
            {/* Legal Notice - FSSAI Operator */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              marginBottom: '8px'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
              }}>
                <strong style={{ color: '#374151' }}>Food prepared by:</strong> Bantu'S kitchen (FSSAI: 23625028002731)
                <br />
                <span style={{ color: '#9CA3AF', fontSize: '0.6875rem' }}>
                  Plot no 17, Road no 3, Padmalaya Nagar, Hayatnagar, Rangareddy, Telangana - 501505
                </span>
              </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              gap: '12px',
              flexDirection: 'column'
            }}>
              {/* Cancel Order Section - Only show if order can be cancelled */}
              {orderId && orderCreatedAt && (() => {
                const CANCELLATION_WINDOW_MS = 3 * 60 * 1000; // 3 minutes
                const canCancel = (orderStatus === 'PENDING' || orderStatus === 'CONFIRMED') && 
                                  timeRemaining !== null && timeRemaining > 0;
                
                // Format time remaining as MM:SS
                const formatTime = (ms: number): string => {
                  const totalSeconds = Math.floor(ms / 1000);
                  const minutes = Math.floor(totalSeconds / 60);
                  const seconds = totalSeconds % 60;
                  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                };
                
                if (!canCancel && timeRemaining !== null && timeRemaining <= 0) {
                  return (
                    <div style={{
                      width: '100%',
                      padding: '16px',
                      background: '#F3F4F6',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#6B7280',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}>
                        <AlertCircle size={16} />
                        <span>Cancellation window has expired</span>
                      </div>
                    </div>
                  );
                }
                
                return canCancel ? (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Timer Display */}
                    <div style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      borderRadius: '12px',
                      border: '2px solid #F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <Clock size={20} style={{ color: '#D97706' }} />
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#92400E',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Time to Cancel
                        </span>
                        <span style={{
                          fontSize: '1.75rem',
                          fontWeight: 800,
                          color: '#92400E',
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em'
                        }}>
                          {timeRemaining !== null ? formatTime(timeRemaining) : '5:00'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Cancel Button */}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      width: '100%',
                      padding: '14px 32px',
                      background: '#DC2626',
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                      e.currentTarget.style.backgroundColor = '#B91C1C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                      e.currentTarget.style.backgroundColor = '#DC2626';
                    }}
                  >
                    <XCircle size={18} />
                    Cancel Order
                  </button>
                  </div>
                ) : null;
              })()}
              
              {/* Done Button */}
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                }}
              >
                Done
              </button>
            </div>
          </div>
          </div>
        )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {orderId && showCancelModal && (
        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          order={{
            id: orderId,
            orderNumber: orderNumber,
            total: orderTotal,
            status: orderStatus,
            paymentStatus: 'pending',
            customerName: formData.name || 'Customer',
          }}
          cancelledBy="customer"
          onSuccess={() => {
            // Clean up timer
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimeRemaining(null);
            
            // Play alert sound for cancellation (red alert)
            try {
              playAlertSound();
            } catch (error) {
              console.warn('Failed to play alert sound:', error);
            }
            
            // Show error toast notification (red) for cancellation
            toast.error('Order Cancelled', 'Your order has been cancelled successfully. Refund will be processed within 5-7 business days if payment was made.');
            
            // Close modal and reset
            setShowCancelModal(false);
            handleClose();
            
            // Redirect to profile to see updated orders
            router.push('/profile');
          }}
        />
      )}
    </>
  );
};

export default CheckoutModal;

