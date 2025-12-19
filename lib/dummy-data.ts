export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  stock: number
  views: number
  sold: number
  revenue: number
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  size?: string
  color?: string
  stock: number
  price: number
  sku: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  items: OrderItem[]
  shippingAddress: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  variantId?: string
  quantity: number
  price: number
  total: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "manager" | "staff"
  avatar?: string
  joinedAt: string
}

export const dummyProducts: Product[] = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    description: "Premium cotton t-shirt with modern fit",
    price: 29.99,
    category: "Apparel",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    stock: 150,
    views: 1245,
    sold: 87,
    revenue: 2609.13,
    variants: [
      { id: "v1", size: "S", color: "White", stock: 30, price: 29.99, sku: "TSH-WHT-S" },
      { id: "v2", size: "M", color: "White", stock: 50, price: 29.99, sku: "TSH-WHT-M" },
      { id: "v3", size: "L", color: "White", stock: 40, price: 29.99, sku: "TSH-WHT-L" },
      { id: "v4", size: "XL", color: "White", stock: 30, price: 29.99, sku: "TSH-WHT-XL" },
    ],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    name: "Wireless Headphones",
    description: "Premium noise-cancelling wireless headphones",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    stock: 75,
    views: 3421,
    sold: 128,
    revenue: 25598.72,
    variants: [
      { id: "v5", color: "Black", stock: 40, price: 199.99, sku: "HP-BLK-001" },
      { id: "v6", color: "White", stock: 35, price: 199.99, sku: "HP-WHT-001" },
    ],
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-18T16:00:00Z",
  },
  {
    id: "3",
    name: "Leather Backpack",
    description: "Handcrafted genuine leather backpack",
    price: 149.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    stock: 45,
    views: 892,
    sold: 32,
    revenue: 4799.68,
    variants: [
      { id: "v7", color: "Brown", stock: 25, price: 149.99, sku: "BP-BRN-001" },
      { id: "v8", color: "Black", stock: 20, price: 149.99, sku: "BP-BLK-001" },
    ],
    createdAt: "2024-01-12T11:00:00Z",
    updatedAt: "2024-01-19T10:00:00Z",
  },
  {
    id: "4",
    name: "Smart Watch",
    description: "Feature-rich smartwatch with health tracking",
    price: 299.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    stock: 120,
    views: 5678,
    sold: 234,
    revenue: 70197.66,
    variants: [
      { id: "v9", size: "42mm", color: "Silver", stock: 60, price: 299.99, sku: "SW-SLV-42" },
      { id: "v10", size: "42mm", color: "Black", stock: 60, price: 299.99, sku: "SW-BLK-42" },
    ],
    createdAt: "2024-01-08T08:00:00Z",
    updatedAt: "2024-01-22T12:00:00Z",
  },
  {
    id: "5",
    name: "Running Shoes",
    description: "Lightweight running shoes with cushioned sole",
    price: 89.99,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    stock: 200,
    views: 2341,
    sold: 89,
    revenue: 8009.11,
    variants: [
      { id: "v11", size: "8", color: "Blue", stock: 40, price: 89.99, sku: "SH-BLU-8" },
      { id: "v12", size: "9", color: "Blue", stock: 50, price: 89.99, sku: "SH-BLU-9" },
      { id: "v13", size: "10", color: "Blue", stock: 45, price: 89.99, sku: "SH-BLU-10" },
      { id: "v14", size: "8", color: "Red", stock: 35, price: 89.99, sku: "SH-RED-8" },
      { id: "v15", size: "9", color: "Red", stock: 30, price: 89.99, sku: "SH-RED-9" },
    ],
    createdAt: "2024-01-14T13:00:00Z",
    updatedAt: "2024-01-21T15:00:00Z",
  },
  {
    id: "6",
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 79.99,
    category: "Home & Kitchen",
    image: "https://images.unsplash.com/photo-1517668808824-b7aefb1c5e5c?w=400",
    stock: 90,
    views: 1456,
    sold: 56,
    revenue: 4479.44,
    variants: [
      { id: "v16", color: "Black", stock: 50, price: 79.99, sku: "CM-BLK-001" },
      { id: "v17", color: "White", stock: 40, price: 79.99, sku: "CM-WHT-001" },
    ],
    createdAt: "2024-01-11T10:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
  },
]

