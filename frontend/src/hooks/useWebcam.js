import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Handles getUserMedia webcam access and exposes a captureFrame()
 * helper that grabs the current video frame as a JPEG data URL
 * (what the backend's face-registration /capture endpoint expects).
 */
export function useWebcam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const streamRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");

  const start = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera permission and try again."
          : "Could not access the webcam. Make sure a camera is connected."
      );
      setIsActive(false);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    const maxDim = 640;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;

    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  useEffect(() => stop, [stop]); // cleanup on unmount

  return { videoRef, isActive, error, start, stop, captureFrame };
}
