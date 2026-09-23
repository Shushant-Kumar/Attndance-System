import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, ScanFace, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as studentsApi from "../api/students";
import * as attendanceApi from "../api/attendance";
import Modal from "../components/Modal";
import StudentForm from "../components/StudentForm";
import ManualAttendanceModal from "../components/ManualAttendanceModal";

const PAGE_SIZE = 10;

export default function StudentManagement() {
  const navigate = useNavigate();

  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: PAGE_SIZE });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [manualAttendanceStudent, setManualAttendanceStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await studentsApi.listStudents({ search, page, pageSize: PAGE_SIZE });
      setData(result);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // debounce search -> reset to page 1
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleAdd(form) {
    await studentsApi.createStudent(form);
    toast.success("Student added");
    setAddOpen(false);
    fetchStudents();
  }

  async function handleEdit(form) {
    await studentsApi.updateStudent(editStudent.id, form);
    toast.success("Student updated");
    setEditStudent(null);
    fetchStudents();
  }

  async function handleDelete() {
    try {
      await studentsApi.deleteStudent(deleteTarget.id);
      toast.success("Student deleted");
      setDeleteTarget(null);
      fetchStudents();
    } catch {
      toast.error("Failed to delete student");
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <th className="px-5 py-3 font-medium">Roll No.</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Year / Section</th>
              <th className="px-5 py-3 font-medium">Face Data</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            ) : (
              data.items.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                    {s.roll_number}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{s.full_name}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{s.department}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {s.year} / {s.section}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        s.has_face_data
                          ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {s.has_face_data ? "Registered" : "Not registered"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Mark attendance manually"
                        onClick={() => setManualAttendanceStudent(s)}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        title="Register face"
                        onClick={() => navigate(`/register-face?studentId=${s.id}`)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <ScanFace size={15} />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => setEditStudent(s)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteTarget(s)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {data.total === 0
              ? "0 results"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, data.total)} of ${data.total}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add student modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Student">
        <StudentForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      {/* Edit student modal */}
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && (
          <StudentForm
            isEdit
            initial={editStudent}
            onSubmit={handleEdit}
            onCancel={() => setEditStudent(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Student">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {deleteTarget.full_name}
              </span>{" "}
              ({deleteTarget.roll_number})? This also removes their face dataset and
              attendance history. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual attendance modal */}
      <ManualAttendanceModal
        open={!!manualAttendanceStudent}
        student={manualAttendanceStudent}
        onClose={() => setManualAttendanceStudent(null)}
        onSuccess={fetchStudents}
      />
    </div>
  );
}
