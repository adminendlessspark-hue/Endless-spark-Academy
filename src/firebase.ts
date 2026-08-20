import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly initialize Firestore using the standard '(default)' database instance
export const db = getFirestore(app, '(default)');

export function enableFirestoreNetwork() {
  return enableNetwork(db);
}

export function disableFirestoreNetwork() {
  return disableNetwork(db);
}

export const storage = getStorage(app, "gs://project-de027e39-14a0-41d7-9ea.firebasestorage.app");
console.log("Firebase Storage initialized with active bucket: project-de027e39-14a0-41d7-9ea.firebasestorage.app");
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

let isNetworkDisabledForQuota = false;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  const isQuota = errInfo.error.includes('Quota limit exceeded') || errInfo.error.includes('Quota exceeded');
  
  if (isQuota) {
    console.warn('Firestore Quota Reached: ', JSON.stringify(errInfo));
    if (!isNetworkDisabledForQuota) {
      isNetworkDisabledForQuota = true;
      disableNetwork(db).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent('firestore_quota_exceeded', { detail: errInfo }));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }

  // If it's a GET, LIST or general read-based subscription, do NOT throw a fatal exception.
  // Returning gracefully prevents uncaught promise rejections on background snapshot listeners.
  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    return;
  }

  // For write mutations (CREATE, UPDATE, DELETE, WRITE) where UI handlers have catch blocks,
  // throw a safe, readable error string.
  const friendlyMsg = isQuota
    ? "Database Quota limit reached today. Your action could not be saved to Cloud Storage, but the system continues running in Sandbox mode."
    : errInfo.error;

  throw new Error(friendlyMsg);
}

async function testConnection() {
  try {
    // Ensure network is active
    await enableNetwork(db).catch(() => {});
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    // Retry once after short delay if initial handshake was still pending
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase connection established successfully on retry.");
    } catch (retryError) {
      if (retryError instanceof Error && retryError.message.toLowerCase().includes('client is offline')) {
        console.warn("Firestore connection pending or in offline fallback mode:", retryError.message);
      } else {
        console.log("Firestore connection test completed.");
      }
    }
  }
}
testConnection();
