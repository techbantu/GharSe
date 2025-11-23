/**
 * CHEF REGISTRATION FLOW - Multi-Step Onboarding
 * 
 * Purpose: Allow home chefs to register and join the marketplace
 * 
 * Features:
 * - 3-step wizard (Basic Info → Business Details → Legal Documents)
 * - FSSAI/GST validation
 * - Image uploads (logo, cover, sample dishes) via Cloudinary
 * - Agreement acceptance
 * - Email verification
 * - Admin approval workflow
 * 
 * THIS ENABLES MARKETPLACE SCALING - KEY FOR INVESTOR PITCH
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, User, Building2, FileText, Upload, Check, ArrowRight, ArrowLeft, Mail, Phone, MapPin, DollarSign, Clock, AlertCircle } from 'lucide-react';

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1: Basic Info
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Business Details
  businessName: string;
  bio: string;
  cuisineTypes: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  serviceRadius: number;
  minOrderAmount: number;
  preparationBuffer: number;
  
  // Step 3: Legal Documents
  fssaiNumber: string;
  fssaiExpiry: string;
  gstNumber: string;
  logo: File | null;
  coverImage: File | null;
  sampleDishes: File[];
  
  // Agreement
  termsAccepted: boolean;
}

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Chinese', 'Italian', 'Continental',
  'Mexican', 'Thai', 'Japanese', 'Bengali', 'Punjabi', 'Hyderabadi',
  'Kerala', 'Gujarati', 'Rajasthani', 'Andhra', 'Tamil', 'Desserts',
  'Bakery', 'Vegan', 'Healthy', 'Fusion'
];

export default function ChefRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    bio: '',
    cuisineTypes: [],
    address: '',
    city: '',
    state: '',
    pincode: '',
    serviceRadius: 5,
    minOrderAmount: 199,
    preparationBuffer: 10,
    fssaiNumber: '',
    fssaiExpiry: '',
    gstNumber: '',
    logo: null,
    coverImage: null,
    sampleDishes: [],
    termsAccepted: false,
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [dishPreviews, setDishPreviews] = useState<string[]>([]);

  function updateFormData(updates: Partial<FormData>) {
    setFormData(prev => ({ ...prev, ...updates }));
  }

  function handleCuisineToggle(cuisine: string) {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'dishes') {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'logo') {
      const file = files[0];
      updateFormData({ logo: file });
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === 'cover') {
      const file = files[0];
      updateFormData({ coverImage: file });
      setCoverPreview(URL.createObjectURL(file));
    } else if (type === 'dishes') {
      const fileArray = Array.from(files).slice(0, 5); // Max 5 images
      updateFormData({ sampleDishes: fileArray });
      setDishPreviews(fileArray.map(f => URL.createObjectURL(f)));
    }
  }

  async function validateStep(step: Step): Promise<boolean> {
    setError('');

    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Please fill all required fields');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Invalid email format');
        return false;
      }
      if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
        setError('Invalid Indian phone number');
        return false;
      }
    } else if (step === 2) {
      if (!formData.businessName || !formData.bio || formData.cuisineTypes.length === 0) {
        setError('Please fill all required fields and select at least one cuisine');
        return false;
      }
      if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
        setError('Please fill all address fields');
        return false;
      }
    } else if (step === 3) {
      if (!formData.fssaiNumber || !formData.fssaiExpiry) {
        setError('FSSAI license is mandatory for food businesses');
        return false;
      }
      if (!formData.termsAccepted) {
        setError('Please accept the terms and conditions');
        return false;
      }
    }

    return true;
  }

  async function handleNext() {
    if (await validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as Step);
    }
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  }

  async function handleSubmit() {
    if (!await validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add all text fields
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('password', formData.password);
      submitData.append('businessName', formData.businessName);
      submitData.append('bio', formData.bio);
      submitData.append('cuisineTypes', JSON.stringify(formData.cuisineTypes));
      submitData.append('address', JSON.stringify({
        street: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      }));
      submitData.append('serviceRadius', formData.serviceRadius.toString());
      submitData.append('minOrderAmount', formData.minOrderAmount.toString());
      submitData.append('preparationBuffer', formData.preparationBuffer.toString());
      submitData.append('fssaiNumber', formData.fssaiNumber);
      submitData.append('fssaiExpiry', formData.fssaiExpiry);
      if (formData.gstNumber) {
        submitData.append('gstNumber', formData.gstNumber);
      }

      // Add files
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      if (formData.coverImage) {
        submitData.append('coverImage', formData.coverImage);
      }
      formData.sampleDishes.forEach((dish, idx) => {
        submitData.append(`sampleDish${idx}`, dish);
      });

      const response = await fetch('/api/chefs/register', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for joining GharSe! We've received your application and will review it within 24-48 hours.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong>What's Next?</strong><br />
              • We'll verify your FSSAI license<br />
              • Our team will review your profile<br />
              • You'll receive an email once approved<br />
              • Then you can start accepting orders!
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChefHat className="w-12 h-12 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-800">Become a Chef Partner</h1>
          </div>
          <p className="text-gray-600">Join India's fastest-growing home chef marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Basic Info', icon: User },
              { num: 2, label: 'Business Details', icon: Building2 },
              { num: 3, label: 'Legal Documents', icon: FileText }
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep >= step.num
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.num ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-600">{step.label}</span>
                </div>
                {idx < 2 && (
                  <div className={`h-1 flex-1 mx-4 mt-1 transition-colors ${
                    currentStep > step.num ? 'bg-orange-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Tell us about yourself</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your culinary business</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateFormData({ businessName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="e.g. Priya's Kitchen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Your Cooking * (Tell customers your story)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateFormData({ bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
                  placeholder="Share your passion for cooking, specialties, and what makes your food unique..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cuisines You Offer * (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CUISINE_OPTIONS.map(cuisine => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => handleCuisineToggle(cuisine)}
                      className={`px-4 py-2 rounded-xl border-2 transition-colors text-sm font-medium ${
                        formData.cuisineTypes.includes(cuisine)
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{formData.cuisineTypes.length} selected</p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Service Area</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none mb-3"
                    placeholder="House/Flat No., Street Name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData({ city: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="City *"
                  />
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData({ state: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="State *"
                  />
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => updateFormData({ pincode: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="Pincode *"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Radius (km) *</label>
                  <input
                    type="number"
                    value={formData.serviceRadius}
                    onChange={(e) => updateFormData({ serviceRadius: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    min="1"
                    max="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => updateFormData({ minOrderAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    min="99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prep Buffer (min) *</label>
                  <input
                    type="number"
                    value={formData.preparationBuffer}
                    onChange={(e) => updateFormData({ preparationBuffer: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    min="5"
                    max="60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Legal Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Legal compliance & branding</h3>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> FSSAI license is mandatory for all food businesses in India. We'll verify your license before approval.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FSSAI License Number *</label>
                  <input
                    type="text"
                    value={formData.fssaiNumber}
                    onChange={(e) => updateFormData({ fssaiNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    placeholder="12345678901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FSSAI Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.fssaiExpiry}
                    onChange={(e) => updateFormData({ fssaiExpiry: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => updateFormData({ gstNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="text-xs text-gray-500 mt-1">Required if your annual turnover exceeds ₹20 lakhs</p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">Brand Images</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo (Optional)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 cursor-pointer transition-colors"
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload logo</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (Optional)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cover')}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 cursor-pointer transition-colors"
                      >
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload cover</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sample Dish Photos (Optional, max 5)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, 'dishes')}
                      className="hidden"
                      id="dishes-upload"
                    />
                    <label
                      htmlFor="dishes-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 cursor-pointer transition-colors"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload sample dishes</span>
                    </label>
                  </div>
                  {dishPreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {dishPreviews.map((preview, idx) => (
                        <img key={idx} src={preview} alt={`Dish ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => updateFormData({ termsAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="/legal/chef-terms" target="_blank" className="text-orange-600 hover:underline">Chef Partner Terms & Conditions</a> and confirm that all information provided is accurate. I understand that GharSe charges a 10% commission on orders.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-colors flex items-center gap-2 font-medium text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="ml-auto px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                {!loading && <Check className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Why join GharSe?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Earn More</h4>
              <p className="text-sm text-orange-100">Only 10% commission vs 20-30% on other platforms</p>
            </div>
            <div className="text-center">
              <Clock className="w-10 h-10 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Flexible Hours</h4>
              <p className="text-sm text-orange-100">Set your own schedule and preparation time</p>
            </div>
            <div className="text-center">
              <ChefHat className="w-10 h-10 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Grow Your Brand</h4>
              <p className="text-sm text-orange-100">Build your customer base and reputation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

