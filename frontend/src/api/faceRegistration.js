import client from "./client";

export async function getStatus(studentId) {
  const { data } = await client.get(`/face-registration/${studentId}/status`);
  return data;
}

export async function captureFrame(studentId, imageDataUrl) {
  const { data } = await client.post(`/face-registration/${studentId}/capture`, {
    image: imageDataUrl,
  });
  return data;
}

export async function finalizeRegistration(studentId) {
  const { data } = await client.post(`/face-registration/${studentId}/finalize`);
  return data;
}

export async function resetRegistration(studentId) {
  await client.delete(`/face-registration/${studentId}/reset`);
}
