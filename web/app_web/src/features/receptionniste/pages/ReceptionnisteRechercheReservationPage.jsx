import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT_PAIEMENT = {
  PAYE:       { label: "Payé",       color: "#26C2A1" },
  EN_ATTENTE: { label: "En attente", color: "#F0883E" },
  REMBOURSE:  { label: "Remboursé",  color: "#6B7280" },
};

const STATUT_BILLET = {
  CONFIRME: { label: "Confirmé", color: "#26C2A1" },
  UTILISE:  { label: "Utilisé",  color: "#58A6FF" },
  ANNULE:   { label: "Annulé",   color: "#E11D48" },
};

export default function ReceptionnisteRechercheReservationPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = () => {
    if (!query.trim()) return;
    setLoading(true);
    apiFetch(`/billets/recherche/?q=${encodeURIComponent(query.trim())}`)
      .then(data => { setResults(Array.isArray(data) ? data : (data.billets ?? data.results ?? [])); setSearched(true); })
      .catch(() => { setResults([]); setSearched(true); })
      .finally(() => setLoading(false));
  };

  const handleKey = e => { if (e.key === "Enter") search(); };

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Recherche de réservation" backPath="/receptionniste" />
      <main style={st.main}>

        {/* Barre de recherche */}
        <div style={st.card}>
          <h3 style={st.cardTitle}>Rechercher un billet</h3>
          <p style={st.hint}>Recherchez par numéro de billet (ex: BF-XXXXXXXX), nom, prénom ou téléphone du passager.</p>
          <div style={st.searchRow}>
            <input
              style={st.searchInput}
              type="text"
              placeholder="BF-XXXXXXXX, nom ou téléphone…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
            />
            <button style={st.btnSearch} onClick={search} disabled={loading || !query.trim()}>
              {loading ? "…" : "Rechercher"}
            </button>
          </div>
        </div>

        {/* Résultats */}
        {searched && (
          <div style={st.card}>
            <h3 style={st.cardTitle}>
              {results.length === 0 ? "Aucun résultat" : `${results.length} billet${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`}
            </h3>
            {results.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={st.table}>
                  <thead>
                    <tr>
                      {["N° Billet", "Passager", "Téléphone", "Trajet", "Siège", "Prix", "Paiement", "Statut", ""].map(h => (
                        <th key={h} style={st.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(b => (
                      <BilletRow key={b.id} b={b} navigate={navigate} onRefresh={search} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function BilletRow({ b, navigate, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const [annuling, setAnnuling] = useState(false);

  const confirmerPaiement = async () => {
    setConfirming(true);
    try {
      await apiFetch(`/billets/${b.numero_billet}/`, { method: "PATCH", body: JSON.stringify({ statut_paiement: "PAYE" }) });
      onRefresh();
    } catch {} finally { setConfirming(false); }
  };

  const annuler = async () => {
    if (!window.confirm(`Annuler le billet ${b.numero_billet} ?`)) return;
    setAnnuling(true);
    try {
      await apiFetch(`/billets/${b.numero_billet}/annuler/`, { method: "POST" });
      onRefresh();
    } catch {} finally { setAnnuling(false); }
  };

  const sp = STATUT_PAIEMENT[b.statut_paiement];
  const sb = STATUT_BILLET[b.statut_billet];

  return (
    <tr style={st.tr}>
      <td style={st.td}><span style={st.numBillet}>{b.numero_billet}</span></td>
      <td style={st.td}><span style={{ color: "#1A1348", fontWeight: "600" }}>{b.passager}</span></td>
      <td style={st.td}>{b.passager_telephone || <span style={{ color: "#6B7280" }}>—</span>}</td>
      <td style={st.td}>
        <div style={{ fontSize: "12px", color: "#1A1348" }}>{b.ligne_display}</div>
        <div style={{ fontSize: "11px", color: "#6B7280" }}>
          {b.arret_depart_ville} → {b.arret_arrivee_ville}
        </div>
        {b.depart_prevu && (
          <div style={{ fontSize: "10px", color: "#6B7280" }}>
            {new Date(b.depart_prevu).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
          </div>
        )}
      </td>
      <td style={st.td}><span style={st.seatBadge}>{b.siege_numero ?? "—"}</span></td>
      <td style={st.td}>{b.prix?.toLocaleString("fr-FR")} {b.devise}</td>
      <td style={st.td}>{sp && <Badge m={sp} />}</td>
      <td style={st.td}>{sb && <Badge m={sb} />}</td>
      <td style={st.tdActions}>
        <button style={st.btnDetail} onClick={() => navigate(`/receptionniste/billet/${b.numero_billet}`)}>Détail</button>
        {b.statut_paiement === "EN_ATTENTE" && b.statut_billet === "CONFIRME" && (
          <button style={{ ...st.btnAction, color: "#26C2A1", borderColor: "#26C2A1" }} onClick={confirmerPaiement} disabled={confirming}>
            {confirming ? "…" : "Confirmer paiement"}
          </button>
        )}
        {b.statut_billet === "CONFIRME" && (
          <button style={{ ...st.btnAction, color: "#E11D48", borderColor: "#E11D48" }} onClick={annuler} disabled={annuling}>
            {annuling ? "…" : "Annuler"}
          </button>
        )}
      </td>
    </tr>
  );
}

function Badge({ m }) {
  return <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: m.color + "22", color: m.color }}>{m.label}</span>;
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:        { maxWidth: "1100px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:        { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:   { fontSize: "15px", fontWeight: "700", color: "#1A1348", margin: "0 0 12px", paddingBottom: "10px", borderBottom: "1px solid #EEF2F7" },
  hint:        { fontSize: "13px", color: "#6B7280", margin: "0 0 14px" },
  searchRow:   { display: "flex", gap: "10px" },
  searchInput: { flex: 1, padding: "10px 14px", backgroundColor: "#F5F7FA", border: "1px solid #E5E7EB", borderRadius: "8px", color: "#1A1348", fontSize: "14px", fontFamily: "inherit" },
  btnSearch:   { padding: "10px 22px", backgroundColor: "#304FFE", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  th:          { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #EEF2F7" },
  tr:          { borderBottom: "1px solid #EEF2F7" },
  td:          { padding: "11px 12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top" },
  tdActions:   { padding: "11px 12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top", display: "flex", flexDirection: "column", gap: "6px", minWidth: "130px" },
  numBillet:   { fontFamily: "monospace", fontSize: "12px", color: "#1A1348", backgroundColor: "#EEF2F7", padding: "2px 8px", borderRadius: "4px" },
  seatBadge:   { backgroundColor: "#EEF2F7", color: "#1A1348", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  btnDetail:   { padding: "3px 10px", fontSize: "11px", fontWeight: "600", color: "#58A6FF", backgroundColor: "transparent", border: "1px solid #58A6FF44", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
  btnAction:   { padding: "3px 10px", fontSize: "11px", fontWeight: "600", backgroundColor: "transparent", border: "1px solid", borderRadius: "5px", cursor: "pointer", fontFamily: "inherit" },
};
