import AdminToolsClient from './AdminToolsClient'

// Default Next.js page types
type Params = {
  id: string;
}

type SearchParams = { [key: string]: string | string[] | undefined }

// Instead of defining our own types, let Next.js infer them
export default function Page({
  params,
  searchParams,
}: {
  params: Params,
  searchParams: SearchParams,
}) {
  // Pass the props directly, letting Next.js handle the Promise resolution
  return <AdminToolsClient params={params} searchParams={searchParams} />
}