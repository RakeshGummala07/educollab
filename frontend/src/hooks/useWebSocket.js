import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccessToken, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice'
import {
  setWsConnected, receiveMessage, setTyping, setUserOnline,
  markMessagesReadByOther, receiveMessageDeleted,
} from '../store/slices/chatSlice'
import { receiveNotification } from '../store/slices/notificationSlice'
import websocketService from '../api/websocketService'

export const useWebSocketConnection = () => {
  const dispatch = useDispatch()
  const token = useSelector(selectAccessToken)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      websocketService.disconnect()
      dispatch(setWsConnected(false))
      return
    }

    websocketService.connect(token)
      .then(() => {
        dispatch(setWsConnected(true))

        // Global presence topic — online/offline broadcasts
        websocketService.subscribe('/topic/presence', (data) => {
          dispatch(setUserOnline({ userId: data.userId, online: data.online }))
        })

        // Personal notification topic — real-time bell updates
        if (currentUser?.id) {
          websocketService.subscribe(`/topic/notifications/${currentUser.id}`, (notif) => {
            dispatch(receiveNotification(notif))
          })
        }
      })
      .catch((err) => {
        dispatch(setWsConnected(false))
      })

    return () => {
      websocketService.disconnect()
      dispatch(setWsConnected(false))
    }
  }, [isAuthenticated, token, currentUser?.id, dispatch])
}

export const useConversationSubscription = (conversationId) => {
  const dispatch = useDispatch()
  const wsConnected = useSelector((s) => s.chat.wsConnected)
  const currentUser = useSelector(selectCurrentUser)

  useEffect(() => {
    if (!conversationId || !wsConnected) return

    const messageDest = `/topic/conversations/${conversationId}`
    const typingDest   = `/topic/conversations/${conversationId}/typing`
    const readDest     = `/topic/conversations/${conversationId}/read`
    const deletedDest  = `/topic/conversations/${conversationId}/deleted`

    websocketService.runWhenConnected(() => {
      websocketService.subscribe(messageDest, (message) => {
        dispatch(receiveMessage({ message, currentUserId: currentUser?.id }))
      })

      websocketService.subscribe(typingDest, (data) => {
        dispatch(setTyping({
          conversationId,
          userId: data.userId,
          fullName: data.fullName,
          typing: data.typing,
        }))
      })

      websocketService.subscribe(readDest, (readerEmail) => {
        if (readerEmail !== currentUser?.email) {
          dispatch(markMessagesReadByOther({ conversationId, readerEmail }))
        }
      })

      websocketService.subscribe(deletedDest, (data) => {
        dispatch(receiveMessageDeleted({ messageId: data.messageId }))
      })
    })

    return () => {
      websocketService.unsubscribe(messageDest)
      websocketService.unsubscribe(typingDest)
      websocketService.unsubscribe(readDest)
      websocketService.unsubscribe(deletedDest)
    }
  }, [conversationId, wsConnected, dispatch, currentUser])

  const sendViaWs = (content, attachment = {}) => {
    websocketService.send(`/app/chat.send/${conversationId}`, { content, ...attachment })
  }

  const sendTyping = (typing) => {
    websocketService.send('/app/chat.typing', { conversationId, typing })
  }

  return { sendViaWs, sendTyping }
}
