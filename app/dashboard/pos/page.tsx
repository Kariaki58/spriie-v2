"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { POSInterface } from "@/components/pos/pos-interface"

export default function POSPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Point of Sale</h2>
                <p className="text-muted-foreground">
                  Process sales and manage payments
                </p>
              </div>
              <POSInterface />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

