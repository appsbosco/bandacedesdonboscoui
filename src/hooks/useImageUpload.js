/**
 * useImageUpload — shared hook for all profile photo uploads.
 *
 * Flow:
 *   idle → cropping (user adjusts crop) → previewing → compressing → uploading → success
 *                                       ↘ cancel → idle
 *
 * Changes vs original:
 *  - New "cropping" state inserted between file pick and preview.
 *  - pickFile now goes to "cropping" instead of "previewing".
 *  - New confirmCrop(croppedFile) method transitions from cropping → previewing.
 *  - All output photos are fixed at OUTPUT_SIZE (800 × 800) — enforced by ImageCropModal.
 */

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPLOAD_PROFILE_PIC } from "graphql/mutations";

// ── Cloudinary config ─────────────────────────────────────────────────────────
const CLOUD_NAME = "dnv9akklf";
const UPLOAD_PRESET = "dn5llzqm";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export function cloudinaryOptimized(url, { width = 400, height = 400 } = {}) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto:good,f_auto/`);
}

// ── Client-side compress ──────────────────────────────────────────────────────
// Used only after crop, since ImageCropModal already exports at OUTPUT_SIZE.
// This step mainly handles quality encoding.
async function compressImage(file, { maxWidthPx = 800, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
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
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
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
 * States:
 *   "idle"        — nothing happening
 *   "cropping"    — ImageCropModal is open; user adjusts framing
 *   "previewing"  — cropped blob shown; user can confirm or cancel
 *   "compressing" — re-encoding for upload
 *   "uploading"   — XHR in progress
 *   "success"     — done
 *   "error"       — something went wrong
 *
 * New in this version:
 *   cropSrc       — blob URL of the raw file to pass to ImageCropModal
 *   confirmCrop   — call with the File returned by ImageCropModal to advance to "previewing"
 */
export function useImageUpload(
  userId,
  { maxWidthPx = 800, quality = 0.82, maxSizeMB = 8, onSuccess } = {}
) {
  const [uploadProfilePic] = useMutation(UPLOAD_PROFILE_PIC);
  const fileInputRef = useRef(null);

  const [state, setState] = useState("idle");
  const [cropSrc, setCropSrc] = useState(null); // raw blob for the crop modal
  const [previewUrl, setPreviewUrl] = useState(null); // cropped blob for preview
  const [pendingFile, setPendingFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCropSrc(null);
    setPreviewUrl(null);
    setPendingFile(null);
    setState("idle");
    setProgress(0);
    setErrorMsg("");
  }, [cropSrc, previewUrl]);

  // Called when the user selects a file — opens the crop modal
  const pickFile = useCallback(
    (file) => {
      if (!file) return;
      const err = validateFile(file, maxSizeMB);
      if (err) {
        setErrorMsg(err);
        setState("error");
        return;
      }
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(URL.createObjectURL(file));
      setErrorMsg("");
      setState("cropping");
    },
    [cropSrc, maxSizeMB]
  );

  // Called by ImageCropModal with the cropped File → moves to "previewing"
  const confirmCrop = useCallback(
    (croppedFile) => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blobUrl = URL.createObjectURL(croppedFile);
      setPreviewUrl(blobUrl);
      setPendingFile(croppedFile);
      setState("previewing");
    },
    [cropSrc, previewUrl]
  );

  // Called when the user confirms the preview → compress + upload
  const confirm = useCallback(async () => {
    if (!pendingFile || !userId) return;

    try {
      setState("compressing");
      const compressed = await compressImage(pendingFile, { maxWidthPx, quality });

      setState("uploading");
      setProgress(0);
      const rawUrl = await uploadToCloudinary(compressed, setProgress);

      await uploadProfilePic({ variables: { id: userId, avatar: rawUrl } });

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
    cropSrc,
    previewUrl,
    progress,
    errorMsg,
    pickFile,
    confirmCrop,
    confirm,
    cancel: reset,
    openPicker,
    inputProps,
  };
}
