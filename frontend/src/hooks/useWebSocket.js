import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccessToken, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice'
import {
  setWsConnected, receiveMessage, setTyping, setUserOnline,
  markMessagesReadByOther, receiveMessageDeleted,
} from '../store/slices/chatSlice'
import { receiveNotification } from '../store/slices/notificationSlice'
import {
  receiveMeetingChatMessage, receiveLifecycleEvent, receiveParticipantEvent,
  receiveModerationEvent, receiveWaitingRoomRequest, approvalReceived, denialReceived,
  joinMeetingRoom,
} from '../store/slices/meetingSlice'
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

// ── Meeting room: chat, lifecycle, participants, moderation, waiting room ──
export const useMeetingRoomSubscription = (meetingId) => {
  const dispatch = useDispatch()
  const wsConnected = useSelector((s) => s.chat.wsConnected)
  const currentUser = useSelector(selectCurrentUser)

  useEffect(() => {
    if (!meetingId || !wsConnected || !currentUser?.id) return

    const chatDest = `/topic/meeting/${meetingId}/chat`
    const privateChatDest = `/topic/meeting/${meetingId}/chat/private/${currentUser.id}`
    const lifecycleDest = `/topic/meeting/${meetingId}/lifecycle`
    const participantsDest = `/topic/meeting/${meetingId}/participants`
    const moderationDest = `/topic/meeting/${meetingId}/moderation`
    const waitingRoomDest = `/topic/meeting/${meetingId}/waiting-room`
    const myWaitingRoomDest = `/topic/meeting/${meetingId}/waiting-room/${currentUser.id}`

    websocketService.runWhenConnected(() => {
      websocketService.subscribe(chatDest, (msg) => dispatch(receiveMeetingChatMessage(msg)))
      websocketService.subscribe(privateChatDest, (msg) => dispatch(receiveMeetingChatMessage(msg)))
      websocketService.subscribe(lifecycleDest, (data) => dispatch(receiveLifecycleEvent(data)))
      websocketService.subscribe(participantsDest, (data) => dispatch(receiveParticipantEvent(data)))
      websocketService.subscribe(moderationDest, (data) => dispatch(receiveModerationEvent(data)))
      websocketService.subscribe(waitingRoomDest, (data) => dispatch(receiveWaitingRoomRequest(data)))
      websocketService.subscribe(myWaitingRoomDest, (data) => {
              if (data.status === 'APPROVED') {
                dispatch(approvalReceived())
                dispatch(joinMeetingRoom(meetingId)) // now actually fetch the LiveKit token
              }
              if (data.status === 'DENIED') dispatch(denialReceived())
        })
    })

    return () => {
      websocketService.unsubscribe(chatDest)
      websocketService.unsubscribe(privateChatDest)
      websocketService.unsubscribe(lifecycleDest)
      websocketService.unsubscribe(participantsDest)
      websocketService.unsubscribe(moderationDest)
      websocketService.unsubscribe(waitingRoomDest)
      websocketService.unsubscribe(myWaitingRoomDest)
    }
  }, [meetingId, wsConnected, currentUser?.id, dispatch])

  const sendChat = (content, recipientId = null) => {
    websocketService.send(`/app/meeting.chat.send/${meetingId}`, { content, recipientId })
  }

  return { sendChat }
}
