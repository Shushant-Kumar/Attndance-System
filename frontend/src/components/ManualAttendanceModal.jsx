import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import * as attendanceApi from "../api/attendance";

export default function ManualAttendanceModal({ open, student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handleMark() {
    setLoading(true);
    try {
      await attendanceApi.markAttendanceManual(student.id);
      toast.success(`Attendance marked for ${student.full_name}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to mark attendance";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Mark Attendance Manually
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {student.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {student.roll_number} · {student.department} {student.year}/{student.section}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Mark <span className="font-medium">{student.full_name}</span> as Present for today?
            This is useful when the camera missed them or if there was a technical issue.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleMark}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {loading ? "Marking..." : "Mark Present"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
