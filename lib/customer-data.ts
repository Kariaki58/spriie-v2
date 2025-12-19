import { dummyOrders } from "./dummy-data"

export interface Customer {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  productsBought: number
  averageOrderValue: number
  lastOrderDate: string
  firstOrderDate: string
  status: "active" | "inactive"
}

// Generate customer data from orders
export function generateCustomerData(): Customer[] {
  const customerMap = new Map<string, {
    name: string
    email: string
    orders: typeof dummyOrders
    orderDates: string[]
  }>()

  // Group orders by customer email
  dummyOrders.forEach((order) => {
    const existing = customerMap.get(order.customerEmail)
    if (existing) {
      existing.orders.push(order)
      existing.orderDates.push(order.createdAt)
    } else {
      customerMap.set(order.customerEmail, {
        name: order.customerName,
        email: order.customerEmail,
        orders: [order],
        orderDates: [order.createdAt],
      })
    }
  })

  // Convert to Customer array
  const customers: Customer[] = Array.from(customerMap.entries()).map(
    ([email, data], index) => {
      const totalSpent = data.orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, order) => sum + order.total, 0)
      
      const totalOrders = data.orders.length
      const productsBought = data.orders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      )
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      
      const sortedDates = data.orderDates.sort()
      const lastOrderDate = sortedDates[sortedDates.length - 1]
      const firstOrderDate = sortedDates[0]
      
      // Consider customer active if they ordered in last 30 days
      const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      const status: "active" | "inactive" = daysSinceLastOrder <= 30 ? "active" : "inactive"

      return {
        id: `customer-${index + 1}`,
        name: data.name,
        email: email,
        totalOrders,
        totalSpent,
        productsBought,
        averageOrderValue,
        lastOrderDate,
        firstOrderDate,
        status,
      }
    }
  )

  // Sort by total spent (highest first)
  return customers.sort((a, b) => b.totalSpent - a.totalSpent)
}

export const dummyCustomers = generateCustomerData()




