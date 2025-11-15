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
  icon: React.ComponentType<{ size: number; className?: string }>;
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
        
        {/* Contact Methods Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div
                key={index}
                className="card text-center group hover:shadow-xl animate-scale-in p-4 sm:p-6"
                style={{ animationDelay: `${index * 100}ms`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${method.bgColor} rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                  {method.isWhatsApp ? (
                    <svg 
                      viewBox="0 0 24 24" 
                      width="32" 
                      height="32" 
                      className="sm:w-10 sm:h-10"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: 'block', flexShrink: 0, opacity: 1 }}
                    >
                      <path 
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" 
                        fill="#25D366"
                        style={{ opacity: 1 }}
                      />
                    </svg>
                  ) : (
                  <Icon size={24} className={`${method.color} sm:w-8 sm:h-8`} style={{ width: '24px', height: '24px', display: 'block' }} />
                  )}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ width: '100%', textAlign: 'center' }}>
                  {method.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-tight sm:leading-normal" style={{ width: '100%', textAlign: 'center' }}>
                  {method.description}
                </p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4" style={{ width: '100%', textAlign: 'center' }}>
                  {method.value}
                </p>
                <a
                  href={method.action}
                  className="btn-secondary inline-block text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
                  target={method.icon === MessageCircle ? '_blank' : undefined}
                  rel={method.icon === MessageCircle ? 'noopener noreferrer' : undefined}
                >
                  {method.actionText}
                </a>
              </div>
            );
          })}
        </div>
        
        {/* Location Info - Premium Centered Card */}
        <div style={{
          maxWidth: '768px',
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '32px',
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px'
          }}>
            {/* Icon Container - Premium Design */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <MapPin size={28} style={{ color: 'white' }} strokeWidth={2.5} />
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#1d1d1f',
                marginBottom: '20px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.03em',
                lineHeight: '1.15'
              }}>
                Our Location
              </h3>
              <p style={{
                fontSize: '1.125rem',
                color: '#374151',
                marginBottom: '16px',
                lineHeight: '1.75',
                letterSpacing: '-0.011em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
                fontWeight: 400
              }}>
                {restaurantInfo.address.street}<br />
                {restaurantInfo.address.city}, {restaurantInfo.address.state} {restaurantInfo.address.zipCode}
              </p>
              <p style={{
                fontSize: '1rem',
                color: '#4B5563',
                lineHeight: '1.75',
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

