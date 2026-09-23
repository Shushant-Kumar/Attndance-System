import client from "./client";

export async function identifyFrame(imageDataUrl) {
  const { data } = await client.post("/recognition/identify", { image: imageDataUrl });
  return data; // { image_width, image_height, faces: [...], known_students_loaded }
}

export async function getKnownCount() {
  const { data } = await client.get("/recognition/known-count");
  return data.count;
}
