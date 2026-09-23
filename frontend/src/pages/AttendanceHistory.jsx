import { useEffect, useState, useCallback } from "react";
import { Search, Download, FileText, Table2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import * as reportsApi from "../api/reports";

const PAGE_SIZE = 20;

export default function AttendanceHistory() {
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    year: "",
    section: "",
    dateFrom: "",
    dateTo: "",
  });

  const [data, setData] = useState({ items: [], total: 0, page: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportsApi.searchAttendanceHistory({
        ...filters,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(result);
    } catch {
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  function handleFilterChange(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      reportsApi.exportPdf(filters);
      toast.success("PDF export started");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      reportsApi.exportExcel(filters);
      toast.success("Excel export started");
    } catch {
      toast.error("Failed to export Excel");
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Search & Filter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Name or Roll Number
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Department
            </label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              placeholder="CSE, ECE, etc."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Year
            </label>
            <input
              type="text"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              placeholder="1st, 2nd, etc."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Section
            </label>
            <input
              type="text"
              value={filters.section}
              onChange={(e) => handleFilterChange("section", e.target.value)}
              placeholder="A, B, C, etc."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleExportPdf}
            disabled={exporting || data.total === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
          >
            <FileText size={16} /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting || data.total === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
          >
            <Table2 size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Roll No.</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Marked By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.items.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-5 py-3 text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{record.full_name}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{record.roll_number}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{record.department}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                    {record.time?.substring(0, 5) || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        record.status === "Present"
                          ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        record.marked_by === "AI"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {record.marked_by}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
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
    </div>
  );
}
