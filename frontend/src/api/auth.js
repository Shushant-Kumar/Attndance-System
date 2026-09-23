import client from "./client";

export async function login(email, password) {
  const { data } = await client.post("/auth/login", { email, password });
  return data; // { access_token, token_type, admin }
}

export async function logout() {
  try {
    await client.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin");
  }
}

export async function getMe() {
  const { data } = await client.get("/auth/me");
  return data;
}
