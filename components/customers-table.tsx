"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEye,
  IconSearch,
  IconLoader,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"
import { toast } from "sonner"

interface Customer {
  email: string
  name: string
  totalOrders: number
  totalSpent: number
  productsBought: number
  averageOrderValue: number
  status: "active" | "inactive"
  lastOrderDate: string
}

interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  items: Array<{ quantity: number }>
  status: string
  paymentStatus: string
  createdAt: string
}

interface POSTransaction {
  _id: string
  transactionNumber: string
  customerName?: string
  customerEmail?: string
  total: number
  items: Array<{ quantity: number }>
  paymentStatus: string
  createdAt: string
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original
      const initials = customer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "totalOrders",
    header: "Orders",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.totalOrders}
        </div>
      )
    },
  },
  {
    accessorKey: "productsBought",
    header: "Products Bought",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.productsBought}
        </div>
      )
    },
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => {
      return (
        <div className="font-semibold text-primary">
          {formatCurrency(row.original.totalSpent)}
        </div>
      )
    },
  },
  {
    accessorKey: "averageOrderValue",
    header: "Avg Order Value",
    cell: ({ row }) => {
      return formatCurrencyCompact(row.original.averageOrderValue)
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          className={
            status === "active"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
          }
        >
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "lastOrderDate",
    header: "Last Order",
    cell: ({ row }) => {
      const date = new Date(row.original.lastOrderDate)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original
      return <CustomerDetailsCell customer={customer} />
    },
  },
]

