"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User as FirebaseAuthUser } from 'firebase/auth';
import {
  auth,
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  sendPasswordReset,
  confirmPasswordResetWithCode,
  verifyResetCode,
  signOut as firebaseSignOut,
  updateUserEmail as firebaseUpdateUserEmail,
  updateUserPassword as firebaseUpdateUserPassword,
} from '@/lib/auth';
import { initializeUserClaimsAction } from '@/services/private/authService';
import { getUserByAuthIdAction } from '@/services/private/userService';
import type { User as DbUser } from '@/lib/types';

interface SignUpData {
  email: string;
  password: string;
  fname: string;
  lname: string;
  phone?: string;
  account_company: string;
  role?: DbUser['role'];
  invitation_token?: string;
}

interface AuthContextType {
  user: FirebaseAuthUser | null;
  dbUser: DbUser | null;
  setDbUser: React.Dispatch<React.SetStateAction<DbUser | null>>;
  loading: boolean;
  accountCompanyId: number | null;
  setAccountCompanyId: React.Dispatch<React.SetStateAction<number | null>>;
  fetchDbUser: (user: FirebaseAuthUser, forceRefresh?: boolean) => Promise<any>;
  signInWithEmail: typeof firebaseSignInWithEmail;
  signUpWithEmail: (data: SignUpData) => Promise<any>;
  signInWithGoogle: typeof firebaseSignInWithGoogle;
  sendPasswordReset: typeof sendPasswordReset;
  confirmPasswordResetWithCode: typeof confirmPasswordResetWithCode;
  verifyResetCode: typeof verifyResetCode;
  signOut: () => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  syncCustomClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setCustomClaims(user: FirebaseAuthUser) {
  try {
    const token = await user.getIdToken(true);
    await initializeUserClaimsAction(token);
    await user.getIdToken(true);
  } catch (error) {
    console.warn("Custom claims synchronization notice:", error);
  }
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [accountCompanyId, setAccountCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = useCallback(async (firebaseUser: FirebaseAuthUser, forceRefresh = false) => {
    try {
      if (forceRefresh) {
        await setCustomClaims(firebaseUser);
      }

      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const { claims } = idTokenResult;

      const appUser = await getUserByAuthIdAction(firebaseUser.uid);

      setDbUser(appUser);
      const claimAccId = claims.account_company_id ? Number(claims.account_company_id) : null;
      setAccountCompanyId(claimAccId ?? appUser?.account_company_id ?? null);
      return appUser;
    } catch (error) {
      console.error("Failed to fetch database user:", error);
      setDbUser(null);
      setAccountCompanyId(null);
      return null;
    }
  }, []);

  const syncCustomClaims = useCallback(async () => {
    if (user) {
      await setCustomClaims(user);
      await fetchDbUser(user);
    }
  }, [user, fetchDbUser]);

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
        setAccountCompanyId(null);
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
  };

  const signUpWithEmail = async (data: SignUpData) => {
    const userCredential = await firebaseSignUpWithEmail({
      ...data,
      account_company: data.account_company,
    });
    if (userCredential.user) {
      await setCustomClaims(userCredential.user);
    }
    return userCredential;
  };

  const signInWithGoogle = async () => {
    const userCredential = await firebaseSignInWithGoogle();
    if (userCredential.user) {
      await setCustomClaims(userCredential.user);
    }
    return userCredential;
  };

  const signOut = async () => {
    await firebaseSignOut();
    setDbUser(null);
    setAccountCompanyId(null);
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
    accountCompanyId,
    setAccountCompanyId,
    fetchDbUser,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    confirmPasswordResetWithCode,
    verifyResetCode,
    signOut,
    updateUserEmail,
    updateUserPassword,
    syncCustomClaims,
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
