import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import i18n from "i18next";
import { normalizePublicLang } from "utils/publicRoutes";

const LanguageRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const detectedLang = normalizePublicLang(i18n.language?.substring(0, 2));
    navigate(`/${detectedLang}`, { replace: true });
  }, [navigate]);

  return null;
};

export default LanguageRedirect;
