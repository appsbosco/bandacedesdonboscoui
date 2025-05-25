import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import i18n from "i18next";

const LanguageRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const supportedLangs = ["es", "en"];
    const langFromI18n = i18n.language?.substring(0, 2) || "es";

    const detectedLang = supportedLangs.includes(langFromI18n) ? langFromI18n : "es";

    console.log("Idioma final detectado:", detectedLang);
    navigate(`/${detectedLang}`, { replace: true });
  }, [navigate]);

  return null;
};

export default LanguageRedirect;
