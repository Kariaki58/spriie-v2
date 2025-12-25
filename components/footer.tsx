"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function Footer() {
  const footerLinks = [
    { href: "/", label: "Home" },
    { href: "/contact", label: "Contact" },
    { href: "/track", label: "Track Order" },
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Spriie</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted e-commerce platform for quality products.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-sm text-muted-foreground">
              Need help? Visit our{" "}
              <Link
                href="/contact"
                className="text-primary hover:underline"
              >
                contact page
              </Link>
              {" "}to get in touch.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Spriie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
