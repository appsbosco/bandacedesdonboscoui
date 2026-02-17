// FILE: src/utils/opencvLoader.js

let cvInstance = null;
let loadingPromise = null;
let isLoaded = false;

function dbg() {
  try {
    return localStorage.getItem("scannerDebug") === "1";
  } catch {
    return false;
  }
}

function log(...a) {
  if (dbg()) console.log("[opencv-loader]", ...a);
}

function disabled() {
  try {
    return localStorage.getItem("disableOpenCV") === "1";
  } catch {
    return false;
  }
}

async function unwrapCvMaybePromise(cv) {
  // La doc indica que `cv` puede venir como Promise.
  return cv instanceof Promise ? await cv : cv;
}

async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function loadOpenCV() {
  if (disabled()) {
    log("OpenCV disabled via localStorage.disableOpenCV=1");
    throw new Error("OpenCV disabled");
  }

  if (isLoaded && cvInstance) return cvInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    (async () => {
      try {
        if (typeof window === "undefined") throw new Error("No window environment");

        // Si ya existe
        if (window.cv) {
          const cv0 = await unwrapCvMaybePromise(window.cv);
          if (cv0 && cv0.Mat) {
            window.cv = cv0;
            cvInstance = cv0;
            isLoaded = true;
            log("OpenCV already ready (window.cv)");
            resolve(cvInstance);
            return;
          }
        }

        // Fail-fast: si falta wasm, no va a inicializar nunca (en la mayoría de builds)
        const hasWasm = await head("/opencv_js.wasm");
        if (!hasWasm) {
          throw new Error(
            "Falta /opencv_js.wasm en public/. Sin ese archivo OpenCV.js no inicializa y la app se queda cargando."
          );
        }

        // Module debe existir antes de cargar el script
        window.Module = window.Module || {};
        window.Module.locateFile = (path) => `/${path}`; // opencv_js.wasm desde tu dominio

        const scriptAlready = document.querySelector("script[data-opencv='1']");
        if (scriptAlready) {
          log("Script already injected, waiting for cv...");
          const start = performance.now();
          while (performance.now() - start < 20000) {
            if (window.cv) {
              const cv1 = await unwrapCvMaybePromise(window.cv);
              if (cv1 && cv1.Mat) {
                window.cv = cv1;
                cvInstance = cv1;
                isLoaded = true;
                resolve(cvInstance);
                return;
              }
            }
            await new Promise((r) => setTimeout(r, 50));
          }
          throw new Error("OpenCV init timeout (cv.Mat nunca apareció)");
        }

        const script = document.createElement("script");
        script.dataset.opencv = "1";
        script.async = true;
        script.defer = true;
        script.src = "/opencv.js";

        const timeout = setTimeout(() => {
          reject(new Error("OpenCV load timeout (opencv.js / wasm no terminaron de iniciar)"));
        }, 20000);

        const finish = async () => {
          if (!window.cv) return false;
          const cv2 = await unwrapCvMaybePromise(window.cv);
          if (cv2 && cv2.Mat) {
            window.cv = cv2;
            cvInstance = cv2;
            isLoaded = true;
            clearTimeout(timeout);
            resolve(cvInstance);
            return true;
          }
          return false;
        };

        window.Module.onRuntimeInitialized = async () => {
          log("onRuntimeInitialized fired");
          await finish();
        };

        script.onload = async () => {
          log("opencv.js loaded");
          // algunos builds usan cv.onRuntimeInitialized
          if (window.cv && !window.cv.Mat) {
            try {
              window.cv.onRuntimeInitialized = async () => {
                log("cv.onRuntimeInitialized fired");
                await finish();
              };
            } catch {}
          }
          await finish();
        };

        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("No se pudo cargar /opencv.js (revisa public/opencv.js)"));
        };

        document.head.appendChild(script);
      } catch (e) {
        reject(e);
      }
    })();
  });

  return loadingPromise;
}

export function isOpenCVReady() {
  return isLoaded && !!cvInstance && !!cvInstance.Mat;
}

export function getCV() {
  if (!isOpenCVReady()) throw new Error("OpenCV not ready");
  return cvInstance;
}

export default loadOpenCV;
