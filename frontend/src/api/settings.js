import client from "./client";

export async function getProfile() {
  const { data } = await client.get("/settings/profile");
  return data;
}

export async function updateProfile(fullName, emailNotificationsEnabled) {
  const { data } = await client.put("/settings/profile", {
    full_name: fullName,
    email_notifications_enabled: emailNotificationsEnabled,
  });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await client.post("/settings/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}
