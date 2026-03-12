/**
 * MotorMetronomo — Motor de audio desacoplado de React
 * 
 * Mejoras sobre versión anterior:
 * - Modo loop real en iniciarSimple (sin compilar 9999 repeticiones)
 * - Pause/resume correcto sin recompilar
 * - Cleanup robusto
 * - Callbacks con protección contra invocación post-cleanup
 */

function generarPatronAcento(numerador) {
  return Array.from({ length: numerador }, (_, i) => (i === 0 ? 1 : 0));
}

export class MotorMetronomo {
  constructor() {
    this.ctx = null;
    this.ticks = [];
    this.tickIndex = 0;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.estado = "detenido";
    this.timerID = null;
    this.lookahead = 0.1;
    this.intervaloSchedule = 25;
    this.onTick = null;
    this.onFin = null;
    this._sonido = "click";
    this._volumen = 0.8;
    this._modoLoop = false;
    this._configLoop = null;
    this._destruido = false;
  }

  _obtenerCtx() {
    if (this._destruido) throw new Error("Motor destruido");
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  _calcularBpm(tempo, progreso) {
    if (tempo.tipo === "fijo") return tempo.bpm;
    const { inicio, fin, curva } = tempo;
    const rango = fin - inicio;
    switch (curva) {
      case "exponencial": return inicio + rango * Math.pow(progreso, 2);
      case "logaritmica": return inicio + rango * Math.sqrt(Math.max(0, progreso));
      default: return inicio + rango * progreso;
    }
  }

  compilar(secciones, desdeSeccionId, countInHabilitado, countInBeats) {
    this.ticks = [];
    let tiempoActual = 0;

    let seccionesACompilar = secciones;
    if (desdeSeccionId !== undefined && desdeSeccionId !== null) {
      const idx = secciones.findIndex((s) => s.id === desdeSeccionId || s.seccionId === desdeSeccionId);
      if (idx !== -1) seccionesACompilar = secciones.slice(idx);
    }

    if (countInHabilitado && countInBeats > 0 && seccionesACompilar.length > 0) {
      const primera = seccionesACompilar[0];
      const bpmCI = primera.tempo.tipo === "fijo" ? primera.tempo.bpm : primera.tempo.inicio;
      const durBeat = 60 / bpmCI;
      for (let i = 0; i < countInBeats; i++) {
        this.ticks.push({
          tiempo: tiempoActual,
          esAcento: i === 0,
          seccionId: -1,
          nombreSeccion: "Preparación",
          numeroBeat: i + 1,
          numeroCompas: 0,
          bpmActual: bpmCI,
          esSubdivision: false,
        });
        tiempoActual += durBeat;
      }
    }

    for (const sec of seccionesACompilar) {
      const secId = sec.seccionId || sec.id;
      for (let compas = 0; compas < sec.repeticiones; compas++) {
        const beatsTotal = sec.repeticiones * sec.compas.numerador;
        for (let beat = 0; beat < sec.compas.numerador; beat++) {
          const beatAbsoluto = compas * sec.compas.numerador + beat;
          const progreso = beatsTotal > 0 ? beatAbsoluto / beatsTotal : 0;
          const bpm = this._calcularBpm(sec.tempo, progreso);
          const durBeat = 60 / bpm;
          const patron = Array.isArray(sec.patronAcento) ? sec.patronAcento : [];
          const esAcento = patron.length > beat ? patron[beat] === 1 : beat === 0;

          this.ticks.push({
            tiempo: tiempoActual,
            esAcento,
            seccionId: secId,
            nombreSeccion: sec.nombre,
            numeroBeat: beat + 1,
            numeroCompas: compas + 1,
            bpmActual: Math.round(bpm * 10) / 10,
            esSubdivision: false,
          });
          tiempoActual += durBeat;

          if (sec.subdivision > 1) {
            const durSub = durBeat / sec.subdivision;
            for (let s = 1; s < sec.subdivision; s++) {
              this.ticks.push({
                tiempo: tiempoActual - durBeat + durSub * s,
                esAcento: false,
                seccionId: secId,
                nombreSeccion: sec.nombre,
                numeroBeat: beat + 1,
                numeroCompas: compas + 1,
                bpmActual: Math.round(bpm * 10) / 10,
                esSubdivision: true,
              });
            }
          }
        }
      }
    }

    this.ticks.sort((a, b) => a.tiempo - b.tiempo);
  }

  _compilarLoop(config) {
    // Para modo rápido: compilamos 1 compás y hacemos loop manual
    this._loopTicks = [];
    let t = 0;
    const durBeat = 60 / config.bpm;
    for (let beat = 0; beat < config.pulsaciones; beat++) {
      const patronAcento = config.patronAcento || generarPatronAcento(config.pulsaciones);
      const esAcento = patronAcento[beat] === 1;
      this._loopTicks.push({
        tiempo: t,
        esAcento,
        seccionId: "rapido",
        nombreSeccion: "Rápido",
        numeroBeat: beat + 1,
        numeroCompas: 1,
        bpmActual: config.bpm,
        esSubdivision: false,
      });
      t += durBeat;
      if (config.subdivision > 1) {
        const durSub = durBeat / config.subdivision;
        for (let s = 1; s < config.subdivision; s++) {
          this._loopTicks.push({
            tiempo: t - durBeat + durSub * s,
            esAcento: false,
            seccionId: "rapido",
            nombreSeccion: "Rápido",
            numeroBeat: beat + 1,
            numeroCompas: 1,
            bpmActual: config.bpm,
            esSubdivision: true,
          });
        }
      }
    }
    this._loopTicks.sort((a, b) => a.tiempo - b.tiempo);
    this._loopDuracion = t;
    this._loopOffset = 0;
    this._loopTickIdx = 0;
  }

  _tocarClick(tiempo, esAcento, esCountIn, sonido, volumen) {
    if (!this.ctx || this._destruido) return;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);
    const volBase = esCountIn ? volumen * 0.65 : volumen;
    const volFinal = esAcento ? volBase : volBase * 0.45;
    gain.gain.setValueAtTime(0, tiempo);
    gain.gain.linearRampToValueAtTime(volFinal, tiempo + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.055);

    const osc = this.ctx.createOscillator();
    osc.connect(gain);

    const configs = {
      madera:   { fAc: 750,  fNorm: 550,  tipo: "triangle" },
      digital:  { fAc: 2200, fNorm: 1400, tipo: "sine" },
      suave:    { fAc: 880,  fNorm: 660,  tipo: "sine" },
      click:    { fAc: 1700, fNorm: 1100, tipo: "square" },
    };
    const cfg = configs[sonido] || configs.click;
    const fAc  = esCountIn ? 1400 : cfg.fAc;
    const fNorm = esCountIn ? 1000 : cfg.fNorm;

    osc.type = esCountIn ? "sine" : cfg.tipo;
    osc.frequency.setValueAtTime(esAcento ? fAc : fNorm, tiempo);
    osc.start(tiempo);
    osc.stop(tiempo + 0.06);
  }

