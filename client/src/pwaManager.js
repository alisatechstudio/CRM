// PWA Service Worker & Install Prompt Manager

let deferredPrompt = null;
const listeners = new Set();

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Mijan CRM ServiceWorker registered successfully:', reg.scope);

          // Check for service worker updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  notifyListeners({ type: 'update_ready' });
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed:', err);
        });
    });

    // Listen for Chromium PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      notifyListeners({ type: 'prompt_ready', canInstall: true });
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      notifyListeners({ type: 'installed', canInstall: false });
      console.log('Mijan CRM was installed as an app');
    });
  }
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  return (
    (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS
  );
}

export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function canPromptInstall() {
  return !!deferredPrompt;
}

export async function promptPwaInstall() {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners({ type: 'choice', outcome: choiceResult.outcome });
    return choiceResult;
  } catch (err) {
    console.error('Install prompt error:', err);
    return { outcome: 'error', error: err };
  }
}

function notifyListeners(data) {
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribePwaState(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
