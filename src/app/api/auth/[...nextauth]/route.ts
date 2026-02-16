import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const runtime = "nodejs";

const requiredEnv = [
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(
    `[NextAuth] Missing required environment variables: ${missingEnv.join(", ")}`,
  );
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) token.idToken = account.id_token;
      return token;
    },
    async session({ session, token }) {
      if (token.idToken) (session as any).idToken = token.idToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
