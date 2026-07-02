import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.subscriptions = new Map()   // destination → subscription
    this.connectPromise = null
    this.onConnectCallbacks = []     // queued until connection is actually ready
    this.reconnectFailCount = 0
  }

  connect(token) {
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () =>
          new SockJS(`/api/ws?token=${encodeURIComponent(token)}`),
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          this.connected = true
          this.reconnectFailCount = 0

          // Start presence heartbeat — tells backend "I'm online" every 20s
          this.heartbeatInterval = setInterval(() => {
            this.send('/app/chat.presence', {})
          }, 20000)
          this.send('/app/chat.presence', {})  // immediate first ping

          // Run any callbacks that were registered before the connection
          // was actually ready (fixes a subscription-timing race condition)
          this.onConnectCallbacks.forEach(cb => cb())

          resolve(this.client)
        },

        onStompError: (frame) => {
          reject(new Error(frame.headers.message))
        },

        onWebSocketClose: () => {
          this.connected = false

          // If the handshake keeps failing (e.g. expired token), stop the
          // infinite reconnect loop instead of hammering the server forever.
          this.reconnectFailCount += 1
          if (this.reconnectFailCount > 3) {
            this.client?.deactivate()
          }
        },
      })

      this.client.activate()
    })

    return this.connectPromise
  }

  // Run a callback immediately if already connected, or queue it for when
  // the connection finishes establishing. Use this instead of calling
  // subscribe() directly right after connect() to avoid a race condition.
  runWhenConnected(callback) {
    if (this.connected) {
      callback()
    } else {
      this.onConnectCallbacks.push(callback)
    }
  }

  disconnect() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe())
      this.subscriptions.clear()
      this.client.deactivate()
      this.client = null
    }
    this.connected = false
    this.connectPromise = null
    this.onConnectCallbacks = []
  }

  subscribe(destination, callback) {
    if (!this.client || !this.connected) {
      return null
    }

    // Avoid duplicate subscriptions
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe()
    }

    const subscription = this.client.subscribe(destination, (message) => {
      // Some broadcasts (e.g. read-receipt emails) are sent as plain strings,
      // not JSON. Try JSON first, fall back to the raw string instead of
      // throwing — otherwise the whole message silently never reaches the
      // reducer.
      let body
      try {
        body = JSON.parse(message.body)
      } catch (e) {
        body = message.body
      }
      callback(body)
    })

    this.subscriptions.set(destination, subscription)
    return subscription
  }

  unsubscribe(destination) {
    const sub = this.subscriptions.get(destination)
    if (sub) {
      sub.unsubscribe()
      this.subscriptions.delete(destination)
    }
  }

  send(destination, body) {
    if (!this.client || !this.connected) {
      return
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    })
  }

  isConnected() {
    return this.connected
  }
}

// Singleton instance — shared across the entire app
const websocketService = new WebSocketService()
export default websocketService
