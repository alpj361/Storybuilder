import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,

            signIn: async (email: string, password: string) => {
                set({ isLoading: true });
                const result = await authService.signIn(email, password);

                if (result.success && result.user && result.session) {
                    set({
                        user: result.user,
                        session: result.session,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return { success: true };
                } else {
                    set({ isLoading: false });
                    return { success: false, error: result.error };
                }
            },

            signUp: async (email: string, password: string) => {
                set({ isLoading: true });
                const result = await authService.signUp(email, password);

                if (result.success) {
                    if (result.session) {
                        // Auto-login if session is provided
                        set({
                            user: result.user || null,
                            session: result.session,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } else {
                        // Signup successful but no session (email confirmation likely required)
                        set({ isLoading: false });
                    }
                    return { success: true, error: result.session ? undefined : 'Please check your email to confirm your account.' };
                } else {
                    set({ isLoading: false });
                    return { success: false, error: result.error };
                }
            },

            signOut: async () => {
                set({ isLoading: true });
                await authService.signOut();
                set({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            checkSession: async () => {
                set({ isLoading: true });
                const session = await authService.getSession();
                const user = await authService.getCurrentUser();

                if (session && user) {
                    set({
                        user,
                        session,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    set({
                        user: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            setSession: (session: Session | null) => {
                set({ session });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                session: state.session,
            }),
        }
    )
);

// Selector hooks for better performance
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
