import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut as firebaseSignOut,
  updateProfile,
  updateEmail,
  updatePassword,
  type Auth,
  type User as FirebaseAuthUser,
  type UserCredential
} from "firebase/auth";
import { app, auth as firebaseAuth } from "./firebase";
import { createUserAction, getUserByAuthIdAction } from "@/services/private/userService";
import type { User } from "./types";

export const auth: Auth = firebaseAuth();

export const confirmPasswordResetWithCode = (code: string, newPassword: string): Promise<void> => {
  return confirmPasswordReset(auth, code, newPassword);
};

export const verifyResetCode = (code: string): Promise<string> => {
  return verifyPasswordResetCode(auth, code);
};

// Sign Up with Email and Password
export const signUpWithEmail = async (userData: {
  email: any; password: any; fname: any; lname: any; phone?: any; account_company: any; role?: User['role']; invitation_token?: string;
}): Promise<UserCredential> => {
  const { email, password, fname, lname, phone, account_company, role, invitation_token } = userData;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fullName = `${fname} ${lname}`;

  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

    await createUserAction({
      auth_id: userCredential.user.uid,
      fname,
      lname,
      email,
      phone,
      account_company: typeof account_company === 'string' ? { name: account_company } : account_company,
      role: role || 'Admin',
      invitation_token: invitation_token
    } as any);
  }

  return userCredential;
};

// Sign In with Email and Password
export const signInWithEmail = (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign In with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const { user } = userCredential;

  if (user) {
    const existingDbUser = await getUserByAuthIdAction(user.uid);
    if (!existingDbUser) {
      const [fname, ...lnameParts] = user.displayName?.split(' ') || ['', ''];

      await createUserAction({
        auth_id: user.uid,
        fname,
        lname: lnameParts.join(' '),
        email: user.email!,
        phone: user.phoneNumber || '',
        account_company: { name: '' }
      } as any);
    }
  }

  return userCredential;
};

// Password Reset
export const sendPasswordReset = (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// Sign Out
export const signOut = (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Update Email
export const updateUserEmail = (user: FirebaseAuthUser, newEmail: string): Promise<void> => {
  return updateEmail(user, newEmail);
};

// Update Password
export const updateUserPassword = (user: FirebaseAuthUser, newPassword: string): Promise<void> => {
  return updatePassword(user, newPassword);
};
