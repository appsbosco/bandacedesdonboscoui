import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import curved0 from "assets/images/curved-images/curved0.webp";
import ProfileImageUploader from "../ProfilePicture/ProfileImageUploader";
import { GET_USERS_BY_ID, GET_PARENTS_BY_ID } from "graphql/queries";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const ROLE_BADGE_COLORS = {
  Admin: "bg-violet-100 text-violet-700",
  "Principal de sección": "bg-blue-100 text-blue-700",
  "Asistente de sección": "bg-sky-100 text-sky-700",
  "Integrante BCDB": "bg-emerald-100 text-emerald-700",
  "Padre/Madre de familia": "bg-amber-100 text-amber-700",
  default: "bg-slate-100 text-slate-600",
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  const { data, loading, refetch } = useQuery(GET_USERS_BY_ID);
  const { data: parentsData } = useQuery(GET_PARENTS_BY_ID);

  const {
    name,
    firstSurName,
    secondSurName,
    avatar,
    instrument,
    role: userRole,
  } = data?.getUser || {};
  const { name: parentName, firstSurName: parentFirstSurName } = parentsData?.getParent || {};
  const parentRole = parentsData?.getParent?.role;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!loading) refetch().catch(console.error);
  }, [loading]);

  const isParent = !!parentRole;
  const displayName = isParent
    ? `${parentName} ${parentFirstSurName}`
    : `${name || ""} ${firstSurName || ""} ${secondSurName || ""}`.trim();
  const displayRole = userRole || parentRole || "";

  const badgeClass = ROLE_BADGE_COLORS[displayRole] || ROLE_BADGE_COLORS.default;

  const getInitials = () => {
    if (isParent && parentName && parentFirstSurName)
      return `${parentName[0]}${parentFirstSurName[0]}`.toUpperCase();
    if (name && firstSurName) return `${name[0]}${firstSurName[0]}`.toUpperCase();
    return "?";
  };

  return (
    <div className="relative w-full">
      {/* Navbar */}
      <DashboardNavbar absolute light />

      {/* Hero Banner */}
      <div
        className="relative w-full overflow-hidden"
        style={{ minHeight: "280px", borderRadius: "0 0 24px 24px" }}
      >
        <img
          src={curved0}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/50 to-blue-900/60" />

        {/* Decorative elements */}
        <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-4 left-16 w-24 h-24 rounded-full bg-blue-400/10 blur-xl" />
      </div>

      {/* Profile Card - floats over the banner */}
      <div className="relative mx-4 sm:mx-6 lg:mx-8 -mt-16 z-10">
        <div
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 px-5 py-5 sm:px-8 sm:py-6"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.06)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {loading ? (
                <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
              ) : isParent ? (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-md">
                  <span className="text-2xl font-semibold text-amber-700">{getInitials()}</span>
                </div>
              ) : (
                <div className="relative">
                  {!avatar || avatar === "" ? (
                    <ProfileImageUploader size="lg" />
                  ) : (
                    <ProfileImageUploader size="lg" />
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
                    {displayName || "—"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {displayRole && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
                      >
                        {displayRole}
                      </span>
                    )}
                    {instrument && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                        {instrument}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
