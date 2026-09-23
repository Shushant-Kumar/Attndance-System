import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, RotateCcw, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useWebcam } from "../hooks/useWebcam";
import * as faceApi from "../api/faceRegistration";
import * as studentsApi from "../api/students";
import StudentPicker from "../components/StudentPicker";

const CAPTURE_INTERVAL_MS = 700; // time between auto-capture attempts

export default function RegisterFace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentIdParam = searchParams.get("studentId");

  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState(null); // { total_captured, target, min_required, is_finalized }
  const [capturing, setCapturing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [lastError, setLastError] = useState("");

  const { videoRef, isActive, error: camError, start, stop, captureFrame } = useWebcam();
  const captureLoopRef = useRef(null);

  // Load the student if a studentId is present in the URL
  useEffect(() => {
    if (!studentIdParam) {
      setStudent(null);
      return;
    }
    studentsApi.getStudent(studentIdParam).then(setStudent).catch(() => {
      toast.error("Student not found");
      setSearchParams({});
    });
  }, [studentIdParam, setSearchParams]);

  const refreshStatus = useCallback(async () => {
    if (!student) return;
    const s = await faceApi.getStatus(student.id);
    setStatus(s);
    return s;
  }, [student]);

  useEffect(() => {
    if (student) refreshStatus();
  }, [student, refreshStatus]);

  function selectStudent(s) {
    setSearchParams({ studentId: s.id });
  }

  function changeStudent() {
    stop();
    setSearchParams({});
    setStudent(null);
    setStatus(null);
  }

  const stopCaptureLoop = useCallback(() => {
    if (captureLoopRef.current) {
      clearInterval(captureLoopRef.current);
      captureLoopRef.current = null;
    }
    setCapturing(false);
  }, []);

  async function startAutoCapture() {
    setLastError("");
    setCapturing(true);

    captureLoopRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;

      try {
        const result = await faceApi.captureFrame(student.id, frame);
        setStatus((prev) => ({ ...prev, total_captured: result.total_captured }));

        if (result.is_complete) {
          stopCaptureLoop();
          toast.success(`Captured ${result.total_captured} images!`);
        }
      } catch (err) {
        // Expected, recoverable errors (no face / multiple faces) — just
        // show a hint and keep the loop running so the student can adjust.
        const detail = err.response?.data?.detail;
        if (detail) setLastError(detail);
      }
    }, CAPTURE_INTERVAL_MS);
  }

  useEffect(() => stopCaptureLoop, [stopCaptureLoop]);

  async function handleReset() {
    stopCaptureLoop();
    try {
      await faceApi.resetRegistration(student.id);
      toast.success("Dataset cleared — you can recapture now");
      refreshStatus();
    } catch {
      toast.error("Failed to reset dataset");
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      const result = await faceApi.finalizeRegistration(student.id);
      toast.success(result.message);
      stop();
      navigate("/students");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to finalize registration");
    } finally {
      setFinalizing(false);
    }
  }

  // ---- No student selected yet ----
  if (!student) {
    return (
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
          Choose a student to register or update their face profile.
        </p>
        <StudentPicker onSelect={selectStudent} />
      </div>
    );
  }

  const progress = status ? Math.min(100, (status.total_captured / status.target) * 100) : 0;
  const canFinalize = status && status.total_captured >= status.min_required;
  const isComplete = status && status.total_captured >= status.target;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <button
        onClick={changeStudent}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft size={14} /> Choose a different student
      </button>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{student.full_name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {student.roll_number} · {student.department} {student.year}/{student.section}
            </p>
          </div>
          {status?.is_finalized && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle2 size={12} /> Already registered
            </span>
          )}
        </div>

        {/* Camera preview */}
        <div className="relative aspect-square w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-gray-900 mb-4">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full h-full object-cover -scale-x-100 ${isActive ? "" : "opacity-0"}`}
          />
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Camera size={28} />
              <span className="text-xs">Camera not started</span>
            </div>
          )}
          {capturing && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 text-white text-xs px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Capturing
            </div>
          )}
        </div>

        {camError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">{camError}</p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Capture progress</span>
            <span>
              {status?.total_captured ?? 0} / {status?.target ?? 25} images
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {lastError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">{lastError}</p>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {!isActive ? (
            <button
              onClick={start}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
            >
              <Camera size={16} /> Start Camera
            </button>
          ) : !capturing ? (
            <button
              onClick={startAutoCapture}
              disabled={isComplete}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium"
            >
              <Camera size={16} />
              {isComplete ? "Capture complete" : "Start Auto-Capture"}
            </button>
          ) : (
            <button
              onClick={stopCaptureLoop}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium"
            >
              Stop Capturing
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleReset}
              disabled={!status?.total_captured}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RotateCcw size={14} /> Recapture
            </button>
            <button
              onClick={handleFinalize}
              disabled={!canFinalize || finalizing}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-40"
            >
              {finalizing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Finalize
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Look straight at the camera, then slowly turn your head slightly
          left/right and up/down while capturing for better accuracy across
          lighting and angles.
        </p>
      </div>
    </div>
  );
}
