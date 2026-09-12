'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import api, { getErrorMessage } from '@/lib/api';
import { useAppSelector } from '@/lib/hooks';
import type { ApiEvent } from '@/lib/types';
import {
  CreditCardIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  event: ApiEvent;
  onSuccess: () => void;
}

export default function CheckoutModal({
  open,
  onClose,
  event,
  onSuccess,
}: CheckoutModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(user?.username || 'John Doe');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardHolder(user?.username || 'John Doe');
    setExpiry('12/28');
    setCvc('123');
    setError(null);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !cardHolder) {
      setError('Please fill in all card details.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate realistic payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create reservation on the backend
      await api.post('/reservations', { eventId: event._id });

      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, 'Payment or reservation failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!loading) {
      setIsSuccess(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      title={isSuccess ? 'Booking Confirmed' : 'Checkout & Payment'}
    >
      {isSuccess ? (
        <div className="py-4 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-light">Payment Successful!</h4>
            <p className="text-sm text-light-muted mt-1">
              Your ticket for <span className="text-light font-medium">{event.title}</span> has been reserved.
            </p>
          </div>

          <div className="bg-dark-primary p-4 rounded-lg border border-border text-left text-xs space-y-1">
            <p className="text-light-muted">Amount Paid: <span className="text-light font-semibold">${event.price.toFixed(2)}</span></p>
            <p className="text-light-muted">Status: <span className="text-emerald-400 font-semibold">Pending Admin Approval</span></p>
            <p className="text-light-muted mt-2">Once approved, your ticket PDF will be available and emailed to you directly.</p>
          </div>

          <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/reservations"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent text-dark-primary hover:bg-accent-hover text-center transition-all"
            >
              View My Reservations
            </Link>
            <button
              onClick={handleModalClose}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-dark-primary text-light-muted hover:text-light border border-border transition-all"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-dark-primary p-3.5 rounded-lg border border-border space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-light text-sm">{event.title}</p>
                <p className="text-xs text-light-muted">{event.location}</p>
              </div>
              <span className="text-sm font-bold text-accent">${event.price.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-xs text-light-muted">
              <span>Standard Admission (x1)</span>
              <span>${event.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-light-muted">
              <span>Platform Service Fee</span>
              <span className="text-emerald-400">FREE ($0.00)</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-light">
              <span>Total Due</span>
              <span className="text-accent">${event.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Test Card Quick-Fill */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-light-muted flex items-center gap-1">
              <LockClosedIcon className="w-3.5 h-3.5 text-accent" />
              Simulated Sandbox Payment
            </span>
            <button
              type="button"
              onClick={handleFillTestCard}
              className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 font-medium transition-colors"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Fill Test Card
            </button>
          </div>

          {/* Payment Card Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-light-muted mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-dark-primary border border-border text-light placeholder-light-muted/50 focus:outline-none focus:border-accent"
                placeholder="Name on card"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-muted mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  maxLength={19}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-dark-primary border border-border text-light placeholder-light-muted/50 focus:outline-none focus:border-accent"
                  placeholder="4242 4242 4242 4242"
                />
                <CreditCardIcon className="w-4 h-4 text-light-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-light-muted mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  maxLength={5}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-dark-primary border border-border text-light placeholder-light-muted/50 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-light-muted mb-1">
                  CVC / CVV
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  required
                  maxLength={4}
                  placeholder="123"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-dark-primary border border-border text-light placeholder-light-muted/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-light-muted">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>256-bit encrypted test</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-dark-primary text-light-muted hover:text-light border border-border transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-dark-primary hover:bg-accent-hover active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                {loading ? 'Processing...' : `Pay $${event.price.toFixed(2)}`}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

