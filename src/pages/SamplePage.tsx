import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, ChevronLeft, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { RugConfig } from '../types';

export const SamplePage: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<RugConfig | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const savedConfig = await storage.getLarge<RugConfig>('rug_current_config');
      const savedImage = await storage.getLarge<string>('rug_selected_image');

      if (savedConfig && savedImage) {
        setConfig(savedConfig);
        setSelectedImage(savedImage);
      } else {
        navigate('/');
      }

      setLoading(false);
    };

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#EFBB76] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config || !selectedImage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-black/40 hover:text-[#EFBB76] transition-colors group mb-12"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <header className="mb-16">
        <h1 className="text-5xl font-serif font-bold text-black mb-4">Request a Sample</h1>
        <p className="text-black/40 text-lg max-w-2xl">
          Review your design details and continue to secure checkout for your physical sample.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        <div className="space-y-8">
          <div className="aspect-square bg-black/5 rounded-3xl overflow-hidden border border-black/10 shadow-2xl">
            <img
              src={selectedImage}
              alt="Selected Rug"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="bg-black/5 p-8 rounded-3xl border border-black/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-black/10 pb-4 mb-4">
              Design Specifications
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Dimensions</span>
                <p className="text-sm font-bold">{config.width}' x {config.length}'</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Construction</span>
                <p className="text-sm font-bold uppercase">{config.construction.replace('-', ' ')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Pile Type</span>
                <p className="text-sm font-bold uppercase">{config.pileType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block">Pile Height</span>
                <p className="text-sm font-bold">{config.pileHeight}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="space-y-6">
            <div className="bg-[#EFBB76]/10 p-8 rounded-[2.5rem] border border-[#EFBB76]/20">
              <h3 className="text-xl font-serif font-bold mb-4">Sample Order Details</h3>
              <p className="text-sm text-black/60 mb-6 leading-relaxed">
                We’ll send you a 1ft x 1ft sample of your design configuration. The sample cost can later be credited toward your final order.
              </p>

              <div className="flex justify-between items-center mb-8 pb-6 border-b border-black/10">
                <span className="text-sm font-bold uppercase tracking-widest text-black/40">Sample Price</span>
                <span className="text-3xl font-serif font-bold text-black">$100</span>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() =>
                    navigate('/checkout', {
                      state: {
                        type: 'sample',
                        amount: 100,
                      },
                    })
                  }
                  className="w-full py-5 bg-[#EFBB76] text-black font-black text-lg rounded-full hover:bg-[#DBA762] transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" /> Proceed to Sample Checkout
                </button>

                <button
                  onClick={() => navigate('/checkout', { state: { type: 'deposit' } })}
                  className="w-full py-5 bg-black text-white font-black text-lg rounded-full hover:bg-black/80 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" /> Pay Deposit for Full Rug
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex gap-4 p-6 bg-black/5 rounded-2xl border border-black/10">
                <Package className="w-6 h-6 text-[#EFBB76] shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1">Premium Packaging</h4>
                  <p className="text-[10px] text-black/40 leading-relaxed">
                    Carefully packed to preserve texture and color accuracy.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-black/5 rounded-2xl border border-black/10">
                <Truck className="w-6 h-6 text-[#EFBB76] shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1">Global Shipping</h4>
                  <p className="text-[10px] text-black/40 leading-relaxed">
                    Worldwide delivery within 3–5 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
