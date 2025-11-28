'use client';

import React, { useState, useEffect } from 'react';
import { Save, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PaymentFormData {
  phonePeUpiId: string;
  paytmUpiId: string;
  googlePayUpiId: string;
}

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PaymentFormData) => Promise<void>;
  initialData?: Partial<PaymentFormData>;
}

export default function EditPaymentModal({ isOpen, onClose, onSave, initialData }: EditPaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    phonePeUpiId: '',
    paytmUpiId: '',
    googlePayUpiId: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        phonePeUpiId: initialData.phonePeUpiId || '',
        paytmUpiId: initialData.paytmUpiId || '',
        googlePayUpiId: initialData.googlePayUpiId || '',
      });
    }
    if (isOpen) {
      setSuccess(false);
    }
  }, [isOpen, initialData]);

  const validateUpiId = (upiId: string): boolean => {
    if (!upiId) return true;
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUpiId(formData.phonePeUpiId)) {
      alert('Invalid PhonePe UPI ID format');
      return;
    }
    if (!validateUpiId(formData.paytmUpiId)) {
      alert('Invalid Paytm UPI ID format');
      return;
    }
    if (!validateUpiId(formData.googlePayUpiId)) {
      alert('Invalid Google Pay UPI ID format');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to update payment settings:', error);
      alert('Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  const hasInvalidUpi =
    !!(formData.phonePeUpiId && !validateUpiId(formData.phonePeUpiId)) ||
    !!(formData.paytmUpiId && !validateUpiId(formData.paytmUpiId)) ||
    !!(formData.googlePayUpiId && !validateUpiId(formData.googlePayUpiId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Settings"
      subtitle="Configure UPI IDs for customer payments"
      size="lg"
    >
      {success ? (
        <Modal.Success
          title="Saved Successfully!"
          message="QR codes have been generated automatically."
          icon={<CheckCircle size={32} style={{ color: '#059669' }} />}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* UPI Payment Methods Section */}
            <Modal.Section
              title="UPI Payment Methods"
              icon={<Smartphone size={16} />}
              badge={
                <span className="text-xs flex items-center gap-1" style={{ color: '#FF6B35' }}>
                  <QrCode size={12} />
                  QR codes auto-generated
                </span>
              }
              description="Enter your UPI IDs below. QR codes will be generated automatically for customer checkout."
            >
              {/* PhonePe */}
              <Modal.Field
                label={<Modal.UpiBadge type="phonepe">PhonePe UPI ID</Modal.UpiBadge>}
                error={formData.phonePeUpiId && !validateUpiId(formData.phonePeUpiId) ? 'Invalid UPI ID format' : undefined}
              >
                <Modal.Input
                  type="text"
                  value={formData.phonePeUpiId}
                  onChange={(e) => setFormData({ ...formData, phonePeUpiId: e.target.value.toLowerCase() })}
                  placeholder="yourname@ybl"
                  hasError={!!(formData.phonePeUpiId && !validateUpiId(formData.phonePeUpiId))}
                />
              </Modal.Field>

              {/* Paytm */}
              <Modal.Field
                label={<Modal.UpiBadge type="paytm">Paytm UPI ID</Modal.UpiBadge>}
                error={formData.paytmUpiId && !validateUpiId(formData.paytmUpiId) ? 'Invalid UPI ID format' : undefined}
              >
                <Modal.Input
                  type="text"
                  value={formData.paytmUpiId}
                  onChange={(e) => setFormData({ ...formData, paytmUpiId: e.target.value.toLowerCase() })}
                  placeholder="yourname@paytm"
                  hasError={!!(formData.paytmUpiId && !validateUpiId(formData.paytmUpiId))}
                />
              </Modal.Field>

              {/* Google Pay */}
              <Modal.Field
                label={<Modal.UpiBadge type="gpay">Google Pay UPI ID</Modal.UpiBadge>}
                error={formData.googlePayUpiId && !validateUpiId(formData.googlePayUpiId) ? 'Invalid UPI ID format' : undefined}
              >
                <Modal.Input
                  type="text"
                  value={formData.googlePayUpiId}
                  onChange={(e) => setFormData({ ...formData, googlePayUpiId: e.target.value.toLowerCase() })}
                  placeholder="yourname@okicici"
                  hasError={!!(formData.googlePayUpiId && !validateUpiId(formData.googlePayUpiId))}
                />
              </Modal.Field>
            </Modal.Section>

            {/* Help Text */}
            <Modal.InfoBox title="How it works:" variant="info">
              <ul style={{ listStyle: 'disc', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Enter your UPI ID for each payment app</li>
                <li>Click Save - QR codes are generated automatically</li>
                <li>Customers will see these QR codes at checkout</li>
              </ul>
            </Modal.InfoBox>
          </Modal.Body>

          <Modal.Footer>
            <Modal.CancelButton onClick={onClose} />
            <Modal.SubmitButton
              loading={loading}
              disabled={hasInvalidUpi}
              icon={<Save size={16} />}
            >
              Save & Generate QR
            </Modal.SubmitButton>
          </Modal.Footer>
        </form>
      )}
    </Modal>
  );
}
