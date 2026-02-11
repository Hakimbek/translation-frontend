import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';
import { Spinner } from "reactstrap";
import './App.css';

const socket = io(import.meta.env.VITE_SERVER_URL);

function App() {
  const [result, setResult] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslatng] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('result', (data: string) => {
      setIsTranslatng(false);
      setResult(data)
    });
    socket.on('error', (message: string) => toast.error(message));

    return () => {
      socket.off('result');
      socket.off('connect');
    }
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit('start-recording', event.data);
        }
      };

      recorder.start(1000); // Send audio data every second
      setIsRecording(true);
    } catch {
      toast.error("Failed to access microphone.");
    }
  }

    const stopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach(track => track.stop()); // Stop all audio tracks
        setIsRecording(false);
        setIsTranslatng(true);
        socket.emit('stop-recording');
      }
    }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-4">
      <h1 className="m-0">Translation APP</h1>
      {isConnected ? <p className="m-0">Connected to server</p> : <p>Connecting...</p>}
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop & Translate" : "Start"}
      </button>
      <p className="d-flex align-items-center gap-3 m-0">Translated Text: {isTranslating ? <Spinner /> : result}</p>
      <ToastContainer />
    </div>
  )
}

export default App
