import Flutterwave from "flutterwave-node-v3"

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
)

export { flw }

// Helper function to encrypt data using Flutterwave encryption key
export function encryptData(data: string): string {
  const crypto = require("crypto")
  const algorithm = "aes-256-cbc"
  const key = Buffer.from(process.env.FLUTTERWAVE_ENCRYPTION_KEY!.slice(0, 32), "utf-8")
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  return iv.toString("hex") + ":" + encrypted
}

