import client from "./client";

export async function listStudents({ search, department, year, section, page = 1, pageSize = 20 }) {
  const { data } = await client.get("/students", {
    params: { search, department, year, section, page, page_size: pageSize },
  });
  return data; // { total, page, page_size, items }
}

export async function getStudent(id) {
  const { data } = await client.get(`/students/${id}`);
  return data;
}

export async function createStudent(payload) {
  const { data } = await client.post("/students", payload);
  return data;
}

export async function updateStudent(id, payload) {
  const { data } = await client.put(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id) {
  await client.delete(`/students/${id}`);
}
