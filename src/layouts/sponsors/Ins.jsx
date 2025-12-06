// app/sponsors/ins/page.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Shield,
  Heart,
  Users,
  Globe,
  TrendingUp,
  Award,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Calendar,
  MapPin,
  Star,
  Building2,
  Target,
  Zap,
  Clock,
  Play,
  Pause,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Info,
  Mail,
  Phone,
  Music,
  Flame,
  Trophy,
} from "lucide-react";
import PropTypes from "prop-types";
import logoJacks from "./logojacks.png";
import logoBCDB from "./Logo BCDB.png";
import { insSponsorContent } from "./content";

// TODO: SEO handled at app shell (use react-helmet or similar at root level)

// ============================================
// Componente: DiamondFlare (efecto diamante)
// ============================================
const DiamondFlare = ({ className = "" }) => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        shouldReduceMotion
          ? { opacity: 0.4, scale: 1 }
          : { opacity: [0.3, 0.6, 0.3], scale: [0.8, 1.2, 0.8] }
      }
      transition={
        shouldReduceMotion ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-cyan-200 to-blue-300 opacity-40 blur-2xl rounded-full" />
        <div className="absolute inset-4 bg-gradient-to-tr from-sky-400 to-cyan-300 opacity-60 blur-xl rounded-full" />
      </div>
    </motion.div>
  );
};

DiamondFlare.propTypes = {
  className: PropTypes.string,
};

