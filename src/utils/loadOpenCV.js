let cvLoaded = false;
let loadPromise = null;

export function loadOpenCV() {
  if (cvLoaded && window.cv?.Mat) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.7.0/opencv.js";
    script.async = true;

    script.onload = () => {
      // Wait for cv to initialize
      const checkCV = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkCV);
          cvLoaded = true;
          resolve();
        }
      }, 100);

      // Timeout after 10s
      setTimeout(() => {
        clearInterval(checkCV);
        if (!cvLoaded) {
          reject(new Error("OpenCV load timeout"));
        }
      }, 10000);
    };

    script.onerror = () => {
      reject(new Error("Failed to load OpenCV script"));
    };

    document.body.appendChild(script);
  });

  return loadPromise;
}
