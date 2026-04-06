import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Loader2,
  Lock,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../lib/storage';
import { RugConfig } from '../types';
import { useFirebase } from '../components/FirebaseProvider';
import { uploadImage } from '../firebase';
import { PRICING_TIERS } from '../constants';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useFirebase();

  const [submitted, setSubmitted] = useState(false);
  const [config, setConfig] = useState<RugConfig | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDeposit = location.state?.type === 'deposit';
  const depositAmount = location.state?.amount || 500;
  const targetTierId = location.state?.tier;
  const targetTier = PRICING_TIERS.find((t) => t.id === targetTierId);

  useEffect(() => {
    const loadData = async () => {
      const savedConfig = await storage.getLarge<RugConfig>('rug_current_config');
      const savedImage = await storage.getLarge<string>('rug_selected_image');

      if (savedConfig) setConfig(savedConfig);
      if (savedImage) setSelectedImage(savedImage);
    };

    loadData();
  }, []);

  const handleSecureCheckout = async () => {
    if (!user) {
      setError('Please sign in to complete checkout.');
      return;
    }

    if (!targetTier && !config) {
      setError('Missing rug configuration.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let imageUrl = selectedImage || '';

      if (selectedImage && !selectedImage.startsWith('http')) {
        const imagePath = `orders/${user.uid}/${Date.now()}.png`;
        imageUrl = await uploadImage(selectedImage, imagePath);
      }

      const payload = {
        type: targetTier ? 'deposit' : isDeposit ? 'deposit' : 'sample',
        amount: targetTier ? targetTier.price : isDeposit ? depositAmount : 100,
        userId: user.uid,
        email: user.email || '',
        imageUrl,
        config: config || undefined,
      };

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create checkout');
      }

      if (!data.checkoutUrl) {
        throw new Error('Missing checkout URL');
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-serif font-bold mb-4">Checkout Created</h1>
          <p className="text-black/40 text-lg leading-relaxed">
            You are being redirected to Shopify checkout.
          </p>
        </div>
      </div>
    );
  }

  const totalDue = targetTier
    ? targetTier.price
    : isDeposit
    ? depositAmount
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-black/40 hover:text-[#EFBB76] transition-colors group mb-8"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-black/5 p-8 rounded-[2.5rem] border border-black/10">
            <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>

            {targetTier ? (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-[#EFBB76]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-[#EFBB76]" />
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-serif font-bold text-black">{targetTier.name} Plan</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">
                    Subscription Upgrade
                  </p>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="aspect-square rounded-2xl overflow-hidden mb-6 border border-black/10">
                <img
                  src={selectedImage}
                  alt="Rug Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            <div className="space-y-4 border-t border-black/10 pt-6">
              <div className="flex justify-between text-xs">
                <span className="text-black/40 uppercase font-bold tracking-widest">Item</span>
                <span className="font-bold">
                  {targetTier ? `${targetTier.name} Subscription` : isDeposit ? 'Custom Rug Deposit' : 'Custom Rug Sample'}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-black/40 uppercase font-bold tracking-widest">Type</span>
                <span className="font-bold">
                  {targetTier ? 'Plan Upgrade' : isDeposit ? 'Deposit Payment' : 'Sample Payment'}
                </span>
              </div>

              <div className="flex justify-between text-xl font-serif font-bold pt-4 border-t border-black/10">
                <span>Total Due</span>
                <span className="text-[#EFBB76]">${Number(totalDue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-[#EFBB76]/5 rounded-2xl border border-[#EFBB76]/20">
            <ShieldCheck className="w-6 h-6 text-[#EFBB76] shrink-0" />
            <p className="text-[10px] text-black/60 leading-relaxed font-bold uppercase tracking-wider">
              Secure checkout will open on Shopify. Payment details are handled there.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-black/10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-black mb-3">Secure Checkout</h2>
            <p className="text-black/50 leading-relaxed">
              Continue to Shopify to complete your payment securely.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold uppercase tracking-widest mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleSecureCheckout}
            disabled={isProcessing}
            className="w-full py-6 bg-[#EFBB76] text-black font-black text-xl rounded-full hover:bg-[#DBA762] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating Checkout...
              </>
            ) : (
              <>
                Proceed to Secure Checkout <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/40">
            <Lock className="w-3 h-3" /> Redirects to Shopify checkout
          </div>
        </div>
      </div>
    </motion.div>
  );
};
