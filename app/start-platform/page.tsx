/**
 * PLATFORM SIGNUP PAGE - White-Label SaaS Onboarding
 * 
 * Purpose: Allow cities/regions to launch their own GharSe marketplace
 * 
 * Features:
 * - Platform name selection
 * - Subdomain selection
 * - Pricing tier selection
 * - Instant platform creation
 * - Owner registration
 */

'use client';

import { useState } from 'react';
import { 
  Rocket, Building2, Globe, Palette, CreditCard, 
  Check, ChevronRight, ArrowRight, Sparkles,
  Users, ShoppingBag, Store, Zap, Shield, Clock
} from 'lucide-react';
import Link from 'next/link';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  limits: {
    chefs: number | 'Unlimited';
    orders: number | 'Unlimited';
    storage: string;
  };
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: 'forever',
    description: 'Perfect for testing the waters',
    features: [
      'Up to 5 home chefs',
      '100 orders/month',
      'Basic analytics',
      'Email support',
      'GharSe branding',
    ],
    limits: { chefs: 5, orders: 100, storage: '1 GB' },
  },
  {
    id: 'starter',
    name: 'Growth',
    price: 99,
    period: 'month',
    description: 'For growing local marketplaces',
    features: [
      'Up to 25 home chefs',
      '1,000 orders/month',
      'Advanced analytics',
      'Priority support',
      'Custom subdomain',
      'Remove GharSe branding',
    ],
    limits: { chefs: 25, orders: 1000, storage: '5 GB' },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    period: 'month',
    description: 'For established marketplaces',
    features: [
      'Up to 100 home chefs',
      '10,000 orders/month',
      'Full analytics suite',
      '24/7 phone support',
      'Custom domain',
      'White-label branding',
      'API access',
      'Priority chef onboarding',
    ],
    limits: { chefs: 100, orders: 10000, storage: '25 GB' },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // Custom pricing
    period: 'custom',
    description: 'For large-scale operations',
    features: [
      'Unlimited home chefs',
      'Unlimited orders',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees',
      'On-premise option',
      'Custom features',
      'Revenue share model',
    ],
    limits: { chefs: 'Unlimited', orders: 'Unlimited', storage: 'Unlimited' },
  },
];

export default function StartPlatformPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    platformName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    city: '',
    selectedPlan: 'professional',
    primaryColor: '#FF6B35',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handlePlatformNameChange = (name: string) => {
    setFormData({
      ...formData,
      platformName: name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsComplete(true);
      } else {
        alert('Failed to create platform. Please try again.');
      }
    } catch (error) {
      console.error('Error creating platform:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            🎉 Your Platform is Ready!
          </h1>
          <p className="text-gray-400 mb-6">
            <strong className="text-white">{formData.platformName}</strong> has been created successfully.
          </p>
          
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 text-left">
            <h3 className="text-white font-semibold mb-3">Your Platform Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">URL:</span>
                <span className="text-orange-400">{formData.slug}.gharse.app</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white">{PRICING_PLANS.find(p => p.id === formData.selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Owner:</span>
                <span className="text-white">{formData.ownerEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <a
              href={`https://${formData.slug}.gharse.app`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              Visit Your Platform →
            </a>
            <Link
              href="/"
              className="block w-full bg-gray-700 text-white font-semibold py-3 rounded-xl hover:bg-gray-600 transition-all"
            >
              Back to GharSe
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">GharSe</span>
          </Link>
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Launch Your Own Food Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your Own <span className="text-orange-400">GharSe</span> Platform
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Launch a home chef marketplace for your city in minutes. 
            No coding required. Full white-label solution.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-sm text-gray-400">Active Chefs</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p className="text-sm text-gray-400">Orders/Month</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">10+</p>
              <p className="text-sm text-gray-400">Cities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Choose Your Plan</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                className={`relative bg-gray-800/50 rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                  formData.selectedPlan === plan.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price === -1 ? (
                    <span className="text-2xl font-bold text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                
                <ul className="space-y-2 mb-4">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className={`w-full py-2 rounded-lg text-center text-sm font-medium ${
                  formData.selectedPlan === plan.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {formData.selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-orange-400" />
              Create Your Platform
            </h2>
            
            <div className="space-y-6">
              {/* Platform Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Platform Name *
                </label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => handlePlatformNameChange(e.target.value)}
                  placeholder="e.g., Delhi Home Chefs"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Your URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-gray-400">.gharse.app</span>
                </div>
              </div>

              {/* Owner Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Delhi"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Brand Color */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <span className="text-gray-400">{formData.primaryColor}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.platformName || !formData.ownerEmail}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Platform...
                  </>
                ) : (
                  <>
                    Launch My Platform
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-gray-500 text-sm">
                By creating a platform, you agree to our Terms of Service and Platform Agreement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Everything You Need to Succeed</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Chef Onboarding',
                description: 'Self-service registration with FSSAI validation and document verification.',
              },
              {
                icon: ShoppingBag,
                title: 'Order Management',
                description: 'Real-time order tracking, kitchen dashboard, and delivery coordination.',
              },
              {
                icon: CreditCard,
                title: 'Payment Processing',
                description: 'Integrated payments with automatic chef payouts and commission tracking.',
              },
              {
                icon: Zap,
                title: 'Real-Time Tracking',
                description: 'GPS delivery tracking with live ETA updates for customers.',
              },
              {
                icon: Shield,
                title: 'Security & Compliance',
                description: 'Enterprise-grade security with DPDPA compliance built-in.',
              },
              {
                icon: Clock,
                title: '24/7 Support',
                description: 'Dedicated support team to help you grow your marketplace.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-6">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © 2025 GharSe. All rights reserved. | 
          <Link href="/legal/terms-of-service" className="hover:text-white ml-2">Terms</Link> | 
          <Link href="/legal/privacy-policy" className="hover:text-white ml-2">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

