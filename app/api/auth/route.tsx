import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                if (!credentials) return null;

                const envUser = process.env.ADMIN_USERNAME;
                const envPass = process.env.ADMIN_PASSWORD;

                // Comparaison simple (OK car tu stockes en .env)
                if (
                    credentials.username === envUser &&
                    credentials.password === envPass
                ) {
                    return { id: "1", name: envUser, role: "admin" };
                }

                return null;
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
