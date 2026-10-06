import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export interface CustomerAuthProfile {
  uid: string;
  provider: 'google' | 'telegram';
  displayName: string;
  email?: string;
  phone?: string;
  telegramUsername?: string;
  photoURL?: string;
}

export async function loginCustomerWithGoogle(): Promise<CustomerAuthProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profile: CustomerAuthProfile = {
    uid: user.uid,
    provider: 'google',
    displayName: (user.displayName || user.email?.split('@')[0] || 'អតិថិជន Google').slice(0, 120),
    email: (user.email || '').slice(0, 200),
    phone: (user.phoneNumber || '').slice(0, 40),
    photoURL: (user.photoURL || '').slice(0, 500),
  };

  if (user.emailVerified) {
    const path = `customer_accounts/${user.uid}`;
    try {
      await setDoc(doc(db, 'customer_accounts', user.uid), profile, { merge: true });
    } catch (error) {
      // Non-blocking if rules reject unverified or existing
      console.warn('Could not sync customer profile to Firestore:', error);
    }
  }

  return profile;
}

export async function logoutCustomerFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {
    // Ignore sign-out errors
  }
}
