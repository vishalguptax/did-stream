import { WebSocket } from 'ws'
const url = process.env.DID_WEBSOCKET_URL
const token = process.env.DID_SOCKET_TOKEN
export async function connectToDIDWebSocket() {
  return new Promise((resolve, reject) => {
    const wsUrl = `${url}?authorization=Basic ${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)

    ws.on('open', () => {
      console.log('Connected to D-ID WebSocket')
      resolve(ws)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      reject(error)
    })

    ws.on('message', (message) => {
      console.log('D-ID Message:', message.toString())
    })
  })
}