export function CustomersTable() {
  const [data, setData] = React.useState<Customer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Fetch customers data from orders and POS transactions
  React.useEffect(() => {
    async function fetchCustomers() {
      try {
        setIsLoading(true)
        // Fetch all orders and POS transactions
        const [ordersRes, posRes] = await Promise.all([
          fetch("/api/orders?limit=1000"),
          fetch("/api/pos/transactions?limit=1000"),
        ])

        const ordersData = await ordersRes.json()
        const posData = await posRes.json()

        const orders: Order[] = ordersData.success ? ordersData.data || [] : []
        const posTransactions: POSTransaction[] = posData.success ? posData.data || [] : []

        // Aggregate customer data
        const customerMap = new Map<string, {
          email: string
          name: string
          orders: Array<{ total: number; items: Array<{ quantity: number }>; createdAt: string }>
          lastOrderDate: string
        }>()

        // Process orders
        orders.forEach((order) => {
          if (!order.customerEmail || !order.customerName) return
          
          if (!customerMap.has(order.customerEmail)) {
            customerMap.set(order.customerEmail, {
              email: order.customerEmail,
              name: order.customerName,
              orders: [],
              lastOrderDate: order.createdAt,
            })
          }

          const customer = customerMap.get(order.customerEmail)!
          customer.orders.push({
            total: order.total || 0,
            items: order.items || [],
            createdAt: order.createdAt,
          })

          // Update last order date if this order is newer
          if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
            customer.lastOrderDate = order.createdAt
          }
        })

        // Process POS transactions
        posTransactions.forEach((transaction) => {
          if (!transaction.customerEmail || !transaction.customerName) return

          if (!customerMap.has(transaction.customerEmail)) {
            customerMap.set(transaction.customerEmail, {
              email: transaction.customerEmail,
              name: transaction.customerName,
              orders: [],
              lastOrderDate: transaction.createdAt,
            })
          }

          const customer = customerMap.get(transaction.customerEmail)!
          customer.orders.push({
            total: transaction.total || 0,
            items: transaction.items || [],
            createdAt: transaction.createdAt,
          })

          // Update last order date if this transaction is newer
          if (new Date(transaction.createdAt) > new Date(customer.lastOrderDate)) {
            customer.lastOrderDate = transaction.createdAt
          }
        })

        // Convert to Customer format
        const customers: Customer[] = Array.from(customerMap.values()).map((customer) => {
          const totalOrders = customer.orders.length
          const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
          const productsBought = customer.orders.reduce(
            (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
            0
          )
          const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

          // Customer is active if they have an order in the last 90 days
          const ninetyDaysAgo = new Date()
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
          const isActive = new Date(customer.lastOrderDate) >= ninetyDaysAgo

          return {
            email: customer.email,
            name: customer.name,
            totalOrders,
            totalSpent,
            productsBought,
            averageOrderValue,
            status: isActive ? "active" : "inactive",
            lastOrderDate: customer.lastOrderDate,
          }
        })

        setData(customers)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error("Failed to load customers")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  React.useEffect(() => {
    table.getColumn("name")?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  React.useEffect(() => {
    if (statusFilter === "all") {
      table.getColumn("status")?.setFilterValue(undefined)
    } else {
      table.getColumn("status")?.setFilterValue(statusFilter)
    }
  }, [statusFilter, table])

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalCustomers = data.length
    const activeCustomers = data.filter((c) => c.status === "active").length
    const inactiveCustomers = totalCustomers - activeCustomers
    const totalRevenue = data.reduce((sum, c) => sum + c.totalSpent, 0)
    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalRevenue,
      averageSpent,
    }
  }, [data])

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage and view customer information
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card transition-all hover:shadow-md border">
          <CardHeader>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalCustomers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card transition-all hover:shadow-md border">
          <CardHeader>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? "..." : stats.activeCustomers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card transition-all hover:shadow-md border">
          <CardHeader>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(stats.totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card transition-all hover:shadow-md border">
          <CardHeader>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Avg Customer Value
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(stats.averageSpent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader className="h-4 w-4 animate-spin" />
                    Loading customers...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-accent/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function CustomerDetailsCell({ customer }: { customer: Customer }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <IconEye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CustomerDetailsDialog customer={customer} open={open} onOpenChange={setOpen} />
    </>
  )
}

function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [customerOrders, setCustomerOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      async function fetchCustomerOrders() {
        try {
          setIsLoading(true)
          // Fetch orders for this customer
          const [ordersRes, posRes] = await Promise.all([
            fetch("/api/orders?limit=1000"),
            fetch("/api/pos/transactions?limit=1000"),
          ])

          const ordersData = await ordersRes.json()
          const posData = await posRes.json()

          const orders: Order[] = ordersData.success ? ordersData.data || [] : []
          const posTransactions: POSTransaction[] = posData.success ? posData.data || [] : []

          // Filter orders by customer email
          const customerOrdersData = [
            ...orders.filter((o) => o.customerEmail === customer.email),
            ...posTransactions
              .filter((t) => t.customerEmail === customer.email)
              .map((t) => ({
                _id: t._id,
                orderNumber: t.transactionNumber || `POS-${t._id}`,
                customerName: t.customerName || "Customer",
                customerEmail: t.customerEmail || "",
                total: t.total,
                items: t.items || [],
                status: "completed",
                paymentStatus: t.paymentStatus,
                createdAt: t.createdAt,
              })) as Order[],
          ]

          // Sort by date (newest first)
          customerOrdersData.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )

          setCustomerOrders(customerOrdersData)
        } catch (error) {
          console.error("Error fetching customer orders:", error)
          toast.error("Failed to load customer orders")
        } finally {
          setIsLoading(false)
        }
      }

      fetchCustomerOrders()
    }
  }, [open, customer.email])

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details - {customer.name}</DialogTitle>
          <DialogDescription>
            View complete customer information and order history
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{customer.name}</h3>
              <p className="text-muted-foreground">{customer.email}</p>
              <Badge
                className={
                  customer.status === "active"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 mt-2"
                    : "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 mt-2"
                }
              >
                {customer.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {customer.totalOrders}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatCurrency(customer.totalSpent)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Products Bought
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {customer.productsBought}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatCurrencyCompact(customer.averageOrderValue)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Order History</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <IconLoader className="h-4 w-4 animate-spin mr-2" />
                Loading orders...
              </div>
            ) : customerOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders found for this customer.
              </p>
            ) : (
              <div className="space-y-2">
                {customerOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })} • {order.items.length} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrencyCompact(order.total)}</div>
                      <Badge
                        className={
                          order.status === "delivered" || order.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : order.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
