// app/admin/users/components/types.ts
export interface User {
    id: string;
    name: string;
    email: string;
    credits: number;
    status: string;
    phone?: string;
  }