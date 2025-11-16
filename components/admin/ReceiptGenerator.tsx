/**
 * NEW FILE: Receipt Generator Component
 * 
 * Purpose: Generate professional receipts for orders
 * Features: PDF generation, email sending, print functionality
 */

'use client';

import React, { useRef } from 'react';
import { Download, Mail, Printer, FileText } from 'lucide-react';
import { Order } from '@/types';
import { format } from 'date-fns';

interface ReceiptGeneratorProps {
  order: Order;
  onClose: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ order, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Generate PDF (in production, use jsPDF or similar)
  const handleDownloadPDF = async () => {
    // In production:
    // const response = await fetch('/api/receipts/generate', {
    //   method: 'POST',
    //   body: JSON.stringify({ orderId: order.id }),
    // });
    // const blob = await response.blob();
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `receipt-${order.orderNumber}.pdf`;
    // a.click();
    
    alert('PDF generation would happen here in production');
  };

  // Email receipt
  const handleEmailReceipt = async () => {
    // In production:
    // await fetch('/api/receipts/email', {
    //   method: 'POST',
    //   body: JSON.stringify({ orderId: order.id, email: order.customer.email }),
    // });
    
    alert(`Receipt would be emailed to ${order.customer.email}`);
  };

  // Print receipt
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
              title="Download PDF"
            >
              <Download size={18} />
              PDF
            </button>
            <button
              onClick={handleEmailReceipt}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all"
              title="Email Receipt"
            >
              <Mail size={18} />
              Email
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all"
              title="Print"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-8 print:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
              GS
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">GharSe</h1>
            <p className="text-sm font-semibold text-gray-700 mb-2">Operated by: Bantu'S kitchen (Proprietor: Sailaja)</p>
            <p className="text-xs text-gray-600 mb-1">FSSAI Reg: 23625028002731 (Valid until: 23 June 2027)</p>
            <p className="text-gray-600 text-sm">Authentic Indian Home Cooking, Made with Love</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>Plot no 17, Road no 3, Padmalaya Nagar, Hayatnagar</p>
              <p>Pedda Amberpet (Kalan), Hayathnagar, Rangareddy, Telangana - 501505</p>
              <p className="mt-2">Phone: +91 90104 60964 | Email: orders@gharse.com</p>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">Technology by TechBantu IT Solutions LLC</p>
          </div>

          <div className="border-t-2 border-b-2 border-gray-300 py-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold text-gray-700">Receipt Number:</p>
                <p className="text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-700">Date:</p>
                <p className="text-gray-900">{format(order.createdAt, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Customer Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="font-semibold">Name:</span> {order.customer.name}</p>
              <p><span className="font-semibold">Phone:</span> {order.customer.phone}</p>
              <p><span className="font-semibold">Email:</span> {order.customer.email}</p>
              {order.deliveryAddress && (
                <p>
                  <span className="font-semibold">Address:</span>{' '}
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.apartment && `, ${order.deliveryAddress.apartment}`}
                  , {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                </p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Order Items</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-bold text-gray-700">Item</th>
                  <th className="text-center py-2 font-bold text-gray-700">Qty</th>
                  <th className="text-right py-2 font-bold text-gray-700">Price</th>
                  <th className="text-right py-2 font-bold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 text-gray-900">{item.menuItem.name}</td>
                      <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-900">₹{item.menuItem.price.toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-900">₹{(item.menuItem.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-gray-500 italic">
                      No items listed
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="font-semibold text-gray-700 mb-1">Special Instructions:</p>
              <p className="text-gray-900 italic">{order.specialInstructions}</p>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-semibold">₹{order.pricing.subtotal.toFixed(2)}</span>
              </div>
              {order.pricing.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Delivery Fee:</span>
                  <span className="text-gray-900 font-semibold">₹{order.pricing.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Tax (5%):</span>
                <span className="text-gray-900 font-semibold">₹{order.pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
                <span className="text-gray-900">Total:</span>
                <span className="text-primary-500">₹{order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700">Payment Method:</p>
                <p className="text-gray-900 capitalize">
                  {order.paymentMethod
                    ? order.paymentMethod.replace(/-/g, ' ').replace(/_/g, ' ')
                    : 'Cash on Delivery'}
                  {order.pricing?.tip && order.pricing.tip > 0 && <span className="text-green-600 ml-2">💝 ₹{order.pricing.tip}</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">Payment Status:</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  order.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">Thank you for your order!</p>
            <p>We hope you enjoy your meal. Please visit us again!</p>
            <p className="mt-4 text-xs text-gray-500">
              For any queries, contact us at orders@gharse.com or +91 90104 60964
            </p>
          </div>

          {/* Legal Footer - FSSAI Compliance */}
          <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
            <p className="text-xs text-gray-600 font-semibold mb-2">Food Business Operator</p>
            <p className="text-xs text-gray-500">
              <strong>Bantu'S kitchen</strong> (Proprietor: Sailaja)
            </p>
            <p className="text-xs text-gray-500">
              FSSAI Registration: <strong>23625028002731</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Petty Retailer - Prepared Foods | Valid until: 23 June 2027
            </p>
            <p className="text-xs text-gray-400 mt-3 italic">
              All food safety, quality, and liability rest with Bantu'S kitchen.
              <br />
              Technology services by TechBantu IT Solutions LLC (zero food liability).
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="mt-6 flex justify-center">
            <div className="w-24 h-24 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <FileText size={32} className="text-gray-400" />
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            Scan for digital receipt
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${receiptRef.current} * {
            visibility: visible;
          }
          ${receiptRef.current} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptGenerator;

