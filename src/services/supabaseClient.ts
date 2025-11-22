import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// @ts-ignore
import env from '../../env.json';

// Try to get config from multiple sources for maximum robustness
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('[supabaseClient] Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('[supabaseClient] Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[supabaseClient] Missing Supabase credentials!');
    console.error('[supabaseClient] Available extra keys:', Object.keys(Constants.expoConfig?.extra || {}));
    throw new Error('Missing Supabase environment variables. Check env.json');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types for our database
export type Database = {
    public: {
        Tables: {
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    user_input: string | null;
                    project_type: string;
                    project_data: any;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    user_input?: string | null;
                    project_type: string;
                    project_data: any;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    description?: string | null;
                    user_input?: string | null;
                    project_type?: string;
                    project_data?: any;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
};
