import { Suspense } from 'react'
import AdminToolsClient from './AdminToolsClient'

type PageParams = {
  id: string;
}

type Props = {
  params: PageParams;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminToolsClient params={params} searchParams={searchParams} />
    </Suspense>
  )
}