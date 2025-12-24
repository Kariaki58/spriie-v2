# Ecommerce API Documentation

This documentation describes all API endpoints available for building the frontend ecommerce store.

Base URL: Your application base URL (e.g., `https://yourdomain.com`)

---

## Authentication

Most endpoints require authentication via NextAuth. Include the session cookie in requests, or use API tokens if configured.

---

## Products

### Get Products

**GET** `/api/products`

Get a list of products with pagination, search, and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search term for name/description
- `category` (string, optional): Filter by category
- `availableForPOS` (boolean, optional): Filter POS-available products

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": 5000,
      "category": "Electronics",
      "image": "https://...",
      "images": ["https://..."],
      "stock": 100,
      "variants": [
        {
          "attributes": [
            { "name": "Size", "value": "L" },
            { "name": "Color", "value": "Red" }
          ],
          "price": 5500,
          "stock": 50,
          "sku": "PROD-L-RED"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "categories": ["Electronics", "Clothing", "Food"]
}
```

### Get Single Product

**GET** `/api/products/[id]`

Get details of a single product.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 5000,
    "category": "Electronics",
    "image": "https://...",
    "stock": 100,
    "variants": [...]
  }
}
```

---

## Orders

### Create Order

**POST** `/api/orders`

Create a new order. Returns order with tracking ID.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "variant": [
        { "name": "Size", "value": "L" },
        { "name": "Color", "value": "Red" }
      ]
    }
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "shippingAddress": "123 Main St, Lagos, Nigeria",
  "shipping": 1000,
  "tax": 375
}
```

**Note:** 
- `variant` is optional. If provided, should be an array of `{name, value}` objects matching product variant attributes.
- `shipping` and `tax` are optional (default: 0)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1234567890-1234",
    "trackingId": "TRKABC12345",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "shippingAddress": "123 Main St, Lagos, Nigeria",
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Product Name",
          "image": "https://..."
        },
        "productName": "Product Name",
        "variant": "[{\"name\":\"Size\",\"value\":\"L\"}]",
        "quantity": 2,
        "price": 5500,
        "total": 11000
      }
    ],
    "subtotal": 11000,
    "shipping": 1000,
    "tax": 375,
    "total": 12375,
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "flutterwave",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Order created successfully"
}
```

### Get Orders List

**GET** `/api/orders`

Get a list of orders. If authenticated, returns user's orders. Otherwise, public access for tracking.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`)
- `paymentStatus` (string, optional): Filter by payment status (`pending`, `paid`, `failed`, `refunded`)
- `search` (string, optional): Search by orderNumber, trackingId, email, or name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-1234567890-1234",
      "trackingId": "TRKABC12345",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "status": "processing",
      "paymentStatus": "paid",
      "total": 12375,
      "items": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Single Order

**GET** `/api/orders/[id]`

Get order details by ID, orderNumber, or trackingId.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1234567890-1234",
    "trackingId": "TRKABC12345",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "shippingAddress": "123 Main St, Lagos, Nigeria",
    "status": "processing",
    "paymentStatus": "paid",
    "paymentMethod": "flutterwave",
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Product Name",
          "image": "https://...",
          "description": "...",
          "category": "Electronics"
        },
        "productName": "Product Name",
        "variant": "[{\"name\":\"Size\",\"value\":\"L\"}]",
        "quantity": 2,
        "price": 5500,
        "total": 11000
      }
    ],
    "subtotal": 11000,
    "shipping": 1000,
    "tax": 375,
    "total": 12375,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Initialize Payment

**POST** `/api/orders/[id]/payment/initialize`

Initialize Flutterwave payment for an order.

**Request Body:**
```json
{
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Note:** If email/name not provided, uses order's customer email/name.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentLink": "https://checkout.flutterwave.com/v3/hosted/pay/...",
    "reference": "ORD-order_id-timestamp"
  }
}
```

**Usage:** Redirect user to `paymentLink` to complete payment.

### Payment Callback

**GET** `/api/orders/payment/callback`

Flutterwave redirect endpoint. Automatically handles payment verification and redirects user.

**Redirects to:**
- Success: `/orders/[trackingId]?payment=success`
- Cancelled: `/orders/[trackingId]?payment=cancelled`
- Failed: `/orders/[trackingId]?payment=failed`

---

## Order Status Codes

### Order Status
- `pending`: Order created, awaiting payment
- `processing`: Payment received, order being processed
- `shipped`: Order has been shipped
- `delivered`: Order has been delivered
- `cancelled`: Order was cancelled

### Payment Status
- `pending`: Payment not yet completed
- `paid`: Payment completed successfully
- `failed`: Payment failed
- `refunded`: Payment was refunded

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "message": "Detailed error message (optional)"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
- `502`: Bad Gateway (payment gateway error)
- `504`: Gateway Timeout

---

## Variants Handling

Products can have variants with different attributes (e.g., Size, Color). When creating an order:

1. **Check if product has variants:**
   - Product `variants` array contains variant objects
   - Each variant has `attributes` array: `[{name: "Size", value: "L"}, {name: "Color", value: "Red"}]`

2. **Include variant in order item:**
   ```json
   {
     "productId": "product_id",
     "quantity": 2,
     "variant": [
       { "name": "Size", "value": "L" },
       { "name": "Color", "value": "Red" }
     ]
   }
   ```

3. **Variant matching:**
   - System matches variant attributes to find correct price and stock
   - If variant not found, uses base product price
   - Stock is checked per variant if available

---

## Example Flow

### Complete Order Flow

1. **Get Products:**
   ```
   GET /api/products?category=Electronics
   ```

2. **Create Order:**
   ```
   POST /api/orders
   Body: {
     "items": [
       {
         "productId": "product_id",
         "quantity": 1,
         "variant": [{"name": "Size", "value": "L"}]
       }
     ],
     "customerName": "John Doe",
     "customerEmail": "john@example.com",
     "shippingAddress": "123 Main St",
     "shipping": 1000,
     "tax": 375
   }
   ```
   
   Response includes `trackingId` - save this!

3. **Initialize Payment:**
   ```
   POST /api/orders/[order_id]/payment/initialize
   Body: {
     "email": "john@example.com",
     "name": "John Doe"
   }
   ```
   
   Redirect user to `paymentLink`

4. **User completes payment on Flutterwave**

5. **Flutterwave redirects to callback:**
   ```
   GET /api/orders/payment/callback?status=successful&tx_ref=...
   ```
   
   Automatically redirects to order tracking page

6. **Track Order:**
   ```
   GET /api/orders/[trackingId]
   ```
   
   Use tracking ID returned in step 2

---

## Webhooks

Flutterwave sends webhooks to:
- `POST /api/orders/payment/webhook`

Webhooks are automatically verified and update order payment status.
