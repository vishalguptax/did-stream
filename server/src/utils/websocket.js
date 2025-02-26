import { connectToDIDWebSocket } from './didSocket.js'

const clients = new Map()
let streamId
let sessionId
let didWs

const handleWebSocket = (wss) => {
  wss.on('connection', async (ws) => {
    console.log('New client connected')
    const clientId = Date.now()
    clients.set(clientId, ws)
    const newDidWs = await connectToDIDWebSocket()
    didWs = newDidWs

    const streamInitPayload = {
      type: 'init-stream',
      payload: {
        presenter_type: 'talk',
        source_url:
          'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg'
      }
    }

    sendMessage(didWs, streamInitPayload)

    didWs.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      switch (data.messageType) {
        case 'init-stream': {
          const {
            id: newStreamId,

            session_id: newSessionId
          } = data
          streamId = newStreamId
          sessionId = newSessionId

          try {
            sendMessage(ws, {
              type: 'init-stream-response',
              data
            })
          } catch (e) {
            console.error('Error during streaming setup', e)
            // stopAllStreams()
            // closePC()
            return
          }
          break
        }

        case 'sdp':
          console.log('`SDP message received`:', event.data)
          break

        case 'delete-stream':
          console.log('Stream deleted:', event.data)
          break
      }
    }

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        switch (data.type) {
          case 'peerConnectionAnswer': {
            console.log('SDP message received:', data)
            const sdpMessage = {
              type: 'sdp',
              payload: {
                answer: data.payload,
                session_id: sessionId,
                presenter_type: 'talk'
              }
            }
            sendMessage(didWs, sdpMessage)
            break
          }
          case 'ice-submit': {
            console.log('ICE message received:', data)
            sendMessage(didWs, data)
            break
          }
          case 'chat-query': {
            console.log('Chat query received:', data)
            handleChatQuery(data.payload.userInput)
            break
          }
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    })

    ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`)
      clients.delete(clientId)
    })

    sendMessage(ws, {
      type: 'welcome',
      message: 'Connected to WebSocket chat server'
    })
  })
}

const handleChatQuery = async (text) => {
  const chunks = text.split(' ')

  // Indicates end of text stream
  chunks.push('')

  // eslint-disable-next-line no-unused-vars
  for (const [_, chunk] of chunks.entries()) {
    const streamMessage = {
      type: 'stream-text',
      payload: {
        script: {
          type: 'text',
          input: chunk,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural '
          },
          ssml: true
        },
        config: {
          stitch: true
        },
        apiKeysExternal: {
          elevenlabs: { key: '' }
        },
        background: {
          color: '#FFFFFF'
        },
        session_id: sessionId,
        stream_id: streamId,
        presenter_type: 'talk'
      }
    }
    sendMessage(didWs, streamMessage)
  }
}

/**
 * Send a message to a specific client
 * @param {WebSocket} ws - The WebSocket client instance
 * @param {Object} data - The data object to send
 */
function sendMessage(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

/**
 * Generate AI chat response using OpenAI's API
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} - The AI-generated response
 */
// async function generateAIResponse(userMessage) {
//   console.log({ userMessage })
//   try {
//     const response = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: userMessage }]
//     })

//     const res =
//       "LoremLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s"

//     return (
//       response.data.choices[0]?.message?.content ||
//       res ||
//       "I couldn't generate a response."
//     )
//   } catch (error) {
//     console.error('OpenAI API error:', error)
//     return "Sorry, I couldn't process that request."
//   }
// }

export default handleWebSocket
