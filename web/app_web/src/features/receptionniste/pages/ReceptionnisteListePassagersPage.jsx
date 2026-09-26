import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT_BILLET = {
  CONFIRME: { label: "Confirmé", color: "#26C2A1" },
  UTILISE:  { label: "Utilisé",  color: "#58A6FF" },
  ANNULE:   { label: "Annulé",   color: "#E11D48" },
};

const STATUT_PAIEMENT = {
  PAYE:       { label: "Payé",       color: "#26C2A1" },
  EN_ATTENTE: { label: "En attente", color: "#F0883E" },
  REMBOURSE:  { label: "Remboursé",  color: "#6B7280" },
};

export default function ReceptionnisteListePassagersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTrajetId = searchParams.get("trajet");

  const [trajets, setTrajets] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [selectedTrajet, setSelectedTrajet] = useState(preselectedTrajetId ?? "");
  const [selectedArret, setSelectedArret] = useState("");
  const [passagers, setPassagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrajets, setLoadingTrajets] = useState(true);

  useEffect(() => {
    apiFetch("/billets/trajets/")
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setTrajets(list);
        if (preselectedTrajetId) {
          const found = list.find(t => String(t.id) === preselectedTrajetId);
          if (found) setArrets(found.arrets ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTrajets(false));
  }, [preselectedTrajetId]);

  const handleTrajetChange = e => {
    const val = e.target.value;
    setSelectedTrajet(val);
    setSelectedArret("");
    setPassagers([]);
    const found = trajets.find(t => String(t.id) === val);
    setArrets(found?.arrets ?? []);
  };

  const fetchPassagers = () => {
    if (!selectedTrajet) return;
    setLoading(true);
    const qs = selectedArret ? `?arret=${selectedArret}` : "";
    apiFetch(`/billets/trajets/${selectedTrajet}/passagers/${qs}`)
      .then(data => setPassagers(Array.isArray(data) ? data : (data.passagers ?? [])))
      .catch(() => setPassagers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedTrajet) fetchPassagers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrajet, selectedArret]);

  const trajetActif = trajets.find(t => String(t.id) === selectedTrajet);
  const totalPassagers = passagers.length;
  const payesCount = passagers.filter(p => p.statut_paiement === "PAYE").length;
  const attenteCount = passagers.filter(p => p.statut_paiement === "EN_ATTENTE").length;

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Liste des passagers" backPath="/receptionniste" />
      <main style={st.main}>

        {/* Filtres */}
        <div style={st.card}>
          <div style={st.filterRow}>
            <div style={{ flex: 2 }}>
              <label style={st.label}>Trajet</label>
              {loadingTrajets ? <p style={st.muted}>Chargement…</p> : (
                <select style={st.select} value={selectedTrajet} onChange={handleTrajetChange}>
                  <option value="">— Sélectionner un trajet —</option>
                  {trajets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.ligne_display} — {t.bus_display} — {t.depart_prevu ? new Date(t.depart_prevu).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {arrets.length > 0 && (
              <div style={{ flex: 1 }}>
                <label style={st.label}>Filtrer par escale</label>
                <select style={st.select} value={selectedArret} onChange={e => setSelectedArret(e.target.value)}>
                  <option value="">Tous les arrêts</option>
                  {arrets.map(a => (
                    <option key={a.id} value={a.id}>{a.ville}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {selectedTrajet && !loading && (
          <div style={st.statsRow}>
            <StatChip label="Total" value={totalPassagers} color="#58A6FF" />
            <StatChip label="Payés" value={payesCount} color="#26C2A1" />
            <StatChip label="En attente" value={attenteCount} color="#F0883E" />
            {trajetActif && <StatChip label="Capacité" value={trajetActif.capacite ?? "—"} color="#6B7280" />}
          </div>
        )}

        {/* Tableau */}
        <div style={st.card}>
          <div style={st.cardTitleRow}>
            <h3 style={st.cardTitle}>Passagers{trajetActif ? ` — ${trajetActif.ligne_display}` : ""}</h3>
            {selectedTrajet && (
              <button style={st.btnSell} onClick={() => navigate(`/receptionniste/vente?trajet=${selectedTrajet}`)}>
                + Vendre un billet
              </button>
            )}
          </div>

          {!selectedTrajet ? (
            <p style={st.muted}>Sélectionnez un trajet pour afficher les passagers.</p>
          ) : loading ? (
            <p style={st.muted}>Chargement…</p>
          ) : passagers.length === 0 ? (
            <p style={st.muted}>Aucun passager pour ce trajet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={st.table}>
                <thead>
                  <tr>
                    {["N° Billet", "Passager", "Téléphone", "Siège", "De → À", "Prix", "Paiement", "Statut", ""].map(h => (
                      <th key={h} style={st.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passagers.map(p => (
                    <tr key={p.id} style={st.tr}>
                      <td style={st.td}><span style={st.numBillet}>{p.numero_billet}</span></td>
                      <td style={st.td}><span style={{ color: "#1A1348", fontWeight: "600" }}>{p.passager}</span></td>
                      <td style={st.td}>{p.passager_telephone || <span style={{ color: "#6B7280" }}>—</span>}</td>
                      <td style={st.td}><span style={st.seatBadge}>{p.siege_numero ?? "—"}</span></td>
                      <td style={{ ...st.td, fontSize: "12px" }}>
                        <span style={{ color: "#79C0FF" }}>{p.arret_depart_ville}</span>
                        {" → "}
                        <span style={{ color: "#79C0FF" }}>{p.arret_arrivee_ville}</span>
                      </td>
                      <td style={st.td}>{p.prix?.toLocaleString("fr-FR")} {p.devise}</td>
                      <td style={st.td}><Badge m={STATUT_PAIEMENT[p.statut_paiement]} /></td>
                      <td style={st.td}><Badge m={STATUT_BILLET[p.statut_billet]} /></td>
                      <td style={st.td}>
                        <button style={st.btnDetail} onClick={() => navigate(`/receptionniste/billet/${p.numero_billet}`)}>
                          Détail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Badge({ m }) {
  if (!m) return null;
  return <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: m.color + "22", color: m.color }}>{m.label}</span>;
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "14px 18px", borderTop: `3px solid ${color}`, flex: "1 1 120px" }}>
      <div style={{ fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "800", color, marginTop: "4px" }}>{value}</div>
    </div>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:        { maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:        { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitleRow:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #EEF2F7" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#1A1348", margin: 0 },
  filterRow:   { display: "flex", gap: "16px", flexWrap: "wrap" },
  label:       { display: "block", fontSize: "12px", color: "#6B7280", marginBottom: "6px", fontWeight: "600" },
  select:      { width: "100%", padding: "9px 12px", backgroundColor: "#F5F7FA", border: "1px solid #E5E7EB", borderRadius: "8px", color: "#1A1348", fontSize: "14px", fontFamily: "inherit" },
  statsRow:    { display: "flex", flexWrap: "wrap", gap: "12px" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  th:          { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #EEF2F7" },
  tr:          { borderBottom: "1px solid #EEF2F7" },
  td:          { padding: "11px 12px", fontSize: "13px", color: "#C9D1D9" },
  numBillet:   { fontFamily: "monospace", fontSize: "12px", color: "#1A1348", backgroundColor: "#EEF2F7", padding: "2px 8px", borderRadius: "4px" },
  seatBadge:   { backgroundColor: "#EEF2F7", color: "#1A1348", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  muted:       { color: "#6B7280", fontSize: "13px", margin: 0 },
  btnSell:     { padding: "6px 14px", fontSize: "12px", fontWeight: "600", color: "#26C2A1", backgroundColor: "transparent", border: "1.5px solid #26C2A1", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnDetail:   { padding: "3px 10px", fontSize: "11px", fontWeight: "600", color: "#58A6FF", backgroundColor: "transparent", border: "1px solid #58A6FF33", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
};
