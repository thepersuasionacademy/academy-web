//src/app/ai/components/dashboard/types/index.ts
import type { AICollection, AISuite, AITool } from '@/lib/supabase/ai'

export type { AICollection as Category }
export type { AISuite as Suite }
export type { AITool as Tool }

export type SuccessState = {
  name: string
  category: string
  suite: string
  inputField1: string
  inputField1Description: string
  inputField2?: string
  inputField2Description?: string
  inputField3?: string
  inputField3Description?: string
}