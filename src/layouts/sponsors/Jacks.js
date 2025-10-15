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
} from "lucide-react";
import Header from "components/Header";
import logoJacks from "./logojacks.png";
import logoBCDB from "./Logo BCDB.png";
import jacks from "./image.png";

const Jacks = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("vision");

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { number: "265+", label: "Jóvenes Talentosos", icon: <Users className="w-6 h-6" /> },
    { number: "50+", label: "Años de Jack's", icon: <Award className="w-6 h-6" /> },
    { number: "2027", label: "Desfile de las Rosas", icon: <Calendar className="w-6 h-6" /> },
    { number: "Millones", label: "de Espectadores", icon: <Globe className="w-6 h-6" /> },
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Compromiso Nacional",
      description: "Apoyo genuino al talento y la cultura costarricense",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: <Music className="w-8 h-8" />,
      title: "Formación Musical",
      description: "Fortalecimiento de programas educativos y artísticos",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Trabajo en Equipo",
      description: "Uniendo esfuerzos por un sueño compartido",
      color: "from-purple-500 to-violet-500",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Excelencia",
      description: "Representación de calidad mundial",
      color: "from-amber-500 to-orange-500",
    },
  ];

  const timeline = [
    { year: "2025", title: "Anuncio Oficial", desc: "Jack's se une como Patrocinador Oro" },
    { year: "2025", title: "Preparación Intensiva", desc: "Ensayos y formación musical avanzada" },
    { year: "2026", title: "Etapa final", desc: "Últimos preparativos y logística internacional" },
    { year: "2027", title: "¡Pasadena!", desc: "Representando a Costa Rica en el mundo" },
  ];

  const benefits = [
    { icon: <Target />, title: "Visibilidad global", desc: "Exposición de marca ante millones" },
    { icon: <Heart />, title: "Impacto social", desc: "Apoyo directo a 200+ jóvenes" },
    { icon: <TrendingUp />, title: "Brand love", desc: "Conexión emocional con el público" },
    { icon: <Award />, title: "Orgullo nacional", desc: "Asociación con excelencia costarricense" },
  ];

  return (
    <>
      <Header />

      <div className="bg-white">
        {/* Hero Section - Más impactante */}
        <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-orange-600 pt-24 pb-40 lg:pb-52">
          {/* Elementos flotantes decorativos */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="white" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h6V4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            {/* Logo showcase - animado */}
            <div
              className={`flex items-center justify-center gap-6 mb-12 transform transition-all duration-1000 ${
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
              }`}
            >
              <div className="w-28 h-28 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-xs font-bold text-red-600">
                  <img
                    src={logoBCDB}
                    alt="Logo Banda CEDES Don Bosco"
                    className="max-w-20 max-h-20"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 mb-2" />
                <div className="text-white font-semibold text-sm">ALIANZA</div>
              </div>
              <div className="w-28 h-28 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-xs font-bold text-red-600">
                  <img src={logoJacks} alt="Logo Jack's" className="max-w-20 max-h-20" />
                </div>
              </div>
            </div>

            <div
              className={`text-center transform transition-all duration-1000 delay-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold mb-8 shadow-lg">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                Patrocinador Oro Oficial
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white mb-8 leading-none">
                {"Jack's"} se une al
                <br />
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                  Sueño en Marcha
                </span>
              </h1>

              <p className="text-xl sm:text-2xl lg:text-3xl text-red-50 max-w-4xl mx-auto mb-10 leading-relaxed font-light">
                Más de 50 años de tradición costarricense apoyando el talento nacional rumbo al
                <span className="font-bold"> Desfile de las Rosas 2027</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                <a
                  href="#historia"
                  className="group inline-flex items-center gap-3 bg-white text-red-600 hover:bg-red-50 px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
                >
                  Descubre la Historia
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#beneficios"
                  className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white/20 px-10 py-5 rounded-full font-bold text-lg transition-all duration-300"
                >
                  Ver Beneficios
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Decorative wave mejorada */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Stats Section - Más dinámico */}
        <section className="py-20 bg-white -mt-20 relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4 group-hover:rotate-12 transition-transform">
                    <div className="text-white">{stat.icon}</div>
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm lg:text-base text-slate-600 font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Historia Section - Mejorada */}
        <section id="historia" className="py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-6 py-2 bg-red-100 text-red-600 rounded-full font-semibold text-sm mb-6">
                NUESTRA HISTORIA
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                Una alianza que sabe a
                <br />
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Orgullo Nacional
                </span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        50+ Años de tradición
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        Con más de cinco décadas llevando sabor y alegría a las familias
                        costarricenses,
                        <span className="font-semibold text-red-600"> {"Jack's"}</span> ha sido
                        parte de los momentos más especiales de nuestras vidas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Más que un patrocinio
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        Esta alianza representa una apuesta por el talento, la disciplina y el
                        orgullo nacional. Valores que tanto {"Jack's"} como la{" "}
                        <span className="font-semibold text-slate-900">Banda CEDES Don Bosco</span>{" "}
                        comparten.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Impulsando el futuro
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        El compromiso de {"Jack's"} refleja su visión de impulsar el potencial
                        costarricense, especialmente entre los jóvenes que representan a nuestro
                        país internacionalmente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  {/* OPCIÓN 1: Con imagen desde carpeta public */}
                  <img
                    src={jacks}
                    alt="Alianza Jack's y Banda CEDES Don Bosco"
                    className="aspect-square w-full object-cover"
                  />

                  {/* OPCIÓN 2: Con imagen desde URL externa */}
                  {/* <img 
                    src="https://tudominio.com/path/imagen.jpg" 
                    alt="Alianza Jack's y Banda CEDES Don Bosco"
                    className="aspect-square w-full object-cover"
                  /> */}

                  {/* OPCIÓN 3: Placeholder temporal mientras consigues la foto */}
                  {/* <div className="aspect-square bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 flex items-center justify-center">
                    <div className="text-center p-12">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Music className="w-16 h-16 text-red-600" />
                      </div>
                      <p className="text-slate-700 font-bold text-xl mb-2">Próximamente</p>
                      <p className="text-slate-600">Foto oficial de la alianza</p>
                    </div>
                  </div> */}

                  {/* Overlay con gradiente sutil para mejor legibilidad si agregas texto sobre la imagen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Elementos decorativos flotantes */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -top-8 -left-8 w-40 h-40 bg-gradient-to-br from-red-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section - Nueva */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900"></div>

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-6 py-2 bg-red-500/20 backdrop-blur-sm text-red-400 rounded-full font-semibold text-sm mb-6">
                CAMINO A PASADENA
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                La Ruta del Sueño
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {timeline.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-slate-700 h-full">
                    <div className="text-5xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ChevronRight className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits for {"Jack's"} - Nueva sección */}
        <section id="beneficios" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-6 py-2 bg-orange-100 text-orange-600 rounded-full font-semibold text-sm mb-6">
                VALOR DE LA ALIANZA
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                Beneficios para <span className="text-red-600">{"Jack's"}</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Una inversión estratégica que conecta marca, comunidad y orgullo nacional
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-slate-100 group-hover:border-transparent">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <div className="text-white">{benefit.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section - Rediseñada */}
        <section id="impacto" className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block px-6 py-2 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm mb-6">
                VALORES COMPARTIDOS
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                El impacto de nuestra alianza
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Juntos fortalecemos la formación musical y proyección internacional de Costa Rica
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="relative group">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${value.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border-2 border-slate-100">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${value.color} rounded-2xl mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg`}
                    >
                      <div className="text-white">{value.icon}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{value.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Project Details - Rediseñada */}
        <section className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="inline-block px-6 py-2 bg-red-500/20 backdrop-blur-sm text-red-400 rounded-full font-semibold text-sm mb-6">
                    EL PROYECTO
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-8">Detalles del viaje</h2>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-4 mb-4">
                    <MapPin className="w-8 h-8 text-red-400" />
                    <div className="text-sm font-semibold text-red-400">DESTINO</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    Desfile de las Rosas 2027
                  </div>
                  <div className="text-slate-300">Pasadena, California, Estados Unidos</div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-orange-500 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-4 mb-4">
                    <Users className="w-8 h-8 text-orange-400" />
                    <div className="text-sm font-semibold text-orange-400">PARTICIPANTES</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">265+ Jóvenes</div>
                  <div className="text-slate-300">Talentosos músicos costarricenses</div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-4 mb-4">
                    <Globe className="w-8 h-8 text-yellow-400" />
                    <div className="text-sm font-semibold text-yellow-400">ALCANCE</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">Millones</div>
                  <div className="text-slate-300">de espectadores en todo el mundo</div>
                </div>
              </div>

              <div className="lg:col-span-3 my-auto">
                <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-10 border border-slate-700">
                  <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                      🍪
                    </span>
                    Sobre {"Jack's"}
                  </h3>

                  <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
                    <p className="text-xl text-white font-semibold">
                      Durante más de 50 años, {"Jack's"} ha sido sinónimo de calidad, innovación y
                      tradición familiar en Costa Rica.
                    </p>
                    <p>
                      Como empresa líder en innovación alimentaria, {"Jack's"} no solo crea
                      productos de calidad que han acompañado los momentos más dulces de las
                      familias costarricenses, sino que también invierte activamente en el futuro de
                      nuestro país.
                    </p>
                    <p>
                      Este patrocinio oro representa el compromiso genuino de {"Jack's"} con la
                      cultura, la educación y el talento nacional. Cada ensayo, cada paso y cada
                      nota del desfile llevan ahora el sello de una marca que cree firmemente en los
                      sueños costarricenses y en el poder transformador de la música y la
                      disciplina.
                    </p>

                    <div className="pt-6 border-t border-slate-700">
                      <div className="flex flex-wrap gap-3 mb-6">
                        <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">
                          Innovación alimentaria
                        </span>
                        <span className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                          Tradición familiar
                        </span>
                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                          Compromiso social
                        </span>
                      </div>

                      <a
                        href="https://www.jacks.co.cr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Visitar sitio web de {"Jack's"}
                        <ChevronRight className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final - Más impactante */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-orange-600"></div>
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
              La unión entre {"Jack's"} y la Banda CEDES Don Bosco simboliza el trabajo en equipo,
              la excelencia y el amor por Costa Rica. Juntos, hacemos historia.
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
                Gracias a {"Jack's"} por creer en el talento costarricense 🇨🇷
              </p>
              <p className="text-white/80 text-lg">
                Copyright &copy; 2025 Banda CEDES Don Bosco - Todos los derechos reservados -
                Desarrollado por Josué Chinchilla Salazar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Jacks;
