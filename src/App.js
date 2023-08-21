import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const App = () => {
  const [localStream, setLocalStream] = useState(null);
  const [webSocket, setWebSocket] = useState(null);
  const videoRef = useRef();

  useEffect(() => {
    const init = async () => {
      // Get media stream (audio and video)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      setLocalStream(stream);

      // Create WebSocket connection
      const ws = new WebSocket('ws://localhost:3000');
      ws.onopen = () => {
        console.log('WebSocket connection established.');

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleMessage(message);
        };

        setWebSocket(ws);
      };
    };

    init();
  }, []);

  const handleMessage = (message) => {
    switch (message.event) {
      case 'transportCreated':
        sendConnectTransport(message.transportOptions);
        break;
      case 'producerCreated':
        // Handle producer created
        break;
      default:
        console.warn('Unknown message event:', message.event);
        break;
    }
  };

  const sendConnectTransport = (transportOptions) => {
    const { id, iceParameters, iceCandidates, dtlsParameters } = transportOptions;
    const message = {
      event: 'connectTransport',
      transportId: id,
      dtlsParameters,
    };
    webSocket.send(JSON.stringify(message));
  };

  const createProducer = async () => {
    const createProducer = async () => {
      if (!localStream) {
        return;
      }
    
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
    
      const response = await axios.post('http://localhost:3000/create-producer', {
        kind: 'video', // or 'audio'
        rtpParameters: videoTrack.getParameters(), // or audioTrack.getParameters()
      });
    
      const producerId = response.data.producerId;
      console.log('Producer created:', producerId);
    };
  };

  return (
    <div>
      <h1>Mediasoup Broadcasting</h1>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={createProducer}>Start Broadcasting</button>
    </div>
  );
};

export default App;
