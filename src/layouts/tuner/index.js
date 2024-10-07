import React, { useState, useEffect, useRef } from "react";
import notes from "./notes.js";
import "./tuner.css";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Componentes adicionales
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Imágenes
import wavesWhite from "assets/images/shapes/waves-white.svg";
import HappyFace from "./happy.svg";
import NeutralFace from "./neutral.svg";
import SadFace from "./sad.svg";
import Manecilla from "./manecilla.svg";
import Scale from "./scale.svg";

const Tuner = () => {
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState(0);
  const [detune, setDetune] = useState(0);
  const [isMicrophoneAccessible, setIsMicrophoneAccessible] = useState(true);

  // Variables para evaluar la estabilidad y tendencias
  const [frequencyHistory, setFrequencyHistory] = useState([]);
  const [detuneHistory, setDetuneHistory] = useState([]);

  const audioContextRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);

  useEffect(() => {
    const startAudio = async () => {
      try {
        const AudioContext = window.AudioContext;
        audioContextRef.current = new AudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

        // Crear un filtro de paso banda
        const bandpassFilter = audioContextRef.current.createBiquadFilter();
        bandpassFilter.type = "bandpass";
        bandpassFilter.frequency.value = 440; // Frecuencia central
        bandpassFilter.Q.value = 1; // Factor de calidad

        // Conectar el filtro al stream de entrada
        mediaStreamSourceRef.current.connect(bandpassFilter);

        analyserNodeRef.current = audioContextRef.current.createAnalyser();
        analyserNodeRef.current.fftSize = 2048;

        // Conectar el filtro al analizador
        bandpassFilter.connect(analyserNodeRef.current);

        updatePitch();
      } catch (err) {
        console.error("Error al acceder al micrófono:", err);
        setIsMicrophoneAccessible(false);
      }
    };

    startAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updatePitch = () => {
    const bufferLength = analyserNodeRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserNodeRef.current.getFloatTimeDomainData(buffer);

    const ac = autoCorrelate(buffer, audioContextRef.current.sampleRate);

    if (ac !== -1) {
      setFrequency(ac);
      const closestNote = getClosestNote(ac);
      setNote(closestNote.note);
      const detuneValue = getDetune(ac, closestNote.frequency);
      setDetune(detuneValue);

      // Actualizar el historial de frecuencias y desviaciones
      setFrequencyHistory((prev) => [...prev.slice(-49), ac]);
      setDetuneHistory((prev) => [...prev.slice(-49), detuneValue]);
    } else {
      setNote("");
      setFrequency(0);
      setDetune(0);

      // Limpiar el historial si no se detecta sonido
      setFrequencyHistory([]);
      setDetuneHistory([]);
    }

    requestAnimationFrame(updatePitch);
  };

  function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    let correlations = new Array(MAX_SAMPLES);

    for (let i = 0; i < SIZE; i++) {
      let val = buffer[i];
      rms += val * val;
    }

    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.0025) return -1;

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      correlations[offset] = correlation;

      if (correlation > 0.9 && correlation > lastCorrelation) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        let shift =
          (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
        return sampleRate / (bestOffset + 8 * shift);
      }
      lastCorrelation = correlation;
    }
    if (bestCorrelation > 0.01) {
      return sampleRate / bestOffset;
    }
    return -1;
  }

  function getClosestNote(freq) {
    let minDiff = Infinity;
    let closestNote = null;

    for (let i = 0; i < notes.length; i++) {
      let diff = Math.abs(freq - notes[i].frequency);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = notes[i];
      }
    }

    return closestNote;
  }

  function getDetune(freq, refFreq) {
    return 1200 * Math.log2(freq / refFreq);
  }

  // Función para evaluar la estabilidad de la afinación
  const getStabilityFeedback = () => {
    if (frequencyHistory.length < 10) return ""; // Necesitamos suficientes datos

    // Calcular la desviación estándar
    const mean = frequencyHistory.reduce((sum, freq) => sum + freq, 0) / frequencyHistory.length;
    const variance =
      frequencyHistory.reduce((sum, freq) => sum + (freq - mean) ** 2, 0) / frequencyHistory.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 0.5) {
      return "🎵 Estás manteniendo el tono estable. ¡Excelente trabajo!";
    } else {
      return "⚠️ El tono está fluctuando. Trata de mantener una columna de aire constante y una embocadura firme.";
    }
  };

  // Función para evaluar las tendencias de afinación
  const getTrendFeedback = () => {
    if (detuneHistory.length < 10) return ""; // Necesitamos suficientes datos

    // Calcular la desviación media
    const meanDetune = detuneHistory.reduce((sum, det) => sum + det, 0) / detuneHistory.length;

    if (meanDetune > 5) {
      return "🔺 Tiendes a estar un poco alto en afinación (la nota es más aguda de lo que debería). Intenta relajar un poco la embocadura o reducir la presión de aire.";
    } else if (meanDetune < -5) {
      return "🔻 Tiendes a estar un poco bajo en afinación (la nota es más grave de lo que debería). Intenta ajustar la embocadura o aumentar la presión de aire.";
    } else {
      return "✔️ Estás afinando correctamente. ¡Sigue así!";
    }
  };

  // Función para obtener retroalimentación específica de la nota para instrumentos de viento
  const getNoteSpecificFeedback = (note) => {
    const windInstrumentTips = {
      C4: "El Do medio es esencial en instrumentos de viento. Asegúrate de tener una buena postura y apoyarte en el diafragma.",
      D4: "El Re puede ser complicado en afinación. Verifica que tus dedos cubran correctamente los orificios o llaves.",
      E4: "El Mi suele requerir un control preciso de la embocadura. Practica escalas lentas para mejorar.",
      F4: "El Fa necesita una columna de aire estable. Concéntrate en tu respiración.",
      G4: "El Sol es una nota común. Trabaja en la claridad y proyección del sonido.",
      A4: "El La es la referencia de afinación. Usa esta nota para calibrar tu instrumento.",
      B4: "El Si puede ser sensible. Asegúrate de una embocadura relajada pero firme.",
      C5: "El Do agudo requiere más control. Practica notas largas para fortalecer tu embocadura.",
    };

    // Manejar notas con sostenidos y bemoles
    const cleanNote = note.split("/")[0];
    return windInstrumentTips[cleanNote] || "";
  };

  // Función para obtener consejos específicos
  const getSpecificTips = () => {
    if (detuneHistory.length < 10) return ""; // Necesitamos suficientes datos

    const stabilityFeedback = getStabilityFeedback();
    const trendFeedback = getTrendFeedback();

    let tips = "";

    if (stabilityFeedback.includes("fluctuando")) {
      tips += "🔹 Mantén una postura erguida y relajada para facilitar la respiración.\n";
      tips +=
        "🔹 Practica ejercicios de respiración diafragmática para mejorar la estabilidad del tono.\n";
      tips += "🔹 Asegúrate de que tu embocadura sea consistente y estable.\n";
    }

    if (trendFeedback.includes("alto")) {
      tips += "🔹 Relaja ligeramente tu embocadura para bajar el tono.\n";
      tips += "🔹 Reduce un poco la presión de aire sin perder soporte.\n";
      tips +=
        "🔹 Revisa la posición de tu instrumento; pequeños ajustes pueden afectar la afinación.\n";
    } else if (trendFeedback.includes("bajo")) {
      tips += "🔹 Aumenta la firmeza de tu embocadura para subir el tono.\n";
      tips += "🔹 Incrementa la presión de aire manteniendo una respiración controlada.\n";
      tips += "🔹 Asegúrate de que tu instrumento esté limpio y en buenas condiciones.\n";
    }

    return tips;
  };

  // Función para obtener notas explicativas
  const getExplanationNotes = () => {
    return (
      "- ¿Qué significa estar 'alto' en afinación?\n" +
      "  Estar 'alto' significa que el sonido que produces es más agudo que la nota correcta. En instrumentos de viento, esto puede deberse a una embocadura demasiado tensa o exceso de presión de aire.\n\n" +
      "- ¿Qué significa estar 'bajo' en afinación?\n" +
      "  Estar 'bajo' significa que el sonido que produces es más grave que la nota correcta. Puede ser resultado de una embocadura demasiado relajada o insuficiente presión de aire.\n\n" +
      "- Importancia de la afinación:\n" +
      "  Una buena afinación es esencial para sonar bien en conjunto y mejorar tu musicalidad. Te ayuda a desarrollar un oído más preciso y una técnica sólida.\n\n" +
      "- Consejos generales:\n" +
      "  Practica con regularidad, escucha atentamente y ten paciencia contigo mismo. La mejora en afinación y técnica es un proceso continuo."
    );
  };

  // Función para obtener el mensaje de retroalimentación
  const getFeedbackMessage = () => {
    if (!note) return "Debes tocar una nota para comenzar.";

    const stabilityFeedback = getStabilityFeedback();
    const trendFeedback = getTrendFeedback();
    const specificTips = getSpecificTips();
    const noteSpecificFeedback = getNoteSpecificFeedback(note);

    return (
      `🎵 Estás tocando un ${note}. ${noteSpecificFeedback}\n\n` +
      `${stabilityFeedback}\n\n` +
      `${trendFeedback}\n\n` +
      `${specificTips}`
    );
  };

  // Función para obtener la imagen correspondiente
  const getFaceImage = () => {
    if (!note) return <img src={NeutralFace} alt="Carita neutral" style={{ width: "300px" }} />;

    if (Math.abs(detune) < 5)
      return <img src={HappyFace} alt="Carita feliz" style={{ width: "100%", height: "300px" }} />;
    if (Math.abs(detune) < 20)
      return <img src={NeutralFace} alt="Carita neutral" style={{ width: "300px" }} />;
    return <img src={SadFace} alt="Carita triste" style={{ width: "300px" }} />;
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Card className="text">
        <SoftBox p={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <SoftBox display="flex" flexDirection="column" height="100%">
                <SoftBox pt={1} mb={0.5}>
                  <SoftTypography variant="body2" color="text" fontWeight="medium">
                    Afinador BCDB
                  </SoftTypography>
                </SoftBox>
                <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
                  Toca una nota para comenzar
                </SoftTypography>
                <SoftBox mb={3} mt={3}>
                  <div className="meter">
                    <img src={Scale} alt="Escala" style={{ width: "100%" }} />
                    <div className="meter-scale">
                      <img
                        src={Manecilla}
                        alt="Aguja"
                        className="needle"
                        style={{
                          transform: `rotate(${detune * 0.1}deg)`,
                          width: "100%",
                        }}
                      />
                    </div>
                  </div>

                  <SoftTypography variant="body2" color="text" style={{ whiteSpace: "pre-wrap" }}>
                    {getFeedbackMessage()}
                  </SoftTypography>
                </SoftBox>
                <SoftTypography
                  component="p"
                  variant="button"
                  color="text"
                  fontWeight="medium"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    mt: "auto",

                    "& .material-icons-round": {
                      fontSize: "1.125rem",
                      transform: `translate(2px, -0.5px)`,
                      transition: "transform 0.2s cubic-bezier(0.34,1.61,0.7,1.3)",
                    },

                    "&:hover .material-icons-round, &:focus  .material-icons-round": {
                      transform: `translate(6px, -0.5px)`,
                    },
                  }}
                >
                  <div className="note">{note}</div>
                  <div className="frequency">{`${frequency.toFixed(2)} Hz`}</div>
                </SoftTypography>
              </SoftBox>
            </Grid>
            <Grid item xs={12} lg={5} sx={{ position: "relative", ml: "auto" }}>
              <SoftBox
                height="100%"
                display="grid"
                justifyContent="center"
                alignItems="center"
                bgColor="#FFC62B"
                borderRadius="lg"
                variant="gradient"
                style={{
                  background: "linear-gradient(180deg, #FFC62B 0%, #F28C0B 100%)",
                }}
              >
                <SoftBox
                  component="img"
                  src={wavesWhite}
                  alt="waves"
                  display="block"
                  position="absolute"
                  left={0}
                  width="100%"
                  height="100%"
                />
                {getFaceImage()}
              </SoftBox>
            </Grid>

            <Grid item xs={12}>
              <SoftBox display="flex" flexDirection="column" height="100%">
                <SoftBox pt={1} mb={0.5}>
                  <SoftTypography variant="body2" color="text" fontWeight="medium">
                    Aprendizaje
                  </SoftTypography>
                </SoftBox>
                <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
                  📘 Notas explicativas
                </SoftTypography>
                <SoftBox mb={6}>
                  <SoftTypography variant="body2" color="text" style={{ whiteSpace: "pre-wrap" }}>
                    {getExplanationNotes()}
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      </Card>
    </DashboardLayout>
  );
};

export default Tuner;
