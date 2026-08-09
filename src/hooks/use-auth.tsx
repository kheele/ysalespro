"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { auth, signInWithEmail as firebaseSignInWithEmail, signUpWithEmail as firebaseSignUpWithEmail, signInWithGoogle as firebaseSignInWithGoogle, sendPasswordReset, signOut as firebaseSignOut, updateUserEmail as firebaseUpdateUserEmail, updateUserPassword as firebaseUpdateUserPassword } from '@/lib/auth';
import { setProjectClaimByToken, initializeUserClaimsAction } from '@/services/authService';
import { getUserByAuthId } from '@/services/userService';
import type { User as DbUser, Organization } from '@/lib/types';

interface SignUpData {
  email: string;
  password: string;
  fname: string;
  lname: string;
  phone?: string;
  organization: string;
  role?: DbUser['role'];
  invitation_token?: string;
}
interface AuthContextType {
  user: FirebaseAuthUser | null;
  dbUser: DbUser | null;
  setDbUser: React.Dispatch<React.SetStateAction<DbUser | null>>;
  loading: boolean;
  projectId: string | null;
  setProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchDbUser: (user: FirebaseAuthUser, forceRefresh?: boolean) => Promise<any>;
  signInWithEmail: typeof firebaseSignInWithEmail;
  signUpWithEmail: (data: SignUpData) => Promise<any>;
  signInWithGoogle: typeof firebaseSignInWithGoogle;
  sendPasswordReset: typeof sendPasswordReset;
  signOut: () => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setCustomClaims(user: FirebaseAuthUser) {
  try {
    const token = await user.getIdToken(true);
    await initializeUserClaimsAction(token);
    // Force refresh the token to get the new claims
    await user.getIdToken(true);
  } catch (error) {
    console.error("Error setting custom claims:", error);
    // Decide if this should throw or be handled gracefully
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = useCallback(async (firebaseUser: FirebaseAuthUser, forceRefresh = false) => {
    try {
      if (forceRefresh) {
        await setCustomClaims(firebaseUser);
      }

      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const { claims } = idTokenResult;

      const appUser = await getUserByAuthId(firebaseUser.uid);

      setDbUser(appUser);
      setProjectId((claims as any).projectId || null);
      return appUser;
    } catch (error) {
      console.error("Failed to fetch database user:", error);
      setDbUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setLoading(true);
        await setCustomClaims(firebaseUser);
        await fetchDbUser(firebaseUser);
        setLoading(false);
      } else {
        setDbUser(null);
        setProjectId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchDbUser]);

  const signInWithEmail = async (email: string, password: string) => {
    const userCredential = await firebaseSignInWithEmail(email, password);
    if (userCredential.user) {
      await setCustomClaims(userCredential.user);
    }
    return userCredential;
  }

  const signUpWithEmail = async (data: SignUpData) => {
    const userCredential = await firebaseSignUpWithEmail(data);
    if (userCredential.user) {
      await setCustomClaims(userCredential.user);
    }
    return userCredential;
  }

  const signInWithGoogle = async () => {
    const userCredential = await firebaseSignInWithGoogle();
    if (userCredential.user) {
      await setCustomClaims(userCredential.user);
    }
    return userCredential;
  }

  const signOut = async () => {
    if (user) {
      const idTokenResult = await user.getIdTokenResult(true);
      if (idTokenResult.claims.projectId) {
        const token = await user.getIdToken(true);
        await setProjectClaimByToken(token, null);
      }
    }
    await firebaseSignOut();
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!user) throw new Error("Not authenticated");
    await firebaseUpdateUserEmail(user, newEmail);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!user) throw new Error("Not authenticated");
    await firebaseUpdateUserPassword(user, newPassword);
  };


  const value = {
    user,
    dbUser,
    setDbUser,
    loading,
    fetchDbUser,
    projectId,
    setProjectId,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    signOut,
    updateUserEmail,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
