function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256File(file) {
  if (!window.crypto?.subtle)
    throw new Error("Este navegador no permite calcular SHA-256 de forma segura");
  return bytesToHex(await window.crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

export function resolveBackendUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const graphQlUrl = process.env.REACT_APP_GRAPHQL_URL;
  const origin = (() => {
    if (!graphQlUrl) return window.location.origin;
    try {
      return new URL(graphQlUrl, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  })();
  return new URL(value, origin).toString();
}

export async function uploadAuthorizedTicket(file, authorization) {
  if (file.size > authorization.maxBytes)
    throw new Error(
      `El archivo excede el máximo de ${Math.round(authorization.maxBytes / 1024 / 1024)} MB`
    );
  if (authorization.provider === "LOCAL") {
    const token = localStorage.getItem("token");
    const url = resolveBackendUrl(authorization.uploadUrl);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: file,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo almacenar el PDF localmente");
    return payload;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", authorization.apiKey);
  form.append("timestamp", String(authorization.timestamp));
  form.append("signature", authorization.signature);
  form.append("public_id", authorization.publicId);
  form.append("type", authorization.deliveryType);
  const response = await fetch(authorization.uploadUrl, { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || "Cloudinary rechazó el PDF");
  return { publicId: payload.public_id, bytes: payload.bytes, mimeType: "application/pdf" };
}

export async function materializeProtectedUrl(url) {
  const resolved = resolveBackendUrl(url);
  if (!resolved || /^https:\/\/api\.cloudinary\.com\//i.test(resolved))
    return { url: resolved, revoke: false };
  const token = localStorage.getItem("token");
  const response = await fetch(resolved, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("No fue posible obtener el PDF privado");
  return { url: URL.createObjectURL(await response.blob()), revoke: true };
}

export async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, run));
  return results;
}
