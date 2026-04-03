import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

declare global {
  interface Window {
    __SHOPIFY_CUSTOMIZER__?: {
      enabled: boolean;
      store?: string;
      currency?: string;
      productHandle?: string;
      productId?: string;
      productTitle?: string;
      productPrice?: number;
      theme?: {
        primaryColor?: string;
        textColor?: string;
        bgColor?: string;
        fontFamily?: string;
      };
    };
  }
}

const initializeApp = () => {
  const container = document.getElementById('root') || document.getElementById('customizer-root');
  
  if (container) {
    try {
      const root = createRoot(container);
      root.render(React.createElement(App));
      
      if (window.__SHOPIFY_CUSTOMIZER__) {
        console.log('[RugVision] Customizer initialized in Shopify theme', window.__SHOPIFY_CUSTOMIZER__);
      } else {
        console.log('[RugVision] App initialized in standalone mode');
      }
    } catch (error) {
      console.error('[RugVision] Failed to initialize app:', error);
      container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Failed to load customizer. Please refresh the page.</p>';
    }
  } else {
    console.error('[RugVision] Root container not found');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export default App;
