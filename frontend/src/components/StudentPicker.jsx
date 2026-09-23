import { useEffect, useState } from "react";
import { Search, ScanFace } from "lucide-react";
import * as studentsApi from "../api/students";

export default function StudentPicker({ onSelect }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await studentsApi.listStudents({ search, page: 1, pageSize: 8 });
        setItems(data.items);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student by name or roll number..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No students found. Add a student first.
          </div>
        ) : (
          items.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-left"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {s.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {s.roll_number} · {s.department} {s.year}/{s.section}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.has_face_data && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                    Registered
                  </span>
                )}
                <ScanFace size={16} className="text-gray-400" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
