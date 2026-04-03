import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CustomizerLayout } from './components/CustomizerLayout';
import { LandingPage } from './pages/LandingPage';
import { DesignPage } from './pages/DesignPage';
import { RugVisualizerPage } from './pages/RugVisualizerPage';
import { DesignDetailPage } from './pages/DesignDetailPage';
import { SamplePage } from './pages/SamplePage';
import { FeatureTiersPage } from './pages/FeatureTiersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { WishlistPage } from './pages/WishlistPage';
import { FirebaseProvider, ErrorBoundary } from './components/FirebaseProvider';
import { storage } from './lib/storage';

// Detect if running in Shopify theme context
const detectShopifyContext = (): boolean => {
  if ((window as any).Shopify) {
    return true;
  }
  if ((window as any).__SHOPIFY_CUSTOMIZER__) {
    return true;
  }
  if (typeof window !== 'undefined' && window.location.pathname.includes('/pages/rug-customizer')) {
    return true;
  }
  return false;
};

function AppContent() {
  const location = useLocation();
  const isShopifyCustomizer = detectShopifyContext();
  const isCustomizerRoute = location.pathname.startsWith('/customize');

  // Global storage cleanup on startup
  React.useEffect(() => {
    const migrateAndCleanup = async () => {
      try {
        const largeKeys = ['rug_current_config', 'rug_generated_images', 'rug_selected_image', 'rug_saved_designs'];
        for (const key of largeKeys) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed = JSON.parse(val);
              await storage.setLarge(key, parsed);
              localStorage.removeItem(key);
              console.log(`Migrated ${key} to IndexedDB`);
            } catch (e) {
              await storage.setLarge(key, val);
              localStorage.removeItem(key);
            }
          }
        }

        const lastGenTime = storage.getSmall('rug_last_gen_time');
        if (lastGenTime) {
          const diff = Date.now() - parseInt(lastGenTime);
          if (diff > 3600000) {
            await storage.remove('rug_generated_images');
            await storage.remove('rug_selected_variation');
          }
        }
      } catch (e) {
        console.warn("Storage migration/cleanup failed", e);
      }
    };

    migrateAndCleanup();
  }, []);

  // In Shopify theme with customizer route: render only customizer without Layout
  if (isShopifyCustomizer && isCustomizerRoute) {
    return (
      <Routes>
        <Route path="/customize/*" element={<CustomizerLayout />}>
          <Route path="design" element={<DesignPage />} />
          <Route path="preview" element={<DesignDetailPage />} />
          <Route path="details" element={<DesignDetailPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>
      </Routes>
    );
  }

  // Regular standalone app with full layout and routing
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/visualizer" element={<RugVisualizerPage />} />
        <Route path="/design-detail" element={<DesignDetailPage />} />
        <Route path="/design-detail/:id" element={<DesignDetailPage />} />
        <Route path="/samples" element={<SamplePage />} />
        <Route path="/tiers" element={<FeatureTiersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        
        {/* Customizer pages for standalone use */}
        <Route path="/customize/*" element={<CustomizerLayout />}>
          <Route path="design" element={<DesignPage />} />
          <Route path="preview" element={<DesignDetailPage />} />
          <Route path="details" element={<DesignDetailPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>
      </Routes>
    </Layout>
  );
}

export default function App() {
  // DO NOT hide scrollbar here - let app scroll naturally
  // The Liquid template in Shopify will handle hiding the scrollbar with CSS
  
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <AppContent />
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
