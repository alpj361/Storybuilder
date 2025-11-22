import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
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
