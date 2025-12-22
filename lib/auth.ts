import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "./db"
import User from "./models/user"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          await dbConnect()
          
          // Find user by email and include password field
          const user = await User.findOne({ email: credentials.email }).select("+password")
          
          if (!user) {
            throw new Error("Invalid email or password")
          }

          // Check if user has a password (for existing OAuth users)
          if (!user.password) {
            throw new Error("Please set a password for your account")
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          // Return user object (without password)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            // Don't include image/avatar - use default fallback
          }
        } catch (error: any) {
          console.error("Auth error:", error)
          throw new Error(error.message || "Authentication failed")
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in, user object is available
      if (user?.email) {
        try {
          await dbConnect()
          const dbUser = await User.findOne({ email: user.email })
          
          if (dbUser) {
            token.userId = dbUser._id.toString()
            token.role = dbUser.role
            // Check if user is admin based on role or email
            const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || []
            token.isAdmin = dbUser.role === "admin" || adminEmails.includes(user.email)
          }
        } catch (error) {
          console.error("Error fetching user from database:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add user data to session from token
      if (session.user) {
        ;(session as any).userId = token.userId
        ;(session as any).role = token.role
        ;(session as any).isAdmin = token.isAdmin ?? false
        // Remove image to use default avatar fallback
        session.user.image = undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
}

