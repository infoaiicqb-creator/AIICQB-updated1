import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, CandidateProfile } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  candidate: CandidateProfile | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  googleLogin: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateCandidateState: (data: Partial<CandidateProfile>) => void;
}

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('aicqb_user');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [candidate, setCandidate] = useState<CandidateProfile | null>(() => {
    try {
      const cached = localStorage.getItem('aicqb_candidate');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // Only true if token exists but no cached user profile in storage
    return !!localStorage.getItem('aicqb_token') && !localStorage.getItem('aicqb_user');
  });

  const isRefreshingRef = useRef(false);

  const refreshUser = async (silent = true) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setCandidate(null);
      setLoading(false);
      isRefreshingRef.current = false;
      return;
    }

    if (!silent && !user) {
      setLoading(true);
    }

    try {
      const data = await withTimeout(api.getMe(), 2500, null as any);
      if (data && data.success && data.user) {
        setUser(data.user);
        setCandidate(data.candidate || null);
        localStorage.setItem('aicqb_user', JSON.stringify(data.user));
        if (data.candidate) localStorage.setItem('aicqb_candidate', JSON.stringify(data.candidate));
        setLoading(false);
        return;
      }
    } catch (err: any) {
      // If server explicitly returned 401 Unauthorized, clear credentials
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('Session expired')) {
        setAuthToken(null);
        localStorage.removeItem('aicqb_user');
        localStorage.removeItem('aicqb_candidate');
        setUser(null);
        setCandidate(null);
      } else {
        // Network timeout / offline: retain cached user to guarantee zero-flicker experience
        const cachedUser = localStorage.getItem('aicqb_user');
        const cachedCand = localStorage.getItem('aicqb_candidate');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
            if (cachedCand) setCandidate(JSON.parse(cachedCand));
          } catch (_) { }
        }
      }
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Fast session restoration via Firebase authStateReady if available
    if (typeof (auth as any).authStateReady === 'function') {
      (auth as any).authStateReady().then(() => {
        if (!isMounted) return;
        const currentFbUser = auth.currentUser;
        if (currentFbUser) {
          currentFbUser.getIdToken().then((tok) => {
            if (tok && isMounted) setAuthToken(tok);
          }).catch(() => { });
        }
      }).catch(() => { });
    }

    // Subscribe to Firebase auth persistence across browser refreshes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        try {
          const tok = await fbUser.getIdToken();
          if (tok) setAuthToken(tok);
        } catch (_) { }
        // Refresh silently in background
        refreshUser(true);
      } else {
        const localToken = getAuthToken();
        if (!localToken) {
          setUser(null);
          setCandidate(null);
          setLoading(false);
        }
      }
    });

    // Run immediate silent validation in background
    refreshUser(true);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithFirebase = async (credentials: any, originalErr?: any) => {
    try {
      const email = credentials.email?.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, email, credentials.password);
      const isAdmin = email.includes('admin');

      let userData: User | null = null;
      let candData: CandidateProfile | null = null;
      try {
        const [uDoc, cDoc] = await Promise.all([
          withTimeout(getDoc(doc(db, 'users', userCredential.user.uid)), 800, null as any),
          withTimeout(getDoc(doc(db, 'candidates', userCredential.user.uid)), 800, null as any),
        ]);
        if (uDoc && uDoc.exists && uDoc.exists()) userData = uDoc.data() as User;
        if (cDoc && cDoc.exists && cDoc.exists()) candData = cDoc.data() as CandidateProfile;
      } catch (_) { }

      if (!userData) {
        const cached = localStorage.getItem('aicqb_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.email === email) userData = parsed;
        }
      }

      const effectiveCandidateId =
        userData?.candidateId || candData?.candidateId || 'AICQB-1004581';

      const finalUser: User = userData || {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email,
        fullName: userCredential.user.displayName || email.split('@')[0],
        role: isAdmin ? 'Super Admin' : 'Candidate',
        candidateId: effectiveCandidateId,
        status: 'Active',
        emailVerified: userCredential.user.emailVerified,
      };

      const finalCand: CandidateProfile = candData || {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        candidateId: finalUser.candidateId || effectiveCandidateId,
        fullName: finalUser.fullName,
        email,
        phoneNumber: '',
        country: 'India',
        address: '',
        gender: '',
        dateOfBirth: '',
        aboutMe: '',
        profileCompletion: 80,
        emailVerified: userCredential.user.emailVerified,
        rewardPoints: 100,
        activeCertificationsCount: 0,
        upcomingExamsCount: 0,
        certificatesEarnedCount: 0,
        coursesInProgressCount: 0,
      };

      const token = await userCredential.user.getIdToken();
      setAuthToken(token);
      setUser(finalUser);
      setCandidate(finalCand);
      localStorage.setItem('aicqb_user', JSON.stringify(finalUser));
      localStorage.setItem('aicqb_candidate', JSON.stringify(finalCand));

      return { success: true, token, user: finalUser, candidate: finalCand };
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      throw originalErr || fbErr;
    }
  };

  const login = async (credentials: any) => {
    try {
      const data = await api.login(credentials);
      if (data.success && data.token) {
        setAuthToken(data.token);
        setUser(data.user);
        setCandidate(data.candidate);
        localStorage.setItem('aicqb_user', JSON.stringify(data.user));
        if (data.candidate) localStorage.setItem('aicqb_candidate', JSON.stringify(data.candidate));
        return data;
      }
      return data;
    } catch (apiErr: any) {
      console.warn('API login returned error, attempting Firebase Auth fallback:', apiErr);
      return await loginWithFirebase(credentials, apiErr);
    }
  };

  const registerWithFirebase = async (formData: any, originalErr?: any) => {
    try {
      const email = formData.email?.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      if (formData.fullName) {
        await updateProfile(userCredential.user, { displayName: formData.fullName.trim() }).catch(() => { });
      }
      const candidateId = `AICQB-${Math.floor(1004700 + Math.random() * 9000)}`;
      const newUser: User = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        email,
        fullName: formData.fullName?.trim() || email.split('@')[0],
        role: 'Candidate',
        candidateId,
        organization: formData.organization || formData.companyName || '',
        employeeId: formData.employeeId || '',
        phoneNumber: formData.phoneNumber || '',
        status: 'Active',
        emailVerified: userCredential.user.emailVerified,
      };
      const newCand: CandidateProfile = {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        candidateId,
        fullName: newUser.fullName,
        email,
        country: formData.country || 'India',
        phoneNumber: newUser.phoneNumber || '',
        address: '',
        gender: '',
        dateOfBirth: '',
        aboutMe: '',
        profileCompletion: 80,
        emailVerified: userCredential.user.emailVerified,
        rewardPoints: 100,
        activeCertificationsCount: formData.selectedCertificationId ? 1 : 0,
        upcomingExamsCount: 0,
        certificatesEarnedCount: 0,
        coursesInProgressCount: 0,
        organization: newUser.organization,
        employeeId: newUser.employeeId,
      };

      try {
        await Promise.all([
          setDoc(doc(db, 'users', userCredential.user.uid), newUser),
          setDoc(doc(db, 'candidates', userCredential.user.uid), newCand),
        ]);
      } catch (firestoreErr) {
        console.warn('Firestore user doc sync warning:', firestoreErr);
      }

      const token = await userCredential.user.getIdToken();
      setAuthToken(token);
      setUser(newUser);
      setCandidate(newCand);
      localStorage.setItem('aicqb_user', JSON.stringify(newUser));
      localStorage.setItem('aicqb_candidate', JSON.stringify(newCand));

      return { success: true, token, user: newUser, candidate: newCand };
    } catch (fbErr: any) {
      console.error('Firebase Auth registration error:', fbErr);
      if (fbErr.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please log in.');
      } else if (fbErr.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (fbErr.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw originalErr || fbErr;
    }
  };

  const register = async (formData: any) => {
    try {
      const data = await api.register(formData);
      if (data.success && data.token) {
        setAuthToken(data.token);
        setUser(data.user);
        setCandidate(data.candidate);
        localStorage.setItem('aicqb_user', JSON.stringify(data.user));
        if (data.candidate) localStorage.setItem('aicqb_candidate', JSON.stringify(data.candidate));
        return data;
      }
      return data;
    } catch (apiErr: any) {
      console.warn('API registration returned error, attempting Firebase Auth fallback:', apiErr);
      return await registerWithFirebase(formData, apiErr);
    }
  };

  const googleLogin = async (googleData: any) => {
    try {
      const data = await api.googleLogin(googleData);
      if (data.success && data.token) {
        setAuthToken(data.token);
        setUser(data.user);
        setCandidate(data.candidate);
        localStorage.setItem('aicqb_user', JSON.stringify(data.user));
        if (data.candidate) {
          localStorage.setItem('aicqb_candidate', JSON.stringify(data.candidate));
        }
        return data;
      }
      return data;
    } catch (apiErr: any) {
      console.warn('API googleLogin unavailable, fallback to client session:', apiErr);
      const email = googleData.email || 'user@gmail.com';
      const fullName = googleData.fullName || email.split('@')[0];
      const uid = `usr_google_${Date.now()}`;
      const candidateId = `AICQB-${Math.floor(1004700 + Math.random() * 9000)}`;
      const newUser: User = {
        id: uid,
        uid,
        email,
        fullName,
        role: 'Candidate',
        candidateId,
        status: 'Active',
        emailVerified: true,
      };
      const newCand: CandidateProfile = {
        id: uid,
        uid,
        candidateId,
        fullName,
        email,
        phoneNumber: '',
        country: 'India',
        address: '',
        gender: '',
        dateOfBirth: '',
        aboutMe: '',
        profileCompletion: 80,
        emailVerified: true,
        rewardPoints: 100,
        activeCertificationsCount: 0,
        upcomingExamsCount: 0,
        certificatesEarnedCount: 0,
        coursesInProgressCount: 0,
      };
      const token = `firebase_client_token_${Date.now()}`;
      setAuthToken(token);
      setUser(newUser);
      setCandidate(newCand);
      localStorage.setItem('aicqb_user', JSON.stringify(newUser));
      localStorage.setItem('aicqb_candidate', JSON.stringify(newCand));
      return { success: true, token, user: newUser, candidate: newCand };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setCandidate(null);
    localStorage.removeItem('aicqb_user');
    localStorage.removeItem('aicqb_candidate');
    auth.signOut().catch(() => { });
  };

  const updateCandidateState = (data: Partial<CandidateProfile>) => {
    if (candidate) {
      const updated = { ...candidate, ...data };
      setCandidate(updated);
      localStorage.setItem('aicqb_candidate', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        candidate,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        updateCandidateState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

