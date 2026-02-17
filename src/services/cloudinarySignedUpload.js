/**
 * Signed upload to Cloudinary using backend-provided credentials.
 */
export async function uploadSignedToCloudinary({
  cloudName,
  apiKey,
  timestamp,
  signature,
  folder,
  publicId,
  fileBlob,
}) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const fd = new FormData();
  fd.append("file", fileBlob);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);
  fd.append("public_id", publicId);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
