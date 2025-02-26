// import { sendMessage } from './websocket'
// let streamId
// let sessionId
// export const handleDidSocketResponse = (res, ws) => {
//   const data = JSON.parse(res)
//   switch (data.messageType) {
//     case 'init-stream': {
//       const {
//         id: newStreamId,
//         offer,
//         ice_servers: iceServers,
//         session_id: newSessionId
//       } = data
//       streamId = newStreamId
//       sessionId = newSessionId

//       try {
//         sendMessage(ws, {
//           type: 'init-stream-response',
//           data
//         })
//         // Step 4: Send SDP answer to WebSocket
//         const sdpMessage = {
//           type: 'sdp',
//           payload: {
//             answer: sessionClientAnswer,
//             session_id: sessionId,
//             presenter_type: PRESENTER_TYPE
//           }
//         }
//         sendMessage(ws, sdpMessage)
//       } catch (e) {
//         console.error('Error during streaming setup', e)
//         // stopAllStreams()
//         // closePC()
//         return
//       }
//       break
//     }

//     case 'sdp':
//       console.log('SDP message received:', event.data)
//       break

//     case 'delete-stream':
//       console.log('Stream deleted:', event.data)
//       break
//   }
// }
