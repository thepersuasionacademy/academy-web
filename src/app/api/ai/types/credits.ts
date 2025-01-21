export interface UserCredits {
    credits_subscription_balance: number;
    credits_subscription_resetDate: string;
    credits_subscription_monthlyAllowance: number;
    credits_subscription_lastProrationDate: string;
    credits_subscription_previousAllowance: number;
    credits_packs_balance: number;
  }
  
  export interface ToolRun {
    PK: string;    // USER#userId
    SK: string;    // RUN#timestamp
    toolId: string;
    creditsUsed: {
      subscription: number;
      packs: number;
    };
    status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
    input: Record<string, any>;  // Type this better based on your tools
    output: Record<string, any>; // Type this better based on your tools
    timestamp: string;
  }
  
  // Utility type for credit operations
  export interface CreditDeduction {
    fromSubscription: number;
    fromPacks: number;
    remaining: {
      subscription: number;
      packs: number;
    };
  }
  
  // For API responses
  export interface CreditCheckResponse {
    hasEnoughCredits: boolean;
    available: {
      subscription: number;
      packs: number;
      total: number;
    };
    required: number;
  }