export const dummyOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    status: "delivered",
    total: 229.98,
    items: [
      {
        id: "i1",
        productId: "1",
        productName: "Classic White T-Shirt",
        variantId: "v2",
        quantity: 2,
        price: 29.99,
        total: 59.98,
      },
      {
        id: "i2",
        productId: "2",
        productName: "Wireless Headphones",
        variantId: "v5",
        quantity: 1,
        price: 199.99,
        total: 199.99,
      },
    ],
    shippingAddress: "123 Main St, New York, NY 10001",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-18T14:00:00Z",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    status: "shipped",
    total: 149.99,
    items: [
      {
        id: "i3",
        productId: "3",
        productName: "Leather Backpack",
        variantId: "v7",
        quantity: 1,
        price: 149.99,
        total: 149.99,
      },
    ],
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90001",
    createdAt: "2024-01-16T11:15:00Z",
    updatedAt: "2024-01-19T09:00:00Z",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customerName: "Bob Johnson",
    customerEmail: "bob@example.com",
    status: "processing",
    total: 299.99,
    items: [
      {
        id: "i4",
        productId: "4",
        productName: "Smart Watch",
        variantId: "v9",
        quantity: 1,
        price: 299.99,
        total: 299.99,
      },
    ],
    shippingAddress: "789 Pine Rd, Chicago, IL 60601",
    createdAt: "2024-01-17T14:20:00Z",
    updatedAt: "2024-01-17T14:20:00Z",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customerName: "Alice Williams",
    customerEmail: "alice@example.com",
    status: "pending",
    total: 179.98,
    items: [
      {
        id: "i5",
        productId: "5",
        productName: "Running Shoes",
        variantId: "v12",
        quantity: 2,
        price: 89.99,
        total: 179.98,
      },
    ],
    shippingAddress: "321 Elm St, Houston, TX 77001",
    createdAt: "2024-01-18T09:45:00Z",
    updatedAt: "2024-01-18T09:45:00Z",
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    customerName: "Charlie Brown",
    customerEmail: "charlie@example.com",
    status: "delivered",
    total: 79.99,
    items: [
      {
        id: "i6",
        productId: "6",
        productName: "Coffee Maker",
        variantId: "v16",
        quantity: 1,
        price: 79.99,
        total: 79.99,
      },
    ],
    shippingAddress: "654 Maple Dr, Phoenix, AZ 85001",
    createdAt: "2024-01-19T16:30:00Z",
    updatedAt: "2024-01-22T11:00:00Z",
  },
]

export const dummyTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@store.com",
    role: "owner",
    joinedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@store.com",
    role: "admin",
    joinedAt: "2023-03-15T00:00:00Z",
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike@store.com",
    role: "manager",
    joinedAt: "2023-06-20T00:00:00Z",
  },
  {
    id: "4",
    name: "Emily Wilson",
    email: "emily@store.com",
    role: "staff",
    joinedAt: "2023-09-10T00:00:00Z",
  },
]

