'use client';

/**
 * BANK ACCOUNT SETUP GUIDE PAGE
 * 
 * Purpose: Displays comprehensive guide for setting up bank account
 * and payment gateway integration for receiving money from orders.
 * 
 * URL: /admin/bank-setup
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, ExternalLink, Phone, Mail, BookOpen } from 'lucide-react';

export default function BankSetupGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg" style={{ padding: '1.5rem 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-4"
            style={{ fontSize: '0.875rem', fontWeight: 600 }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">🏦 Bank Account Setup Guide</h1>
          <p className="text-white/80">Get Your Money Instantly - Complete Payment Gateway Integration</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          
          {/* Current Situation */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Situation</h2>
            <p className="text-gray-700 mb-4">
              Right now, your "Today's Revenue" shows <strong>order totals</strong>, but this is NOT actual money in your bank account yet. Here's what's happening:
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle size={20} />
                What's NOT Working:
              </h3>
              <ul className="list-disc list-inside text-red-800 space-y-1">
                <li>Money is NOT automatically going to your bank</li>
                <li>Payment gateways (Stripe/Razorpay) are not fully connected</li>
                <li>No webhook handler to record actual payments</li>
                <li>No bank account linked for automatic transfers</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle size={20} />
                What We're Building:
              </h3>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li><strong>Payment tracking system</strong> - Records every payment received</li>
                <li><strong>Bank account integration</strong> - Automatic transfers to your bank</li>
                <li><strong>Real-time financial dashboard</strong> - See actual money received vs pending</li>
                <li><strong>Payout tracking</strong> - Know when money reaches your bank</li>
              </ul>
            </div>
          </section>

          {/* Money Flow */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 How Money Flows (Payment Gateway Process)</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">Step 1: Customer Pays</h3>
              <div className="font-mono text-sm text-blue-800 bg-white p-3 rounded border border-blue-100">
                Customer → Stripe/Razorpay → Payment Gateway
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-yellow-900 mb-3">Step 2: Payment Gateway Holds Money</h3>
              <div className="font-mono text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-100 mb-3">
                Payment Gateway → Holds money for 1-7 days
              </div>
              <ul className="text-yellow-800 space-y-1">
                <li><strong>Stripe:</strong> 2-7 days (T+2 to T+7)</li>
                <li><strong>Razorpay:</strong> 1-3 days (T+1 to T+3)</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">Step 3: Money Transfers to Your Bank</h3>
              <div className="font-mono text-sm text-green-800 bg-white p-3 rounded border border-green-100">
                Payment Gateway → Your Bank Account (Automatic)
              </div>
              <div className="mt-4 text-green-800">
                <p className="font-semibold mb-2">Timeline:</p>
                <ul className="space-y-1">
                  <li><strong>Day 1:</strong> Customer pays ₹1000</li>
                  <li><strong>Day 2-7:</strong> Money held by payment gateway (processing)</li>
                  <li><strong>Day 7+:</strong> Money automatically transferred to your bank account</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Setup Instructions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Setup Instructions</h2>

            {/* Stripe Option */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Option 1: Stripe (International, Works in India)</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">1. Create Stripe Account</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">https://dashboard.stripe.com/register <ExternalLink size={14} /></a></li>
                    <li>Sign up with your business email</li>
                    <li>Complete business verification</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">2. Get API Keys</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Developers → API Keys</strong></li>
                    <li>Copy:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><strong>Publishable Key</strong> → Add to `.env` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`</li>
                        <li><strong>Secret Key</strong> → Add to `.env` as `STRIPE_SECRET_KEY`</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">3. Connect Bank Account</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → Bank accounts and scheduling</strong></li>
                    <li>Click <strong>Add bank account</strong></li>
                    <li>Enter your Indian bank account details:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li>Account number</li>
                        <li>IFSC code</li>
                        <li>Account holder name</li>
                      </ul>
                    </li>
                    <li>Verify account (Stripe will send small test deposits)</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">4. Set Up Webhook (Critical!)</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Developers → Webhooks</strong></li>
                    <li>Click <strong>Add endpoint</strong></li>
                    <li>Enter URL: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://yourdomain.com/api/payments/webhook</code></li>
                    <li>Select events:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><code className="bg-gray-100 px-1 rounded text-xs">payment_intent.succeeded</code></li>
                        <li><code className="bg-gray-100 px-1 rounded text-xs">payment_intent.payment_failed</code></li>
                        <li><code className="bg-gray-100 px-1 rounded text-xs">charge.refunded</code></li>
                      </ul>
                    </li>
                    <li>Copy <strong>Webhook signing secret</strong> → Add to `.env` as `STRIPE_WEBHOOK_SECRET`</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">5. Configure Payout Schedule</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → Bank accounts and scheduling</strong></li>
                    <li>Set payout schedule:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><strong>Daily</strong> (recommended) - Money transfers every day</li>
                        <li><strong>Weekly</strong> - Money transfers once a week</li>
                        <li><strong>Manual</strong> - You trigger transfers manually</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Stripe Fees:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li><strong>Cards:</strong> 2.9% + ₹2 per transaction</li>
                    <li><strong>UPI:</strong> 2% per transaction</li>
                    <li><strong>Net Banking:</strong> 2% per transaction</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Razorpay Option */}
            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-gray-900">Option 2: Razorpay (Best for India 🇮🇳)</h3>
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">RECOMMENDED</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">1. Create Razorpay Account</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <a href="https://razorpay.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">https://razorpay.com/signup <ExternalLink size={14} /></a></li>
                    <li>Sign up as <strong>Business Account</strong></li>
                    <li>Complete KYC verification (required for payouts)</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">2. Get API Keys</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → API Keys</strong></li>
                    <li>Copy:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><strong>Key ID</strong> → Add to `.env` as `RAZORPAY_KEY_ID`</li>
                        <li><strong>Key Secret</strong> → Add to `.env` as `RAZORPAY_KEY_SECRET`</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">3. Connect Bank Account</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → Bank Accounts</strong></li>
                    <li>Click <strong>Add Bank Account</strong></li>
                    <li>Enter details:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li>Bank name</li>
                        <li>Account number</li>
                        <li>IFSC code</li>
                        <li>Account type (Current/Savings)</li>
                      </ul>
                    </li>
                    <li>Upload cancelled cheque or bank statement</li>
                    <li>Wait for verification (1-2 business days)</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">4. Set Up Webhook</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → Webhooks</strong></li>
                    <li>Click <strong>Add Webhook</strong></li>
                    <li>Enter URL: <code className="bg-gray-100 px-2 py-1 rounded text-sm">https://yourdomain.com/api/payments/webhook</code></li>
                    <li>Select events:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><code className="bg-gray-100 px-1 rounded text-xs">payment.captured</code></li>
                        <li><code className="bg-gray-100 px-1 rounded text-xs">payment.failed</code></li>
                        <li><code className="bg-gray-100 px-1 rounded text-xs">refund.created</code></li>
                      </ul>
                    </li>
                    <li>Copy <strong>Webhook Secret</strong> → Add to `.env` as `RAZORPAY_WEBHOOK_SECRET`</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">5. Configure Settlement Schedule</h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
                    <li>Go to <strong>Settings → Settlements</strong></li>
                    <li>Choose schedule:
                      <ul className="list-disc list-inside ml-6 mt-1">
                        <li><strong>T+1</strong> (Next day) - Fastest, money arrives next day</li>
                        <li><strong>T+2</strong> (2 days) - Standard</li>
                        <li><strong>Weekly</strong> - Once a week</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="bg-white border border-orange-200 rounded p-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Razorpay Fees:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li><strong>Cards:</strong> 2% per transaction</li>
                    <li><strong>UPI:</strong> <span className="text-green-600 font-bold">0% (FREE!)</span></li>
                    <li><strong>Net Banking:</strong> 2% per transaction</li>
                    <li><strong>Wallets:</strong> 2% per transaction</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
                  <p className="font-semibold text-green-900 mb-2">Why Razorpay is Better for India:</p>
                  <ul className="text-green-800 space-y-1">
                    <li>✅ UPI payments are FREE (0% fees)</li>
                    <li>✅ Faster payouts (T+1 vs T+7)</li>
                    <li>✅ Better Indian bank support</li>
                    <li>✅ Lower fees overall</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Environment Variables */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔧 Environment Variables</h2>
            <p className="text-gray-700 mb-4">Add these to your `.env` file:</p>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
{`# Stripe (if using)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (recommended for India)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Database (already configured)
DATABASE_URL=...`}
              </pre>
            </div>
          </section>

          {/* Understanding Dashboard */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Understanding Your Money Dashboard</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Available Now</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Money that has cleared payment gateway hold period</li>
                  <li>Ready to withdraw immediately</li>
                  <li><strong>This is YOUR money</strong> - can use right away</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">In Transit</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Money received but still processing</li>
                  <li>Will be available in 1-7 days</li>
                  <li>Automatically transfers to your bank</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Pending Collection</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Cash on delivery orders</li>
                  <li>Not paid yet</li>
                  <li>You collect when delivering</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Gateway Fees</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Fees charged by Stripe/Razorpay</li>
                  <li>Typically 2-3% per transaction</li>
                  <li>Already deducted from "Available Now"</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Quick Start Checklist */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Quick Start Checklist</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <ul className="space-y-2">
                {[
                  'Choose payment gateway (Razorpay recommended for India)',
                  'Create account and complete KYC',
                  'Add API keys to `.env` file',
                  'Connect bank account',
                  'Set up webhook endpoint',
                  'Configure payout schedule',
                  'Test with small payment (₹10)',
                  'Verify money arrives in bank account',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Support */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📞 Support</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone size={20} />
                  Stripe Support
                </h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Email: <a href="mailto:support@stripe.com" className="text-blue-600 hover:underline">support@stripe.com</a></li>
                  <li>Phone: Check dashboard for local number</li>
                  <li>Docs: <a href="https://stripe.com/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">https://stripe.com/docs <ExternalLink size={14} /></a></li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone size={20} />
                  Razorpay Support
                </h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Email: <a href="mailto:help@razorpay.com" className="text-blue-600 hover:underline">help@razorpay.com</a></li>
                  <li>Phone: <a href="tel:18001231234" className="text-blue-600 hover:underline">1800-123-1234</a> (Toll-free)</li>
                  <li>Docs: <a href="https://razorpay.com/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">https://razorpay.com/docs <ExternalLink size={14} /></a></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Important Notes</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="text-yellow-900 space-y-2">
                <li><strong>KYC Required:</strong> Both Stripe and Razorpay require business verification before you can receive payouts</li>
                <li><strong>Test Mode:</strong> Start with test mode to verify everything works</li>
                <li><strong>Webhook Security:</strong> Never expose webhook secrets publicly</li>
                <li><strong>Bank Verification:</strong> May take 1-2 business days</li>
                <li><strong>First Payout:</strong> Usually takes 7-14 days for first payout (security check)</li>
              </ul>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚨 Troubleshooting</h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">"Money not showing in bank"</h3>
                <ul className="text-gray-700 space-y-1 list-disc list-inside">
                  <li>Check payout schedule (daily/weekly)</li>
                  <li>Verify bank account is connected</li>
                  <li>Check payout status in payment gateway dashboard</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">"Webhook not working"</h3>
                <ul className="text-gray-700 space-y-1 list-disc list-inside">
                  <li>Verify webhook URL is accessible (not localhost)</li>
                  <li>Check webhook secret matches `.env` file</li>
                  <li>View webhook logs in payment gateway dashboard</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">"Payment failed"</h3>
                <ul className="text-gray-700 space-y-1 list-disc list-inside">
                  <li>Check API keys are correct</li>
                  <li>Verify account is activated (not in test mode)</li>
                  <li>Check customer's payment method is valid</li>
                </ul>
              </div>
            </div>
          </section>

          {/* After Setup */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ After Setup</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-900 mb-4">Once configured, you'll see:</p>
              <ul className="text-green-800 space-y-2">
                <li>✅ Real-time payment tracking</li>
                <li>✅ Actual money received (not just order totals)</li>
                <li>✅ Automatic bank transfers</li>
                <li>✅ Financial dashboard showing available balance</li>
                <li>✅ Payout schedule and history</li>
              </ul>
              <p className="text-green-900 font-semibold mt-4">
                Your money will automatically transfer to your bank account every day/week (based on your schedule)!
              </p>
            </div>
          </section>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