  _schedulerLoop() {
    if (this.estado !== "reproduciendo" || !this.ctx || this._destruido) return;
    const ahora = this.ctx.currentTime;
    const ventanaFin = ahora - this.startTime + this.lookahead;

    // Recorrer ticks del loop compensando offset de repetición
    while (true) {
      const tickTiempo = this._loopTicks[this._loopTickIdx].tiempo + this._loopOffset;
      if (tickTiempo >= ventanaFin) break;

      const tick = { ...this._loopTicks[this._loopTickIdx], tiempo: tickTiempo };
      const tiempoAbs = this.startTime + tickTiempo;
      this._tocarClick(tiempoAbs, tick.esAcento, false, this._sonido, this._volumen);

      if (!tick.esSubdivision && this.onTick) {
        const delay = Math.max(0, (tiempoAbs - ahora) * 1000);
        const snapshot = { ...tick };
        setTimeout(() => {
          if (this.estado === "reproduciendo" && !this._destruido) this.onTick(snapshot);
        }, delay);
      }

      this._loopTickIdx++;
      if (this._loopTickIdx >= this._loopTicks.length) {
        this._loopTickIdx = 0;
        this._loopOffset += this._loopDuracion;
      }
    }
  }

  _scheduler() {
    if (this.estado !== "reproduciendo" || !this.ctx || this._destruido) return;
    const ahora = this.ctx.currentTime;
    const ventana = ahora - this.startTime + this.lookahead;

    while (this.tickIndex < this.ticks.length && this.ticks[this.tickIndex].tiempo < ventana) {
      const tick = this.ticks[this.tickIndex];
      const tiempoAbs = this.startTime + tick.tiempo;
      const esCountIn = tick.numeroCompas === 0;
      this._tocarClick(tiempoAbs, tick.esAcento, esCountIn, this._sonido, this._volumen);

      if (!tick.esSubdivision && this.onTick) {
        const delay = Math.max(0, (tiempoAbs - ahora) * 1000);
        const snapshot = { ...tick };
        setTimeout(() => {
          if (this.estado === "reproduciendo" && !this._destruido) this.onTick(snapshot);
        }, delay);
      }
      this.tickIndex++;
    }

    if (this.tickIndex >= this.ticks.length) {
      clearInterval(this.timerID);
      this.timerID = null;
      this.estado = "detenido";
      if (this.onFin && !this._destruido) setTimeout(() => this.onFin(), 200);
    }
  }

