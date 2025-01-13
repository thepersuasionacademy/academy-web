// scripts/seed-ai-data.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const docClient = DynamoDBDocumentClient.from(client)

const categories = [
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'AI tools for creating various types of content'
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'AI tools for email campaigns and outreach'
  },
  {
    id: 'sales-copy',
    name: 'Sales Copy',
    description: 'AI tools for persuasive sales copy'
  }
]

const suites = [
  {
    id: 'blog-content',
    categoryId: 'content-creation',
    name: 'Blog Content',
    description: 'Tools for creating blog posts and articles'
  },
  {
    id: 'social-posts',
    categoryId: 'content-creation',
    name: 'Social Media Posts',
    description: 'Tools for social media content'
  },
  {
    id: 'cold-outreach',
    categoryId: 'email-marketing',
    name: 'Cold Outreach',
    description: 'Tools for cold email campaigns'
  },
  {
    id: 'email-sequences',
    categoryId: 'email-marketing',
    name: 'Email Sequences',
    description: 'Tools for email nurture sequences'
  },
  {
    id: 'sales-pages',
    categoryId: 'sales-copy',
    name: 'Sales Pages',
    description: 'Tools for creating sales page copy'
  },
  {
    id: 'product-descriptions',
    categoryId: 'sales-copy',
    name: 'Product Descriptions',
    description: 'Tools for writing product descriptions'
  }
]

async function seedData() {
  try {
    // Seed categories
    for (const category of categories) {
      const item = {
        PK: `AI#CATEGORY#${category.id}`,
        SK: 'METADATA',
        GSI1PK: 'AI#CATEGORIES', // For querying all categories
        GSI1SK: category.name,   // For sorting by name
        name: category.name,
        description: category.description,
        displayOrder: categories.indexOf(category) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'ACTIVE'
      }

      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: item
      }))
      console.log(`Created category: ${category.name}`)
    }

    // Seed suites
    for (const suite of suites) {
      const item = {
        PK: `AI#CATEGORY#${suite.categoryId}`,
        SK: `SUITE#${suite.id}`,
        GSI1PK: `AI#CATEGORY#${suite.categoryId}#SUITES`, // For querying suites by category
        GSI1SK: suite.name,      // For sorting by name
        name: suite.name,
        description: suite.description,
        displayOrder: suites.filter(s => s.categoryId === suite.categoryId).indexOf(suite) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'ACTIVE'
      }

      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: item
      }))
      console.log(`Created suite: ${suite.name} in category: ${suite.categoryId}`)
    }

    console.log('✅ Seed completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
}

seedData()