import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
console.log("Firebase Storage initialized with bucket:", firebaseConfig.storageBucket);
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  const isQuota = errInfo.error.includes('Quota limit exceeded') || errInfo.error.includes('Quota exceeded');
  
  if (isQuota) {
    window.dispatchEvent(new CustomEvent('firestore_quota_exceeded', { detail: errInfo }));
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
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      console.warn("Firebase connection test performed. If you see permission errors, ignore if 'test' collection is restricted.");
    }
  }
}
testConnection();
