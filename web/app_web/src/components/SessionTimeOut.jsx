import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../features/accounts/services/authservice";

const DUREE_INACTIVITE = 30 * 60 * 1000;

function SessionTimeout() {
  const navigate = useNavigate();

  useEffect(() => {
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

    evenements.forEach((eventName) => {
      window.addEventListener(eventName, reinitialiserTimer);
    });

    reinitialiserTimer();

    return () => {
      clearTimeout(timeoutId);
      evenements.forEach((eventName) => {
        window.removeEventListener(eventName, reinitialiserTimer);
      });
    };
  }, [navigate]);

  return null;
}

export default SessionTimeout;