/**
 * SMART KITCHEN INTELLIGENCE - Dynamic Pricing Explainer Modal
 * 
 * Purpose: Educate customers about dynamic pricing and build trust
 * Features:
 * - Explains why prices change
 * - Shows benefits to customers
 * - Transparency about algorithm
 * - FAQ section
 * 
 * Psychology: Transparency builds trust. Customers accept dynamic pricing
 * when they understand they're getting fair value.
 */

'use client';

import { useState } from 'react';
import { X, TrendingDown, Clock, Leaf, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface DynamicPricingExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DynamicPricingExplainer({ isOpen, onClose }: DynamicPricingExplainerProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Smart Pricing Explained</h2>
              <p className="text-orange-100 text-sm">
                How we save you money while reducing food waste
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Why We Do This */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Why Do Prices Change?
            </h3>
            <p className="text-gray-700 mb-4">
              Our prices adjust in real-time based on three factors. This helps us:
            </p>

            <div className="space-y-4">
              <FeatureCard
                icon={<Clock className="w-6 h-6 text-blue-600" />}
                title="Serve You Faster"
                description="Lower prices when our kitchen has capacity = faster preparation times for you"
                color="blue"
              />

              <FeatureCard
                icon={<Leaf className="w-6 h-6 text-green-600" />}
                title="Reduce Food Waste"
                description="Discounts on items with ingredients expiring soon = maximum freshness + savings"
                color="green"
              />

              <FeatureCard
                icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
                title="Save You Money"
                description="Order during slow hours and get up to 30% off without compromising quality"
                color="orange"
              />
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              How It Works
            </h3>

            <div className="space-y-4">
              <Step
                number={1}
                title="Kitchen Capacity"
                description="When our kitchen is less busy, we offer discounts to fill capacity. When it's peak time, prices may increase slightly."
                percentage="40% weight"
              />

              <Step
                number={2}
                title="Ingredient Freshness"
                description="Items with ingredients needing to be used today get discounted. You get maximum freshness, we reduce waste."
                percentage="35% weight"
              />

              <Step
                number={3}
                title="Demand Patterns"
                description="Our AI predicts busy times and adjusts prices to manage demand. Order ahead of rush hours to save."
                percentage="25% weight"
              />
            </div>
          </section>

          {/* Benefits to You */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              What You Get
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BenefitCard
                title="Save Money"
                description="Average savings of 15-20% when ordering during optimal times"
              />

              <BenefitCard
                title="Faster Service"
                description="Order when kitchen has capacity = your food ready faster"
              />

              <BenefitCard
                title="Fresher Food"
                description="Discounted items are made with ingredients at peak freshness"
              />

              <BenefitCard
                title="Help Environment"
                description="Reducing food waste helps the planet"
              />
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Common Questions
            </h3>

            <div className="space-y-3">
              <FaqItem
                question="Will quality be different if I get a discount?"
                answer="Absolutely not! Discounted items are made with the same high-quality ingredients and cooking process. The only difference is timing - we're discounting to use fresh ingredients before they expire or to fill kitchen capacity during slower hours."
                isExpanded={expandedFaq === 0}
                onToggle={() => setExpandedFaq(expandedFaq === 0 ? null : 0)}
              />

              <FaqItem
                question="How often do prices change?"
                answer="Prices update every 15 minutes based on real-time conditions. You'll see the new price reflected immediately when browsing the menu."
                isExpanded={expandedFaq === 1}
                onToggle={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
              />

              <FaqItem
                question="What if price changes after I add to cart?"
                answer="The price is locked when you add an item to your cart. You'll pay the price you saw, even if it changes before checkout."
                isExpanded={expandedFaq === 2}
                onToggle={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
              />

              <FaqItem
                question="How much can prices change?"
                answer="Prices can decrease by up to 50% (for items with expiring ingredients) or increase by up to 30% during extreme peak hours. Most changes are between 10-20%."
                isExpanded={expandedFaq === 3}
                onToggle={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
              />

              <FaqItem
                question="When's the best time to order for savings?"
                answer="Generally, 2-4 PM on weekdays offers the best discounts as kitchen capacity is lower. Avoid 7-9 PM for best prices."
                isExpanded={expandedFaq === 4}
                onToggle={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
              />
            </div>
          </section>

          {/* Trust Indicators */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Our Commitment to Transparency
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>We always show the regular price alongside any discount</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>We explain exactly why each price changed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Your cart price is locked - no surprise charges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Same quality, same portions, just smarter pricing</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors"
          >
            Got It! Start Ordering
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description, color }: any) {
  return (
    <div className={`flex gap-4 p-4 bg-${color}-50 rounded-lg border border-${color}-100`}>
      <div className={`flex-shrink-0 w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description, percentage }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
            {percentage}
          </span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ title, description }: any) {
  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
      <h4 className="font-bold text-gray-900 mb-1 text-green-700">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer, isExpanded, onToggle }: any) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-bold text-gray-900">{question}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white text-sm text-gray-700">
          {answer}
        </div>
      )}
    </div>
  );
}

export default DynamicPricingExplainer;

