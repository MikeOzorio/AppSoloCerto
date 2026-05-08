import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const profileToUser = (profile, authUser) => ({
  id: profile?.id || authUser?.id,
  name: profile?.name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'Usuário',
  email: profile?.email || authUser?.email,
  role: profile?.role || authUser?.user_metadata?.role || 'user',
  trialDays: profile?.trial_days ?? Number(authUser?.user_metadata?.trial_days || 0),
  createdAt: profile?.created_at || authUser?.created_at
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadUsers = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,role,trial_days,created_at')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
    const mapped = (data || []).map(profileToUser);
    setUsers(mapped);
    return mapped;
  };

  const loadCurrentUser = async (authUser) => {
    if (!supabase || !authUser) {
      setUser(null);
      return null;
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,name,email,role,trial_days,created_at')
      .eq('id', authUser.id)
      .maybeSingle();
    if (error) console.error('Erro ao carregar perfil:', error);
    const mapped = profileToUser(profile, authUser);
    setUser(mapped);
    return mapped;
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      setLoading(true);
      setAuthError('');
      if (!isSupabaseConfigured || !supabase) {
        setAuthError('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      if (data.session?.user) {
        await loadCurrentUser(data.session.user);
        await loadUsers();
      } else {
        setUser(null);
        setUsers([]);
      }
      setLoading(false);
    };
    boot();
    if (!supabase) return () => { mounted = false; };
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        await loadCurrentUser(session.user);
        await loadUsers();
      } else {
        setUser(null);
        setUsers([]);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message || 'E-mail ou senha incorretos.' };
    if (data.user) {
      await loadCurrentUser(data.user);
      await loadUsers();
    }
    return { success: true };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setUsers([]);
  };

  const createUser = async (name, email, password, role = 'user', trialDays = 0) => {
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem criar contas.' };
    }
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, trial_days: Number(trialDays) } }
    });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role,
        trial_days: Number(trialDays)
      });
    }
    await loadUsers();
    return { success: true };
  };

  const value = useMemo(() => ({
    user,
    users,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    createUser,
    refreshUsers: loadUsers
  }), [user, users, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
