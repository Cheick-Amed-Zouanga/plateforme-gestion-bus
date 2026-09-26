import { useState, useEffect, useCallback } from "react";
import apiFetch from "../../../shared/services/api";
import { ActionButton, PageHeader } from "../../../shared/components/dashboard";
import Modal from "../../../shared/components/Modal";
import { ChefBusCreerForm } from "./ChefBusCreerPage";

export default function ChefBusPage() {
  const [bus, setBus]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState("");
  const [recherche, setRecherche] = useState("");
  const [actionId, setActionId]   = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const charger = useCallback(() => {
    setLoading(true);
    apiFetch("/transport/bus/")
      .then(setBus)
      .catch(e => setErreur(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function desactiverBus(b) {
    if (!window.confirm(`Désactiver le bus ${b.immatriculation} ?`)) return;
    setActionId(b.id);
    try {
      await apiFetch(`/transport/bus/${b.id}/`, { method: "DELETE" });
      setBus(prev => prev.map(x => x.id === b.id ? { ...x, actif: false } : x));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setActionId(null);
    }
  }

  const busFiltres = bus.filter(b =>
    b.immatriculation.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={st.page}>
      <PageHeader
        title="Flotte de bus"
        subtitle="Gérez les véhicules de votre compagnie."
        actions={
          <ActionButton variant="green" onClick={() => setModalOpen(true)}>
            + Ajouter un bus
          </ActionButton>
        }
      />

      <Modal open={modalOpen} title="Nouveau bus" onClose={() => setModalOpen(false)}>
        <ChefBusCreerForm
          onCancel={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            charger();
          }}
        />
      </Modal>

      <main style={st.main}>

        <div style={st.topBar}>
          <input
            style={st.search}
            placeholder="Rechercher par immatriculation…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>

        {erreur && <div style={st.erreur}>{erreur}</div>}

        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr>
                {["Immatriculation", "Type", "Capacité", "Statut", "Actions"].map(h => (
                  <th key={h} style={st.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={st.empty}>Chargement…</td></tr>
              )}
              {!loading && busFiltres.length === 0 && (
                <tr><td colSpan={5} style={st.empty}>Aucun bus trouvé.</td></tr>
              )}
              {busFiltres.map(b => (
                <tr key={b.id} style={st.tr}>
                  <td style={st.td}><span style={st.immat}>{b.immatriculation}</span></td>
                  <td style={st.td}>
                    <span style={b.type_bus === "VIP" ? st.badgeVip : st.badgeStd}>
                      {b.type_bus_display}
                    </span>
                  </td>
                  <td style={st.td}>{b.capacite} places</td>
                  <td style={st.td}>
                    <span style={b.actif ? st.actif : st.inactif}>
                      {b.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={st.td}>
                    {b.actif && (
                      <button
                        style={{ ...st.btnAction, opacity: actionId === b.id ? 0.5 : 1 }}
                        onClick={() => desactiverBus(b)}
                        disabled={actionId === b.id}
                      >
                        Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

const st = {
  page:      { fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:      { maxWidth: "100%", margin: 0, padding: 0 },
  topBar:    { display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  search:    { flex: 1, minWidth: "200px", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", border: "1.5px solid #E5E7EB", backgroundColor: "#EEF2F7", color: "#1A1348", outline: "none", fontFamily: "inherit" },
  btnAdd:    { padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#fff", backgroundColor: "#26C2A1", border: "none", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap" },
  erreur:    { padding: "12px 16px", backgroundColor: "#2D1117", color: "#E11D48", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" },
  card:      { backgroundColor: "#FFFFFF", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "1px solid #E5E7EB", backgroundColor: "#F5F7FA" },
  tr:        { borderBottom: "1px solid #EEF2F7" },
  td:        { padding: "14px 16px", fontSize: "14px", color: "#1A1348" },
  empty:     { padding: "32px", textAlign: "center", color: "#6B7280", fontSize: "14px" },
  immat:     { fontFamily: "monospace", fontSize: "13px", color: "#79C0FF" },
  badgeVip:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#3D1F6B", color: "#D2A8FF" },
  badgeStd:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1C3260", color: "#79C0FF" },
  actif:     { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#112D1F", color: "#26C2A1" },
  inactif:   { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: "#2D1117", color: "#E11D48" },
  btnBack:   { marginBottom: "16px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#6B7280", backgroundColor: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" },
  btnAction: { padding: "5px 12px", fontSize: "12px", fontWeight: "600", color: "#E11D48", backgroundColor: "transparent", border: "1.5px solid #E11D48", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" },
};
