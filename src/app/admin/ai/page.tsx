// src/app/admin/ai/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AIEngineClient from './components/AIEngineClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - AI Engine',
}

export default async function AIEnginePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return <AIEngineClient params={params} searchParams={searchParams} />
}