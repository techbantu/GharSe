/**
 * NEW FILE: Loyalty Program Component
 * 
 * Purpose: Implements a points-based loyalty system for customer retention
 * 
 * Features:
 * - Points earned per order
 * - Points redemption for discounts
 * - Tier system (Bronze, Silver, Gold, Platinum)
 * - Order history tracking
 * - Referral rewards
 */

'use client';

import React, { useState } from 'react';
import { Gift, Star, TrendingUp, Users, Trophy, GiftIcon } from 'lucide-react';

interface LoyaltyProgramProps {
  customerId?: string;
}

interface LoyaltyTier {
  name: string;
  pointsRequired: number;
  discount: number;
  color: string;
  icon: React.ReactNode;
}

const tiers: LoyaltyTier[] = [
  {
    name: 'Bronze',
    pointsRequired: 0,
    discount: 0,
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: <Trophy size={20} />,
  },
  {
    name: 'Silver',
    pointsRequired: 500,
    discount: 5,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: <Trophy size={20} />,
  },
  {
    name: 'Gold',
    pointsRequired: 1500,
    discount: 10,
    icon: <Trophy size={20} />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  {
    name: 'Platinum',
    pointsRequired: 3000,
    discount: 15,
    icon: <Trophy size={20} />,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
];

const LoyaltyProgram: React.FC<LoyaltyProgramProps> = ({ customerId }) => {
  // Mock data - replace with API call
  const [loyaltyData] = useState({
    points: 1250,
    totalOrders: 15,
    currentTier: 'Silver',
    pointsToNextTier: 250,
    nextTier: 'Gold',
    referralCode: 'BANTU2024',
    referralRewards: 3,
  });
  
  const currentTierInfo = tiers.find(t => t.name === loyaltyData.currentTier) || tiers[0];
  const nextTierInfo = tiers.find(t => t.name === loyaltyData.nextTier) || tiers[1];
  const progress = ((loyaltyData.points - currentTierInfo.pointsRequired) / 
    (nextTierInfo.pointsRequired - currentTierInfo.pointsRequired)) * 100;
  
  // Calculate points earned per ₹10 spent (varies by tier)
  const pointsPerRupee = currentTierInfo.name === 'Platinum' ? 2 : 
    currentTierInfo.name === 'Gold' ? 1.5 : 
    currentTierInfo.name === 'Silver' ? 1.2 : 1;
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Loyalty Program
        </h2>
        <p className="text-gray-600">
          Earn points with every order and unlock exclusive rewards!
        </p>
      </div>
      
      {/* Current Status Card */}
      <div className={`bg-gradient-orange text-white rounded-xl shadow-lg p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Current Tier</p>
              <div className="flex items-center gap-2">
                {currentTierInfo.icon}
                <h3 className="text-2xl font-bold">{loyaltyData.currentTier}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">Total Points</p>
              <p className="text-3xl font-bold">{loyaltyData.points.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to {loyaltyData.nextTier}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-2 text-white/80">
              {loyaltyData.pointsToNextTier} points until {loyaltyData.nextTier}
            </p>
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Gift size={20} />
              <span className="text-sm">{currentTierInfo.discount}% discount on orders</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={20} />
              <span className="text-sm">{pointsPerRupee} points per ₹10 spent</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tiers Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Membership Tiers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {tiers.map((tier) => {
            const isActive = tier.name === loyaltyData.currentTier;
            const isUnlocked = loyaltyData.points >= tier.pointsRequired;
            
            return (
              <div
                key={tier.name}
                className={`p-4 rounded-lg border-2 ${
                  isActive
                    ? tier.color
                    : isUnlocked
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tier.icon}
                    <h4 className="font-semibold">{tier.name}</h4>
                  </div>
                  {isActive && (
                    <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {tier.pointsRequired} points required
                </p>
                <div className="flex items-center gap-2">
                  <GiftIcon size={16} className="text-gray-500" />
                  <span className="text-sm font-medium">
                    {tier.discount}% discount
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <TrendingUp size={32} className="mx-auto text-primary-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loyaltyData.totalOrders}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Star size={32} className="mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            ₹{Math.round(loyaltyData.points * 0.1)}
          </p>
          <p className="text-sm text-gray-600">Available Rewards</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Users size={32} className="mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{loyaltyData.referralRewards}</p>
          <p className="text-sm text-gray-600">Referrals</p>
        </div>
      </div>
      
      {/* Referral Program */}
      <div className="bg-gradient-to-r from-primary-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Referral Program</h3>
        <p className="text-white/90 mb-4">
          Share your referral code and both you and your friend get bonus points!
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80 mb-1">Your Referral Code</p>
            <p className="text-2xl font-bold font-mono">{loyaltyData.referralCode}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(loyaltyData.referralCode);
              alert('Referral code copied!');
            }}
            className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-white/80 mt-4">
          You both get 100 points when they place their first order!
        </p>
      </div>
      
      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">Earn Points</h4>
              <p className="text-sm text-gray-600">
                Get {pointsPerRupee} points for every ₹10 you spend. Points earned vary by tier!
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">Level Up</h4>
              <p className="text-sm text-gray-600">
                Reach higher tiers to unlock better discounts and earn points faster.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">Redeem Rewards</h4>
              <p className="text-sm text-gray-600">
                Use your points for discounts: 100 points = ₹10 off your next order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgram;

