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
  Zap,
  Crown,
  Diamond,
  Eye,
  Camera,
  Video,
  Megaphone,
  Share2,
  BarChart3,
  Rocket,
  Shield,
  Medal,
  Activity,
  Radio,
  Tv,
  Newspaper,
  Instagram,
  Facebook,
  Youtube,
  Gift,
  Handshake,
  Building2,
  Briefcase,
  LineChart,
} from "lucide-react";

const DiamondSponsor = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const heroStats = [
    { number: "100M+", label: "Impresiones Globales", icon: <Eye className="w-6 h-6" /> },
    { number: "350+", label: "Medios Internacionales", icon: <Newspaper className="w-6 h-6" /> },
    { number: "5 Continentes", label: "Cobertura Mundial", icon: <Globe className="w-6 h-6" /> },
    { number: "Prime Time", label: "Exposición TV", icon: <Tv className="w-6 h-6" /> },
  ];

  const diamondBenefits = [
    {
      icon: <Crown className="w-10 h-10" />,
      title: "Patrocinio Exclusivo de Título",
      desc: "La Banda llevará el nombre de la marca en todas sus presentaciones oficiales",
      highlight: "EXCLUSIVO",
      colorBg: "from-purple-600 to-violet-600",
    },
    {
      icon: <Camera className="w-10 h-10" />,
      title: "Derechos de Contenido Premium",
      desc: "Acceso completo a material audiovisual profesional del evento y preparación",
      highlight: "PREMIUM",
      colorBg: "from-blue-600 to-cyan-600",
    },
    {
      icon: <Megaphone className="w-10 h-10" />,
      title: "Campaña de Marketing Conjunta",
      desc: "Desarrollo de campaña publicitaria co-branded con alcance nacional e internacional",
      highlight: "CO-BRANDING",
      colorBg: "from-red-600 to-orange-600",
    },
    {
      icon: <Video className="w-10 h-10" />,
      title: "Documental Behind-the-Scenes",
      desc: "Serie documental exclusiva del viaje con prominencia de marca",
      highlight: "STORYTELLING",
      colorBg: "from-emerald-600 to-teal-600",
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Activaciones con Jóvenes",
      desc: "Programas de embajadores y activaciones directas con los 265+ músicos",
      highlight: "ENGAGEMENT",
      colorBg: "from-pink-600 to-rose-600",
    },
    {
      icon: <Building2 className="w-10 h-10" />,
      title: "Presencia en Instalaciones",
      desc: "Branding permanente en el Centro de Formación y espacios de ensayo",
      highlight: "VISIBILIDAD 24/7",
      colorBg: "from-amber-600 to-yellow-600",
    },
  ];

  const exposureMetrics = [
    {
      category: "Televisión Internacional",
      icon: <Tv className="w-8 h-8" />,
      metrics: [
        { label: "Cadenas de TV", value: "200+", desc: "incluyendo NBC, ABC, CBS" },
        { label: "Tiempo en pantalla", value: "15-20 min", desc: "durante el desfile" },
        { label: "Menciones de marca", value: "50+", desc: "en transmisión" },
      ],
      colorBorder: "border-blue-500",
      colorText: "text-blue-400",
      colorBg: "bg-blue-500",
    },
    {
      category: "Redes Sociales",
      icon: <Share2 className="w-8 h-8" />,
      metrics: [
        { label: "Alcance potencial", value: "500M+", desc: "usuarios únicos" },
        { label: "Contenido generado", value: "10,000+", desc: "posts y shares" },
        { label: "Hashtag oficial", value: "#1", desc: "trending nacional" },
      ],
      colorBorder: "border-purple-500",
      colorText: "text-purple-400",
      colorBg: "bg-purple-500",
    },
    {
      category: "Prensa y Medios",
      icon: <Newspaper className="w-8 h-8" />,
      metrics: [
        { label: "Artículos de prensa", value: "300+", desc: "medios nacionales" },
        { label: "Cobertura internacional", value: "50+", desc: "países" },
        { label: "Valor publicitario", value: "$5M+", desc: "en earned media" },
      ],
      colorBorder: "border-emerald-500",
      colorText: "text-emerald-400",
      colorBg: "bg-emerald-500",
    },
    {
      category: "Eventos y Activaciones",
      icon: <Calendar className="w-8 h-8" />,
      metrics: [
        { label: "Presentaciones previas", value: "25+", desc: "eventos públicos" },
        { label: "Asistentes totales", value: "100,000+", desc: "personas en vivo" },
        { label: "Recaudación de fondos", value: "15+", desc: "eventos de gala" },
      ],
      colorBorder: "border-orange-500",
      colorText: "text-orange-400",
      colorBg: "bg-orange-500",
    },
  ];

  const brandingOpportunities = [
    {
      title: "Uniformes Oficiales",
      desc: "Logo prominente en uniformes de desfile y práctica de 265+ jóvenes",
      impact: "Alto",
      visibility: "Permanente",
      icon: <Shield className="w-8 h-8" />,
    },
    {
      title: "Instrumentos y Equipamiento",
      desc: "Branding en equipamiento musical y de viaje",
      impact: "Medio-Alto",
      visibility: "Constante",
      icon: <Music className="w-8 h-8" />,
    },
    {
      title: "Vehículos de Transporte",
      desc: "Rotulación de buses y vehículos oficiales del tour",
      impact: "Alto",
      visibility: "Móvil Nacional",
      icon: <Rocket className="w-8 h-8" />,
    },
    {
      title: "Material Promocional",
      desc: "Presencia en todo material impreso y digital del proyecto",
      impact: "Muy Alto",
      visibility: "Multicanal",
      icon: <Briefcase className="w-8 h-8" />,
    },
    {
      title: "Escenarios y Tarimas",
      desc: "Backdrop y señalización en presentaciones y eventos",
      impact: "Muy Alto",
      visibility: "Masiva",
      icon: <Award className="w-8 h-8" />,
    },
    {
      title: "Plataformas Digitales",
      desc: "Presencia destacada en web, redes sociales y aplicaciones",
      impact: "Muy Alto",
      visibility: "Global 24/7",
      icon: <Globe className="w-8 h-8" />,
    },
  ];

  const timeline = [
    {
      quarter: "Q1 2025",
      title: "Lanzamiento de Alianza",
      activities: [
        "Anuncio oficial en conferencia de prensa",
        "Campaña de lanzamiento multimedia",
        "Primera activación con músicos",
        "Desarrollo de contenido inicial",
      ],
      deliverables: "Press kit, contenido co-branded, evento de lanzamiento",
    },
    {
      quarter: "Q2-Q3 2025",
      title: "Fase de Activación",
      activities: [
        "Serie de eventos y presentaciones nacionales",
        "Producción de contenido behind-the-scenes",
        "Campaña en redes sociales",
        "Activaciones en puntos de venta",
      ],
      deliverables: "15+ eventos, 100+ piezas de contenido, campaña digital",
    },
    {
      quarter: "Q4 2025 - Q3 2026",
      title: "Construcción de Momentum",
      activities: [
        "Gira nacional de preparación",
        "Documental en producción",
        "Campañas de recaudación",
        "Activaciones experienciales",
      ],
      deliverables: "25+ presentaciones, documental, eventos especiales",
    },
    {
      quarter: "Q4 2026 - Q1 2027",
      title: "Camino a Pasadena",
      activities: [
        "Eventos de despedida nacional",
        "Cobertura intensiva de preparación",
        "Lanzamiento de campaña global",
        "Activaciones internacionales",
      ],
      deliverables: "Cobertura 360°, contenido premium, eventos VIP",
    },
    {
      quarter: "Enero 2027",
      title: "Rose Parade - El Gran Momento",
      activities: [
        "Desfile de las Rosas en vivo",
        "Transmisión internacional",
        "Activaciones en California",
        "Cobertura en tiempo real",
      ],
      deliverables: "Exposición global, contenido viral, impacto máximo",
    },
    {
      quarter: "Post-Evento",
      title: "Legado y Continuidad",
      activities: [
        "Campaña de celebración",
        "Lanzamiento de documental completo",
        "Eventos de agradecimiento",
        "Planificación de continuidad",
      ],
      deliverables: "Contenido evergreen, caso de éxito, ROI report",
    },
  ];

  const comparisonTiers = [
    {
      tier: "Diamante",
      price: "Inversión Premium",
      features: [
        "Patrocinio de título exclusivo",
        "Derechos de contenido completos",
        "Campaña co-branded nacional",
        "Documental con naming rights",
        "Branding en uniformes oficiales",
        "Activaciones ilimitadas",
        "Presencia en todos los canales",
        "Acceso VIP a eventos",
        "Representante dedicado",
        "Informe mensual de impacto",
      ],
      highlight: true,
      colorGradient: "from-purple-600 via-violet-600 to-indigo-600",
      icon: <Diamond className="w-8 h-8" />,
    },
    {
      tier: "Oro",
      price: "Inversión Estratégica",
      features: [
        "Logo en uniformes",
        "Contenido seleccionado",
        "Mención en materiales",
        "Presencia en eventos principales",
        "Redes sociales destacadas",
        "Activaciones limitadas",
        "Informe trimestral",
      ],
      highlight: false,
      colorGradient: "from-amber-500 to-yellow-600",
      icon: <Award className="w-8 h-8" />,
    },
    {
      tier: "Plata",
      price: "Inversión Estándar",
      features: [
        "Logo en materiales",
        "Mención en redes sociales",
        "Presencia en eventos",
        "Contenido básico",
        "Informe semestral",
      ],
      highlight: false,
      colorGradient: "from-slate-400 to-slate-500",
      icon: <Medal className="w-8 h-8" />,
    },
  ];

  const testimonials = [
    {
      quote:
        "Asociarnos con proyectos que inspiran a la juventud es parte de nuestro ADN. Esta alianza representa los valores de excelencia, disciplina y superación que compartimos.",
      author: "Director de Marketing",
      company: "Nike Costa Rica",
      image: "👤",
    },
    {
      quote:
        "La visibilidad internacional y el impacto emocional de este proyecto superan cualquier campaña tradicional. Es una inversión en cultura y marca que genera resultados medibles.",
      author: "Gerente de Marca",
      company: "Nike Centroamérica",
      image: "👤",
    },
    {
      quote:
        "Ver el logo de Nike en el Desfile de las Rosas, representando a Costa Rica ante el mundo, es una oportunidad única que conecta emocionalmente con millones de personas.",
      author: "VP de Comunicaciones",
      company: "Nike Latinoamérica",
      image: "👤",
    },
  ];

  const roiMetrics = [
    {
      metric: "Brand Awareness",
      before: "65%",
      after: "92%",
      growth: "+27%",
      icon: <TrendingUp className="w-6 h-6" />,
      colorText: "text-emerald-400",
      colorBg: "bg-emerald-500",
    },
    {
      metric: "Positive Sentiment",
      before: "72%",
      after: "94%",
      growth: "+22%",
      icon: <Heart className="w-6 h-6" />,
      colorText: "text-rose-400",
      colorBg: "bg-rose-500",
    },
    {
      metric: "Social Engagement",
      before: "Index 100",
      after: "Index 385",
      growth: "+285%",
      icon: <Share2 className="w-6 h-6" />,
      colorText: "text-blue-400",
      colorBg: "bg-blue-500",
    },
    {
      metric: "Media Value",
      before: "$1M",
      after: "$7.5M",
      growth: "+650%",
      icon: <BarChart3 className="w-6 h-6" />,
      colorText: "text-violet-400",
      colorBg: "bg-violet-500",
    },
  ];

  const activationIdeas = [
    {
      title: "Nike Music Academy",
      desc: "Programa de talleres y clínicas con los músicos usando metodología Nike Training",
      icon: <Target className="w-8 h-8" />,
      impact: "Alto",
    },
    {
      title: "Just Do It Costa Rica",
      desc: "Campaña inspiracional documentando el viaje de preparación",
      icon: <Video className="w-8 h-8" />,
      impact: "Muy Alto",
    },
    {
      title: "Sneaker Edition Especial",
      desc: "Línea limitada de calzado con diseño inspirado en la Banda",
      icon: <Gift className="w-8 h-8" />,
      impact: "Alto",
    },
    {
      title: "Athlete Meets Artist",
      desc: "Contenido crossover entre atletas Nike y músicos de la banda",
      icon: <Users className="w-8 h-8" />,
      impact: "Medio-Alto",
    },
    {
      title: "Rose Parade Experience",
      desc: "Activación en California con experiencias de marca durante el desfile",
      icon: <MapPin className="w-8 h-8" />,
      impact: "Muy Alto",
    },
    {
      title: "Digital Innovation Hub",
      desc: "Plataforma interactiva siguiendo el viaje con tecnología Nike",
      icon: <Zap className="w-8 h-8" />,
      impact: "Alto",
    },
  ];

  return (
    <div className="bg-slate-950">
      {/* Hero Ultra Premium */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-white rounded-full opacity-20"
                  style={{
                    width: Math.random() * 4 + 1 + "px",
                    height: Math.random() * 4 + 1 + "px",
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                    animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
                    animationDelay: Math.random() * 2 + "s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Diamond particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-1/3 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Diamond Badge */}
            <div
              className={`inline-flex items-center justify-center mb-8 transform transition-all duration-1000 ${
                isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl">
                  <Diamond className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>

            <div
              className={`transform transition-all duration-1000 delay-200 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full text-white font-bold text-lg mb-10 border border-white/20">
                <Crown className="w-6 h-6 text-yellow-300" />
                PATROCINADOR DIAMANTE EXCLUSIVO
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>

              <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black text-white mb-8 leading-none">
                <span className="inline-block bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent">
                  Nike
                </span>
                <br />
                <span className="text-5xl sm:text-6xl lg:text-7xl bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  Presents
                </span>
              </h1>

              <div className="max-w-5xl mx-auto mb-12">
                <p className="text-2xl sm:text-3xl lg:text-4xl text-purple-100 font-light leading-relaxed mb-6">
                  La alianza más ambiciosa en la historia del deporte y la cultura costarricense
                </p>
                <p className="text-xl sm:text-2xl text-violet-200 font-medium">
                  Banda CEDES Don Bosco × Nike
                  <br />
                  <span className="text-lg text-purple-300">Rumbo al Rose Parade 2027</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <button className="group relative inline-flex items-center gap-3 bg-white text-purple-900 hover:bg-purple-50 px-12 py-6 rounded-full font-black text-xl transition-all duration-300 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <Rocket className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Ver Paquete Completo
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
                </button>
                <button className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-12 py-6 rounded-full font-bold text-xl transition-all duration-300">
                  <Video className="w-7 h-7" />
                  Ver Video Presentación
                </button>
              </div>

              {/* Quick Stats Hero */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {heroStats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="text-purple-300 mb-2 flex justify-center">{stat.icon}</div>
                    <div className="text-3xl font-black text-white mb-1">{stat.number}</div>
                    <div className="text-sm text-purple-200 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-white rotate-90" />
        </div>
      </section>

      {/* Why Diamond Section */}
      <section className="py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="white" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h6V4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-6 py-3 rounded-full text-purple-300 font-bold mb-8">
              <Diamond className="w-5 h-5" />
              EXCLUSIVIDAD PREMIUM
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              ¿Por qué Patrocinio
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Diamante?
              </span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              El nivel más alto de asociación estratégica. Beneficios exclusivos que transforman tu
              marca en protagonista de una historia épica.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {diamondBenefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.colorBg} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}
                ></div>

                <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-full">
                      {benefit.highlight}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.colorBg} rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
                  >
                    <div className="text-white">{benefit.icon}</div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-lg flex-grow">{benefit.desc}</p>

                  <div className="mt-6 pt-6 border-t border-slate-700 flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                    Ver detalles
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative">
              <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-6" />
              <h3 className="text-4xl font-black text-white mb-4">Solo UN Patrocinador Diamante</h3>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Esta es una oportunidad única y exclusiva. El primer patrocinador en comprometerse
                asegura todos los beneficios premium.
              </p>
              <button className="inline-flex items-center gap-3 bg-white text-purple-900 hover:bg-purple-50 px-10 py-5 rounded-full font-black text-xl transition-all duration-300 shadow-2xl transform hover:scale-105">
                Asegurar Exclusividad Ahora
                <Zap className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Exposure & Impact Metrics */}
      <section className="py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-full text-emerald-300 font-bold mb-8">
              <BarChart3 className="w-5 h-5" />
              MÉTRICAS DE IMPACTO
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              Exposición y
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Alcance Global
              </span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto">
              Tu marca ante millones de ojos en múltiples plataformas y territorios
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {exposureMetrics.map((category, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-10 hover:border-slate-600 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-16 h-16 ${category.colorBg}/20 border ${category.colorBorder}/30 rounded-2xl flex items-center justify-center ${category.colorText}`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-white">{category.category}</h3>
                </div>

                <div className="space-y-6">
                  {category.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 font-medium">{metric.label}</span>
                        <span className={`text-3xl font-black ${category.colorText}`}>
                          {metric.value}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm">{metric.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total Impact Summary */}
          <div className="mt-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border-2 border-purple-500/30">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  800M+
                </div>
                <div className="text-slate-400 font-semibold">Impresiones Totales</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  120+
                </div>
                <div className="text-slate-400 font-semibold">Países Alcanzados</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  $12M+
                </div>
                <div className="text-slate-400 font-semibold">Valor en Medios</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                  95%+
                </div>
                <div className="text-slate-400 font-semibold">Sentimiento Positivo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branding Opportunities */}
      <section className="py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-6 py-3 rounded-full text-orange-300 font-bold mb-8">
              <Target className="w-5 h-5" />
              OPORTUNIDADES DE MARCA
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              Puntos de
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                Contacto con Marca
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandingOpportunities.map((opp, index) => (
              <div
                key={index}
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 hover:border-orange-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mb-6">
                  {opp.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{opp.title}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">{opp.desc}</p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Impacto</div>
                    <div className="text-sm font-bold text-orange-400">{opp.impact}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Visibilidad</div>
                    <div className="text-sm font-bold text-orange-400">{opp.visibility}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Detallado */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-6 py-3 rounded-full text-purple-300 font-bold mb-8">
              <Calendar className="w-5 h-5" />
              ROADMAP COMPLETO
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              El Viaje Completo
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                2025-2027
              </span>
            </h2>
          </div>

          <div className="space-y-8">
            {timeline.map((phase, index) => (
              <div
                key={index}
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/4">
                    <div className="inline-block px-6 py-3 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 font-black text-xl mb-4">
                      {phase.quarter}
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">{phase.title}</h3>
                  </div>

                  <div className="lg:w-3/4 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">
                        Actividades Principales
                      </h4>
                      <ul className="space-y-2">
                        {phase.activities.map((activity, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300">{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                      <h4 className="text-sm font-bold text-orange-400 mb-2 uppercase tracking-wider">
                        Entregables
                      </h4>
                      <p className="text-slate-400">{phase.deliverables}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Tiers */}
      <section className="py-32 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-6 py-3 rounded-full text-violet-300 font-bold mb-8">
              <Award className="w-5 h-5" />
              COMPARATIVA DE NIVELES
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-8">
              La Diferencia
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                Diamante
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {comparisonTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative rounded-3xl overflow-hidden ${
                  tier.highlight ? "transform scale-105 lg:scale-110" : ""
                }`}
              >
                {tier.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 opacity-20 blur-2xl"></div>
                )}

                <div
                  className={`relative ${
                    tier.highlight
                      ? "bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500"
                      : "bg-slate-800/50 border border-slate-700"
                  } rounded-3xl p-8`}
                >
                  {tier.highlight && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-black text-sm rounded-full shadow-lg">
                        RECOMENDADO
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8 pt-4">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${tier.colorGradient} rounded-2xl mb-4 shadow-lg`}
                    >
                      <div className="text-white">{tier.icon}</div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">{tier.tier}</h3>
                    <p className="text-slate-400 font-semibold">{tier.price}</p>
                  </div>

                  <ul className="space-y-4">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            tier.highlight ? "text-purple-400" : "text-slate-500"
                          }`}
                        />
                        <span className={tier.highlight ? "text-slate-300" : "text-slate-500"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {tier.highlight && (
                    <button className="w-full mt-8 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                      Solicitar Propuesta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activation Ideas */}
      <section className="py-32 bg-slate-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-6 py-3 rounded-full text-cyan-300 font-bold mb-8">
              <Zap className="w-5 h-5" />
              IDEAS DE ACTIVACIÓN
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              Experiencias de Marca
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Inolvidables
              </span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto">
              Conceptos creativos para maximizar el impacto y engagement de tu marca
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {activationIdeas.map((idea, index) => (
              <div
                key={index}
                className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/50 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {idea.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{idea.title}</h3>
                <p className="text-slate-400 mb-6 leading-relaxed">{idea.desc}</p>
                <div className="pt-6 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Impacto esperado</span>
                    <span className="text-sm font-bold text-cyan-400">{idea.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <LineChart className="w-full h-full text-emerald-500" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-full text-emerald-300 font-bold mb-8">
              <TrendingUp className="w-5 h-5" />
              RETORNO DE INVERSIÓN
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8">
              Impacto Medible
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                y Comprobable
              </span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto">
              Métricas proyectadas basadas en casos de éxito similares
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {roiMetrics.map((metric, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300"
              >
                <div
                  className={`w-14 h-14 ${metric.colorBg}/20 rounded-xl flex items-center justify-center ${metric.colorText} mb-6`}
                >
                  {metric.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{metric.metric}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Antes</span>
                    <span className="text-slate-400 font-semibold">{metric.before}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Después</span>
                    <span className={`${metric.colorText} font-bold text-lg`}>{metric.after}</span>
                  </div>
                  <div className={`${metric.colorText} font-black text-2xl text-right`}>
                    {metric.growth}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Informe de Impacto Mensual</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Como patrocinador Diamante, recibirás informes mensuales detallados con métricas
                  en tiempo real de alcance, engagement, sentimiento de marca, valor en medios y
                  mucho más. Transparencia total del ROI de tu inversión.
                </p>
                <ul className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Dashboard interactivo en tiempo real",
                    "Análisis de menciones y sentimiento",
                    "Métricas de redes sociales",
                    "Valoración de exposición en medios",
                    "Engagement de audiencias",
                    "Informes comparativos mensuales",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-full text-blue-300 font-bold mb-8">
              <Star className="w-5 h-5" />
              PALABRAS DE LÍDERES
            </div>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-8">
              Lo que dicen sobre
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                esta alianza
              </span>
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-12">
              <div className="mb-8">
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-4" />
                <p className="text-2xl text-slate-200 leading-relaxed italic">
                  {testimonials[activeTestimonial].quote}
                </p>
              </div>
              <div className="flex items-center gap-4 pt-8 border-t border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl">
                  {testimonials[activeTestimonial].image}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">
                    {testimonials[activeTestimonial].author}
                  </div>
                  <div className="text-slate-400">{testimonials[activeTestimonial].company}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeTestimonial === index
                      ? "bg-blue-500 w-8"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 rounded-full mb-12 shadow-2xl animate-pulse">
            <Diamond className="w-16 h-16 text-white" />
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Conviértete en el
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              Patrocinador Diamante
            </span>
          </h2>

          <p className="text-2xl sm:text-3xl text-purple-100 mb-12 leading-relaxed max-w-4xl mx-auto font-light">
            Una oportunidad única para asociar tu marca con un momento histórico que quedará grabado
            en la memoria de millones de personas alrededor del mundo.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button className="group relative inline-flex items-center gap-4 bg-white text-purple-900 hover:bg-purple-50 px-12 py-6 rounded-full font-black text-2xl transition-all duration-300 shadow-2xl overflow-hidden transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Crown className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              Solicitar Paquete Completo
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-12 py-6 rounded-full font-bold text-2xl transition-all duration-300">
              <Calendar className="w-8 h-8" />
              Agendar Reunión
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <Handshake className="w-10 h-10 text-purple-300 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">Asesoría Personalizada</div>
              <div className="text-purple-200 text-sm">Te acompañamos en cada paso del proceso</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <Shield className="w-10 h-10 text-purple-300 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">Exclusividad Garantizada</div>
              <div className="text-purple-200 text-sm">Solo un patrocinador Diamante</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <Zap className="w-10 h-10 text-purple-300 mx-auto mb-4" />
              <div className="font-bold text-white mb-2">Activación Inmediata</div>
              <div className="text-purple-200 text-sm">Comenzamos hoy mismo</div>
            </div>
          </div>

          <div className="mt-20 pt-16 border-t border-white/10">
            <p className="text-white/80 text-lg mb-2">
              Una alianza histórica entre Nike y la Banda CEDES Don Bosco 🇨🇷
            </p>
            <p className="text-white/60">
              Copyright © 2025 Banda CEDES Don Bosco - Todos los derechos reservados
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DiamondSponsor;
