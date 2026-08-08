import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STATUT_PAIEMENT = {
  PAYE:       { label: "Payé",       color: "#26C2A1", bg: "#1B3A2D" },
  EN_ATTENTE: { label: "En attente", color: "#F0883E", bg: "#2D1A0A" },
  REMBOURSE:  { label: "Remboursé",  color: "#6B7280", bg: "#EEF2F7" },
};

const STATUT_BILLET = {
  CONFIRME: { label: "Confirmé", color: "#26C2A1", bg: "#1B3A2D" },
  UTILISE:  { label: "Utilisé",  color: "#58A6FF", bg: "#1B2A3B" },
  ANNULE:   { label: "Annulé",   color: "#E11D48", bg: "#2D1117" },
};

export default function ReceptionnisteDetailBilletPage() {
  const { numero } = useParams();
  const navigate   = useNavigate();

  const [billet,   setBillet]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [annuling,   setAnnuling]   = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch(`/billets/${numero}/`)
      .then(data => setBillet(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [numero]);

  const confirmerPaiement = async () => {
    setConfirming(true);
    setActionMsg("");
    try {
      await apiFetch(`/billets/${numero}/`, { method: "PATCH", body: JSON.stringify({ statut_paiement: "PAYE" }) });
      setActionMsg("Paiement confirmé.");
      load();
    } catch (e) {
      setActionMsg(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const annuler = async () => {
    if (!window.confirm(`Annuler le billet ${numero} ?`)) return;
    setAnnuling(true);
    setActionMsg("");
    try {
      await apiFetch(`/billets/${numero}/annuler/`, { method: "POST" });
      setActionMsg("Billet annulé.");
      load();
    } catch (e) {
      setActionMsg(e.message);
    } finally {
      setAnnuling(false);
    }
  };

  if (loading) return (
    <div style={st.page}><Header /><SubHeader title="Détail billet" backPath="/receptionniste/recherche" />
      <main style={st.main}><p style={st.muted}>Chargement…</p></main>
    </div>
  );

  if (error || !billet) return (
    <div style={st.page}><Header /><SubHeader title="Détail billet" backPath="/receptionniste/recherche" />
      <main style={st.main}>
        <div style={st.errBox}>{error || "Billet introuvable."}</div>
        <button style={st.btnBack} onClick={() => navigate("/receptionniste/recherche")}>← Retour</button>
      </main>
    </div>
  );

  const sp = STATUT_PAIEMENT[billet.statut_paiement];
  const sb = STATUT_BILLET[billet.statut_billet];
  const dateDepart  = billet.depart_prevu ? new Date(billet.depart_prevu).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }) : "—";
  const dateEmission = billet.emis_le     ? new Date(billet.emis_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Détail billet" backPath="/receptionniste/recherche" />
      <main style={st.main}>

        {actionMsg && <div style={{ padding: "10px 14px", borderRadius: "8px", fontSize: "13px", backgroundColor: "#1B3A2D", color: "#26C2A1", border: "1px solid #26C2A133" }}>{actionMsg}</div>}

        <div style={st.card}>
          {/* En-tête compagnie */}
          {billet.nom_compagnie && (
            <div style={{ textAlign: "center", padding: "10px 0 12px", borderBottom: "1px solid #EEF2F7", marginBottom: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "3px", color: "#1A1348", textTransform: "uppercase" }}>{billet.nom_compagnie}</div>
              <div style={{ fontSize: "10px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px" }}>Billet de voyage officiel</div>
            </div>
          )}

          {/* En-tête billet */}
          <div style={st.billetHeader}>
            <div>
              <span style={st.numBillet}>{billet.numero_billet}</span>
              <span style={st.sourceTag}>{billet.source_display ?? billet.source}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {sb && <Badge color={sb.color} bg={sb.bg} label={sb.label} />}
              {sp && <Badge color={sp.color} bg={sp.bg} label={sp.label} />}
            </div>
          </div>

          <div style={st.section}>
            <h4 style={st.sectionTitle}>Passager</h4>
            <div style={st.grid}>
              <Field label="Nom complet"      value={billet.passager} />
              <Field label="Téléphone"        value={billet.passager_telephone || "—"} />
              <Field label="Pièce d'identité" value={billet.passager_piece_identite || "—"} />
            </div>
          </div>

          <div style={st.section}>
            <h4 style={st.sectionTitle}>Trajet</h4>
            <div style={st.grid}>
              <Field label="Ligne"      value={billet.ligne_display} />
              <Field label="Bus"        value={billet.bus_display} />
              <Field label="Départ"     value={billet.arret_depart_ville} />
              <Field label="Arrivée"    value={billet.arret_arrivee_ville} />
              <Field label="Siège"      value={billet.siege_numero} />
              <Field label="Date/Heure" value={dateDepart} />
            </div>
          </div>

          <div style={st.section}>
            <h4 style={st.sectionTitle}>Paiement</h4>
            <div style={st.grid}>
              <Field label="Prix"           value={`${billet.prix?.toLocaleString("fr-FR")} ${billet.devise}`} />
              <Field label="Mode"           value={billet.mode_paiement_display ?? billet.mode_paiement} />
              <Field label="Émis le"        value={dateEmission} />
            </div>
          </div>

          {/* Code-barres + QR côte à côte */}
          {(billet.barcode_image || billet.qr_image) && (
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
              {billet.barcode_image && (
                <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "10px 14px", textAlign: "center", flex: "2 1 200px" }}>
                  <div style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>Code-barres</div>
                  <img src={billet.barcode_image} alt="Code-barres" style={{ height: "52px", maxWidth: "100%", display: "block", margin: "0 auto" }} />
                  <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", fontFamily: "monospace" }}>{billet.numero_billet}</div>
                </div>
              )}
              {billet.qr_image && (
                <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "10px", textAlign: "center", flex: "0 0 auto" }}>
                  <div style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>QR Code</div>
                  <img src={billet.qr_image} alt="QR Code" style={{ width: "120px", height: "120px", display: "block" }} />
                  <div style={{ fontSize: "9px", color: "#888", marginTop: "4px" }}>Scanner pour embarquement</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={st.actions}>
          <button style={st.btnSecondary} onClick={() => navigate(-1)}>← Retour</button>
          <button style={st.btnPrint} onClick={() => imprimerBillet(billet)}>🖨 Imprimer</button>
          {billet.statut_paiement === "EN_ATTENTE" && billet.statut_billet === "CONFIRME" && (
            <button style={{ ...st.btnAction, color: "#26C2A1", borderColor: "#26C2A1" }}
              onClick={confirmerPaiement} disabled={confirming}>
              {confirming ? "…" : "Confirmer paiement"}
            </button>
          )}
          {billet.statut_billet === "CONFIRME" && (
            <button style={{ ...st.btnAction, color: "#E11D48", borderColor: "#E11D48" }}
              onClick={annuler} disabled={annuling}>
              {annuling ? "…" : "Annuler le billet"}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}

function imprimerBillet(billet) {
  const dateDepart   = billet.depart_prevu ? new Date(billet.depart_prevu).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }) : "—";
  const dateEmission = billet.emis_le      ? new Date(billet.emis_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";
  const prixFmt     = billet.prix != null ? Number(billet.prix).toLocaleString("fr-FR") : "—";
  const statutColor = billet.statut_paiement === "PAYE" ? "#155724" : "#856404";
  const statutBg    = billet.statut_paiement === "PAYE" ? "#d4edda"  : "#fff3cd";
  const statutLabel = billet.statut_paiement_display || (billet.statut_paiement === "PAYE" ? "Payé" : "En attente");
  const nomCompagnie = billet.nom_compagnie || "TERRASSO";
  const prenom = billet.passager_prenom || "";
  const nom    = billet.passager_nom    || "";
  const sourceLabel = billet.source === "APP" ? "En ligne (Application)" : "En présentiel (Guichet)";

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Billet ${billet.numero_billet}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#000;padding:20px}
  .ticket{max-width:440px;margin:0 auto;border:2px solid #222;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15)}
  .hdr{background:#F5F7FA;color:#fff;padding:16px 22px 14px;text-align:center}
  .co{font-size:24px;font-weight:900;letter-spacing:4px;text-transform:uppercase}
  .sub{font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px}
  .num{font-size:12px;font-family:monospace;color:#58A6FF;margin-top:6px;background:rgba(255,255,255,.06);display:inline-block;padding:2px 10px;border-radius:4px}
  .route{background:#f5f5f5;padding:12px 22px;text-align:center;border-top:3px solid #26C2A1}
  .cities{font-size:22px;font-weight:900;color:#000;letter-spacing:1px}
  .arrow{color:#26C2A1;margin:0 10px}
  .rdate{font-size:12px;color:#555;margin-top:3px}
  .body{padding:14px 22px}
  .st-title{font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#999;font-weight:700;margin:12px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
  .fl{font-size:9px;text-transform:uppercase;color:#999;letter-spacing:.8px}
  .fv{font-size:13px;font-weight:700;color:#111;margin-top:1px}
  .price-row{display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px;padding:10px 14px;background:#f9f9f9;border-radius:8px}
  .plabel{font-size:12px;color:#555}
  .pvalue{font-size:24px;font-weight:900;color:#26C2A1}
  .st-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px}
  .st-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${statutBg};color:${statutColor}}
  .src-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;background:#f0f0f0;color:#555}
  .sep{border:none;border-top:1px dashed #ddd;margin:12px 0}
  .codes-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:12px 22px;border-top:1px dashed #ddd;background:#fff}
  .barcode-block{flex:1;text-align:center}
  .barcode-block img{max-width:100%;height:52px;display:block;margin:0 auto}
  .bc-num{font-size:10px;font-family:monospace;color:#555;margin-top:3px}
  .qr-block{flex:0 0 auto;text-align:center}
  .qr-block img{width:120px;height:120px;display:block}
  .ql{font-size:9px;color:#aaa;margin-top:4px}
  .footer{background:#f5f5f5;padding:9px 22px;text-align:center;border-top:1px solid #ddd;font-size:9px;color:#999}
  @media print{body{padding:0}@page{margin:8mm;size:A5}}
</style></head>
<body><div class="ticket">
  <div class="hdr">
    <div class="co">${nomCompagnie}</div>
    <div class="sub">Billet de voyage officiel</div>
    <div class="num">${billet.numero_billet}</div>
  </div>
  <div class="route">
    <div class="cities"><span>${billet.arret_depart_ville ?? "—"}</span><span class="arrow">→</span><span>${billet.arret_arrivee_ville ?? "—"}</span></div>
    <div class="rdate">${dateDepart}</div>
  </div>
  <div class="body">
    <div class="st-title">Informations passager</div>
    <div class="grid">
      <div><div class="fl">Prénom</div><div class="fv">${prenom || "—"}</div></div>
      <div><div class="fl">Nom</div><div class="fv">${nom || "—"}</div></div>
      <div><div class="fl">Téléphone</div><div class="fv">${billet.passager_telephone || "—"}</div></div>
      <div><div class="fl">Pièce d'identité</div><div class="fv">${billet.passager_piece_identite || "—"}</div></div>
      <div><div class="fl">Siège n°</div><div class="fv">${billet.siege_numero ?? "—"}</div></div>
    </div>
    <div class="st-title">Détails du voyage</div>
    <div class="grid">
      <div><div class="fl">Bus</div><div class="fv">${billet.bus_display ?? "—"}</div></div>
      <div><div class="fl">Ligne</div><div class="fv">${billet.ligne_display ?? "—"}</div></div>
      <div><div class="fl">Départ</div><div class="fv">${billet.arret_depart_ville ?? "—"}</div></div>
      <div><div class="fl">Arrivée</div><div class="fv">${billet.arret_arrivee_ville ?? "—"}</div></div>
    </div>
    <hr class="sep">
    <div class="price-row">
      <span class="plabel">Montant total</span>
      <span class="pvalue">${prixFmt} <span style="font-size:14px;font-weight:600">${billet.devise ?? "XOF"}</span></span>
    </div>
    <div class="st-row">
      <span class="st-badge">${statutLabel}</span>
      <span class="src-badge">${sourceLabel}</span>
    </div>
  </div>
  ${(billet.barcode_image || billet.qr_image) ? `
  <div class="codes-row">
    ${billet.barcode_image ? `<div class="barcode-block"><img src="${billet.barcode_image}" alt="Code-barres"><div class="bc-num">${billet.numero_billet}</div></div>` : ""}
    ${billet.qr_image ? `<div class="qr-block"><img src="${billet.qr_image}" alt="QR Code"><div class="ql" style="font-size:9px;color:#aaa;margin-top:4px">Scanner pour embarquement</div></div>` : ""}
  </div>` : ""}
  <div class="footer">
    <div>Émis le ${dateEmission} — ${nomCompagnie}</div>
    <div style="margin-top:3px">Ce billet est personnel et non cessible — ${sourceLabel}</div>
  </div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

  const win = window.open("", "_blank", "width=540,height=820");
  win.document.write(html);
  win.document.close();
}

function Badge({ color, bg, label }) {
  return <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", backgroundColor: bg, color, border: `1px solid ${color}44` }}>{label}</span>;
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#1A1348", fontWeight: "600", marginTop: "2px" }}>{value ?? "—"}</div>
    </div>
  );
}

const st = {
  page:        { minHeight: "100vh", backgroundColor: "#F5F7FA", fontFamily: "'Poppins', 'Segoe UI', sans-serif" },
  main:        { maxWidth: "680px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "16px" },
  card:        { backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  billetHeader:{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #EEF2F7" },
  numBillet:   { display: "block", fontSize: "20px", fontWeight: "800", color: "#1A1348", fontFamily: "monospace", marginBottom: "6px" },
  sourceTag:   { fontSize: "11px", color: "#6B7280", backgroundColor: "#EEF2F7", padding: "2px 8px", borderRadius: "4px" },
  section:     { marginBottom: "20px" },
  sectionTitle:{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px", paddingBottom: "6px", borderBottom: "1px solid #EEF2F7" },
  grid:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  actions:     { display: "flex", gap: "10px", flexWrap: "wrap" },
  btnSecondary:{ padding: "10px 20px", backgroundColor: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnPrint:    { padding: "10px 20px", backgroundColor: "#1B2A3B", color: "#58A6FF", border: "1px solid #58A6FF44", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnAction:   { padding: "10px 20px", backgroundColor: "transparent", border: "1.5px solid", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  errBox:      { padding: "12px 16px", backgroundColor: "#2D1117", color: "#E11D48", borderRadius: "8px", fontSize: "13px" },
  btnBack:     { padding: "10px 20px", backgroundColor: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  muted:       { color: "#6B7280", fontSize: "13px", margin: 0 },
};
