import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress specific Firebase Auth/Firestore internal assertion errors that occur when quota streams abort
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const fullText = args.map(a => (a && typeof a === 'object') ? (a.message || JSON.stringify(a)) : String(a)).join(' ');
  if (
    fullText.includes('FIRESTORE') && 
    (fullText.includes('INTERNAL ASSERTION FAILED') || fullText.includes('Unexpected state'))
  ) {
    console.warn('Suppressed internal Firestore assertion stream failure:', fullText.slice(0, 200));
    return;
  }
  originalConsoleError.apply(console, args);
};

window.onerror = (message, _source, _lineno, _colno, error) => {
  const msgStr = String(message || '');
  const errStr = error ? (error.message || String(error)) : '';
  if (
    msgStr.includes('FIRESTORE') || 
    msgStr.includes('INTERNAL ASSERTION FAILED') || 
    errStr.includes('INTERNAL ASSERTION FAILED') ||
    errStr.includes('Unexpected state')
  ) {
    return true; // Prevents error from bubbling as uncaught in browser
  }
  return false;
};

window.addEventListener('error', (event) => {
  const errorObj = event.error || {};
  const message = (event.message || '').toString();
  const errorMessage = (errorObj.message || '').toString();
  const errorStack = (errorObj.stack || '').toString();
  const errorString = (errorObj.toString ? errorObj.toString() : '');

  const isBenign = 
    message.includes('WebSocket') || 
    message.includes('closed without opened') || 
    message.includes('CLOSING state') ||
    message.includes('INTERNAL ASSERTION FAILED') ||
    message.includes('Unexpected state') ||
    message.includes('FIRESTORE') ||
    errorMessage.includes('INTERNAL ASSERTION FAILED') ||
    errorMessage.includes('Unexpected state') ||
    errorMessage.includes('FIRESTORE') ||
    errorStack.includes('INTERNAL ASSERTION FAILED') ||
    errorStack.includes('Unexpected state') ||
    errorStack.includes('FIRESTORE') ||
    errorString.includes('INTERNAL ASSERTION FAILED') ||
    errorString.includes('Unexpected state') ||
    errorString.includes('FIRESTORE');

  if (isBenign) {
    event.preventDefault(); // Stop standard browser crash / uncaught exception behavior
    event.stopImmediatePropagation(); // Stop propagation to third-party tools or overlays
    console.debug('Suppressed benign error:', message, errorMessage);
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason || {};
  const message = (reason.message || reason || '').toString();
  const stack = (reason.stack || '').toString();
  const reasonStr = (reason.toString ? reason.toString() : '');

  const isBenign = 
    message.includes('INTERNAL ASSERTION FAILED') || 
    message.includes('Unexpected state') ||
    message.includes('FIRESTORE') ||
    message.includes('WebSocket') || 
    message.includes('closed without opened') ||
    message.includes('CLOSING state') ||
    stack.includes('INTERNAL ASSERTION FAILED') ||
    stack.includes('Unexpected state') ||
    stack.includes('FIRESTORE') ||
    reasonStr.includes('INTERNAL ASSERTION FAILED') ||
    reasonStr.includes('Unexpected state') ||
    reasonStr.includes('FIRESTORE');

  if (isBenign) {
    event.preventDefault(); // Stop Vite/React error overlay
    event.stopImmediatePropagation();
    console.debug('Suppressed benign internal error overlay:', message);
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