// Analytics data
export const salesData = [
  { date: "2024-01-01", sales: 1200, orders: 15, views: 3200 },
  { date: "2024-01-02", sales: 1900, orders: 22, views: 3800 },
  { date: "2024-01-03", sales: 1500, orders: 18, views: 3500 },
  { date: "2024-01-04", sales: 2100, orders: 25, views: 4200 },
  { date: "2024-01-05", sales: 1800, orders: 21, views: 3900 },
  { date: "2024-01-06", sales: 2400, orders: 28, views: 4500 },
  { date: "2024-01-07", sales: 2200, orders: 26, views: 4100 },
  { date: "2024-01-08", sales: 1600, orders: 19, views: 3600 },
  { date: "2024-01-09", sales: 2000, orders: 24, views: 4000 },
  { date: "2024-01-10", sales: 2300, orders: 27, views: 4400 },
  { date: "2024-01-11", sales: 1700, orders: 20, views: 3700 },
  { date: "2024-01-12", sales: 2500, orders: 30, views: 4800 },
  { date: "2024-01-13", sales: 1900, orders: 23, views: 3900 },
  { date: "2024-01-14", sales: 2100, orders: 25, views: 4200 },
  { date: "2024-01-15", sales: 2800, orders: 33, views: 5200 },
  { date: "2024-01-16", sales: 2400, orders: 29, views: 4600 },
  { date: "2024-01-17", sales: 2000, orders: 24, views: 4100 },
  { date: "2024-01-18", sales: 2600, orders: 31, views: 4900 },
  { date: "2024-01-19", sales: 2200, orders: 26, views: 4300 },
  { date: "2024-01-20", sales: 3000, orders: 35, views: 5500 },
  { date: "2024-01-21", sales: 2700, orders: 32, views: 5100 },
  { date: "2024-01-22", sales: 2300, orders: 28, views: 4500 },
  { date: "2024-01-23", sales: 2500, orders: 30, views: 4700 },
  { date: "2024-01-24", sales: 2900, orders: 34, views: 5300 },
  { date: "2024-01-25", sales: 2100, orders: 25, views: 4200 },
  { date: "2024-01-26", sales: 2400, orders: 29, views: 4600 },
  { date: "2024-01-27", sales: 2800, orders: 33, views: 5200 },
  { date: "2024-01-28", sales: 2600, orders: 31, views: 5000 },
  { date: "2024-01-29", sales: 3000, orders: 35, views: 5400 },
  { date: "2024-01-30", sales: 3200, orders: 38, views: 5800 },
]

export const productViewsData = [
  { product: "Classic White T-Shirt", views: 1245, conversions: 45 },
  { product: "Wireless Headphones", views: 3421, conversions: 128 },
  { product: "Leather Backpack", views: 892, conversions: 32 },
  { product: "Smart Watch", views: 5678, conversions: 234 },
  { product: "Running Shoes", views: 2341, conversions: 89 },
  { product: "Coffee Maker", views: 1456, conversions: 56 },
]

export const conversionRateData = [
  { date: "2024-01-01", rate: 2.8 },
  { date: "2024-01-02", rate: 3.2 },
  { date: "2024-01-03", rate: 2.9 },
  { date: "2024-01-04", rate: 3.5 },
  { date: "2024-01-05", rate: 3.1 },
  { date: "2024-01-06", rate: 3.7 },
  { date: "2024-01-07", rate: 3.4 },
  { date: "2024-01-08", rate: 2.7 },
  { date: "2024-01-09", rate: 3.3 },
  { date: "2024-01-10", rate: 3.6 },
  { date: "2024-01-11", rate: 3.0 },
  { date: "2024-01-12", rate: 3.8 },
  { date: "2024-01-13", rate: 3.2 },
  { date: "2024-01-14", rate: 3.4 },
  { date: "2024-01-15", rate: 3.9 },
  { date: "2024-01-16", rate: 3.5 },
  { date: "2024-01-17", rate: 3.3 },
  { date: "2024-01-18", rate: 3.7 },
  { date: "2024-01-19", rate: 3.4 },
  { date: "2024-01-20", rate: 4.0 },
  { date: "2024-01-21", rate: 3.8 },
  { date: "2024-01-22", rate: 3.5 },
  { date: "2024-01-23", rate: 3.6 },
  { date: "2024-01-24", rate: 3.9 },
  { date: "2024-01-25", rate: 3.3 },
  { date: "2024-01-26", rate: 3.5 },
  { date: "2024-01-27", rate: 3.8 },
  { date: "2024-01-28", rate: 3.7 },
  { date: "2024-01-29", rate: 4.0 },
  { date: "2024-01-30", rate: 4.2 },
]

