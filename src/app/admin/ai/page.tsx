import AdminToolsClient from './AdminToolsClient'

export default async function Page({ 
  params,
  searchParams 
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return <AdminToolsClient params={params} searchParams={searchParams} />
}