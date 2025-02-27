import { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";
import useWebSocket from "react-use-websocket";

function App() {
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [userInput, setUserInput] = useState("");
  const [initStreamData, setInitStreamData] = useState(null);
  const [streamState, setStreamState] = useState("ended");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  const { lastMessage, sendMessage } = useWebSocket("ws://localhost:8000", {
    onOpen: () => {
      setIsLoading(true);
      console.log("Connected to WebSocket");
    },
    onClose: (e) => console.log("Disconnected from WebSocket", e),
    onError: (error) => console.error("WebSocket Error:", error),
    shouldReconnect: true,
  });

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      peerConnectionRef.current?.close();
    };
  }, [sendMessage]);

  const onIceCandidate = useCallback(
    (event) => {
      console.log("onIceCandidate", event);
      if (event.candidate) {
        const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
        sendMessage(
          JSON.stringify({
            type: "ice-submit",
            payload: {
              session_id: initStreamData.session_id,
              candidate,
              sdpMid,
              sdpMLineIndex,
            },
          })
        );
      } else {
        sendMessage(
          JSON.stringify({
            type: "ice-submit",
            payload: {
              stream_id: initStreamData.id,
              session_id: initStreamData.session_id,
              presenter_type: "talk",
            },
          })
        );
      }
    },
    [initStreamData?.id, initStreamData?.session_id, sendMessage]
  );

  function closePC(pc = peerConnectionRef.current) {
    if (!pc) return;
    console.log("stopping peer connection");
    pc.close();
    console.log("stopped peer connection");
    if (pc === peerConnectionRef.current) {
      peerConnectionRef.current = null;
    }
  }

  const createPeerConnection = useCallback(
    async (offer, iceServers) => {
      if (!peerConnectionRef.current) {
        const actualRTCPC = (
          window.RTCPeerConnection ||
          window.webkitRTCPeerConnection ||
          window.mozRTCPeerConnection
        ).bind(window);

        const pc = new actualRTCPC({ iceServers });
        const dataChannel = pc.createDataChannel("JanusDataChannel");

        // Store references
        peerConnectionRef.current = pc;
        dataChannelRef.current = dataChannel;

        pc.onIceConnectionStateChange = () => {
          if (
            pc.iceConnectionState === "failed" ||
            pc.iceConnectionState === "closed"
          ) {
            console.log("ICE Connection State Change:", pc.iceConnectionState);
            setStreamState("ended");
            videoRef.current.srcObject = null;
            closePC();
          }
        };

        pc.onIceCandidate = (event) => {
          if (event.candidate) {
            console.log("ICE Candidate:", event.candidate);
            onIceCandidate(event);
          }
        };

        pc.ontrack = (event) => {
          console.log("peerConnection.ontrack", event);

          event.track.addEventListener("ended", (evt) => {
            console.log("track.ended", evt);
          });

          event.track.addEventListener("mute", (evt) => {
            console.log("track.mute", evt);
          });

          event.track.addEventListener("unmute", (evt) => {
            console.log("track.unmute", evt);
          });

          const stream = event.streams[0];

          if (videoRef.current && stream) {
            // setCurrStreamEnded(false);

            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setStreamState("live");
              // setStreamLoading(false);
              videoRef.current
                ?.play()
                .catch(() => console.warn("Auto-play prevented"));
            };
          }
        };

        dataChannel.addEventListener("message", (event) => {
          console.log("Data Channel Message:", event.data);
          setStreamState(event.data === "stream/done" ? "ended" : "live");
        });

        // pcDataChannel.onmessage = (message) => {
        //   if (pcDataChannel) {
        //     const state = pcDataChannel?.readyState;
        //     if (state === "open") {
        //       setStreamState(message.data === "stream/done" ? "ended" : "live");
        //     }
        //   }
        // };
      }
      await peerConnectionRef.current.setRemoteDescription(offer);
      console.log("Set remote SDP OK");

      const sessionClientAnswer =
        await peerConnectionRef.current.createAnswer();
      console.log("Create local SDP OK");

      await peerConnectionRef.current.setLocalDescription(sessionClientAnswer);
      console.log("Set local SDP OK");
      setIsLoading(false);

      return sessionClientAnswer;
    },
    [onIceCandidate]
  );

  const handleInitStream = useCallback(
    async (data) => {
      setInitStreamData(data);
      const { offer, ice_servers: iceServers } = data;
      const pc = await createPeerConnection(offer, iceServers);
      const peerConnectionPayload = {
        type: "peerConnectionAnswer",
        payload: pc,
      };
      console.log({ peerConnectionPayload });
      sendMessage(JSON.stringify(peerConnectionPayload));
    },
    [createPeerConnection, sendMessage]
  );

  useEffect(() => {
    if (lastMessage !== null) {
      let data;
      try {
        data = JSON.parse(lastMessage.data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        return;
      }

      switch (data.type) {
        case "error":
          alert(data.message);
          break;
        case "init-stream-response":
          handleInitStream(data?.data);
          break;
        default:
          console.log("Unhandled message type:", data.type, data.message);
      }
    }
  }, [handleInitStream, lastMessage]);

  const handleSendQuery = () => {
    sendMessage(JSON.stringify({ type: "chat-query", payload: { userInput } }));
  };

  console.log({ streamState });

  return (
    <>
      <div>DID WebSocket</div>
      <p>Stream State: {streamState}</p>
      <div className="media-container">
        <img
          src="https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg"
          alt="placeholder"
          className={streamState === "ended" ? "opacity-100" : "opacity-0"}
        />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          preload="yes"
          className={streamState === "live" ? "!opacity-100" : "!opacity-0"}
        />
      </div>
      <div className="flex flex-col items-center gap-3 w-80">
        <textarea
          placeholder="What would you like to say?"
          onChange={(e) => setUserInput(e.target.value)}
          value={userInput}
          className="w-full px-4 py-2 rounded h-min border"
          rows={5}
        />
        <button
          onClick={handleSendQuery}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading...</span>
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </>
  );
}

export default App;
