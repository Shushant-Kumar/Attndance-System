
import client from "./client";

export async function searchAttendanceHistory({
  search,
  department,
  year,
  section,
  dateFrom,
  dateTo,
  page = 1,
  pageSize = 20,
}) {
  const response = await client.get("/reports/attendance-history", {
    params: {
      search,
      department,
      year,
      section,
      date_from: dateFrom,
      date_to: dateTo,
      page,
      page_size: pageSize,
    },
  });

  return response.data;
}

export function exportPdf(filters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.department) {
    params.append("department", filters.department);
  }

  if (filters.year) {
    params.append("year", filters.year);
  }

  if (filters.section) {
    params.append("section", filters.section);
  }

  if (filters.dateFrom) {
    params.append("date_from", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.append("date_to", filters.dateTo);
  }

  const token = localStorage.getItem("access_token");

  let url =
    "https://attendance-system-yqt6.onrender.com/api/reports/export-pdf?" +
    params.toString();

  if (token) {
    url += "&Authorization=Bearer " + encodeURIComponent(token);
  }

  window.location.href = url;
}

export function exportExcel(filters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.department) {
    params.append("department", filters.department);
  }

  if (filters.year) {
    params.append("year", filters.year);
  }

  if (filters.section) {
    params.append("section", filters.section);
  }

  if (filters.dateFrom) {
    params.append("date_from", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.append("date_to", filters.dateTo);
  }

  const token = localStorage.getItem("access_token");

  let url =
    "https://attendance-system-yqt6.onrender.com/api/reports/export-excel?" +
    params.toString();

  if (token) {
    url += "&Authorization=Bearer " + encodeURIComponent(token);
  }

  window.location.href = url;
}

