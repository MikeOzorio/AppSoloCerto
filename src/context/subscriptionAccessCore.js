import { createContext, useContext } from 'react';
import { ACCESS_MODULES, SUBSCRIPTION_TIERS } from '../constants/subscriptionPlanConfig';

export const SubscriptionAccessContext = createContext(null);

const FULL_ACCESS_PLAN_CODES = new Set(['trial_15', 'trial_admin', 'mensal', 'trimestral', 'semestral', 'anual']);
const tierIds = new Set(SUBSCRIPTION_TIERS.map((tier) => tier.id));

export const getTierIdFromPlanCode = (planCode) => {
  if (!planCode) return null;
  if (FULL_ACCESS_PLAN_CODES.has(planCode)) return 'premium';

  const [tierId] = String(planCode).split('_');
  return tierIds.has(tierId) ? tierId : null;
};

export const getModuleByRoute = (pathname) => {
  if (!pathname) return null;
  return ACCESS_MODULES.find((module) => module.route === pathname) || null;
};

export const useSubscriptionAccess = () => useContext(SubscriptionAccessContext);
