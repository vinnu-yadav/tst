import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

export type FirebaseConfig = FirebaseOptions

export function firebaseClient(config: FirebaseConfig) {
  if (!config.apiKey) throw new Error('Firebase configuration is unavailable. Check the existing apiKey project variable and redeploy.')
  const app = getApps().find((app) => app.name === 'lively') ?? initializeApp(config, 'lively')
  return { auth: getAuth(app), database: getDatabase(app) }
}

export function friendlyError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code).toLowerCase() : ''
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'That email and password don’t match. Please try again.',
    'auth/wrong-password': 'That email and password don’t match. Please try again.',
    'auth/user-not-found': 'That email and password don’t match. Please try again.',
    'auth/email-already-in-use': 'Unable to create that account. Try signing in or resetting your password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/password-does-not-meet-requirements': 'Your password doesn’t meet this project’s password policy. Try a longer password with uppercase, lowercase, numbers, and symbols.',
    'auth/too-many-requests': 'Too many attempts. Please wait a little before trying again.',
    'auth/network-request-failed': 'Couldn’t reach Firebase. Check your internet connection and try again.',
    'auth/operation-not-allowed': 'Enable Email/Password in Firebase Console → Authentication → Sign-in method.',
    'auth/unauthorized-domain': 'Add this website’s domain to Firebase Authentication → Settings → Authorized domains.',
    'auth/invalid-api-key': 'Firebase rejected the configured API key. Check the value of the existing apiKey variable.',
    'auth/configuration-not-found': 'Set up Authentication and enable Email/Password in your Firebase console.',
    'auth/user-disabled': 'This account has been disabled. Contact the project owner.',
    'permission_denied': 'Database access was denied. Publish the supplied lively Realtime Database rules, then try again.',
    'database/permission-denied': 'Database access was denied. Publish the supplied lively Realtime Database rules, then try again.',
  }
  if (messages[code]) return messages[code]
  if (error instanceof Error && /permission.?denied/i.test(error.message)) return messages.permission_denied
  if (error instanceof Error && error.name === 'NotAllowedError') return 'Microphone or camera access was blocked. Allow it in your browser’s site settings. If using the embedded preview, open the site in its own tab.'
  if (error instanceof Error && error.name === 'NotFoundError') return 'No microphone or camera was found. Connect a device and try again.'
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
