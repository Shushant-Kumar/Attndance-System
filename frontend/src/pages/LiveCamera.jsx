import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, AlertTriangle, UserCheck, UserX, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useWebcam } from "../hooks/useWebcam";
import * as recognitionApi from "../api/recognition";
import * as attendanceApi from "../api/attendance";

const MARK_INTERVAL_MS = 1200;
const MAX_LOG_ENTRIES = 15;

const OUTCOME_COLOR = {
  marked: "#16a34a", // green — newly marked present
  already_marked: "#2563eb", // blue — already present today
  unknown: "#dc2626", // red — unrecognized face
};

const OUTCOME_LABEL = {
  marked: "Marked Present",
  already_marked: "Already Marked",
  unknown: "Unknown",
};

export default function LiveCamera() {
  const { videoRef, isActive, error: camError, start, stop, captureFrame } = useWebcam();
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const loopRef = useRef(null);
  const inFlightRef = useRef(false);
  const alreadyToastedRef = useRef(new Set()); // avoid re-toasting the same student repeatedly

  const [running, setRunning] = useState(false);
  const [knownCount, setKnownCount] = useState(null);
  const [log, setLog] = useState([]);

  useEffect(() => {
    recognitionApi.getKnownCount().then(setKnownCount).catch(() => setKnownCount(0));
  }, []);

  const drawOverlay = useCallback((faces, imageWidth, imageHeight) => {
    const canvas = overlayRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const displayW = container.clientWidth;
    const displayH = container.clientHeight;
    canvas.width = displayW;
    canvas.height = displayH;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, displayW, displayH);

    const scaleX = displayW / imageWidth;
    const scaleY = displayH / imageHeight;

    faces.forEach((face) => {
      const { top, right, bottom, left } = face.box;
      // Because the video is mirrored horizontally (-scale-x-100), mirror the X coordinate
      // so the box matches the mirrored video while text stays readable:
      const w = (right - left) * scaleX;
      const h = (bottom - top) * scaleY;
      const x = displayW - (right * scaleX);
      const y = top * scaleY;

      const color = OUTCOME_COLOR[face.outcome] || "#dc2626";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      const label = face.is_known
        ? `${face.full_name} — ${OUTCOME_LABEL[face.outcome]}`
        : `Unknown (${face.confidence}%)`;

      ctx.font = "13px sans-serif";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 5, y - 5);
    });
  }, []);

  const runMarkingLoop = useCallback(() => {
    loopRef.current = setInterval(async () => {
      if (inFlightRef.current) return;
      const frame = captureFrame();
      if (!frame) return;

      inFlightRef.current = true;
      try {
        const result = await attendanceApi.markAttendance(frame);
        drawOverlay(result.faces, result.image_width, result.image_height);

        const knownFaces = result.faces.filter((f) => f.is_known);
        if (knownFaces.length > 0) {
          setLog((prev) => {
            const entries = knownFaces.map((f) => ({
              id: `${f.student_id}-${Date.now()}`,
              studentId: f.student_id,
              name: f.full_name,
              rollNumber: f.roll_number,
              confidence: f.confidence,
              outcome: f.outcome,
              time: new Date().toLocaleTimeString(),
            }));
            const lastId = prev[0]?.studentId;
            const filtered = entries.filter(
              (e) => e.studentId !== lastId || prev.length === 0
            );
            return [...filtered, ...prev].slice(0, MAX_LOG_ENTRIES);
          });

          // Toast once per student per session when freshly marked present
          knownFaces
            .filter((f) => f.outcome === "marked")
            .forEach((f) => {
              if (!alreadyToastedRef.current.has(f.student_id)) {
                alreadyToastedRef.current.add(f.student_id);
                toast.success(`Attendance marked: ${f.full_name}`);
              }
            });
        }
      } catch {
        // transient error — skip this tick
      } finally {
        inFlightRef.current = false;
      }
    }, MARK_INTERVAL_MS);
  }, [captureFrame, drawOverlay]);

  function startMarking() {
    setRunning(true);
    runMarkingLoop();
  }

  function stopMarking() {
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = null;
    setRunning(false);
    const canvas = overlayRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {knownCount === 0 && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-3">
            <AlertTriangle size={16} />
            No students have completed face registration yet — everyone will
            show as Unknown. Register faces first.
          </div>
        )}

        <div
          ref={containerRef}
          className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900"
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full h-full object-cover -scale-x-100 ${isActive ? "" : "opacity-0"}`}
          />
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Camera size={28} />
              <span className="text-xs">Camera not started</span>
            </div>
          )}
          {running && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/90 text-white text-xs px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Marking Attendance
            </div>
          )}
        </div>

        {camError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{camError}</p>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <button
              onClick={start}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
            >
              <Camera size={16} /> Start Camera
            </button>
          ) : !running ? (
            <button
              onClick={startMarking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
            >
              <UserCheck size={16} /> Start Attendance Marking
            </button>
          ) : (
            <button
              onClick={stopMarking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium"
            >
              Stop Marking
            </button>
          )}
          {isActive && (
            <button
              onClick={() => {
                stopMarking();
                stop();
              }}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Stop Camera
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 justify-center">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" /> Newly marked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Already marked today
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-600 inline-block" /> Unrecognized
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 h-fit">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          Recent Activity
        </h2>
        {log.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Recognized students will appear here once marking starts.
          </p>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60"
              >
                <div className="flex items-center gap-2">
                  {entry.outcome === "marked" ? (
                    <UserCheck size={14} className="text-green-600 dark:text-green-400" />
                  ) : entry.outcome === "already_marked" ? (
                    <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <UserX size={14} className="text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.rollNumber} · {entry.time}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {OUTCOME_LABEL[entry.outcome]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
