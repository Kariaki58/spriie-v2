import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import dbConnect from "./db"
import User from "./models/user"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          await dbConnect()
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email })
          
          if (!existingUser) {
            // Determine role based on admin emails
            const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || []
            const isAdmin = adminEmails.includes(user.email)
            
            // Create new user
            await User.create({
              name: user.name || "User",
              email: user.email,
              avatar: user.image,
              role: isAdmin ? "admin" : "customer",
              status: "active",
            })
          } else {
            // Update user info if needed (avatar, name might have changed)
            if (user.image && existingUser.avatar !== user.image) {
              existingUser.avatar = user.image
            }
            if (user.name && existingUser.name !== user.name) {
              existingUser.name = user.name
            }
            await existingUser.save()
          }
        } catch (error) {
          console.error("Error saving user to database:", error)
          // Still allow sign in even if database save fails
        }
      }
      return true
    },
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
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/google",
  },
}

