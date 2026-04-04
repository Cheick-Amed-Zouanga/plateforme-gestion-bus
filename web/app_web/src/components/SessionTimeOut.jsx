import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../features/accounts/services/authservice";

const DUREE_INACTIVITE = 30 * 60 * 1000;

const PAGES_PUBLIQUES = [
  "/login",
  "/recuperationCompte",
  "/verificationCode",
  "/reinitialisationCompte",
];

function SessionTimeout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (PAGES_PUBLIQUES.includes(location.pathname)) return;

    let timeoutId;

    async function deconnecterPourInactivite() {
      try {
        await logoutUser();
      } catch (error) {
        console.error(error);
      } finally {
        navigate("/login");
      }
    }

    function reinitialiserTimer() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(deconnecterPourInactivite, DUREE_INACTIVITE);
    }

    const evenements = ["mousemove", "keydown", "click", "scroll"];

    evenements.forEach((ev) => window.addEventListener(ev, reinitialiserTimer));
    reinitialiserTimer();

    return () => {
      clearTimeout(timeoutId);
      evenements.forEach((ev) => window.removeEventListener(ev, reinitialiserTimer));
    };
  }, [navigate, location.pathname]);

  return null;
}

export default SessionTimeout;
