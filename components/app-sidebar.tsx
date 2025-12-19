"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconPackage,
  IconPoint,
  IconReceipt,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUserCircle,
  IconWallet,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useThemeConfig } from "@/contexts/theme-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Store Owner",
    email: "owner@store.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconPackage,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconReceipt,
    },
    {
      title: "POS",
      url: "/dashboard/pos",
      icon: IconPoint,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: IconUserCircle,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
    },
    {
      title: "Team",
      url: "/dashboard/team",
      icon: IconUsers,
    },
    {
      title: "Wallet",
      url: "/dashboard/wallet",
      icon: IconWallet,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { theme } = useThemeConfig()
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                {theme.logo ? (
                  <img
                    src={theme.logo}
                    alt={theme.storeName}
                    className="h-8 w-8 object-contain rounded-md"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                    <IconInnerShadowTop className="!size-5 text-primary-foreground" />
                  </div>
                )}
                <span className="text-base font-semibold">
                  {theme.storeName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain.map(item => ({ ...item, isActive: pathname === item.url }))} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
