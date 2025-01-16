//src/app/ai/components/dashboard/types/index.ts
export type Category = {
  id: string
  name: string
}

export type Suite = {
  id: string
  name: string
}

export type Tool = {
  name: string
  SK: string
  description: string
  creditCost: number
  promptTemplate: string
  inputField1: string
  inputField1Description: string
}

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