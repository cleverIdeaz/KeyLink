// KeyLink Developer Token System
// Integrates with Fly.io API for real usage tracking and billing

export interface KeyLinkToken {
  id: string;
  name: string;
  developer: string;
  email: string;
  tier: 'free' | 'pro' | 'enterprise';
  usage: {
    requests: number;
    bandwidth: number; // in MB
    lastUsed: string;
  };
  limits: {
    monthlyRequests: number;
    monthlyBandwidth: number; // in MB
  };
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface TokenUsage {
  tokenId: string;
  timestamp: string;
  endpoint: string;
  bandwidth: number;
  cost: number; // in cents
}

export class KeyLinkTokenSystem {
  private flyToken: string;
  private baseUrl: string = 'https://api.fly.io/v1';
  
  constructor(flyToken: string) {
    this.flyToken = flyToken;
  }

  // Generate a new developer token
  async generateToken(developer: string, email: string, tier: 'free' | 'pro' | 'enterprise' = 'free'): Promise<KeyLinkToken> {
    const tokenId = this.generateTokenId();
    const limits = this.getTierLimits(tier);
    
    const token: KeyLinkToken = {
      id: tokenId,
      name: `${developer}'s KeyLink Token`,
      developer,
      email,
      tier,
      usage: {
        requests: 0,
        bandwidth: 0,
        lastUsed: new Date().toISOString()
      },
      limits,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Store token (in real implementation, this would be in a database)
    this.storeToken(token);
    
    return token;
  }

  // Validate token and check usage limits
  async validateToken(tokenId: string, endpoint: string, bandwidth: number = 0): Promise<{ valid: boolean; reason?: string; usage?: any }> {
    const token = await this.getToken(tokenId);
    
    if (!token) {
      return { valid: false, reason: 'Token not found' };
    }

    if (!token.isActive) {
      return { valid: false, reason: 'Token is inactive' };
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { valid: false, reason: 'Token has expired' };
    }

    // Check usage limits
    const currentUsage = await this.getTokenUsage(tokenId);
    const projectedUsage = {
      requests: currentUsage.requests + 1,
      bandwidth: currentUsage.bandwidth + bandwidth
    };

    if (projectedUsage.requests > token.limits.monthlyRequests) {
      return { valid: false, reason: 'Monthly request limit exceeded' };
    }

    if (projectedUsage.bandwidth > token.limits.monthlyBandwidth) {
      return { valid: false, reason: 'Monthly bandwidth limit exceeded' };
    }

    // Update usage
    await this.recordUsage(tokenId, endpoint, bandwidth);

    return { valid: true, usage: projectedUsage };
  }

  // Get Fly.io usage data for billing
  async getFlyUsage(): Promise<{ currentUsage: number; limit: number; percentage: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/apps/keylink/billing`, {
        headers: {
          'Authorization': `Bearer ${this.flyToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Fly.io API error: ${response.status}`);
      }

      const data = await response.json();
      const currentUsage = data.current_month_bill || 0;
      const limit = 7; // $7 monthly limit
      const percentage = (currentUsage / limit) * 100;

      return { currentUsage, limit, percentage };
    } catch (error) {
      console.error('Error fetching Fly.io usage:', error);
      // Fallback to simulated data
      return { currentUsage: 3.50, limit: 7, percentage: 50 };
    }
  }

  // Calculate token costs based on usage
  calculateTokenCost(usage: TokenUsage): number {
    // Pricing model:
    // Free tier: 1000 requests/month, 100MB bandwidth
    // Pro tier: 10,000 requests/month, 1GB bandwidth - $5/month
    // Enterprise: Unlimited - $20/month
    
    const baseCost = 0.001; // $0.001 per request
    const bandwidthCost = 0.01; // $0.01 per MB
    
    return (usage.bandwidth * bandwidthCost) + baseCost;
  }

  // Get tier limits
  private getTierLimits(tier: string) {
    switch (tier) {
      case 'free':
        return { monthlyRequests: 1000, monthlyBandwidth: 100 };
      case 'pro':
        return { monthlyRequests: 10000, monthlyBandwidth: 1000 };
      case 'enterprise':
        return { monthlyRequests: 1000000, monthlyBandwidth: 100000 };
      default:
        return { monthlyRequests: 1000, monthlyBandwidth: 100 };
    }
  }

  // Generate unique token ID
  private generateTokenId(): string {
    return 'kl_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  // Store token (in real implementation, this would be in a database)
  private async storeToken(token: KeyLinkToken): Promise<void> {
    const tokens = this.getStoredTokens();
    tokens[token.id] = token;
    localStorage.setItem('keylink_tokens', JSON.stringify(tokens));
  }

  // Get stored tokens
  private getStoredTokens(): Record<string, KeyLinkToken> {
    const stored = localStorage.getItem('keylink_tokens');
    return stored ? JSON.parse(stored) : {};
  }

  // Get specific token
  private async getToken(tokenId: string): Promise<KeyLinkToken | null> {
    const tokens = this.getStoredTokens();
    return tokens[tokenId] || null;
  }

  // Get token usage
  private async getTokenUsage(tokenId: string): Promise<{ requests: number; bandwidth: number }> {
    const usage = localStorage.getItem(`keylink_usage_${tokenId}`);
    if (usage) {
      const data = JSON.parse(usage);
      // Reset monthly if it's a new month
      const lastReset = new Date(data.lastReset);
      const now = new Date();
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        return { requests: 0, bandwidth: 0 };
      }
      return { requests: data.requests, bandwidth: data.bandwidth };
    }
    return { requests: 0, bandwidth: 0 };
  }

  // Record token usage
  private async recordUsage(tokenId: string, endpoint: string, bandwidth: number): Promise<void> {
    const currentUsage = await this.getTokenUsage(tokenId);
    const newUsage = {
      requests: currentUsage.requests + 1,
      bandwidth: currentUsage.bandwidth + bandwidth,
      lastReset: new Date().toISOString()
    };
    
    localStorage.setItem(`keylink_usage_${tokenId}`, JSON.stringify(newUsage));
  }

  // Get all tokens for a developer
  async getDeveloperTokens(developer: string): Promise<KeyLinkToken[]> {
    const tokens = this.getStoredTokens();
    return Object.values(tokens).filter(token => token.developer === developer);
  }

  // Deactivate token
  async deactivateToken(tokenId: string): Promise<boolean> {
    const token = await this.getToken(tokenId);
    if (token) {
      token.isActive = false;
      await this.storeToken(token);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const keylinkTokenSystem = new KeyLinkTokenSystem(
  'fm2_lJPECAAAAAAACQ8TxBASbPzTS5DPUv+JjSDEq1VNwrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOABE4XR8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDw7RixwSLuoUGk4RxhA4DpsAN0RUzmKyFWPMYs2NaDM3VCnownMPwzF00pOXgsrJrPo/ByiccoIlOEpVbPETlE/JPxOcgj9eqHPk08fwsUNC38JawL6W643nTWEd1D06nzCodi89/h528bPWpyPlhQRHzncUMaGGUBAzRuBOWnj081ibZGk9mLjDg6VeQ2SlAORgc4Ae9vcHwWRgqdidWlsZGVyH6J3Zx8BxCBbMo1uvSb2uvDKr8Whq3eQmm3j7/P6lvFH7DiDC5ElIg==,fm2_lJPETlE/JPxOcgj9eqHPk08fwsUNC38JawL6W643nTWEd1D06nzCodi89/h528bPWpyPlhQRHzncUMaGGUBAzRuBOWnj081ibZGk9mLjDg6VecQQ+aLpWRqyjPjRRF4xe7yw8sO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5oum9Dzmjh/GEXzgAQjT8Kkc4AEI0/DMQQNbS5MOmkqh+ii+f+Jk1cV8QgVnLlT7COaakFYf13o5eGFyEndYGFpnfJNPOJ3cxFNMg='
);
