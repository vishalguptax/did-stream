// export async function createPeerConnection(offer, iceServers) {
//   if (!peerConnection) {
//     peerConnection = new RTCPeerConnection({ iceServers });
//     pcDataChannel = peerConnection.createDataChannel("JanusDataChannel");
//     peerConnection.addEventListener(
//       "icegatheringstatechange",
//       onIceGatheringStateChange,
//       true
//     );
//     peerConnection.addEventListener("icecandidate", onIceCandidate, true);
//     peerConnection.addEventListener(
//       "iceconnectionstatechange",
//       onIceConnectionStateChange,
//       true
//     );
//     peerConnection.addEventListener(
//       "connectionstatechange",
//       onConnectionStateChange,
//       true
//     );
//     peerConnection.addEventListener(
//       "signalingstatechange",
//       onSignalingStateChange,
//       true
//     );
//     peerConnection.addEventListener("track", onTrack, true);
//     pcDataChannel.addEventListener("message", onStreamEvent, true);
//   }

//   await peerConnection.setRemoteDescription(offer);
//   console.log("set remote sdp OK");

//   const sessionClientAnswer = await peerConnection.createAnswer();
//   console.log("create local sdp OK");

//   await peerConnection.setLocalDescription(sessionClientAnswer);
//   console.log("set local sdp OK");

//   return sessionClientAnswer;
// }
