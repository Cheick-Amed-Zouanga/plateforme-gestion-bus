import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

export default function ReceptionnisteCommandesEnLignePage() {
  const navigate = useNavigate();

  const [enAttente,     setEnAttente]     = useState([]);
  const [confirmes,     setConfirmes]     = useState([]);
  const [nbEnAttente,   setNbEnAttente]   = useState(0);
  const [nbConfirmes,   setNbConfirmes]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState(null);
  const [onglet,        setOnglet]        = useState("en_attente"); // "en_attente" | "confirmes"

  const charger = useCallback(() => {
    setLoading(true);
    apiFetch("/billets/commandes-en-ligne/")
      .then(data => {
        setEnAttente(data.en_attente  ?? []);
        setConfirmes(data.confirmes   ?? []);
        setNbEnAttente(data.total_en_attente ?? 0);
        setNbConfirmes(data.total_confirmes  ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const confirmerPaiement = async (b) => {
    setActionId(b.id);
    try {
      await apiFetch(`/billets/commandes-en-ligne/${b.numero_billet}/`, {
        method: "PATCH",
        body: JSON.stringify({ statut_paiement: "PAYE" }),
      });
      charger();
    } catch {} finally {
      setActionId(null);
    }
  };

  const billets = onglet === "en_attente" ? enAttente : confirmes;

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Commandes en ligne" backPath="/receptionniste" />
      <main style={st.main}>

        {/* Onglets */}
        <div style={st.tabs}>
          <button
            style={{ ...st.tab, ...(onglet === "en_attente" ? st.tabEnAttente : {}) }}
            onClick={() => setOnglet("en_attente")}>
            <span>Paiement en attente</span>
            {nbEnAttente > 0 && (
              <span style={{ ...st.badge, backgroundColor: "#F0883E", color: "#fff" }}>
                {nbEnAttente}
              </span>
            )}
          </button>
          <button
            style={{ ...st.tab, ...(onglet === "confirmes" ? st.tabConfirme : {}) }}
            onClick={() => setOnglet("confirmes")}>
            <span>Paiement confirmé</span>
            {nbConfirmes > 0 && (
              <span style={{ ...st.badge, backgroundColor: "#26C2A1", color: "#F5F7FA" }}>
                {nbConfirmes}
              </span>
            )}
          </button>
          <button style={st.btnRefresh} onClick={charger} disabled={loading}>
            {loading ? "…" : "↻ Actualiser"}
          </button>
        </div>

        {/* Alerte paiements en attente */}
        {onglet === "en_attente" && nbEnAttente > 0 && (
          <div style={st.alertBox}>
            <span style={{ fontSize: "16px" }}>⏳</span>
            <span>
              <strong>{nbEnAttente} commande{nbEnAttente > 1 ? "s" : ""}</strong> en attente de confirmation de paiement.
              Vérifiez la réception du paiement et cliquez sur <strong>"Confirmer paiement"</strong>.
            </span>
          </div>
        )}

        {/* Contenu */}
        <div style={st.card}>
          {loading ? (
            <p style={st.muted}>Chargement…</p>
          ) : billets.length === 0 ? (
            <div style={st.emptyBox}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                {onglet === "en_attente" ? "✓" : "📭"}
              </div>
              <p style={st.muted}>
                {onglet === "en_attente"
                  ? "Aucune commande en attente de paiement."
                  : "Aucune commande avec paiement confirmé."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={st.table}>
                <thead>
                  <tr>
                    {["N° Billet", "Passager", "Trajet & Segment", "Siège", "Prix", "Date réservation", "Actions"].map(h => (
                      <th key={h} style={st.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billets.map(b => (
                    <CommandeRow
                      key={b.id}
                      b={b}
                      onglet={onglet}
                      actionId={actionId}
                      onConfirmer={confirmerPaiement}
                      onVoir={() => navigate(`/receptionniste/billet/${b.numero_billet}`)}
                    />
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

function CommandeRow({ b, onglet, actionId, onConfirmer, onVoir }) {
  const enCours = actionId === b.id;
  return (
    <tr style={st.tr}>
      <td style={st.td}>
        <span style={st.numBillet}>{b.numero_billet}</span>
      </td>

      <td style={st.td}>
        <span style={{ color: "#1A1348", fontWeight: "600", display: "block" }}>
          {[b.passager_prenom, b.passager_nom].filter(Boolean).join(" ") || b.passager || "—"}
        </span>
        {b.passager_telephone && (
          <span style={{ fontSize: "11px", color: "#6B7280" }}>{b.passager_telephone}</span>
        )}
      </td>

      <td style={st.td}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#1A1348" }}>{b.ligne_display}</div>
        <div style={{ fontSize: "11px", color: "#79C0FF" }}>
          {b.arret_depart_ville} → {b.arret_arrivee_ville}
        </div>
        {b.depart_prevu && (
          <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
            {new Date(b.depart_prevu).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "#6B7280" }}>Bus : {b.bus_display}</div>
      </td>

      <td style={st.td}>
        <span style={st.seatBadge}>{b.siege_numero ?? "—"}</span>
      </td>

      <td style={st.td}>
        <span style={{ fontWeight: "700", color: "#1A1348", fontSize: "14px" }}>
          {b.prix?.toLocaleString("fr-FR")}
        </span>
        <span style={{ color: "#6B7280", fontSize: "11px", marginLeft: "4px" }}>{b.devise}</span>
      </td>

      <td style={st.td}>
        <span style={{ fontSize: "12px", color: "#6B7280" }}>
          {b.emis_le ? new Date(b.emis_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}
        </span>
      </td>

      <td style={st.tdActions}>
        <button style={st.btnVoir} onClick={onVoir}>
          Détail
        </button>
        {onglet === "en_attente" && (
          <button
            style={{ ...st.btnConfirmer, opacity: enCours ? 0.5 : 1 }}
            onClick={() => onConfirmer(b)}
            disabled={enCours}>
            {enCours ? "…" : "✓ Confirmer paiement"}
          </button>
        )}
      </td>
    </tr>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:        { maxWidth: "1200px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },

  tabs:        { display: "flex", gap: "4px", alignItems: "center", borderBottom: "1px solid #EEF2F7", paddingBottom: "0" },
  tab:         { display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", fontSize: "14px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: "-1px" },
  tabEnAttente:{ color: "#F0883E", borderBottomColor: "#F0883E" },
  tabConfirme: { color: "#26C2A1", borderBottomColor: "#26C2A1" },
  badge:       { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "20px", height: "20px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", padding: "0 6px" },
  btnRefresh:  { marginLeft: "auto", padding: "6px 14px", fontSize: "12px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },

  alertBox:    { display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", backgroundColor: "#2D1A0A", border: "1px solid #F0883E44", borderRadius: "10px", fontSize: "13px", color: "#C9D1D9" },
  emptyBox:    { padding: "40px", textAlign: "center" },

  card:        { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  table:       { width: "100%", borderCollapse: "collapse", minWidth: "900px" },
  th:          { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #EEF2F7" },
  tr:          { borderBottom: "1px solid #EEF2F7" },
  td:          { padding: "12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top" },
  tdActions:   { padding: "12px", fontSize: "13px", color: "#C9D1D9", verticalAlign: "top", display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" },
  numBillet:   { fontFamily: "monospace", fontSize: "12px", color: "#1A1348", backgroundColor: "#EEF2F7", padding: "2px 8px", borderRadius: "4px" },
  seatBadge:   { backgroundColor: "#EEF2F7", color: "#1A1348", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", fontFamily: "monospace" },
  muted:       { color: "#6B7280", fontSize: "13px", margin: 0 },
  btnVoir:     { padding: "4px 12px", fontSize: "12px", fontWeight: "600", color: "#58A6FF", backgroundColor: "transparent", border: "1px solid #58A6FF44", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
  btnConfirmer:{ padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#F5F7FA", backgroundColor: "#26C2A1", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
};
