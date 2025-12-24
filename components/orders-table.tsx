"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEye,
  IconSearch,
  IconRefresh,
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
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OrderItem {
  _id?: string
  product: any
  productName: string
  variant?: string
  quantity: number
  price: number
  total: number
}

interface Order {
  _id: string
  orderNumber: string
  trackingId: string
  customerName: string
  customerEmail: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: string
  shippingDate?: string
  shippingProvider?: string
  deliveryNote?: string
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  shipped: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
}

const paymentStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  refunded: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.orderNumber}</div>
    ),
  },
  {
    accessorKey: "trackingId",
    header: "Tracking ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground">
        {row.original.trackingId}
      </div>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.customerName}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.customerEmail}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge className={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const paymentStatus = row.original.paymentStatus
      return (
        <Badge className={paymentStatusColors[paymentStatus]} variant="outline">
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const itemCount = row.original.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      )
      return <div>{itemCount} items</div>
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      return formatCurrency(row.original.total)
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
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
      const order = row.original
      return <OrderActionsCell order={order} onUpdate={fetchOrders} />
    },
  },
]

let fetchOrders: () => void

export function OrdersTable() {
  const [data, setData] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  fetchOrders = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter)

      const res = await fetch(`/api/orders?${params}`)
      const result = await res.json()

      if (result.success) {
        setData(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        toast.error(result.error || "Failed to load orders")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, statusFilter, paymentStatusFilter])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

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

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage and track customer orders
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchOrders()}
          disabled={isLoading}
        >
          <IconRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatusFilter} onValueChange={(value) => {
          setPaymentStatusFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
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
                    Loading orders...
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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function OrderActionsCell({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false)
  const [selectedStatus, setSelectedStatus] = React.useState<string>(order.status)
  const [shippingDate, setShippingDate] = React.useState<string>("")
  const [shippingProvider, setShippingProvider] = React.useState<string>(order.shippingProvider || "")
  const [deliveryNote, setDeliveryNote] = React.useState<string>(order.deliveryNote || "")
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusUpdate = async () => {
    setIsUpdating(true)
    try {
      const updateData: any = { status: selectedStatus }
      
      if (selectedStatus === "processing" && !shippingDate) {
        toast.error("Shipping date is required when status is set to processing")
        setIsUpdating(false)
        return
      }

      if (selectedStatus === "shipped" && !shippingProvider) {
        toast.error("Shipping provider is required when status is set to shipped")
        setIsUpdating(false)
        return
      }

      if (selectedStatus === "delivered" && !deliveryNote.trim()) {
        toast.error("Delivery note is required when status is set to delivered")
        setIsUpdating(false)
        return
      }

      if (selectedStatus === "processing") {
        updateData.shippingDate = shippingDate
      }

      if (selectedStatus === "shipped") {
        updateData.shippingProvider = shippingProvider
        // If shippingDate not set yet, use current date
        if (!shippingDate) {
          updateData.shippingDate = new Date().toISOString()
        }
      }

      if (selectedStatus === "delivered") {
        updateData.deliveryNote = deliveryNote
      }

      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const result = await res.json()

      if (result.success) {
        toast.success("Order updated successfully")
        setUpdateDialogOpen(false)
        onUpdate()
      } else {
        toast.error(result.error || "Failed to update order")
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Failed to update order")
    } finally {
      setIsUpdating(false)
    }
  }

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
          <DropdownMenuItem onSelect={() => {
            setSelectedStatus(order.status)
            setShippingDate(order.shippingDate ? new Date(order.shippingDate).toISOString().split('T')[0] : "")
            setShippingProvider(order.shippingProvider || "")
            setDeliveryNote(order.deliveryNote || "")
            setUpdateDialogOpen(true)
          }}>
            Update Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <OrderDetailsDialog order={order} open={open} onOpenChange={setOpen} />
      <UpdateStatusDialog
        order={order}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        shippingDate={shippingDate}
        setShippingDate={setShippingDate}
        shippingProvider={shippingProvider}
        setShippingProvider={setShippingProvider}
        deliveryNote={deliveryNote}
        setDeliveryNote={setDeliveryNote}
        onUpdate={handleStatusUpdate}
        isUpdating={isUpdating}
      />
    </>
  )
}

function UpdateStatusDialog({
  order,
  open,
  onOpenChange,
  selectedStatus,
  setSelectedStatus,
  shippingDate,
  setShippingDate,
  shippingProvider,
  setShippingProvider,
  deliveryNote,
  setDeliveryNote,
  onUpdate,
  isUpdating,
}: {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  shippingDate: string
  setShippingDate: (date: string) => void
  shippingProvider: string
  setShippingProvider: (provider: string) => void
  deliveryNote: string
  setDeliveryNote: (note: string) => void
  onUpdate: () => void
  isUpdating: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update the status of order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedStatus === "processing" && (
            <div className="space-y-2">
              <Label htmlFor="shippingDate">Shipping Date *</Label>
              <Input
                id="shippingDate"
                type="date"
                value={shippingDate}
                onChange={(e) => setShippingDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required when status is set to processing
              </p>
            </div>
          )}

          {selectedStatus === "shipped" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="shippingProvider">Shipping Provider (Logistic Company) *</Label>
                <Input
                  id="shippingProvider"
                  placeholder="e.g., DHL, FedEx, UPS, etc."
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required when status is set to shipped
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingDateShipped">Shipping Date</Label>
                <Input
                  id="shippingDateShipped"
                  type="date"
                  value={shippingDate}
                  onChange={(e) => setShippingDate(e.target.value)}
                />
              </div>
            </>
          )}

          {selectedStatus === "delivered" && (
            <div className="space-y-2">
              <Label htmlFor="deliveryNote">Delivery Note *</Label>
              <textarea
                id="deliveryNote"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add delivery note (e.g., Delivered to customer at front door, signed by recipient, etc.)"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required when status is set to delivered
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Tracking ID: {order.trackingId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {order.customerName}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {order.customerEmail}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={statusColors[order.status]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>{" "}
                  <Badge className={paymentStatusColors[order.paymentStatus]} variant="outline">
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                {order.shippingDate && (
                  <div>
                    <span className="text-muted-foreground">Shipping Date:</span>{" "}
                    {new Date(order.shippingDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                )}
                {order.shippingProvider && (
                  <div>
                    <span className="text-muted-foreground">Shipping Provider:</span>{" "}
                    {order.shippingProvider}
                  </div>
                )}
                {order.deliveryNote && (
                  <div>
                    <span className="text-muted-foreground">Delivery Note:</span>{" "}
                    <span className="font-medium">{order.deliveryNote}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => {
                let variantDisplay: string | null = null
                if (item.variant) {
                  try {
                    const variantAttrs = JSON.parse(item.variant)
                    if (Array.isArray(variantAttrs) && variantAttrs.length > 0) {
                      variantDisplay = variantAttrs.map((attr: any) => `${attr.name}: ${attr.value}`).join(", ")
                    }
                  } catch {
                    variantDisplay = item.variant
                  }
                }

                return (
                  <div
                    key={item._id || idx}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      {variantDisplay && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {variantDisplay}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-semibold">{formatCurrency(item.total)}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span>{formatCurrency(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
