import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearOldSupabaseAuthStorage, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + Number(days || 0));
  return result.toISOString();
};

const withTimeout = (promise, ms = 12000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado ao comunicar com o Supabase.')), ms)),
]);

const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  if (!['trialing', 'active'].includes(subscription.status)) return false;
  if (!subscription.ends_at) return true;
  return new Date(subscription.ends_at).getTime() >= Date.now();
};

const profileToUser = (profile, authUser, subscription) => ({
  id: profile?.id || authUser?.id,
  firstName: profile?.first_name || authUser?.user_metadata?.first_name || '',
  lastName: profile?.last_name || authUser?.user_metadata?.last_name || '',
  name: profile?.name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'Usuário',
  email: profile?.email || authUser?.email,
  phone: profile?.phone || authUser?.user_metadata?.phone || '',
  birthDate: profile?.birth_date || authUser?.user_metadata?.birth_date || '',
  cpf: profile?.cpf || authUser?.user_metadata?.cpf || '',
  role: profile?.role || authUser?.user_metadata?.role || 'user',
  emailVerified: Boolean(authUser?.email_confirmed_at),
  phoneVerified: Boolean(profile?.phone_verified_at),
  createdAt: profile?.created_at || authUser?.created_at,
  subscription,
  hasActiveSubscription: isSubscriptionActive(subscription),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadSubscription = async (userId) => {
    if (!supabase || !userId) return null;
    const { data, error } = await withTimeout(
      supabase.from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    if (error) {
      console.error('Erro ao carregar assinatura:', error);
      return null;
    }
    return data;
  };

  const loadUsers = async (force = false) => {
    if (!supabase) return [];
    if (!force && user?.role !== 'admin') return [];
    const { data, error } = await withTimeout(
      supabase.from('profiles')
        .select('id,name,first_name,last_name,email,phone,birth_date,cpf,role,created_at')
        .order('created_at', { ascending: true })
    );
    if (error) {
      console.error('Erro ao carregar usuários:', error);
      return [];
    }
    const mapped = (data || []).map((profile) => profileToUser(profile, null, null));
    setUsers(mapped);
    return mapped;
  };

  const loadCurrentUser = async (authUser) => {
    if (!supabase || !authUser) {
      setUser(null);
      return null;
    }

    let profile = null;
    const { data: profileData, error: profileError } = await withTimeout(
      supabase.from('profiles')
        .select('id,name,first_name,last_name,email,phone,birth_date,cpf,role,created_at,phone_verified_at')
        .eq('id', authUser.id)
        .maybeSingle()
    );

    if (profileError) {
      console.error('Erro ao carregar perfil:', profileError);
    } else {
      profile = profileData;
    }

    // Garante que usuário antigo sem profile não fica preso no F5.
    if (!profile) {
      const fullName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário';
      const { data: insertedProfile, error: insertError } = await supabase.from('profiles').upsert({
        id: authUser.id,
        name: fullName,
        first_name: authUser.user_metadata?.first_name || '',
        last_name: authUser.user_metadata?.last_name || '',
        phone: authUser.user_metadata?.phone || '',
        email: authUser.email,
        birth_date: authUser.user_metadata?.birth_date || null,
        cpf: authUser.user_metadata?.cpf || '',
        role: authUser.user_metadata?.role || 'user',
      }).select('id,name,first_name,last_name,email,phone,birth_date,cpf,role,created_at,phone_verified_at').maybeSingle();

      if (!insertError) profile = insertedProfile;
      if (insertError) console.error('Erro ao criar perfil automático:', insertError);
    }

    const subscription = await loadSubscription(authUser.id);
    const mapped = profileToUser(profile, authUser, subscription);
    setUser(mapped);

    if (mapped.role === 'admin') {
      await loadUsers(true);
    } else {
      setUsers([]);
    }

    return mapped;
  };

  const restoreSession = async () => {
    setLoading(true);
    setAuthError('');

    if (!isSupabaseConfigured || !supabase) {
      setAuthError('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      setUser(null);
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      clearOldSupabaseAuthStorage();
      const { data, error } = await withTimeout(supabase.auth.getSession());
      if (error) throw error;

      if (data.session?.user) {
        await loadCurrentUser(data.session.user);
      } else {
        setUser(null);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      setAuthError('Não foi possível restaurar sua sessão. Verifique a conexão e tente atualizar a página.');
      setUser(null);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    restoreSession();

    if (!supabase) {
      return () => { mounted = false; };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Evita deadlock/travamento no refresh: não aguarda queries Supabase dentro do callback.
      setTimeout(async () => {
        if (!mounted) return;
        try {
          setAuthError('');
          if (session?.user) {
            await loadCurrentUser(session.user);
          } else {
            setUser(null);
            setUsers([]);
          }
        } catch (error) {
          console.error('Erro ao atualizar sessão:', error);
          setAuthError('Erro ao atualizar sessão.');
        } finally {
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { success: false, error: error.message || 'E-mail ou senha incorretos.' };
    }
    if (data.user) await loadCurrentUser(data.user);
    setLoading(false);
    return { success: true };
  };

  const signup = async ({ firstName, lastName, phone, email, birthDate, cpf, password }) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const cleanCpf = (cpf || '').replace(/\D/g, '');
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: fullName, first_name: firstName, last_name: lastName, phone, birth_date: birthDate, cpf: cleanCpf },
      },
    });
    if (error) return { success: false, error: error.message };

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        birth_date: birthDate || null,
        cpf: cleanCpf,
        role: 'user',
      });
      if (profileError) return { success: false, error: profileError.message };
      await loadCurrentUser(data.user);
    }

    return {
      success: true,
      needsEmailConfirmation: !data.session,
      message: data.session ? 'Cadastro criado. Escolha seu teste grátis ou assinatura.' : 'Cadastro criado. Confira seu e-mail para validar a conta antes de entrar.',
    };
  };

  const startTrial = async () => {
    if (!supabase || !user?.id) return { success: false, error: 'Usuário não autenticado.' };
    const now = new Date().toISOString();
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_code: 'trial_15',
      status: 'trialing',
      starts_at: now,
      trial_ends_at: addDays(now, 15),
      ends_at: addDays(now, 15),
      amount_cents: 0,
      currency: 'BRL',
      payment_provider: 'manual',
    }, { onConflict: 'user_id' });
    if (error) return { success: false, error: error.message };
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await loadCurrentUser(authUser);
    return { success: true };
  };

  const choosePlan = async (plan) => {
    if (!supabase || !user?.id) return { success: false, error: 'Usuário não autenticado.' };
    const now = new Date().toISOString();
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan_code: plan.id,
      status: 'pending_payment',
      starts_at: now,
      ends_at: null,
      amount_cents: Math.round(Number(plan.price || 0) * 100),
      currency: 'BRL',
      payment_provider: 'manual',
    }, { onConflict: 'user_id' });
    if (error) return { success: false, error: error.message };
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await loadCurrentUser(authUser);
    return { success: true };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setUsers([]);
  };

  const createUser = async (name, email, password, role = 'user', trialDays = 0) => {
    if (!user || user.role !== 'admin') return { success: false, error: 'Apenas administradores podem criar contas.' };
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, trial_days: Number(trialDays) } },
    });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, name, email, role });
      if (Number(trialDays) > 0) {
        await supabase.from('subscriptions').upsert({
          user_id: data.user.id,
          plan_code: 'trial_admin',
          status: 'trialing',
          starts_at: new Date().toISOString(),
          trial_ends_at: addDays(new Date(), Number(trialDays)),
          ends_at: addDays(new Date(), Number(trialDays)),
          amount_cents: 0,
          currency: 'BRL',
          payment_provider: 'manual',
        }, { onConflict: 'user_id' });
      }
    }
    await loadUsers(true);
    return { success: true };
  };

  const value = useMemo(() => ({
    user,
    users,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    hasActiveSubscription: user?.role === 'admin' || Boolean(user?.hasActiveSubscription),
    login,
    signup,
    logout,
    createUser,
    startTrial,
    choosePlan,
    refreshUsers: () => loadUsers(true),
    refreshCurrentUser: async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return loadCurrentUser(data.user);
      return null;
    },
    restoreSession,
  }), [user, users, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
