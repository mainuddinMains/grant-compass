import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { readUsers, writeUsers } from '@/lib/auth-db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await readUsers();
        const user = users.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        );
        if (!user) return null;

        // Google-only accounts have no password
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image ?? null };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Runs on every sign-in attempt. For Google OAuth: provision / link account.
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;

      const email = (user.email ?? '').toLowerCase();
      if (!email) return false;

      const users = await readUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase() === email);

      if (idx === -1) {
        // New user — create account
        const newUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: user.name ?? email.split('@')[0],
          email,
          passwordHash: '',
          provider: 'google',
          image: user.image ?? undefined,
          createdAt: Date.now(),
        };
        users.push(newUser);
        await writeUsers(users);
        // Rewrite user.id so the jwt callback gets our internal ID
        user.id = newUser.id;
      } else {
        // Existing account — link to Google and refresh image
        users[idx] = {
          ...users[idx],
          provider: 'google',
          image: user.image ?? users[idx].image,
        };
        await writeUsers(users);
        user.id = users[idx].id;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        // Keep Google profile picture in the token
        if (user.image) token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        // Expose profile picture to client (null if not set)
        session.user.image = (token.picture as string | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
