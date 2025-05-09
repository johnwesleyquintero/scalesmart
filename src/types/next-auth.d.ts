import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    provider?: string;
    expires_at?: number;
    user: {
      id?: string; // Add id to user object
    } & DefaultSession['user']; // Keep existing properties like name, email, image
  }

  // If using adapter and database strategy, you might augment User too
  // interface User extends DefaultUser {
  //   id: string;
  // }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    accessToken?: string;
    provider?: string;
    expires_at?: number;
  }
}
