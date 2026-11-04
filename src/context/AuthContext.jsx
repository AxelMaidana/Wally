import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // The profile row is created by the on_auth_user_created trigger in the database
    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error loading profile:', error);
            return null;
        }
        return data;
    };

    const signup = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        // Without a session, Supabase is waiting for the user to confirm their email
        return { ...data, needsConfirmation: !data.session };
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        // "local" ends only this device's session; the default ("global") would also
        // revoke the ones open on the phone or other tabs
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) throw error;
    };

    // Only display_name, photo_url and telegram_token are writable by the user (see the migration)
    const updateProfile = async (fields) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', user.id)
            .select()
            .single();
        if (error) throw error;
        setUserData(data);
        return data;
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load the profile outside onAuthStateChange: awaiting Supabase calls inside that callback can deadlock
    const userId = user?.id;
    useEffect(() => {
        if (!userId) return;

        let cancelled = false;
        fetchProfile(userId).then((data) => {
            if (cancelled) return;
            setUserData(data);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [userId]);

    const value = {
        user,
        userData,
        isAdmin: userData?.role === 'admin',
        signup,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
        loading
    };


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
