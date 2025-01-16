import AdminToolsClient from './AdminToolsClient'

export interface AdminPageParams {
  id: string;
}

export interface AdminPageProps {
  params: AdminPageParams;
  searchParams: { [key: string]: string | string[] | undefined };  // Removed optional marker
}

export default function Page(props: AdminPageProps) {
  return <AdminToolsClient {...props} />
}