  iniciarSimple(config) {
    if (this._destruido) return;
    this._modoLoop = true;
    this._configLoop = config;
    this._sonido = config.sonido;
    this._volumen = config.volumen;
    const ctx = this._obtenerCtx();
    this._compilarLoop(config);
    this.estado = "reproduciendo";
    this.startTime = ctx.currentTime + 0.05;
    this.timerID = setInterval(() => this._schedulerLoop(), this.intervaloSchedule);
  }

  reproducir(secciones, desdeSeccionId, countIn, countInBeats, sonido, volumen) {
    if (this._destruido) return;
    this._modoLoop = false;
    this._sonido = sonido;
    this._volumen = volumen;
    const ctx = this._obtenerCtx();

    if (this.estado === "pausado" && desdeSeccionId === undefined) {
      this.startTime = ctx.currentTime - this.pauseOffset;
      this.estado = "reproduciendo";
      this.timerID = setInterval(() => this._scheduler(), this.intervaloSchedule);
      return;
    }

    this.compilar(secciones, desdeSeccionId, countIn, countInBeats);
    if (this.ticks.length === 0) return;

    this.estado = "reproduciendo";
    this.tickIndex = 0;
    this.startTime = ctx.currentTime + 0.05;
    this.timerID = setInterval(() => this._scheduler(), this.intervaloSchedule);
  }

  pausar() {
    if (this.estado !== "reproduciendo") return;
    this.pauseOffset = this.ctx ? this.ctx.currentTime - this.startTime : 0;
    clearInterval(this.timerID);
    this.timerID = null;
    this.estado = "pausado";
  }

  detener() {
    clearInterval(this.timerID);
    this.timerID = null;
    this.estado = "detenido";
    this.tickIndex = 0;
    this.pauseOffset = 0;
    this._loopOffset = 0;
    this._loopTickIdx = 0;
  }

  actualizarSonido(sonido, volumen) {
    this._sonido = sonido;
    this._volumen = volumen;
  }

  async exportarWAV(secciones, countIn, countInBeats, onProgreso) {
    this.compilar(secciones, undefined, countIn, countInBeats);
    if (this.ticks.length === 0) throw new Error("Sin contenido para exportar");
    const ultimoTick = this.ticks[this.ticks.length - 1];
    const duracion = ultimoTick.tiempo + 1;
    const sampleRate = 44100;
    const offCtx = new OfflineAudioContext(1, Math.ceil(duracion * sampleRate), sampleRate);

    this.ticks.forEach((tick, i) => {
      const esCountIn = tick.numeroCompas === 0;
      this._renderClickOffline(offCtx, tick.tiempo, tick.esAcento, esCountIn);
      if (onProgreso && i % 20 === 0) onProgreso((i / this.ticks.length) * 0.6);
    });

    onProgreso?.(0.6);
    const buffer = await offCtx.startRendering();
    onProgreso?.(0.8);
    const blob = this._audioBufferAWav(buffer);
    onProgreso?.(1);
    return blob;
  }

  _renderClickOffline(ctx, tiempo, esAcento, esCountIn) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = esAcento ? (esCountIn ? 1400 : 1200) : (esCountIn ? 1000 : 800);
    gain.gain.setValueAtTime(0, tiempo);
    gain.gain.linearRampToValueAtTime(esAcento ? 0.3 : 0.15, tiempo + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempo + 0.055);
    osc.start(tiempo);
    osc.stop(tiempo + 0.06);
  }

  _audioBufferAWav(buffer) {
    const length = buffer.length * 2;
    const ab = new ArrayBuffer(44 + length);
    const view = new DataView(ab);
    let pos = 0;
    const s16 = (v) => { view.setUint16(pos, v, true); pos += 2; };
    const s32 = (v) => { view.setUint32(pos, v, true); pos += 4; };
    s32(0x46464952); s32(36 + length); s32(0x45564157);
    s32(0x20746d66); s32(16); s16(1); s16(1);
    s32(buffer.sampleRate); s32(buffer.sampleRate * 2); s16(2); s16(16);
    s32(0x61746164); s32(length);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      pos += 2;
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  destruir() {
    this._destruido = true;
    this.detener();
    this.onTick = null;
    this.onFin = null;
    this.ctx?.close();
    this.ctx = null;
  }
}