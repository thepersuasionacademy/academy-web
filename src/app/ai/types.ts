// types.ts
export interface UserPageParams {
    id: string;
  }
  
  export interface UserPageProps {
    params: UserPageParams;
    searchParams?: { [key: string]: string | string[] | undefined };
  }