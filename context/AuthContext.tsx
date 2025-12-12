import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data && !error) {
            setProfile({
                id: data.id,
                full_name: data.full_name || '',
                email: userEmail || '',
                avatar_url: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'User')}&background=8fbc8f&color=fff`,
                department: data.department || '',
                affiliation: data.affiliation || '',
                subscription_tier: data.subscription_tier || 'free',
                paper_count: data.paper_count || 0,
                subscription_started_at: data.subscription_started_at
            });
        } else if (error) {
            console.error('Error fetching profile:', error);
        }
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id, user.email);
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });

        if (!error && data.user) {
            // Create profile
            await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: fullName,
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8fbc8f&color=fff`
            });
        }

        return { error: error as Error | null };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
