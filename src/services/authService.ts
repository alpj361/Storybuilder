import { supabase } from './supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
    success: boolean;
    user?: User;
    session?: Session;
    error?: string;
}

export const authService = {
    /**
     * Sign up a new user with email and password
     */
    async signUp(email: string, password: string): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: true,
                user: data.user ?? undefined,
                session: data.session ?? undefined,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Sign up failed',
            };
        }
    },

    /**
     * Sign in an existing user with email and password
     */
    async signIn(email: string, password: string): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Sign in failed',
            };
        }
    },

    /**
     * Sign out the current user
     */
    async signOut(): Promise<AuthResult> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Sign out failed',
            };
        }
    },

    /**
     * Get the current session
     */
    async getSession(): Promise<Session | null> {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('[authService] Error getting session:', error);
                return null;
            }
            return data.session;
        } catch (error) {
            console.error('[authService] Failed to get session:', error);
            return null;
        }
    },

    /**
     * Get the current user
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error('[authService] Error getting user:', error);
                return null;
            }
            return data.user;
        } catch (error) {
            console.error('[authService] Failed to get user:', error);
            return null;
        }
    },

    /**
     * Send password reset email
     */
    async resetPassword(email: string): Promise<AuthResult> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
                return {
                    success: false,
                    error: error.message,
                };
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Password reset failed',
            };
        }
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },
};
