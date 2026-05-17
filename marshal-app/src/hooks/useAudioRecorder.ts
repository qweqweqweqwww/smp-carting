import { useState, useRef, useCallback } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  blob: Blob | null;
  blobRef: React.MutableRefObject<Blob | null>;
  durationMs: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  // Ref that always holds the latest blob — readable from stale closures
  const blobRef = useRef<Blob | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    blobRef.current = null;
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType });
      blobRef.current = recorded;
      setBlob(recorded);
      setDurationMs(Date.now() - startTimeRef.current);
      stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    };

    recorder.start(100);
    startTimeRef.current = Date.now();
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    blobRef.current = null;
    setBlob(null);
    setDurationMs(0);
    setError(null);
  }, []);

  return { isRecording, blob, blobRef, durationMs, error, start, stop, reset };
}
