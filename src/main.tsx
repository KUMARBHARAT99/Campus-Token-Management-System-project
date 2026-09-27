import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/*
 * Clean up the older Smart Campus service worker once.
 * The previous worker intercepted ALL GET requests, including Supabase
 * REST requests, and returned index.html when a request failed. That made
 * Supabase JSON responses look like HTML and caused:
 *   SyntaxError: Unexpected token '<', "<!doctype ..." is not valid JSON
 *
 * The current worker is safe, but unregistering old registrations prevents
 * a stale worker from continuing to affect an already-open browser session.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    }).catch(() => undefined);
  });
}
