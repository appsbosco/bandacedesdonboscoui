/**
 * useImageUpload — shared hook for all profile photo uploads.
 *
 * Strategy:
 *  1. Client-side resize + compress (canvas) before upload  → smaller payload, faster upload
 *  2. Cloudinary transformation via URL params              → serve WebP at exact size, no waste
 *  3. Consistent validation, progress, error states         → reused everywhere
 *
 * @param {object} options
 *   maxWidthPx    — max dimension before compress (default 800)
 *   quality       — JPEG quality 0–1 (default 0.82)
 *   maxSizeMB     — reject files larger than this (default 8)
 */

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPLOAD_PROFILE_PIC } from "graphql/mutations";

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUD_NAME = "dnv9akklf";
const UPLOAD_PRESET = "dn5llzqm";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Append Cloudinary fetch transformations to a URL so the browser
 * always gets a WebP image at the right display size.
 *
 * w_400,h_400,c_fill  → square crop at 400 px (retina: displayed at 200 px max)
 * q_auto:good         → Cloudinary picks optimal quality
 * f_auto              → serve WebP/AVIF when supported
 */
export function cloudinaryOptimized(url, { width = 400, height = 400 } = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;
  // Insert transformation segment after /upload/
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto:good,f_auto/`);
}

// ── Client-side compress ──────────────────────────────────────────────────────

/**
 * Resize + compress an image File on the client using an offscreen canvas.
 * Returns a new File (JPEG) that is ≤ targetMaxWidth on its longest side.
 */
async function compressImage(file, { maxWidthPx = 800, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate target dimensions — preserve aspect ratio
      let { width, height } = img;
      if (width > maxWidthPx || height > maxWidthPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxWidthPx);
          width = maxWidthPx;
        } else {
          width = Math.round((width / height) * maxWidthPx);
          height = maxWidthPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };

    img.src = objectUrl;
  });
}

// ── Upload to Cloudinary ──────────────────────────────────────────────────────

async function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("cloud_name", CLOUD_NAME);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_URL);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url || data.url);
      } else {
        reject(new Error(`Cloudinary error ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];

function validateFile(file, maxSizeMB = 8) {
  if (!VALID_TYPES.includes(file.type)) return "Solo JPG, PNG, WEBP, GIF o HEIC.";
  if (file.size > maxSizeMB * 1024 * 1024) return `Máximo ${maxSizeMB} MB.`;
  return null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @returns {object}
 *   state        — "idle" | "previewing" | "compressing" | "uploading" | "success" | "error"
 *   previewUrl   — blob URL for local preview (null when idle)
 *   progress     — 0–100 upload progress
 *   errorMsg     — string error message
 *   pickFile     — call with a File to start the preview flow
 *   confirm      — call to compress + upload the pending file
 *   cancel       — reset everything
 *   inputProps   — spread onto <input type="file"> for file picking
 */
export function useImageUpload(
  userId,
  { maxWidthPx = 800, quality = 0.82, maxSizeMB = 8, onSuccess } = {}
) {
  const [uploadProfilePic] = useMutation(UPLOAD_PROFILE_PIC);
  const fileInputRef = useRef(null);

  const [state, setState] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setState("idle");
    setProgress(0);
    setErrorMsg("");
  }, [previewUrl]);

  const pickFile = useCallback(
    (file) => {
      if (!file) return;
      const err = validateFile(file, maxSizeMB);
      if (err) {
        setErrorMsg(err);
        setState("error");
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);
      setPendingFile(file);
      setErrorMsg("");
      setState("previewing");
    },
    [previewUrl, maxSizeMB]
  );

  const confirm = useCallback(async () => {
    if (!pendingFile || !userId) return;

    try {
      // 1. Compress on client
      setState("compressing");
      const compressed = await compressImage(pendingFile, { maxWidthPx, quality });

      // 2. Upload via XHR (real progress)
      setState("uploading");
      setProgress(0);
      const rawUrl = await uploadToCloudinary(compressed, setProgress);

      // 3. Persist to DB
      await uploadProfilePic({ variables: { id: userId, avatar: rawUrl } });

      // 4. Clean up & notify
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingFile(null);
      setState("success");
      setProgress(100);

      onSuccess?.(rawUrl);

      setTimeout(reset, 2500);
    } catch (err) {
      console.error("[useImageUpload]", err);
      setErrorMsg("No se pudo subir la foto. Intentá de nuevo.");
      setState("error");
    }
  }, [pendingFile, userId, maxWidthPx, quality, previewUrl, uploadProfilePic, onSuccess, reset]);

  const inputProps = {
    ref: fileInputRef,
    type: "file",
    accept: VALID_TYPES.join(","),
    className: "hidden",
    onChange: (e) => {
      pickFile(e.target.files?.[0]);
      e.target.value = "";
    },
  };

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  return {
    state,
    previewUrl,
    progress,
    errorMsg,
    pickFile,
    confirm,
    cancel: reset,
    openPicker,
    inputProps,
  };
}
