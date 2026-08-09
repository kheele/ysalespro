

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  updateEmail,
  updatePassword,
  type Auth,
  type User as FirebaseAuthUser,
  type UserCredential
} from "firebase/auth";
import { app, auth as firebaseAuth } from "./firebase";
import { createUser, getUserByAuthId } from "@/services/userService";
import type { User } from "./types";

export const auth: Auth = firebaseAuth();

// Sign Up with Email and Password
export const signUpWithEmail = async (userData: {
  email: any; password: any; fname: any; lname: any; phone?: any; organization: any; role?: User['role']; invitation_token?: string;
}): Promise<UserCredential> => {
  const { email, password, fname, lname, phone, organization, role, invitation_token } = userData;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fullName = `${fname} ${lname}`;

  if (userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

    await createUser({
      auth_id: userCredential.user.uid,
      fname,
      lname,
      email,
      phone,
      organization: { name: organization },
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
    const existingDbUser = await getUserByAuthId(user.uid);
    if (!existingDbUser) {
      const [fname, ...lnameParts] = user.displayName?.split(' ') || ['', ''];

      await createUser({
        auth_id: user.uid,
        fname,
        lname: lnameParts.join(' '),
        email: user.email!,
        phone: user.phoneNumber || '',
        organization: { name: '' } // Company is initially empty
      });
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
}

// Update Password
export const updateUserPassword = (user: FirebaseAuthUser, newPassword: string): Promise<void> => {
  return updatePassword(user, newPassword);
}


