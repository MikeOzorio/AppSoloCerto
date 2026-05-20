import { useCallback, useEffect, useMemo, useState } from 'react';
import { mergeSubscriptionPlanConfig } from '../constants/subscriptionPlanConfig';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { SubscriptionAccessContext, getModuleByRoute, getTierIdFromPlanCode } from './subscriptionAccessCore';

const SETTINGS_ID = 'default';
const PUBLIC_MODULES = new Set(['subscription']);

export function SubscriptionAccessProvider({ children }) {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [config, setConfig] = useState(() => mergeSubscriptionPlanConfig());
  const [loading, setLoading] = useState(false);

  const currentTierId = useMemo(() => (
    getTierIdFromPlanCode(user?.subscription?.plan_code)
  ), [user?.subscription?.plan_code]);

  const loadAccessConfig = useCallback(async () => {
    if (!supabase || !isAuthenticated) {
      setConfig(mergeSubscriptionPlanConfig());
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('subscription_plan_settings')
      .select('plan_config')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (!error) {
      setConfig(mergeSubscriptionPlanConfig(data?.plan_config || {}));
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!supabase || !isAuthenticated) {
        if (!cancelled) setConfig(mergeSubscriptionPlanConfig());
        return;
      }

      if (!cancelled) setLoading(true);

      const { data, error } = await supabase
        .from('subscription_plan_settings')
        .select('plan_config')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

      if (cancelled) return;
      if (!error) setConfig(mergeSubscriptionPlanConfig(data?.plan_config || {}));
      setLoading(false);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const canAccess = useCallback((moduleId) => {
    if (!moduleId) return false;
    if (isAdmin) return true;
    if (PUBLIC_MODULES.has(moduleId)) return true;
    if (!currentTierId) return false;
    return Boolean(config.access?.[currentTierId]?.[moduleId]);
  }, [config, currentTierId, isAdmin]);

  const canAccessRoute = useCallback((pathname) => {
    const module = getModuleByRoute(pathname);
    if (!module) return true;
    return canAccess(module.id);
  }, [canAccess]);

  const value = useMemo(() => ({
    config,
    currentTierId,
    loading,
    canAccess,
    canAccessRoute,
    reloadAccessConfig: loadAccessConfig,
  }), [canAccess, canAccessRoute, config, currentTierId, loadAccessConfig, loading]);

  return (
    <SubscriptionAccessContext.Provider value={value}>
      {children}
    </SubscriptionAccessContext.Provider>
  );
}
