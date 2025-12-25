"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function useActiveUsers() {
  const [count, setCount] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    socket = io("https://realtime-get-active-users.onrender.com", {
      transports: ["websocket"], // important for Render
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to active users socket")
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from active users socket")
    })

    socket.on("userCount", (data: number) => {
      setCount(data)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    return () => {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    }
  }, [])

  // Return the count, or null if not connected
  return { count, isConnected }
}
