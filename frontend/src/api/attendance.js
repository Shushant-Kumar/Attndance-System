import client from "./client";

export async function markAttendance(imageDataUrl) {
  const { data } = await client.post("/attendance/mark", { image: imageDataUrl });
  return data; // { image_width, image_height, faces: [{ outcome: 'marked'|'already_marked'|'unknown', ... }] }
}

export async function markAttendanceManual(studentId) {
  const { data } = await client.post(`/attendance/manual/${studentId}`);
  return data;
}

export async function getTodayAttendance() {
  const { data } = await client.get("/attendance/today");
  return data; // { date, total_students, present_count, absent_count, attendance_percent, records }
}
