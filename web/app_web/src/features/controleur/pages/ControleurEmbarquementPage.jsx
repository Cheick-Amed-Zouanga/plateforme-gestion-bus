import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const REFRESH_INTERVAL = 12000; // 12 s

export default function ControleurEmbarquementPage() {
  const { trajetId } = useParams();
  const navigate     = useNavigate();

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filtre,   setFiltre]   = useState("TOUS"); // TOUS | EMBARQUE | EN_ATTENTE
  const [recherche,setRecherche]= useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const charger = useCallback((quiet = false) => {
    if (!quiet) setLoading(true);
    apiFetch(`/billets/controleur/${trajetId}/embarquement/`)
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [trajetId]);

  useEffect(() => {
    charger();
    timerRef.current = setInterval(() => charger(true), REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [charger]);

  const passagers  = data?.passagers ?? [];
  const embarques  = data?.embarques  ?? 0;
  const total      = data?.total      ?? 0;
  const enAttente  = data?.en_attente ?? 0;

  const filtres = passagers.filter(p => {
    const matchFiltre = filtre === "TOUS"
      || (filtre === "EMBARQUE"   && p.embarque)
      || (filtre === "EN_ATTENTE" && !p.embarque);
    const q = recherche.trim().toLowerCase();
    const matchRecherche = !q
      || p.passager.toLowerCase().includes(q)
      || String(p.siege_numero).includes(q)
      || p.numero_billet.toLowerCase().includes(q);
    return matchFiltre && matchRecherche;
  });

  const pct = total > 0 ? Math.round(embarques / total * 100) : 0;

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Liste d'embarquement" backPath="/controleur" />
      <main style={st.main}>

        {/* Barre de progression */}
        <div style={st.progressCard}>
          <div style={st.progressTop}>
            <div>
              <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>Progression</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#1A1348", marginTop: "2px" }}>
                {embarques} / {total} passagers
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: pct >= 80 ? "#26C2A1" : pct >= 40 ? "#F0883E" : "#58A6FF" }}>{pct}%</div>
              <div style={{ fontSize: "11px", color: "#6B7280" }}>embarqués</div>
            </div>
          </div>
          <div style={{ height: "8px", backgroundColor: "#EEF2F7", borderRadius: "4px", overflow: "hidden", marginTop: "12px" }}>
            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: pct >= 80 ? "#26C2A1" : pct >= 40 ? "#F0883E" : "#58A6FF", transition: "width 0.5s", borderRadius: "4px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px" }}>
            <span style={{ color: "#26C2A1", fontWeight: "700" }}>{embarques} embarqués</span>
            <span style={{ color: "#F0883E", fontWeight: "700" }}>{enAttente} en attente</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            {lastRefresh && (
              <span style={{ fontSize: "11px", color: "#6B7280" }}>
                Mis à jour {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button style={st.btnRefresh} onClick={() => charger()}>
              ↻ Actualiser
            </button>
          </div>
        </div>

        {/* Filtres + Recherche */}
        <div style={st.controls}>
          <div style={st.tabs}>
            {[
              { key: "TOUS",       label: `Tous (${total})` },
              { key: "EMBARQUE",   label: `Embarqués (${embarques})` },
              { key: "EN_ATTENTE", label: `En attente (${enAttente})` },
            ].map(t => (
              <button
                key={t.key}
                style={{ ...st.tab, ...(filtre === t.key ? st.tabActif : {}) }}
                onClick={() => setFiltre(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            style={st.search}
            type="text"
            placeholder="Nom, siège, N° billet…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>

        {/* Liste */}
        <div style={st.card}>
          {loading ? (
            <p style={st.muted}>Chargement…</p>
          ) : filtres.length === 0 ? (
            <p style={st.muted}>Aucun passager trouvé.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={st.table}>
                <thead>
                  <tr>
                    {["Siège", "Passager", "Trajet", "Source", "Statut", "Scanné le"].map(h => (
                      <th key={h} style={st.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtres.map(p => (
                    <tr key={p.id} style={{
                      ...st.tr,
                      backgroundColor: p.embarque ? "rgba(86,211,100,0.04)" : "transparent",
                    }}>
                      <td style={st.td}>
                        <span style={st.seatBadge}>{p.siege_numero ?? "—"}</span>
                      </td>
                      <td style={st.td}>
                        <div style={{ fontWeight: "700", color: "#1A1348", fontSize: "14px" }}>{p.passager}</div>
                        {p.passager_telephone && (
                          <div style={{ fontSize: "11px", color: "#6B7280" }}>{p.passager_telephone}</div>
                        )}
                      </td>
                      <td style={st.td}>
                        <div style={{ fontSize: "12px", color: "#79C0FF" }}>
                          {p.arret_depart_ville} → {p.arret_arrivee_ville}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6B7280", fontFamily: "monospace" }}>{p.numero_billet}</div>
                      </td>
                      <td style={st.td}>
                        <span style={{
                          fontSize: "11px", padding: "2px 7px", borderRadius: "4px",
                          backgroundColor: p.source === "APP" ? "#1B2A3B" : "#EEF2F7",
                          color: p.source === "APP" ? "#79C0FF" : "#6B7280",
                        }}>
                          {p.source === "APP" ? "En ligne" : "Guichet"}
                        </span>
                      </td>
                      <td style={st.td}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                          backgroundColor: p.embarque ? "#1B3A2D" : "#2D1A0A",
                          color: p.embarque ? "#26C2A1" : "#F0883E",
                        }}>
                          {p.embarque ? "Embarqué" : "En attente"}
                        </span>
                      </td>
                      <td style={st.td}>
                        <span style={{ fontSize: "11px", color: "#6B7280" }}>
                          {p.scanne_le
                            ? new Date(p.scanne_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bouton scanner */}
        <button style={st.btnScan} onClick={() => navigate("/controleur/valider")}>
          Scanner un billet
        </button>

      </main>
    </div>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:        { maxWidth: "1000px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  progressCard:{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  progressTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  btnRefresh:  { padding: "6px 14px", backgroundColor: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "6px", color: "#6B7280", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  controls:    { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" },
  tabs:        { display: "flex", gap: "4px", flexWrap: "wrap" },
  tab:         { padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: "#6B7280", backgroundColor: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  tabActif:    { color: "#1A1348", borderColor: "#58A6FF", backgroundColor: "#1B2A3B" },
  search:      { flex: "1 1 180px", padding: "8px 12px", backgroundColor: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "8px", color: "#1A1348", fontSize: "13px", fontFamily: "inherit" },
  card:        { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "4px 0", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "660px" },
  th:          { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #EEF2F7" },
  tr:          { borderBottom: "1px solid #EEF2F7" },
  td:          { padding: "12px 14px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "middle" },
  seatBadge:   { backgroundColor: "#EEF2F7", color: "#1A1348", padding: "3px 9px", borderRadius: "6px", fontSize: "13px", fontWeight: "800", fontFamily: "monospace" },
  muted:       { color: "#6B7280", fontSize: "13px", margin: "16px", padding: "16px" },
  btnScan:     { alignSelf: "center", padding: "12px 32px", backgroundColor: "#26C2A1", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
};