// ============================================
// Componente: AnimatedCounter
// ============================================
const AnimatedCounter = ({ end, suffix = "", duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const startValue = 0;

    let endValue;
    if (typeof end === "number") {
      endValue = end;
    } else if (typeof end === "string") {
      const parsed = parseInt(end.replace(/\D/g, ""), 10);
      endValue = isNaN(parsed) ? 0 : parsed;
    } else {
      endValue = 0;
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isInView]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
};

AnimatedCounter.propTypes = {
  end: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  suffix: PropTypes.string,
  duration: PropTypes.number,
};

// ============================================
// Componente Principal
// ============================================
export default function INSSponsorPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    setIsVisible(true);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (
      !insSponsorContent?.testimonials ||
      !Array.isArray(insSponsorContent.testimonials) ||
      insSponsorContent.testimonials.length <= 1
    )
      return;

    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % insSponsorContent.testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (iconName, fallback = Shield) => {
    const iconMap = {
      Users,
      Calendar,
      Globe,
      Clock,
      Award,
      TrendingUp,
      Shield,
      Heart,
      Target,
      Zap,
      Music,
      Flame,
      Trophy,
      Building2,
      MapPin,
    };
    return iconMap[iconName] || fallback;
  };

  return (
    <div className="bg-slate-50 overflow-hidden">
      {insSponsorContent?.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(insSponsorContent.structuredData),
          }}
        />
      )}

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <motion.section
        style={shouldReduceMotion ? {} : { opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 pt-20 pb-32 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute top-20 left-10 w-96 h-96 bg-cyan-400 rounded-full mix-blend-overlay blur-3xl"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                  }
            }
            transition={
              shouldReduceMotion ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-sky-300 rounded-full mix-blend-overlay blur-3xl"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, -50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
                  }
            }
            transition={
              shouldReduceMotion
                ? {}
                : { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }
          />
        </div>

        <DiamondFlare className="top-10 right-20" />
        <DiamondFlare className="bottom-40 left-20" />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h6V4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            transform: shouldReduceMotion ? "none" : `translateY(${scrollY * 0.3}px)`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-8 mb-12"
          >
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: 2 }}
              className="relative w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-cyan-300/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={logoBCDB}
                alt="Logo Banda CEDES Don Bosco"
                loading="lazy"
                decoding="async"
                className="relative z-10 max-w-20 max-h-20 object-contain"
              />
            </motion.div>

            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }
              }
              transition={
                shouldReduceMotion ? {} : { duration: 20, repeat: Infinity, ease: "linear" }
              }
              className="flex flex-col items-center"
            >
              <div className="relative">
                <Sparkles className="w-12 h-12 text-sky-300 fill-sky-300" />
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-12 h-12 text-cyan-200 fill-cyan-200" />
                  </motion.div>
                )}
              </div>
              <div className="mt-3 px-4 py-1 bg-white/10 backdrop-blur-md rounded-full">
                <span className="text-sky-100 font-bold text-xs tracking-wider">ALIANZA</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: -2 }}
              className="relative w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-300/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={insSponsorContent?.assets?.logos?.ins || logoJacks}
                alt="Logo INS - Patrocinador Diamante"
                loading="lazy"
                decoding="async"
                className="relative z-10 w-24 h-24 object-contain"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-sky-400/20 to-cyan-300/20 backdrop-blur-md border-2 border-sky-300/30 px-8 py-4 rounded-full shadow-2xl">
              <div className="relative">
                <motion.div
                  animate={shouldReduceMotion ? {} : { rotate: [0, 360] }}
                  transition={
                    shouldReduceMotion ? {} : { duration: 3, repeat: Infinity, ease: "linear" }
                  }
                >
                  <Sparkles className="w-6 h-6 text-sky-200 fill-sky-200" />
                </motion.div>
              </div>
              <span className="text-white font-bold text-lg tracking-wide">
                {insSponsorContent?.hero?.badge || "Patrocinador Diamante Oficial"}
              </span>
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: [0, -360] }}
                transition={
                  shouldReduceMotion ? {} : { duration: 3, repeat: Infinity, ease: "linear" }
                }
              >
                <Sparkles className="w-6 h-6 text-cyan-200 fill-cyan-200" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb-8 leading-none">
              {insSponsorContent?.hero?.headline
                ? insSponsorContent.hero.headline.split("\n").map((line, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <br />}
                      {idx === 1 ? (
                        <span className="relative inline-block">
                          <span className="absolute inset-0 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 blur-2xl opacity-50" />
                          <span className="relative bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent">
                            {line}
                          </span>
                        </span>
                      ) : (
                        line
                      )}
                    </React.Fragment>
                  ))
                : "INS × BCDB"}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl sm:text-2xl lg:text-3xl text-sky-50 max-w-4xl mx-auto mb-12 leading-relaxed"
            >
              {insSponsorContent?.hero?.subheading ||
                "Una alianza de excelencia rumbo a Pasadena 2027"}
            </motion.p>

            {insSponsorContent?.hero?.cta?.primary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="flex justify-center"
              >
                <a
                  href="#historia"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("historia")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-3 bg-white text-emerald-800 hover:bg-emerald-50 px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50"
                  aria-label="Descubrir la alianza INS y BCDB"
                >
                  Descubrir la alianza
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="rgb(248 250 252)"
            />
          </svg>
        </div>
      </motion.section>

      {/* ============================================ */}
      {/* MÉTRICAS DE IMPACTO */}
      {/* ============================================ */}
      {insSponsorContent?.metrics &&
        Array.isArray(insSponsorContent.metrics) &&
        insSponsorContent.metrics.length > 0 && (
          <section className="py-20 bg-slate-50 -mt-20 relative z-10">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {insSponsorContent.metrics.map((metric, index) => {
                  const Icon = getIcon(metric.icon, Award);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                      <div className="relative bg-white rounded-3xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4 group-hover:rotate-12 transition-transform shadow-lg">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent mb-2">
                          {metric.animated ? (
                            <AnimatedCounter end={metric.value} suffix={metric.suffix || ""} />
                          ) : (
                            <>
                              {metric.value}
                              {metric.suffix}
                            </>
                          )}
                        </div>
                        <div className="text-sm lg:text-base text-slate-600 font-semibold">
                          {metric.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* POR QUÉ DIAMANTE */}
      {/* ============================================ */}
      {insSponsorContent?.whyDiamond?.reasons &&
        Array.isArray(insSponsorContent.whyDiamond.reasons) &&
        insSponsorContent.whyDiamond.reasons.length > 0 && (
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.whyDiamond.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-sm mb-6">
                    <Shield className="w-4 h-4" />
                    {insSponsorContent.whyDiamond.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.whyDiamond.title || "¿Por qué Diamante?"}
                </h2>
                {insSponsorContent.whyDiamond.subtitle && (
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                    {insSponsorContent.whyDiamond.subtitle}
                  </p>
                )}
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {insSponsorContent.whyDiamond.reasons.map((reason, index) => {
                  const Icon = getIcon(reason.icon, Shield);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity" />
                      <div className="relative bg-slate-50 rounded-3xl p-8 h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-slate-100 group-hover:border-emerald-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{reason.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{reason.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* RELATO INS × BCDB */}
      {/* ============================================ */}
      {insSponsorContent?.story?.paragraphs &&
        Array.isArray(insSponsorContent.story.paragraphs) &&
        insSponsorContent.story.paragraphs.length > 0 && (
          <section id="historia" className="py-24 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.story.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-100 text-cyan-700 rounded-full font-semibold text-sm mb-6">
                    <Building2 className="w-4 h-4" />
                    {insSponsorContent.story.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.story.title || "Nuestra alianza"}
                </h2>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  {insSponsorContent.story.paragraphs.map((paragraph, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100"
                    >
                      <p className="text-lg text-slate-700 leading-relaxed">{paragraph}</p>
                    </div>
                  ))}

                  {insSponsorContent.story.keyValues &&
                    Array.isArray(insSponsorContent.story.keyValues) &&
                    insSponsorContent.story.keyValues.length > 0 && (
                      <div className="flex flex-wrap gap-4 pt-4">
                        {insSponsorContent.story.keyValues.map((value, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-full text-sm font-semibold"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  {insSponsorContent?.assets?.media?.hero && (
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                      <img
                        src={insSponsorContent.assets.media.hero}
                        alt="INS × BCDB - Alianza Diamante"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {insSponsorContent?.assets?.media?.video && (
                        <button
                          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity focus:outline-none focus:ring-4 focus:ring-white/50"
                          aria-label={isVideoPlaying ? "Pausar video" : "Reproducir video"}
                        >
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                            {isVideoPlaying ? (
                              <Pause className="w-10 h-10 text-emerald-700" />
                            ) : (
                              <Play className="w-10 h-10 text-emerald-700 ml-1" />
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-cyan-400 to-sky-400 rounded-full opacity-20 blur-3xl" />
                  <div className="absolute -top-8 -left-8 w-40 h-40 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-20 blur-3xl" />
                </motion.div>
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* TIMELINE CAMINO A PASADENA */}
      {/* ============================================ */}
      {insSponsorContent?.timeline?.milestones &&
        Array.isArray(insSponsorContent.timeline.milestones) &&
        insSponsorContent.timeline.milestones.length > 0 && (
          <section className="py-24 bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900" />

            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="white" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h6V4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
            )}

            <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.timeline.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 rounded-full font-semibold text-sm mb-6">
                    <MapPin className="w-4 h-4" />
                    {insSponsorContent.timeline.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                  {insSponsorContent.timeline.title || "Camino a Pasadena"}
                </h2>
                {insSponsorContent.timeline.subtitle && (
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    {insSponsorContent.timeline.subtitle}
                  </p>
                )}
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {insSponsorContent.timeline.milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    className="relative"
                  >
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-slate-700 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          {milestone.period}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{milestone.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{milestone.description}</p>
                    </div>

                    {index < insSponsorContent.timeline.milestones.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ChevronRight className="w-8 h-8 text-emerald-500" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* EL DESFILE DE LAS ROSAS */}
      {/* ============================================ */}
      {insSponsorContent?.roseParade?.facts &&
        Array.isArray(insSponsorContent.roseParade.facts) &&
        insSponsorContent.roseParade.facts.length > 0 && (
          <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.roseParade.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-rose-100 text-rose-700 rounded-full font-semibold text-sm mb-6">
                    <Trophy className="w-4 h-4" />
                    {insSponsorContent.roseParade.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.roseParade.title}
                </h2>
                {insSponsorContent.roseParade.subtitle && (
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                    {insSponsorContent.roseParade.subtitle}
                  </p>
                )}
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {insSponsorContent.roseParade.facts.map((fact, index) => {
                  const Icon = getIcon(fact.icon, Star);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-100 hover:border-rose-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{fact.title}</h3>
                          <p className="text-slate-600 leading-relaxed">{fact.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {insSponsorContent.roseParade.history && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-10 border-2 border-rose-100"
                >
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-rose-600" />
                    {insSponsorContent.roseParade.history.title}
                  </h3>
                  <div className="space-y-4">
                    {insSponsorContent.roseParade.history.paragraphs.map((para, idx) => (
                      <p key={idx} className="text-slate-700 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* INS EN ACCIÓN */}
      {/* ============================================ */}
      {insSponsorContent?.initiatives?.items &&
        Array.isArray(insSponsorContent.initiatives.items) &&
        insSponsorContent.initiatives.items.length > 0 && (
          <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.initiatives.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-teal-100 text-teal-700 rounded-full font-semibold text-sm mb-6">
                    <Zap className="w-4 h-4" />
                    {insSponsorContent.initiatives.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.initiatives.title || "Iniciativas"}
                </h2>
                {insSponsorContent.initiatives.subtitle && (
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                    {insSponsorContent.initiatives.subtitle}
                  </p>
                )}
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {insSponsorContent.initiatives.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center relative overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title || "Iniciativa INS"}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center">
                          <Zap className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed mb-4">{item.description}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1"
                          aria-label={`Conocer más sobre ${item.title}`}
                        >
                          Conocer más
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* TESTIMONIOS */}
      {/* ============================================ */}
      {insSponsorContent?.testimonials &&
        Array.isArray(insSponsorContent.testimonials) &&
        insSponsorContent.testimonials.length > 0 && (
          <section className="py-24 bg-gradient-to-br from-emerald-900 to-teal-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <motion.div
                className="absolute top-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"
                animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={shouldReduceMotion ? {} : { duration: 8, repeat: Infinity }}
              />
            </div>

            <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-sm text-sky-200 rounded-full font-semibold text-sm mb-6">
                  <Star className="w-4 h-4" />
                  Testimonios
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Voces de la alianza
                </h2>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-10 lg:p-12 border border-white/20"
                >
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-cyan-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl">
                      <Star className="w-8 h-8 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-2xl lg:text-3xl text-white font-light leading-relaxed italic mb-6">
                        &ldquo;{insSponsorContent.testimonials[activeTestimonial].quote}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-lg">
                        {insSponsorContent.testimonials[activeTestimonial].name}
                      </div>
                      <div className="text-sky-200">
                        {insSponsorContent.testimonials[activeTestimonial].role}
                      </div>
                    </div>

                    {insSponsorContent.testimonials.length > 1 && (
                      <div className="flex gap-2">
                        {insSponsorContent.testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTestimonial(idx)}
                            className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                              idx === activeTestimonial
                                ? "bg-white w-8"
                                : "bg-white/30 hover:bg-white/50"
                            }`}
                            aria-label={`Ver testimonio ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* GALERÍA */}
      {/* ============================================ */}
      {insSponsorContent?.gallery?.images &&
        Array.isArray(insSponsorContent.gallery.images) &&
        insSponsorContent.gallery.images.length > 0 && (
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.gallery.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 rounded-full font-semibold text-sm mb-6">
                    <Award className="w-4 h-4" />
                    {insSponsorContent.gallery.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.gallery.title || "Galería"}
                </h2>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {insSponsorContent.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all"
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Imagen ${index + 1} de la alianza INS × BCDB`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-sm font-semibold">
                        {image.caption || ""}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* FAQs */}
      {/* ============================================ */}
      {insSponsorContent?.faqs?.questions &&
        Array.isArray(insSponsorContent.faqs.questions) &&
        insSponsorContent.faqs.questions.length > 0 && (
          <section id="faqs" className="py-24 bg-slate-50">
            <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                {insSponsorContent.faqs.sectionLabel && (
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-sm mb-6">
                    <Info className="w-4 h-4" />
                    {insSponsorContent.faqs.sectionLabel}
                  </div>
                )}
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                  {insSponsorContent.faqs.title || "Preguntas frecuentes"}
                </h2>
              </motion.div>

              <div className="space-y-4">
                {insSponsorContent.faqs.questions.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      aria-expanded={activeFaq === index}
                    >
                      <span className="text-lg font-bold text-slate-900 pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`w-6 h-6 text-emerald-600 flex-shrink-0 transition-transform duration-300 ${
                          activeFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* LEGAL */}
      {/* ============================================ */}
      {insSponsorContent?.legal?.content &&
        Array.isArray(insSponsorContent.legal.content) &&
        insSponsorContent.legal.content.length > 0 && (
          <section id="legal" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-50 rounded-3xl p-10 border-2 border-slate-100"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {insSponsorContent.legal.title || "Información legal"}
                    </h3>
                    <div className="prose prose-slate max-w-none">
                      {insSponsorContent.legal.content.map((paragraph, idx) => (
                        <p key={idx} className="text-slate-600 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      {insSponsorContent?.footer && (
        <footer className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/20"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Elementos flotantes */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
          <div
            className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold mb-8">
              <Sparkles className="w-5 h-5" />
              Sé parte de la historia
              <Sparkles className="w-5 h-5" />
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-8 leading-tight">
              ¡Acompáñanos en
              <br />
              esta gran aventura!
            </h2>

            <p className="text-2xl text-red-50 mb-12 leading-relaxed max-w-3xl mx-auto">
              La unión entre {"INS"} y la Banda CEDES Don Bosco simboliza el trabajo en equipo, la
              excelencia y el amor por Costa Rica. Juntos, hacemos historia.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="/"
                className="group inline-flex items-center justify-center gap-3 bg-white text-red-600 hover:bg-red-50 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
              >
                Apoya el Proyecto
                <Heart className="w-6 h-6 group-hover:scale-125 transition-transform" />
              </a>
              <a
                href="/contacto"
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white/20 px-10 py-5 rounded-full font-bold text-xl transition-all duration-300"
              >
                Contactar
                <ChevronRight className="w-6 h-6" />
              </a>
            </div>

            <div className="mt-16 pt-16 border-t border-white/20">
              <p className="text-white/80 text-lg">
                Gracias a {"INS"} por creer en el talento costarricense 🇨🇷
              </p>
              <p className="text-white/80 text-lg">
                Copyright &copy; 2025 Banda CEDES Don Bosco - Todos los derechos reservados -
                Desarrollado por Josué Chinchilla Salazar.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
