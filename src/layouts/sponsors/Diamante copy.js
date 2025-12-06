import React, { useState, useEffect } from "react";
import {
  Heart,
  Music,
  Users,
  Trophy,
  ChevronRight,
  Star,
  Sparkles,
  Target,
  TrendingUp,
  Globe,
  Calendar,
  MapPin,
  Award,
  CheckCircle2,
  ArrowRight,
  Crown,
  Gem,
  Zap,
  Shield,
  Camera,
  Tv,
  Radio,
  Newspaper,
  Building2,
  Handshake,
  Rocket,
  PartyPopper,
  Medal,
} from "lucide-react";

const DiamondSponsor = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    {
      number: "1",
      label: "Patrocinador Principal",
      icon: <Crown className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      number: "265+",
      label: "Jóvenes Impactados",
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "100M+",
      label: "Impresiones Globales",
      icon: <Globe className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      number: "2027",
      label: "Rose Parade",
      icon: <Trophy className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
    },
  ];

  const exclusiveBenefits = [
    {
      icon: <Crown className="w-10 h-10" />,
      title: "Reconocimiento Exclusivo",
      description: "Patrocinador Principal en TODOS los materiales y eventos oficiales",
      highlights: [
        "Logo principal en uniformes",
        "Naming rights en eventos",
        "Presentación especial en Pasadena",
      ],
      color: "from-purple-600 via-pink-600 to-rose-600",
    },
    {
      icon: <Tv className="w-10 h-10" />,
      title: "Cobertura Mediática VIP",
      description: "Exposición premium en televisión, radio y medios digitales",
      highlights: ["Menciones en NBC (USA)", "Cobertura nacional CR", "Contenido exclusivo redes"],
      color: "from-blue-600 via-cyan-600 to-teal-600",
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Experiencias VIP",
      description: "Acceso privilegiado para ejecutivos y clientes de la marca",
      highlights: [
        "20 pases VIP Pasadena",
        "Eventos privados con la banda",
        "Meet & greet exclusivo",
      ],
      color: "from-amber-600 via-orange-600 to-red-600",
    },
    {
      icon: <Camera className="w-10 h-10" />,
      title: "Contenido Premium",
      description: "Producción audiovisual profesional y derechos de uso",
      highlights: [
        "Video documental exclusivo",
        "Sesión fotográfica profesional",
        "Derechos comerciales contenido",
      ],
      color: "from-emerald-600 via-green-600 to-lime-600",
    },
    {
      icon: <Building2 className="w-10 h-10" />,
      title: "Activaciones Especiales",
      description: "Eventos y experiencias de marca personalizadas",
      highlights: ["Conciertos corporativos", "Presentaciones en sedes", "Tours promocionales"],
      color: "from-indigo-600 via-violet-600 to-purple-600",
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: "Exclusividad Garantizada",
      description: "Protección total de categoría y competencia",
      highlights: [
        "Único patrocinador categoría",
        "Veto competencia directa",
        "Territorio exclusivo",
      ],
      color: "from-slate-600 via-gray-600 to-zinc-600",
    },
  ];

  const mediaExposure = [
    {
      platform: "Televisión Nacional",
      reach: "2M+ espectadores",
      icon: <Tv />,
      color: "bg-red-500",
    },
    { platform: "NBC Universal", reach: "50M+ viewers USA", icon: <Tv />, color: "bg-blue-500" },
    {
      platform: "Redes Sociales",
      reach: "5M+ impresiones",
      icon: <Camera />,
      color: "bg-purple-500",
    },
    { platform: "Radio Nacional", reach: "1M+ oyentes", icon: <Radio />, color: "bg-orange-500" },
    {
      platform: "Prensa Escrita",
      reach: "500K+ lectores",
      icon: <Newspaper />,
      color: "bg-cyan-500",
    },
    { platform: "Digital/Streaming", reach: "10M+ views", icon: <Zap />, color: "bg-pink-500" },
  ];

  const timeline = [
    {
      phase: "Fase 1",
      period: "Enero - Junio 2025",
      title: "Lanzamiento Épico",
      items: [
        "Conferencia de prensa internacional",
        "Campaña de lanzamiento multimedia",
        "Evento inaugural con banda",
        "Activación en puntos de venta",
      ],
      icon: <Rocket />,
      color: "from-purple-500 to-pink-500",
    },
    {
      phase: "Fase 2",
      period: "Julio - Diciembre 2025",
      title: "Construcción de Marca",
      items: [
        "Serie de conciertos patrocinados",
        "Contenido documental exclusivo",
        "Experiencias VIP para clientes",
        "Giras regionales promocionales",
      ],
      icon: <Building2 />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      phase: "Fase 3",
      period: "Enero - Junio 2026",
      title: "Momentum Global",
      items: [
        "Campaña internacional pre-desfile",
        "Activaciones digitales masivas",
        "Eventos corporativos exclusivos",
        "Preparativos logísticos USA",
      ],
      icon: <TrendingUp />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      phase: "Fase 4",
      period: "Segundo Semestre 2026",
      title: "Cuenta Regresiva",
      items: [
        "Tour de despedida nacional",
        "Lanzamiento productos especiales",
        "Experiencia inmersiva marca",
        "Eventos pre-viaje USA",
      ],
      icon: <Calendar />,
      color: "from-orange-500 to-red-500",
    },
    {
      phase: "Fase 5",
      period: "Enero 2027",
      title: "El Gran Momento",
      items: [
        "Rose Parade en Pasadena",
        "Cobertura en vivo internacional",
        "Eventos VIP en California",
        "Celebración histórica CR",
      ],
      icon: <Trophy />,
      color: "from-amber-500 to-yellow-500",
    },
    {
      phase: "Fase 6",
      period: "Post Enero 2027",
      title: "Legado Permanente",
      items: [
        "Documental oficial lanzamiento",
        "Gira de celebración victoria",
        "Contenido perpetuo marca",
        "Reconocimientos internacionales",
      ],
      icon: <Medal />,
      color: "from-indigo-500 to-violet-500",
    },
  ];

  const investmentDetails = [
    {
      category: "Visibilidad Masiva",
      value: "$500K+",
      description: "Valor en exposición mediática",
      icon: <Tv />,
    },
    {
      category: "ROI Emocional",
      value: "Incalculable",
      description: "Conexión con audiencia nacional",
      icon: <Heart />,
    },
    {
      category: "Alcance Global",
      value: "100M+",
      description: "Impresiones internacionales",
      icon: <Globe />,
    },
    {
      category: "Contenido Exclusivo",
      value: "50+ piezas",
      description: "Material audiovisual premium",
      icon: <Camera />,
    },
  ];

  const vipBenefits = [
    "20 pases VIP para el Rose Parade en Pasadena",
    "Suite privada para eventos y presentaciones",
    "Meet & greet exclusivo con la banda",
    "Acceso backstage en todos los eventos",
    "Cena de gala anual con directivos",
    "Tours exclusivos y ensayos privados",
  ];

  return (
    <div className="bg-black min-h-screen">
      {/* Hero Section - Ultra Premium */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          </div>
        </div>

        {/* Cristal effect overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center py-20">
          {/* Diamond Badge */}
          <div
            className={`transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
            }`}
          >
            <div className="inline-flex items-center justify-center w-32 h-32 mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-full p-8 shadow-2xl">
                <Gem className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div
            className={`transform transition-all duration-1000 delay-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-full border-2 border-white/20 mb-8">
              <Crown className="w-6 h-6 text-yellow-300" />
              <span className="text-white font-bold text-lg">PATROCINADOR DIAMANTE</span>
              <Sparkles className="w-6 h-6 text-purple-300" />
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black text-white mb-8 leading-none">
              <span className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent animate-pulse">
                [EMPRESA]
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl lg:text-4xl text-purple-100 max-w-5xl mx-auto mb-12 leading-relaxed font-light">
              El Patrocinador Principal que hace posible el
              <span className="font-bold text-white"> sueño más grande</span> de la
              <span className="font-bold text-white"> Banda CEDES Don Bosco</span>
            </p>

            <p className="text-xl sm:text-2xl text-purple-200 max-w-4xl mx-auto mb-16">
              Juntos en el camino hacia el{" "}
              <span className="font-bold text-yellow-300">Rose Parade 2027</span>
              <br />
              Una alianza histórica que trasciende fronteras 🇨🇷 ✨
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="#beneficios"
                className="group relative inline-flex items-center gap-3 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:scale-105 shadow-2xl"
              >
                Descubre el Impacto
                <Sparkles className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              </a>

              <a
                href="#exclusividad"
                className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/20 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300"
              >
                Ver Beneficios Exclusivos
                <Crown className="w-6 h-6 group-hover:scale-125 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-white rotate-90" />
        </div>
      </section>

      {/* Stats Section - Crystalline */}
      <section className="py-24 bg-gradient-to-b from-black to-slate-950 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-xl px-6 py-3 rounded-full border border-purple-500/30 mb-6">
              <Star className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 font-semibold">IMPACTO DIAMANTE</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Números que Brillan</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 text-center hover:border-purple-500 transition-all duration-500 hover:scale-105">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl mb-4 group-hover:rotate-12 transition-transform duration-500 shadow-lg`}
                  >
                    <div className="text-white">{stat.icon}</div>
                  </div>
                  <div
                    className={`text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                  >
                    {stat.number}
                  </div>
                  <div className="text-slate-300 font-semibold">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Benefits - Premium Grid */}
      <section id="exclusividad" className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl px-8 py-4 rounded-full border border-purple-500/30 mb-8">
              <Crown className="w-6 h-6 text-yellow-300" />
              <span className="text-white font-bold text-lg">BENEFICIOS EXCLUSIVOS</span>
            </div>
            <h2 className="text-6xl font-black text-white mb-6">
              Privilegios que
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Solo un Diamante Merece
              </span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Acceso sin precedentes a experiencias y exposición de marca
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exclusiveBenefits.map((benefit, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700`}
                ></div>
                <div className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 hover:border-purple-500 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-2xl mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                  >
                    <div className="text-white">{benefit.icon}</div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-slate-300 mb-6 leading-relaxed">{benefit.description}</p>

                  <div className="space-y-3">
                    {benefit.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                        <span className="text-slate-400 text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Exposure */}
      <section id="beneficios" className="py-24 bg-gradient-to-b from-slate-950 to-black relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-xl px-6 py-3 rounded-full border border-blue-500/30 mb-6">
              <Tv className="w-5 h-5 text-blue-300" />
              <span className="text-blue-200 font-semibold">EXPOSICIÓN MEDIÁTICA</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Alcance Global Sin Precedentes</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Su marca en los medios más importantes del mundo
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaExposure.map((media, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute inset-0 ${media.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}
                ></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl border-2 border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 ${media.color} rounded-xl mb-4 shadow-lg`}
                  >
                    <div className="text-white">{media.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{media.platform}</h3>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {media.reach}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-purple-950/10"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-xl px-6 py-3 rounded-full border border-purple-500/30 mb-6">
              <Rocket className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 font-semibold">ROADMAP 2025-2027</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">El Viaje hacia la Historia</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Cada fase diseñada para maximizar el impacto de su marca
            </p>
          </div>

          <div className="space-y-8">
            {timeline.map((phase, index) => (
              <div key={index} className="group relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${phase.color} rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500`}
                ></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 hover:border-purple-500 transition-all duration-500">
                  <div className="grid lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-3">
                      <div
                        className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${phase.color} rounded-2xl mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500`}
                      >
                        <div className="text-white text-3xl">{phase.icon}</div>
                      </div>
                      <div className="text-sm text-purple-400 font-semibold mb-2">
                        {phase.phase}
                      </div>
                      <div className="text-lg text-slate-400 mb-2">{phase.period}</div>
                      <h3 className="text-3xl font-bold text-white">{phase.title}</h3>
                    </div>

                    <div className="lg:col-span-9">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {phase.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-all duration-300"
                          >
                            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                            <span className="text-slate-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Value */}
      <section className="py-24 bg-gradient-to-b from-black to-slate-950 relative">
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-xl px-6 py-3 rounded-full border border-emerald-500/30 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-200 font-semibold">VALOR DE LA INVERSIÓN</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">ROI que Trasciende lo Monetario</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {investmentDetails.map((detail, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-8 text-center hover:border-emerald-500 transition-all duration-500 transform hover:scale-105">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
                    <div className="text-white">{detail.icon}</div>
                  </div>
                  <div className="text-sm text-slate-400 mb-2">{detail.category}</div>
                  <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {detail.value}
                  </div>
                  <p className="text-slate-400 text-sm">{detail.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Experience */}
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-transparent to-amber-950/20"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 lg:p-16 border-2 border-amber-500/30 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-xl px-6 py-3 rounded-full border border-amber-500/30 mb-6">
                  <Crown className="w-5 h-5 text-amber-300" />
                  <span className="text-amber-200 font-semibold">EXPERIENCIA VIP</span>
                </div>
                <h2 className="text-5xl font-bold text-white mb-6">
                  Acceso Privilegiado en
                  <span className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Cada Momento
                  </span>
                </h2>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Como Patrocinador Diamante, usted y su equipo tendrán acceso exclusivo a
                  experiencias únicas e irrepetibles.
                </p>

                <div className="space-y-4">
                  {vipBenefits.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-all duration-300"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-slate-200 text-lg">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-amber-500/30 p-12 flex items-center justify-center">
                  <div className="text-center">
                    <PartyPopper className="w-32 h-32 text-amber-400 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-white mb-4">
                      Experiencias
                      <br />
                      Inolvidables
                    </h3>
                    <p className="text-slate-300 text-lg">
                      Momentos exclusivos que
                      <br />
                      fortalecen su marca
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -top-6 -left-6 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900"></div>
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-full border-2 border-white/20 mb-8">
            <Gem className="w-6 h-6 text-purple-300" />
            <span className="text-white font-bold text-lg">PATROCINADOR DIAMANTE</span>
            <Sparkles className="w-6 h-6 text-pink-300" />
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Únase a la
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
              Elite del Patrocinio
            </span>
          </h2>

          <p className="text-2xl sm:text-3xl text-purple-100 mb-12 leading-relaxed max-w-4xl mx-auto">
            Esta es una oportunidad única de asociar su marca con un momento histórico que quedará
            grabado en la memoria colectiva de Costa Rica.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <a
              href="/contacto"
              className="group relative inline-flex items-center gap-3 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white hover:scale-105 shadow-2xl"
            >
              Convertirse en Diamante
              <Crown className="w-6 h-6 group-hover:scale-125 transition-transform" />
            </a>

            <a
              href="/propuesta"
              className="group inline-flex items-center gap-3 bg-white text-purple-900 hover:bg-purple-50 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Solicitar Propuesta Completa
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 pt-16 border-t border-white/20">
            <div className="text-center">
              <Handshake className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Alianza Estratégica</div>
              <div className="text-purple-200 text-sm">Socio principal del proyecto</div>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Impacto Global</div>
              <div className="text-pink-200 text-sm">100M+ impresiones mundiales</div>
            </div>
            <div className="text-center">
              <Heart className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <div className="text-white font-semibold mb-1">Legado Permanente</div>
              <div className="text-blue-200 text-sm">Historia que perdura</div>
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10">
            <p className="text-white/60 text-sm mb-2">
              🇨🇷 Gracias por creer en el talento costarricense
            </p>
            <p className="text-white/60 text-sm">
              Copyright © 2025 Banda CEDES Don Bosco - Todos los derechos reservados
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiamondSponsor;
