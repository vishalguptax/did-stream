import express from 'express'
import { WebSocketServer } from 'ws'
import handleWebSocket from './utils/websocket.js'
import './utils/didSocket.js'

const PORT = process.env.PORT || 8000
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export const wss = new WebSocketServer({ server })

handleWebSocket(wss)
