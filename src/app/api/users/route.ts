import { NextResponse } from 'next/server';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const emailQuery = searchParams.get('email')?.toLowerCase();
  const nameQuery = searchParams.get('name');

  // Return empty if no search parameters
  if (!emailQuery && !nameQuery) {
    return NextResponse.json([]);
  }

  try {
    let filterExpression = 'begins_with(PK, :userPrefix) AND SK = :metaValue';
    let expressionAttributeValues: any = {
      ':userPrefix': 'USER#',
      ':metaValue': 'META'
    };
    let expressionAttributeNames: any = {};

    // Add email filter if provided
    if (emailQuery) {
      filterExpression += ' AND contains(#email, :emailQuery)';
      expressionAttributeValues[':emailQuery'] = emailQuery;
      expressionAttributeNames['#email'] = 'email';
    }

    // Add name filter if provided
    if (nameQuery) {
      const allUsers = await dynamoDB.scan({
        TableName: 'payment-portal',
        FilterExpression: 'begins_with(PK, :userPrefix) AND SK = :metaValue',
        ExpressionAttributeValues: {
          ':userPrefix': 'USER#',
          ':metaValue': 'META'
        }
      }).promise();

      // Filter users based on name match
      const filteredUsers = allUsers.Items?.filter(user => {
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const searchTerm = nameQuery.toLowerCase();
        return firstName.includes(searchTerm) || lastName.includes(searchTerm);
      }) || [];

      return NextResponse.json(filteredUsers.map(item => ({
        id: item.PK.replace('USER#', ''),
        name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        email: item.email || '',
        credits: item.credits || 0,
        status: item.status || 'ACTIVE'
      })));
    }

    // If only email search, use DynamoDB filter
    const result = await dynamoDB.scan({
      TableName: 'payment-portal',
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json([]);
    }

    const users = result.Items.map(item => ({
      id: item.PK.replace('USER#', ''),
      name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      email: item.email || '',
      credits: item.credits || 0,
      status: item.status || 'ACTIVE'
    }));

    return NextResponse.json(users);

  } catch (error) {
    console.error('DynamoDB error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}