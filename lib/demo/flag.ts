const KEY = 'invitide:demo';
const CHANGE_EVENT = 'invitide:demo-change';

// Fallback when sessionStorage is blocked.
let memoryFlag = false;

export function isDemo(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(KEY) === '1' || memoryFlag;
  } catch {
    return memoryFlag;
  }
}

function setFlag(on: boolean) {
  memoryFlag = on;
  try {
    if (on) window.sessionStorage.setItem(KEY, '1');
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // memoryFlag covers this page load.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const enableDemo = () => setFlag(true);
export const disableDemo = () => setFlag(false);

export function subscribeDemo(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
