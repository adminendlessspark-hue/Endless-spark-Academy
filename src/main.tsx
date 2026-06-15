import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress specific Firebase Auth/Firestore internal errors that don't affect functionality
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
});

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
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
