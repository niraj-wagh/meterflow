import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

let socketInstance = null

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    if (!socketInstance) {
      socketInstance = io('/', { withCredentials: true, transports: ['websocket'] })
    }

    socketInstance.emit('join-user-room', user._id)
    if (user.role === 'admin') socketInstance.emit('join-admin-room')

    return () => {
      // Don't disconnect on component unmount – keep alive for session
    }
  }, [isAuthenticated, user])

  return socketInstance
}

export const getSocket = () => socketInstance
