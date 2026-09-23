import { useState } from "react";
import { Loader2 } from "lucide-react";

const empty = {
  roll_number: "",
  full_name: "",
  department: "",
  year: "",
  section: "",
  email: "",
  phone: "",
};

export default function StudentForm({ initial, onSubmit, onCancel, isEdit = false }) {
  const [form, setForm] = useState(initial || empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        roll_number: form.roll_number?.trim(),
        full_name: form.full_name?.trim(),
        department: form.department?.trim(),
        year: form.year?.trim(),
        section: form.section?.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
      };
      await onSubmit(payload);
    } catch (err) {
      let msg = "Failed to save student";
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (detail && typeof detail === "object") {
        msg = detail.message || JSON.stringify(detail);
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Roll Number</label>
          <input
            required
            disabled={isEdit}
            value={form.roll_number}
            onChange={(e) => update("roll_number", e.target.value)}
            className={`${inputClass} ${isEdit ? "opacity-60" : ""}`}
          />
        </div>
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Department</label>
          <input
            required
            value={form.department}
            onChange={(e) => update("department", e.target.value)}
            placeholder="CSE"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Year</label>
          <input
            required
            value={form.year}
            onChange={(e) => update("year", e.target.value)}
            placeholder="2nd"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Section</label>
          <input
            required
            value={form.section}
            onChange={(e) => update("section", e.target.value)}
            placeholder="A"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone (optional)</label>
          <input
            value={form.phone || ""}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save Changes" : "Add Student"}
        </button>
      </div>
    </form>
  );
}
