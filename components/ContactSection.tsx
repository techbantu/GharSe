/**
 * NEW FILE: Contact Section - Multiple Contact Methods
 * 
 * Purpose: Provides various ways for customers to reach the restaurant,
 * including phone, email, and WhatsApp. Emphasizes accessibility.
 * 
 * Design: Visual cards for each contact method with clear CTAs.
 */

'use client';

import React from 'react';
import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react';
import { restaurantInfo } from '@/data/menuData';

interface ContactMethod {
  icon: React.ComponentType<{ size: number; className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  value: string;
  action: string;
  actionText: string;
  color: string;
  bgColor: string;
  isWhatsApp?: boolean;
}

const ContactSection: React.FC = () => {
  const contactMethods: ContactMethod[] = [
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with us for immediate assistance',
      value: restaurantInfo.contact.phone,
      action: `tel:${restaurantInfo.contact.phone}`,
      actionText: 'Call Now',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us a message and we\'ll respond promptly',
      value: restaurantInfo.contact.email,
      action: `mailto:${restaurantInfo.contact.email}`,
      actionText: 'Send Email',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Chat with us on WhatsApp for quick responses',
      value: restaurantInfo.contact.whatsapp || restaurantInfo.contact.phone,
      action: `https://wa.me/${(restaurantInfo.contact.whatsapp || restaurantInfo.contact.phone).replace(/\D/g, '')}`,
      actionText: 'Chat on WhatsApp',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isWhatsApp: true,
    },
  ];
  
  return (
    <section id="contact" className="section bg-white py-16 px-4">
      <div className="container-custom mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6" style={{
            letterSpacing: '-0.04em',
            lineHeight: '1.1',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
            color: '#1d1d1f'
          }}>
            Get in <span className="text-gradient-orange" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite' }}>Touch</span>
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto" style={{
            lineHeight: '1.75',
            letterSpacing: '-0.011em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
            fontWeight: 400,
            color: '#4B5563'
          }}>
            Have questions or special requests? We're here to help! Reach out to us through any of these channels.
          </p>
        </div>
        
        {/* Contact Methods Grid - Premium Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            // Premium gradient backgrounds
            const iconGradients: Record<string, string> = {
              'text-blue-500': 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              'text-red-500': 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              'text-green-600': 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            };
            const iconGradient = iconGradients[method.color] || iconGradients['text-blue-500'];
            
            return (
              <div
                key={index}
                className="group animate-scale-in"
                style={{ 
                  animationDelay: `${index * 80}ms`,
                  background: 'white',
                  borderRadius: '1.5rem',
                  padding: '1.75rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                }}
              >
                {/* Premium Icon Container */}
                <div 
                  style={{ 
                    width: '4rem',
                    height: '4rem',
                    background: iconGradient,
                    borderRadius: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                  className="group-hover:scale-110"
                >
                  {method.isWhatsApp ? (
                    <svg 
                      viewBox="0 0 24 24" 
                      width="28" 
                      height="28" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: 'block', flexShrink: 0 }}
                    >
                      <path 
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                        fill="#25D366"
                      />
                    </svg>
                  ) : (
                    <Icon size={28} className={method.color} strokeWidth={2} />
                  )}
                </div>
                
                {/* Title */}
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#1d1d1f',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.3'
                }}>
                  {method.title}
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '0.8125rem',
                  color: '#6B7280',
                  lineHeight: '1.5',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em',
                  fontWeight: 400
                }}>
                  {method.description}
                </p>
                
                {/* Value */}
                <p style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#1d1d1f',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.01em'
                }}>
                  {method.value}
                </p>
                
                {/* Premium CTA Button */}
                <a
                  href={method.action}
                  target={method.icon === MessageCircle ? '_blank' : undefined}
                  rel={method.icon === MessageCircle ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#f97316',
                    background: 'transparent',
                    border: '2px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {method.actionText}
                </a>
              </div>
            );
          })}
        </div>
        
        {/* Location Info - Premium Centered Card */}
        <div 
          className="group"
          style={{
            maxWidth: '48rem',
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: '2.5rem',
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.5rem'
          }}>
            {/* Icon Container - Premium Design */}
            <div 
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="group-hover:scale-105"
            >
              <MapPin size={28} style={{ color: 'white' }} strokeWidth={2.5} />
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#1d1d1f',
                marginBottom: '1rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.03em',
                lineHeight: '1.2'
              }}>
                Our Location
              </h3>
              <p style={{
                fontSize: '1.0625rem',
                color: '#374151',
                marginBottom: '1rem',
                lineHeight: '1.7',
                letterSpacing: '-0.011em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                fontWeight: 400
              }}>
                {restaurantInfo.address.street}<br />
                {restaurantInfo.address.city}, {restaurantInfo.address.state} {restaurantInfo.address.zipCode}
              </p>
              <p style={{
                fontSize: '0.9375rem',
                color: '#4B5563',
                lineHeight: '1.7',
                letterSpacing: '-0.011em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                fontWeight: 400
              }}>
                We deliver within a <span style={{ fontWeight: 700, color: '#f97316' }}>{restaurantInfo.settings.deliveryRadius} km</span> radius.{' '}
                Free delivery on orders over <span style={{ fontWeight: 700, color: '#f97316' }}>₹{restaurantInfo.settings.freeDeliveryOver}</span>!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

