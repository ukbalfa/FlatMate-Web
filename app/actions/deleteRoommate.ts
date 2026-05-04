'use server';

import admin from 'firebase-admin';
import { headers } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface DeleteRoommateResult {
  success: boolean;
  error?: string;
}

interface UserData {
  role?: string;
  flatId?: string;
}

function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.app();
}

export async function deleteRoommateAction(uid: string): Promise<DeleteRoommateResult> {
  try {
    getAdminApp();

    // 1. AUTHENTICATION CHECK: Verify caller via Firebase ID token in Authorization header
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch {
      return { success: false, error: 'Invalid or expired token' };
    }
    
    const callerUid = decodedToken.uid;

    // 2. AUTHORIZATION CHECK: Verify caller is admin
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
      return { success: false, error: 'Caller not found' };
    }
    
    const callerData = callerDoc.data() as UserData;
    if (callerData?.role !== 'admin') {
      return { success: false, error: 'Forbidden: insufficient permissions' };
    }

    // 3. SAME-FLAT PROTECTION: Verify target user belongs to same flat as admin
    const targetDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!targetDoc.exists) {
      return { success: false, error: 'Target user not found' };
    }
    
    const targetData = targetDoc.data() as UserData;
    if (callerData?.flatId !== targetData?.flatId) {
      return { success: false, error: 'Forbidden: cannot delete user from another flat' };
    }

    // 4. SELF-DELETION GUARD: Prevent admin from deleting their own account
    if (callerUid === uid) {
      return { success: false, error: 'Forbidden: cannot delete your own account' };
    }

    // 5. Perform deletion: Delete Firebase Auth user and Firestore document
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection('users').doc(uid).delete();

    return { success: true };
  } catch (error) {
    // 5. ERROR HANDLING: Return typed error responses
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/user-not-found') {
      return { success: false, error: 'User not found' };
    }
    
    const message = error instanceof Error ? error.message : 'Failed to delete roommate';
    return { success: false, error: message };
  }
}