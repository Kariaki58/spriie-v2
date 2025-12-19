"use client"

import { type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={item.isActive}
                className={cn(
                  "transition-all duration-200",
                  item.isActive
                    ? "bg-accent text-accent-foreground border-l-2 border-primary"
                    : "hover:bg-accent/50"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
