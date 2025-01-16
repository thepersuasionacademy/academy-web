export interface AdminPageParams {
    id: string;
  }
  
  export interface AdminPageProps {
    params: AdminPageParams;
    searchParams?: { [key: string]: string | string[] | undefined };
  }