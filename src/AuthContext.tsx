import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  updatePassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { useIdleTimeout } from './hooks/useIdleTimeout';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (userData: Partial<User>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  quickBypassLogin: (role: 'admin' | 'faculty' | 'telecaller' | 'qc' | 'student' | 'marketing', customEmail?: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  isAdmin: boolean;
  isQC: boolean;
  isElevated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of hardcoded admin emails
const ADMIN_EMAILS = [
  'adminendlessspark@gmail.com',
  'endlessspark.in@gmail.com',
  'info@endlesssparkcreativehub.in',
  // Add your new email address here to grant admin access
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pauseRunningProjects = useCallback(async (studentId: string) => {
    try {
      const q = query(
        collection(db, 'student_projects'),
        where('studentId', '==', studentId),
        where('isTimerRunning', '==', true)
      );
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        const p = docSnap.data();
        const startTime = new Date(p.lastTimerStart).getTime();
        const endTime = Date.now();
        let sessionTimeMinutes = Math.ceil((endTime - startTime) / 60000);
        
        // Cap single session time at 10 hours (600 minutes) as requested
        if (sessionTimeMinutes > 600) {
          sessionTimeMinutes = 600;
        }

        await updateDoc(doc(db, 'student_projects', docSnap.id), {
          isTimerRunning: false,
          lastTimerStart: null,
          workStatus: 'Paused',
          actualTime: (p.actualTime || 0) + sessionTimeMinutes,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error auto-pausing projects on logout/idle:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    if (user?.id && user.role === 'student') {
      await pauseRunningProjects(user.id);
    }
    localStorage.removeItem('sandbox_bypass_user');
    await signOut(auth);
    setUser(null);
  }, [user, pauseRunningProjects]);

  const isAdmin = user?.role === 'admin' || (auth.currentUser?.email && ADMIN_EMAILS.includes(auth.currentUser.email)) || (user?.email && ADMIN_EMAILS.includes(user.email)) || false;
  const isQC = user?.role === 'qc';
  const isElevated = isAdmin || isQC;

  // Auto-pause active project timers if a student is inactive for 15 minutes
  useIdleTimeout(() => {
    if (user && user.role === 'student' && !isAdmin) {
      console.log("Student idle for 15 minutes, auto-pausing running projects...");
      pauseRunningProjects(user.id);
    }
  }, 15);

  // Idle timeout: 30 minutes of inactivity logs students out for security
  useIdleTimeout(() => {
    if (user && user.role === 'student' && !isAdmin) {
      console.log("Student idle for 30 minutes, logging out for security...");
      logout();
    }
  }, 30);

  // Auto-pause project on page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && user.role === 'student' && user.id) {
        pauseRunningProjects(user.id);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, pauseRunningProjects]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) {
          console.warn("Auth loading timeout reached");
          return false;
        }
        return prev;
      });
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // Check if there is a cached bypass user first
    const bypassString = localStorage.getItem('sandbox_bypass_user');
    if (bypassString) {
      try {
        const bypassUserObj = JSON.parse(bypassString);
        setUser(bypassUserObj);
        setIsLoading(false);
        return; // Skip setting up onAuthStateChanged since we are in bypass mode
      } catch (e) {
        localStorage.removeItem('sandbox_bypass_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time updates to the user profile
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const newData = docSnap.data() as User;
            
            // Check for expiry
            if (newData.role === 'student' && newData.expiryDate && new Date(newData.expiryDate) < new Date()) {
              signOut(auth).catch(console.error);
              setUser(null);
              setIsLoading(false);
              return;
            }

            // Check for password expiry (30 days) - Disabled as requested by admin
            /*
            const hasPasswordProvider = firebaseUser.providerData.some(p => p.providerId === 'password');
            if (hasPasswordProvider) {
              const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
              const lastUpdate = newData.lastPasswordUpdate ? new Date(newData.lastPasswordUpdate).getTime() : 0;
              if (Date.now() - lastUpdate > THIRTY_DAYS && !newData.mustChangePassword) {
                updateDoc(userDocRef, { mustChangePassword: true }).catch(console.error);
              }
            }
            */

            setUser(prev => {
              if (JSON.stringify(prev) === JSON.stringify(newData)) {
                return prev;
              }
              return newData;
            });
            // Cache successful profile to support offline/quota-limited sandbox mode
            localStorage.setItem(`cached_user_profile_${firebaseUser.uid}`, JSON.stringify(newData));
          } else {
            console.warn("User document not found in Firestore");
            // If the email is in hardcoded admins, allow entry as a placeholder admin
            if (firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email)) {
              setUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Admin',
                email: firebaseUser.email,
                role: 'admin',
                isApproved: true,
                username: firebaseUser.email.split('@')[0],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as any);
            }
          }
          setIsLoading(false);
        }, (error) => {
          setIsLoading(false);
          
          // Attempt recovery using cached profile
          const cached = localStorage.getItem(`cached_user_profile_${firebaseUser.uid}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setUser(parsed);
              console.warn("Recovered user profile from local cache following Firestore read/rate-limit error:", error);
              return;
            } catch (e) {
              console.error("Malformed profile cache:", e);
            }
          }

          // Generate synthetic sandbox profile based on authentication state
          if (firebaseUser.email) {
            const role = ADMIN_EMAILS.includes(firebaseUser.email) ? 'admin' : 'student';
            const fallbackProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              role: role,
              isApproved: true,
              username: firebaseUser.email.split('@')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setUser(fallbackProfile as any);
            console.warn("Created dynamic offline/sandbox user profile:", fallbackProfile);
            return;
          }

          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    try {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password.trim();
      let email = cleanIdentifier;
      
      // If it's not an email, try finding by username via server API
      // Check for @ but also allow registration numbers which might not be emails
      if (!cleanIdentifier.includes('@')) {
        const response = await fetch('/api/get-email-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanIdentifier })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Username or Registration Number not found. Please check your spelling or use your registered email address.');
        }
        
        const data = await response.json();
        email = data.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, cleanPassword);
      const firebaseUser = userCredential.user;
      
      // Fetch user doc to check status
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        if (userData.role === 'student' && userData.isPhasedOut) {
          await signOut(auth);
          throw new Error('Your account has been phased out due to guideline violations or unpaid fees. Please contact administration.');
        }
        if (userData.role === 'student' && userData.expiryDate && new Date(userData.expiryDate) < new Date()) {
          await signOut(auth);
          throw new Error('Your course duration has expired. Please contact administration to extend your access.');
        }
        return true;
      }
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid username/email or password. If you originally signed up with Google, please continue with Google or use "Forgot Password" to set a password for your email.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password login is not enabled in Firebase. Please enable it in Firebase Console.');
      }
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset password error:", error);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      }
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user doc exists, if not create it
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const isAdminEmail = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email);
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
          email: firebaseUser.email || '',
          role: isAdminEmail ? 'admin' : 'student',
          isApproved: isAdminEmail, 
          registeredForDemo: false,
          applicationStatus: 'pending',
          videoRecorded: false,
          quizCompleted: false,
          completedModules: [],
          scores: {
            productionArtEngineer: {},
            printReadyEngineer: {},
            qualityControlEngineer: {},
          },
        };
        await setDoc(userDocRef, newUser);
      } else {
        const userData = userDoc.data() as User;
        const isAdminEmail = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email);
        
        // Auto-upgrade to admin if email matches but role is student
        if (isAdminEmail && userData.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
        }

        if (userData.role === 'student' && userData.isPhasedOut) {
          await signOut(auth);
          throw new Error('Your account has been phased out due to guideline violations or unpaid fees. Please contact administration.');
        }
        if (userData.role === 'student' && userData.expiryDate && new Date(userData.expiryDate) < new Date()) {
          await signOut(auth);
          throw new Error('Your course duration has expired. Please contact administration to extend your access.');
        }
      }
      return true;
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please ensure: 1) You are not blocking third-party cookies (check browser settings/ad blockers). 2) The current domain is added to Authorized Domains in Firebase Console (Authentication > Settings > Authorized domains).');
      }
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Unauthorized domain. Please add the current application domain to the "Authorized Domains" list in your Firebase Console (Authentication > Settings > Authorized domains).');
      }
      if (error.code === 'auth/popup-closed-by-user') {
        const isIframe = window.self !== window.top;
        if (isIframe) {
          throw new Error('Google Sign-in was blocked or closed. Because the application is running in an iframe (the AI Studio preview), the browser blocks cross-origin popup contexts. Please click "Open in new tab" at the top-right of your screen to log in safely!');
        }
        throw new Error('Sign-in popup was closed before completing the login. Please try again.');
      }
      if (error.code === 'auth/email-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('Mail ID already used. Please login with your original method (e.g., Email/Password).');
      }
      throw error;
    }
  }, []);

  const signup = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!userData.email || !userData.password) throw new Error('Email and password are required');
      
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name || '',
        username: userData.username || userData.email,
        email: userData.email,
        role: 'student',
        isApproved: false,
        registeredForDemo: false,
        applicationStatus: 'pending',
        videoRecorded: false,
        quizCompleted: false,
        completedModules: [],
        scores: {
          productionArtEngineer: {},
          printReadyEngineer: {},
          qualityControlEngineer: {},
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // Trigger WhatsApp notification via server API (non-blocking)
      fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: userData.name,
          studentEmail: userData.email,
        })
      }).catch(err => console.error("WhatsApp trigger failed:", err));

      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Mail ID already used. Please login instead.');
      }
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!auth.currentUser) {
      // If we are in sandbox/bypass mode, update the local state and localStorage!
      const isBypass = localStorage.getItem('sandbox_bypass_user');
      if (isBypass) {
        try {
          const currentUserObj = JSON.parse(isBypass);
          const updatedUserObj = { ...currentUserObj, ...updates };
          localStorage.setItem('sandbox_bypass_user', JSON.stringify(updatedUserObj));
          setUser(updatedUserObj);
          return;
        } catch (e) {
          console.error("Failed to parse sandbox user", e);
        }
      }
      // Fallback fallback to local state if no item in localStorage
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, updates);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!auth.currentUser) throw new Error("No user is currently signed in.");
    
    try {
      await updatePassword(auth.currentUser, newPassword);
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { 
        mustChangePassword: false,
        lastPasswordUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("For security reasons, this operation requires a recent login. Please log out and log in again, then try changing your password.");
      }
      throw error;
    }
  }, []);

  const quickBypassLogin = useCallback(async (role: 'admin' | 'faculty' | 'telecaller' | 'qc' | 'student' | 'marketing', customEmail?: string) => {
    setIsLoading(true);
    let email = customEmail;
    if (!email) {
      if (role === 'admin') email = 'info@endlesssparkcreativehub.in';
      else if (role === 'qc') email = 'qc@endlesssparkcreativehub.in';
      else if (role === 'faculty') email = 'faculty@endlesssparkcreativehub.in';
      else if (role === 'telecaller') email = 'telecaller@endlesssparkcreativehub.in';
      else if (role === 'marketing') email = 'marketing@endlesssparkcreativehub.in';
      else email = 'student@endlesssparkcreativehub.in';
    }
    
    const bypassUserObj: User = {
      id: `bypass-${role}-${Date.now()}`,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: email,
      role: role,
      status: 'active' as any,
      isApproved: true,
      registeredForDemo: role === 'student' ? true : false,
      applicationStatus: 'approved',
      username: email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentId: role === 'student' ? `STU-${Math.random().toString(36).substring(2,8).toUpperCase()}` : undefined
    } as any;

    localStorage.setItem('sandbox_bypass_user', JSON.stringify(bypassUserObj));
    setUser(bypassUserObj);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, resetPassword, logout, quickBypassLogin, updateUser, changePassword, isLoading, isAdmin, isQC, isElevated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
