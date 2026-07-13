export interface FraudRules {
  velocityThreshold: number;
  maxOrderValueAlert: number;
  bannedKeywords: string[];
  autoSuspendEnabled: boolean;
  autoSuspendThreshold: number;
  requirePhoneVerification: boolean;
  blockVPNOrders: boolean;
  blockedIPs: string[];
  updatedAt: string;
}

export const DEFAULT_FRAUD_RULES: FraudRules = {
  velocityThreshold: 5,          // max orders per hour per email/IP
  maxOrderValueAlert: 2000,      // alert if single order > GH₵2000
  bannedKeywords: ['scam', 'fake', 'replica', 'counterfeit', 'fraud'],
  autoSuspendEnabled: true,
  autoSuspendThreshold: 3,       // suspend after N failed velocity checks
  requirePhoneVerification: true,
  blockVPNOrders: false,
  blockedIPs: ['185.220.101.42', '103.245.89.12'], // pre-seed with some suspicious proxy IPs for rich visuals
  updatedAt: new Date().toISOString(),
};

// Global standard storage cache to survive module reload boundaries in some environments
let cachedRules: FraudRules = (global as any).africartFraudRules;

if (!cachedRules) {
  cachedRules = (global as any).africartFraudRules = { ...DEFAULT_FRAUD_RULES };
}

export function getFraudRules(): FraudRules {
  return cachedRules;
}

export function updateFraudRules(newRules: Partial<FraudRules>): FraudRules {
  cachedRules = (global as any).africartFraudRules = {
    ...cachedRules,
    ...newRules,
    updatedAt: new Date().toISOString(),
  };
  return cachedRules;
}

export function checkIPBlocked(ip: string): boolean {
  if (!cachedRules.blockedIPs) return false;
  return cachedRules.blockedIPs.includes(ip);
}
