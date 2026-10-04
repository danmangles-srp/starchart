import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      orgId: string;
      isAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    orgId: string;
    isAdmin: boolean;
  }
}
