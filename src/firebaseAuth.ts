import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  idToken?: string;
}

function hasFirebaseConfig(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getFirebaseAuth(): Auth | null {
  if (!hasFirebaseConfig()) return null;
  if (!app) app = initializeApp(firebaseConfig);
  if (!auth) auth = getAuth(app);
  return auth;
}

async function toAuthUser(user: User): Promise<AuthUser> {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? 'Pet seeker',
    photoURL: user.photoURL ?? undefined,
    idToken: await user.getIdToken(),
  };
}

function demoUser(email = 'demo@iwantapet.xyz'): AuthUser {
  return { uid: `demo-${email}`, email, displayName: email.split('@')[0] || 'Demo adopter', idToken: 'demo-token' };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const firebase = getFirebaseAuth();
  if (!firebase) return demoUser(email);
  try {
    return toAuthUser((await signInWithEmailAndPassword(firebase, email, password)).user);
  } catch {
    return toAuthUser((await createUserWithEmailAndPassword(firebase, email, password)).user);
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const firebase = getFirebaseAuth();
  if (!firebase) return demoUser('google-demo@iwantapet.xyz');
  const provider = new GoogleAuthProvider();
  return toAuthUser((await signInWithPopup(firebase, provider)).user);
}

export async function logout(): Promise<void> {
  const firebase = getFirebaseAuth();
  if (firebase) await signOut(firebase);
}
