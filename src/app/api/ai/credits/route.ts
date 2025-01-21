// app/api/ai/credits/route.ts
import { NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

type CreditOperation = 'deduct' | 'add' | 'reset';

interface CreditRequest {
  operation: CreditOperation;
  userId: string;
  amount: number;
  toolId?: string;  // Only needed for deduct
}

export async function POST(req: Request) {
  try {
    const { operation, userId, amount, toolId } = await req.json() as CreditRequest;

    // Input validation
    if (!userId || !operation || (amount < 0)) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    const user = await dynamodb.get({
      TableName: 'YourTable',
      Key: {
        PK: `USER#${userId}`,
        SK: 'META'
      }
    }).promise();

    if (!user.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize credit values if they don't exist
    const currentSubscriptionBalance = user.Item.credits_subscription_balance ?? 0;
    const currentPackBalance = user.Item.credits_packs_balance ?? 0;
    const monthlyAllowance = user.Item.credits_subscription_monthlyAllowance ?? 0;

    let updateExpression = '';
    const expressionValues: Record<string, any> = {};
    let conditionExpressions: string[] = [];
    let fromSubscription = 0;
    let fromPacks = 0;

    switch (operation) {
      case 'deduct':
        if (!toolId) {
          return NextResponse.json({ error: 'Tool ID required for deduct operation' }, { status: 400 });
        }

        // Check total available credits first
        const totalAvailable = currentSubscriptionBalance + currentPackBalance;
        if (totalAvailable < amount) {
          return NextResponse.json({ 
            error: 'Insufficient credits',
            available: {
              subscription: currentSubscriptionBalance,
              packs: currentPackBalance,
              total: totalAvailable
            },
            required: amount
          }, { status: 400 });
        }

        // Calculate deductions
        fromSubscription = Math.min(amount, currentSubscriptionBalance);
        fromPacks = amount - fromSubscription;

        updateExpression = 'SET ';
        // Only include subscription update if they have a subscription
        if (monthlyAllowance > 0) {
          updateExpression += 'credits_subscription_balance = :newSubBalance, ';
          expressionValues[':newSubBalance'] = currentSubscriptionBalance - fromSubscription;
        }
        // Only include packs update if they're using pack credits
        if (fromPacks > 0) {
          updateExpression += 'credits_packs_balance = :newPackBalance';
          expressionValues[':newPackBalance'] = currentPackBalance - fromPacks;
        }

        // Add condition to prevent negative balances
        if (fromSubscription > 0) {
          conditionExpressions.push('credits_subscription_balance >= :subMinRequired');
          expressionValues[':subMinRequired'] = fromSubscription;
        }
        if (fromPacks > 0) {
          conditionExpressions.push('credits_packs_balance >= :packMinRequired');
          expressionValues[':packMinRequired'] = fromPacks;
        }
        break;

      case 'add':
        // Initialize packs balance if it doesn't exist
        updateExpression = 'SET credits_packs_balance = if_not_exists(credits_packs_balance, :zero) + :amount';
        expressionValues[':amount'] = amount;
        expressionValues[':zero'] = 0;
        break;

      case 'reset':
        // Only reset if they have a subscription
        if (monthlyAllowance === 0) {
          return NextResponse.json({ error: 'No active subscription to reset' }, { status: 400 });
        }

        updateExpression = `SET 
          credits_subscription_balance = :monthlyAmount,
          credits_subscription_resetDate = :nextReset
        `;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        expressionValues[':monthlyAmount'] = monthlyAllowance;
        expressionValues[':nextReset'] = nextMonth.toISOString();
        break;

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Perform the update
    const result = await dynamodb.update({
      TableName: 'YourTable',
      Key: {
        PK: `USER#${userId}`,
        SK: 'META'
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression: conditionExpressions.length ? conditionExpressions.join(' AND ') : undefined,
      ReturnValues: 'ALL_NEW'
    }).promise();

    // If it's a deduct operation, record the tool usage
    if (operation === 'deduct' && toolId) {
      await dynamodb.put({
        TableName: 'YourTable',
        Item: {
          PK: `USER#${userId}`,
          SK: `RUN#${Date.now()}`,
          toolId,
          creditsUsed: {
            subscription: fromSubscription,
            packs: fromPacks
          },
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        }
      }).promise();
    }

    return NextResponse.json({
      success: true,
      operation,
      newBalance: {
        subscription: result.Attributes?.credits_subscription_balance || 0,
        packs: result.Attributes?.credits_packs_balance || 0,
        total: (result.Attributes?.credits_subscription_balance || 0) + 
               (result.Attributes?.credits_packs_balance || 0)
      }
    });

  } catch (error: unknown) {
    console.error('Credit operation error:', error);
    
    // Handle specific DynamoDB errors
    if (error instanceof Error && 'code' in error && error.code === 'ConditionalCheckFailedException') {
      return NextResponse.json({ 
        error: 'Insufficient credits or concurrent update detected'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : 'Unknown error' 
        : undefined
    }, { status: 500 });
  }
}