import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

// Scan result types
const TYPE = { IDLE: 0, OK: 1, DEJA: 2, REFUSE: 3 };

const RAISON_LABELS = {
  INEXISTANT:     "Code QR inconnu — accès refusé",
  ANNULE:         "Billet annulé — accès refusé",
  AUTRE_COMPAGNIE:"Ce billet n'appartient pas à votre compagnie",
};

export default function ControleurValidationBilletPage() {
  const navigate = useNavigate();

  // Camera scanner state
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const scanningRef = useRef(false);
  const [scannerOn,    setScannerOn]    = useState(false);
  const [cameraError,  setCameraError]  = useState("");
  const [canUseCam,    setCanUseCam]    = useState(false);

  // Manual input
  const [numero,  setNumero]  = useState("");
  const [loading, setLoading] = useState(false);

  // Result
  const [type,   setType]   = useState(TYPE.IDLE);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setCanUseCam("BarcodeDetector" in window && "mediaDevices" in navigator);
    return () => stopScanner();
  }, []);

  const stopScanner = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScannerOn(false);
  };

  const startScanner = async () => {
    setCameraError("");
    setType(TYPE.IDLE);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScannerOn(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      scanningRef.current = true;

      const scan = async () => {
        if (!scanningRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const code = codes[0].rawValue.trim().toUpperCase();
            stopScanner();
            await validerBillet(code);
            return;
          }
        } catch { /* ignore detection error */ }
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    } catch (err) {
      setCameraError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
      stopScanner();
    }
  };

  const validerBillet = useCallback(async (num) => {
    const n = (num || numero).trim().toUpperCase();
    if (!n) return;
    setLoading(true);
    setType(TYPE.IDLE);
    setResult(null);
    try {
      const data = await apiFetch("/billets/controleur/valider/", {
        method: "POST",
        body: JSON.stringify({ numero_billet: n }),
      });
      if (data.valide) {
        setType(TYPE.OK);
        setResult(data);
        setNumero("");
      } else if (data.raison === "DEJA_SCANNE") {
        setType(TYPE.DEJA);
        setResult(data);
      } else {
        setType(TYPE.REFUSE);
        setResult(data);
      }
    } catch (e) {
      setType(TYPE.REFUSE);
      setResult({ message: e.message ?? "Erreur réseau." });
    } finally {
      setLoading(false);
    }
  }, [numero]);

  const reset = () => {
    setType(TYPE.IDLE);
    setResult(null);
    setNumero("");
  };

  const handleKey = e => { if (e.key === "Enter") validerBillet(); };

  const scannerColor = type === TYPE.OK ? "#56D364" : type === TYPE.DEJA ? "#F0883E" : type === TYPE.REFUSE ? "#FF7B72" : "#30363D";

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Scanner de billets" backPath="/controleur" />
      <main style={st.main}>

        {/* Scanner caméra */}
        {canUseCam && (
          <div style={{ ...st.card, border: `2px solid ${scannerColor}`, transition: "border-color 0.3s" }}>
            <h3 style={st.cardTitle}>Scan QR code</h3>

            <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", backgroundColor: "#000", aspectRatio: "4/3", maxHeight: "320px" }}>
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: scannerOn ? "block" : "none" }}
                playsInline
                muted
              />
              {!scannerOn && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6E7681", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "48px" }}>📷</div>
                  <span style={{ fontSize: "13px" }}>Caméra inactive</span>
                </div>
              )}
              {/* Viewfinder overlay */}
              {scannerOn && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ width: "180px", height: "180px", border: "3px solid #58A6FF", borderRadius: "12px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
                </div>
              )}
            </div>

            {cameraError && <p style={{ color: "#FF7B72", fontSize: "12px", margin: "8px 0 0" }}>{cameraError}</p>}

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              {!scannerOn ? (
                <button style={{ ...st.btn, backgroundColor: "#1B6CA8", flex: 1 }} onClick={startScanner}>
                  Activer la caméra
                </button>
              ) : (
                <button style={{ ...st.btn, backgroundColor: "#2D1117", color: "#FF7B72", flex: 1 }} onClick={stopScanner}>
                  Arrêter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saisie manuelle */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>Saisie manuelle</h3>
          <p style={st.hint}>Entrez le numéro de billet ou scannez le code-barres avec un lecteur USB.</p>
          <div style={st.inputRow}>
            <input
              style={st.input}
              type="text"
              placeholder="BF-XXXXXXXX"
              value={numero}
              onChange={e => { setNumero(e.target.value.toUpperCase()); reset(); }}
              onKeyDown={handleKey}
              autoFocus={!canUseCam}
            />
            <button
              style={{ ...st.btn, backgroundColor: "#009A44", opacity: loading || !numero.trim() ? 0.6 : 1, minWidth: "90px" }}
              onClick={() => validerBillet()}
              disabled={loading || !numero.trim()}
            >
              {loading ? "…" : "Valider"}
            </button>
          </div>
        </div>

        {/* Résultat */}
        {type !== TYPE.IDLE && result && (
          <div style={{ ...st.resultCard, borderColor: type === TYPE.OK ? "#56D364" : type === TYPE.DEJA ? "#F0883E" : "#FF7B72" }}>

            {/* En-tête statut */}
            <div style={st.resultHeader}>
              <div style={{
                ...st.resultIcon,
                backgroundColor: type === TYPE.OK ? "#1B3A2D" : type === TYPE.DEJA ? "#2D1A0A" : "#2D1117",
                color: type === TYPE.OK ? "#56D364" : type === TYPE.DEJA ? "#F0883E" : "#FF7B72",
              }}>
                {type === TYPE.OK ? "✓" : type === TYPE.DEJA ? "⚠" : "✗"}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: type === TYPE.OK ? "#56D364" : type === TYPE.DEJA ? "#F0883E" : "#FF7B72" }}>
                  {type === TYPE.OK ? "EMBARQUÉ" : type === TYPE.DEJA ? "DÉJÀ SCANNÉ" : "ACCÈS REFUSÉ"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#8B949E" }}>{result.message}</p>
              </div>
            </div>

            {/* Infos passager — embarqué */}
            {type === TYPE.OK && (
              <div style={st.infoGrid}>
                <InfoField label="N° Billet"        value={result.numero_billet} mono />
                <InfoField label="Passager"          value={`${result.passager_prenom || ""} ${result.passager_nom || ""}`.trim()} large />
                <InfoField label="Pièce d'identité"  value={result.passager_piece_identite || "—"} />
                <InfoField label="Téléphone"          value={result.passager_telephone || "—"} />
                <InfoField label="Siège"              value={result.siege ?? "—"} />
                <InfoField label="Bus"                value={result.bus_display} />
                <InfoField label="Ligne"              value={result.ligne_display} />
                <InfoField label="De"                 value={result.depart_ville} />
                <InfoField label="À"                  value={result.arrivee_ville} />
                <InfoField label="Heure départ"       value={result.heure_depart} />
                <InfoField label="Prix"               value={result.prix ? `${result.prix.toLocaleString("fr-FR")} ${result.devise}` : "—"} />
                <InfoField label="Compagnie"          value={result.nom_compagnie} />
              </div>
            )}

            {/* Déjà scanné */}
            {type === TYPE.DEJA && (
              <div style={st.infoGrid}>
                <InfoField label="N° Billet" value={result.numero_billet} mono />
                <InfoField label="Passager"  value={`${result.passager_prenom || ""} ${result.passager_nom || ""}`.trim()} large />
                <InfoField label="Siège"     value={result.siege ?? "—"} />
                {result.scanne_le && (
                  <InfoField label="Scanné le" value={new Date(result.scanne_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} />
                )}
              </div>
            )}

            <button style={{ ...st.btn, backgroundColor: "#21262D", marginTop: "14px", width: "100%" }} onClick={reset}>
              Scanner suivant →
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

function InfoField({ label, value, large, mono }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: large ? "15px" : "13px", fontWeight: "700", color: "#E6EDF3", fontFamily: mono ? "monospace" : "inherit" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:        { maxWidth: "560px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:        { backgroundColor: "#161B22", borderRadius: "12px", padding: "22px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)", border: "1.5px solid #21262D" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 12px", paddingBottom: "10px", borderBottom: "1px solid #21262D" },
  hint:        { fontSize: "12px", color: "#6E7681", margin: "0 0 12px" },
  inputRow:    { display: "flex", gap: "10px" },
  input:       { flex: 1, padding: "11px 14px", backgroundColor: "#0D1117", border: "1.5px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "14px", fontFamily: "monospace", letterSpacing: "1px" },
  btn:         { padding: "11px 18px", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  resultCard:  { backgroundColor: "#161B22", borderRadius: "12px", padding: "20px 22px", border: "2px solid", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  resultHeader:{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" },
  resultIcon:  { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", flexShrink: 0 },
  infoGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#0D1117", borderRadius: "8px", padding: "14px" },
};
