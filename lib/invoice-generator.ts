// Client-side invoice PDF generator using jsPDF
// Note: This requires jsPDF to be installed

export interface InvoiceData {
  transactionNumber: string
  items: Array<{
    productId?: string
    productName: string
    price: number
    quantity: number
    variant?: string
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  paidAt?: string
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  // Dynamically import jsPDF only when needed
  const { default: jsPDF } = await import("jspdf")
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", pageWidth - margin, yPos, { align: "right" })
  
  yPos += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Transaction #: ${data.transactionNumber}`, pageWidth - margin, yPos, { align: "right" })
  
  yPos += 20

  // Company Info (you can customize this)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Spriie", margin, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Point of Sale Invoice", margin, yPos)
  
  yPos += 20

  // Date
  doc.setFontSize(10)
  const createdDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.text(`Date: ${createdDate}`, margin, yPos)
  
  yPos += 8
  if (data.paidAt) {
    const paidDate = new Date(data.paidAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    doc.text(`Paid At: ${paidDate}`, margin, yPos)
    yPos += 8
  }

  // Payment Status
  doc.setFont("helvetica", "bold")
  doc.text(`Status: ${data.paymentStatus.toUpperCase()}`, margin, yPos)
  yPos += 10

  // Items Table
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Items", margin, yPos)
  yPos += 8

  // Table Header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F")
  
  doc.setFontSize(10)
  doc.text("Item", margin + 2, yPos)
  doc.text("Quantity", pageWidth - margin - 80, yPos)
  doc.text("Price", pageWidth - margin - 50, yPos)
  doc.text("Total", pageWidth - margin - 20, yPos, { align: "right" })
  
  yPos += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Table Rows
  doc.setFont("helvetica", "normal")
  data.items.forEach((item, index) => {
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      yPos = margin
    }

    let itemName = item.productName
    // Handle variant info - could be string or JSON
    if (item.variant) {
      try {
        // Try to parse as JSON (new format)
        const variantAttrs = JSON.parse(item.variant)
        if (Array.isArray(variantAttrs) && variantAttrs.length > 0) {
          const variantString = variantAttrs.map((attr: any) => `${attr.name}: ${attr.value}`).join(", ")
          itemName = `${item.productName} (${variantString})`
        } else {
          itemName = `${item.productName} (${item.variant})`
        }
      } catch {
        // If not JSON, use as string (fallback)
        itemName = `${item.productName} (${item.variant})`
      }
    }
    
    const price = item.price.toFixed(2)
    const quantity = item.quantity.toString()
    const total = (item.price * item.quantity).toFixed(2)

    // Wrap long product names
    const maxWidth = pageWidth - margin - 80 - 50 - 30
    const lines = doc.splitTextToSize(itemName, maxWidth)
    
    doc.text(lines[0], margin + 2, yPos)
    if (lines.length > 1) {
      yPos += 5
      doc.text(lines.slice(1).join(" "), margin + 5, yPos)
    }
    
    doc.text(quantity, pageWidth - margin - 80, yPos)
    doc.text(price, pageWidth - margin - 50, yPos)
    doc.text(total, pageWidth - margin - 20, yPos, { align: "right" })
    
    yPos += 8
  })

  yPos += 5
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Totals
  doc.setFont("helvetica", "normal")
  doc.text(`Subtotal:`, pageWidth - margin - 60, yPos)
  doc.text(data.subtotal.toFixed(2), pageWidth - margin - 20, yPos, { align: "right" })
  
  yPos += 8
  doc.text(`VAT (7.5%):`, pageWidth - margin - 60, yPos)
  doc.text(data.tax.toFixed(2), pageWidth - margin - 20, yPos, { align: "right" })
  
  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`Total:`, pageWidth - margin - 60, yPos)
  doc.text(data.total.toFixed(2), pageWidth - margin - 20, yPos, { align: "right" })

  yPos += 15

  // Payment Method
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const paymentMethodText = data.paymentMethod === "cash" ? "Cash Payment" : "Bank Transfer"
  doc.text(`Payment Method: ${paymentMethodText}`, margin, yPos)

  // Generate PDF blob
  const pdfBlob = doc.output("blob")
  return pdfBlob
}

export function downloadInvoice(data: InvoiceData, filename?: string) {
  generateInvoicePDF(data).then((blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `invoice-${data.transactionNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }).catch((error) => {
    console.error("Error generating invoice:", error)
    throw error
  })
}
