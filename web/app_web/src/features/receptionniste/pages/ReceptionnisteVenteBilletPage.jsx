import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../../components/Header";
import SubHeader from "../../../components/SubHeader";
import apiFetch from "../../../shared/services/api";

const STEPS = ["Trajet", "Sièges", "Passager", "Confirmation"];

const MODE_LABEL = {
  ESPECES:      "Espèces",
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY:   "Moov Money",
};

const STATUT_PAIEMENT_OPTS = [
  { value: "PAYE",       label: "Payé maintenant" },
  { value: "EN_ATTENTE", label: "En attente de paiement" },
];

export default function ReceptionnisteVenteBilletPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTrajetId = searchParams.get("trajet");

  const [step, setStep] = useState(0);
  const [trajets, setTrajets] = useState([]);
  const [loadingTrajets, setLoadingTrajets] = useState(true);

  // Step 0
  const [selectedTrajet, setSelectedTrajet] = useState(null);
  const [arretDepart, setArretDepart] = useState("");
  const [arretArrivee, setArretArrivee] = useState("");

  // Step 1
  const [plan, setPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedSiege, setSelectedSiege] = useState(null);

  // Step 2
  const [form, setForm] = useState({
    nom: "", prenom: "", telephone: "", piece_identite: "",
    mode_paiement: "ESPECES",
    statut_paiement: "PAYE",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 3
  const [billet, setBillet] = useState(null);

  useEffect(() => {
    apiFetch("/billets/trajets/")
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setTrajets(list);
        if (preselectedTrajetId) {
          const found = list.find(t => String(t.id) === preselectedTrajetId);
          if (found) setSelectedTrajet(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTrajets(false));
  }, [preselectedTrajetId]);

  const arrets = selectedTrajet ? (selectedTrajet.arrets ?? []) : [];
  const arretDepartObj   = arrets.find(a => String(a.id) === arretDepart);
  const arretArriveeList = arretDepartObj ? arrets.filter(a => a.ordre > arretDepartObj.ordre) : [];

  const fetchPlan = useCallback(() => {
    if (!selectedTrajet || !arretDepart || !arretArrivee) return;
    setLoadingPlan(true);
    setSelectedSiege(null);
    apiFetch(`/billets/trajets/${selectedTrajet.id}/plan/?arret_depart=${arretDepart}&arret_arrivee=${arretArrivee}`)
      .then(data => setPlan(data.plan ?? []))
      .catch(() => setPlan([]))
      .finally(() => setLoadingPlan(false));
  }, [selectedTrajet, arretDepart, arretArrivee]);

  const handleNextStep0 = () => {
    if (!selectedTrajet || !arretDepart || !arretArrivee) {
      setError("Veuillez sélectionner un trajet, une ville de départ et d'arrivée.");
      return;
    }
    setError("");
    fetchPlan();
    setStep(1);
  };

  const handleNextStep1 = () => {
    if (!selectedSiege) { setError("Veuillez sélectionner un siège."); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) { setError("Le nom du passager est requis."); return; }
    setError("");
    setSubmitting(true);
    try {
      const result = await apiFetch("/billets/vendre/", {
        method: "POST",
        body: JSON.stringify({
          trajet:             selectedTrajet.id,
          siege:              selectedSiege.id,
          arret_depart:       Number(arretDepart),
          arret_arrivee:      Number(arretArrivee),
          passager_nom:             form.nom,
          passager_prenom:          form.prenom,
          passager_telephone:       form.telephone,
          passager_piece_identite:  form.piece_identite,
          mode_paiement:      form.mode_paiement,
          statut_paiement:    form.statut_paiement,
        }),
      });
      setBillet({ ...result.billet, qr_image: result.qr_image, barcode_image: result.barcode_image });
      setStep(3);
    } catch (e) {
      setError(e.message ?? "Erreur lors de la vente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNouveauBillet = () => {
    setStep(0);
    setSelectedTrajet(null);
    setArretDepart("");
    setArretArrivee("");
    setSelectedSiege(null);
    setForm({ nom: "", prenom: "", telephone: "", piece_identite: "", mode_paiement: "ESPECES", statut_paiement: "PAYE" });
    setBillet(null);
    setError("");
  };

  return (
    <div style={st.page}>
      <Header />
      <SubHeader title="Vente de billet — Guichet" backPath="/receptionniste" />
      <main style={st.main}>

        {/* Stepper */}
        <div style={st.stepper}>
          {STEPS.map((label, i) => (
            <div key={i} style={st.stepItem}>
              <div style={{ ...st.stepDot, backgroundColor: i <= step ? "#009A44" : "#21262D", color: i <= step ? "#fff" : "#6E7681" }}>{i + 1}</div>
              <span style={{ ...st.stepLabel, color: i === step ? "#E6EDF3" : "#6E7681" }}>{label}</span>
              {i < STEPS.length - 1 && <div style={{ ...st.stepLine, backgroundColor: i < step ? "#009A44" : "#21262D" }} />}
            </div>
          ))}
        </div>

        {error && <div style={st.errorBanner}>{error}</div>}

        {/* ── STEP 0 : Trajet ── */}
        {step === 0 && (
          <div style={st.card}>
            <h3 style={st.cardTitle}>Choisir le trajet</h3>
            {loadingTrajets ? <p style={st.muted}>Chargement…</p> : (
              <>
                <label style={st.label}>Trajet</label>
                <select style={st.select} value={selectedTrajet?.id ?? ""} onChange={e => {
                  const t = trajets.find(x => String(x.id) === e.target.value);
                  setSelectedTrajet(t ?? null);
                  setArretDepart(""); setArretArrivee("");
                }}>
                  <option value="">— Sélectionner —</option>
                  {trajets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.ligne_display} — {t.bus_display} — {t.depart_prevu ? new Date(t.depart_prevu).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : ""}
                    </option>
                  ))}
                </select>

                {selectedTrajet && (
                  <>
                    <label style={st.label}>Ville de départ</label>
                    <select style={st.select} value={arretDepart} onChange={e => { setArretDepart(e.target.value); setArretArrivee(""); }}>
                      <option value="">— Sélectionner —</option>
                      {arrets.filter(a => !a.est_arrivee).map(a => (
                        <option key={a.id} value={a.id}>{a.ville}</option>
                      ))}
                    </select>

                    <label style={st.label}>Ville d'arrivée</label>
                    <select style={st.select} value={arretArrivee} onChange={e => setArretArrivee(e.target.value)} disabled={!arretDepart}>
                      <option value="">— Sélectionner —</option>
                      {arretArriveeList.map(a => (
                        <option key={a.id} value={a.id}>{a.ville}</option>
                      ))}
                    </select>
                  </>
                )}

                <button style={st.btnPrimary} onClick={handleNextStep0}>Voir les sièges →</button>
              </>
            )}
          </div>
        )}

        {/* ── STEP 1 : Plan de bus ── */}
        {step === 1 && (
          <div style={st.card}>
            <h3 style={st.cardTitle}>
              Choisir un siège — {selectedTrajet?.bus_display} &nbsp;|&nbsp;
              {arrets.find(a => String(a.id) === arretDepart)?.ville} → {arrets.find(a => String(a.id) === arretArrivee)?.ville}
            </h3>
            <div style={st.legend}>
              <LegendDot color="#56D364" label="Disponible" />
              <LegendDot color="#F0883E" label="Guichet (occupé)" />
              <LegendDot color="#FF7B72" label="App (occupé)" />
              {selectedSiege && <LegendDot color="#58A6FF" label={`Siège ${selectedSiege.numero} sélectionné`} />}
            </div>

            {loadingPlan ? <p style={st.muted}>Chargement du plan…</p> : (
              <BusPlan plan={plan} selected={selectedSiege} onSelect={s => s.etat === "disponible" && setSelectedSiege(s)} />
            )}

            <div style={st.btnRow}>
              <button style={st.btnSecondary} onClick={() => { setStep(0); setSelectedSiege(null); }}>← Retour</button>
              <button style={st.btnPrimary} onClick={handleNextStep1}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2 : Passager + Paiement ── */}
        {step === 2 && (
          <div style={st.card}>
            <h3 style={st.cardTitle}>Informations passager &amp; paiement</h3>
            <div style={st.infoRow}>
              <InfoChip label="Bus"   value={selectedTrajet?.bus_display} />
              <InfoChip label="Siège" value={selectedSiege?.numero} />
              <InfoChip label="De"    value={arrets.find(a => String(a.id) === arretDepart)?.ville} />
              <InfoChip label="À"     value={arrets.find(a => String(a.id) === arretArrivee)?.ville} />
            </div>

            <div style={st.formGrid}>
              <Field label="Nom *"           value={form.nom}            onChange={v => setForm(f => ({ ...f, nom: v }))} />
              <Field label="Prénom"          value={form.prenom}         onChange={v => setForm(f => ({ ...f, prenom: v }))} />
              <Field label="Téléphone"       value={form.telephone}      onChange={v => setForm(f => ({ ...f, telephone: v }))} type="tel" />
              <Field label="Pièce d'identité" value={form.piece_identite} onChange={v => setForm(f => ({ ...f, piece_identite: v }))} placeholder="N° CNI / Passeport" />
              <div>
                <label style={st.label}>Mode de paiement</label>
                <select style={st.select} value={form.mode_paiement} onChange={e => setForm(f => ({ ...f, mode_paiement: e.target.value }))}>
                  {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Confirmation paiement */}
            <div style={st.paiementBox}>
              <p style={st.paiementTitle}>Statut du paiement</p>
              <div style={st.paiementOpts}>
                {STATUT_PAIEMENT_OPTS.map(opt => (
                  <label key={opt.value} style={{
                    ...st.paiementOpt,
                    ...(form.statut_paiement === opt.value ? st.paiementOptActif : {}),
                  }}>
                    <input
                      type="radio"
                      name="statut_paiement"
                      value={opt.value}
                      checked={form.statut_paiement === opt.value}
                      onChange={() => setForm(f => ({ ...f, statut_paiement: opt.value }))}
                      style={{ display: "none" }}
                    />
                    <span style={{ fontSize: "18px" }}>{opt.value === "PAYE" ? "✓" : "⏳"}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={st.btnRow}>
              <button style={st.btnSecondary} onClick={() => setStep(1)}>← Retour</button>
              <button style={{ ...st.btnPrimary, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Traitement…" : "Émettre le billet"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 : Confirmation + Téléchargement ── */}
        {step === 3 && billet && (
          <div style={st.card}>
            <div style={st.successIcon}>✓</div>
            <h3 style={{ ...st.cardTitle, textAlign: "center", color: "#56D364" }}>Billet émis avec succès</h3>

            <div style={st.billetBox}>
              {/* En-tête compagnie */}
              <div style={{ textAlign: "center", padding: "14px 0 10px", borderBottom: "1px solid #21262D", marginBottom: "14px" }}>
                <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "3px", color: "#E6EDF3", textTransform: "uppercase" }}>
                  {billet.nom_compagnie || "—"}
                </div>
                <div style={{ fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "3px" }}>Billet de voyage officiel</div>
                <div style={{ ...st.billetNum, marginTop: "8px" }}>{billet.numero_billet}</div>
              </div>

              {/* Route */}
              <div style={{ textAlign: "center", backgroundColor: "#0D1117", borderRadius: "8px", padding: "10px", marginBottom: "14px", borderTop: "3px solid #009A44" }}>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#E6EDF3" }}>
                  {billet.arret_depart_ville} <span style={{ color: "#009A44" }}>→</span> {billet.arret_arrivee_ville}
                </div>
                {billet.depart_prevu && (
                  <div style={{ fontSize: "12px", color: "#8B949E", marginTop: "3px" }}>
                    {new Date(billet.depart_prevu).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
                  </div>
                )}
              </div>

              {/* Badges statut */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                <span style={{ ...st.statutBadge, backgroundColor: billet.statut_paiement === "PAYE" ? "#1B3A2D" : "#2D1A0A", color: billet.statut_paiement === "PAYE" ? "#56D364" : "#F0883E", borderColor: billet.statut_paiement === "PAYE" ? "#56D364" : "#F0883E" }}>
                  {billet.statut_paiement === "PAYE" ? "✓ Payé" : "⏳ En attente"}
                </span>
                <span style={{ ...st.statutBadge, backgroundColor: "#21262D", color: "#8B949E", borderColor: "#30363D" }}>
                  {billet.source_display ?? billet.source}
                </span>
              </div>

              <div style={st.billetGrid}>
                <BilletField label="Nom"              value={billet.passager_nom} />
                <BilletField label="Prénom"           value={billet.passager_prenom || "—"} />
                <BilletField label="Téléphone"        value={billet.passager_telephone || "—"} />
                <BilletField label="Pièce d'identité" value={billet.passager_piece_identite || "—"} />
                <BilletField label="Siège n°"         value={billet.siege_numero} />
                <BilletField label="Bus"              value={billet.bus_display} />
                <BilletField label="Mode paiement"    value={MODE_LABEL[billet.mode_paiement] ?? billet.mode_paiement_display} />
                <BilletField label="Prix"             value={`${billet.prix?.toLocaleString("fr-FR")} ${billet.devise}`} />
              </div>

              {/* Code-barres + QR côte à côte */}
              <div style={{ display: "flex", gap: "12px", marginTop: "18px", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
                {billet.barcode_image && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "10px 14px", textAlign: "center", flex: "2 1 200px" }}>
                    <img src={billet.barcode_image} alt="Code-barres" style={{ height: "52px", maxWidth: "100%", display: "block", margin: "0 auto" }} />
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", fontFamily: "monospace" }}>{billet.numero_billet}</div>
                  </div>
                )}
                {billet.qr_image && (
                  <div style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "10px", textAlign: "center", flex: "0 0 auto" }}>
                    <img src={billet.qr_image} alt="QR Code" style={{ width: "120px", height: "120px", display: "block" }} />
                    <div style={{ fontSize: "9px", color: "#888", marginTop: "4px" }}>Scanner le QR</div>
                  </div>
                )}
              </div>
            </div>

            <div style={st.btnRow}>
              <button style={st.btnSecondary} onClick={() => navigate("/receptionniste")}>Tableau de bord</button>
              <button style={st.btnDownload} onClick={() => imprimerBillet(billet)}>
                🖨 Imprimer / Télécharger
              </button>
              <button style={st.btnPrimary} onClick={handleNouveauBillet}>Nouveau billet</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Impression ticket ─────────────────────────────────────────────────────────

function imprimerBillet(billet) {
  const dateDepart   = billet.depart_prevu
    ? new Date(billet.depart_prevu).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })
    : "—";
  const dateEmission = billet.emis_le
    ? new Date(billet.emis_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : "—";
  const prixFmt     = billet.prix != null ? Number(billet.prix).toLocaleString("fr-FR") : "—";
  const statutColor = billet.statut_paiement === "PAYE" ? "#155724" : "#856404";
  const statutBg    = billet.statut_paiement === "PAYE" ? "#d4edda"  : "#fff3cd";
  const statutLabel = billet.statut_paiement_display || (billet.statut_paiement === "PAYE" ? "Payé" : "En attente");
  const nomCompagnie = billet.nom_compagnie || "TERRASSO";
  const prenom = billet.passager_prenom || "";
  const nom    = billet.passager_nom    || "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || billet.passager || "—";
  const sourceLabel = billet.source === "APP" ? "En ligne (Application)" : "En présentiel (Guichet)";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Billet ${billet.numero_billet}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #000; padding: 20px; }
    .ticket { max-width: 440px; margin: 0 auto; border: 2px solid #222; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
    .hdr { background: #0D1117; color: #fff; padding: 16px 22px 14px; text-align: center; }
    .co  { font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; }
    .sub { font-size: 10px; color: #8B949E; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px; }
    .num { font-size: 12px; font-family: monospace; color: #58A6FF; margin-top: 6px; background: rgba(255,255,255,.06); display: inline-block; padding: 2px 10px; border-radius: 4px; }
    .route { background: #f5f5f5; padding: 12px 22px; text-align: center; border-top: 3px solid #009A44; }
    .cities { font-size: 22px; font-weight: 900; color: #000; letter-spacing: 1px; }
    .arrow  { color: #009A44; margin: 0 10px; }
    .rdate  { font-size: 12px; color: #555; margin-top: 3px; }
    .body   { padding: 14px 22px; }
    .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #999; font-weight: 700; margin: 12px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }
    .fl     { font-size: 9px; text-transform: uppercase; color: #999; letter-spacing: .8px; }
    .fv     { font-size: 13px; font-weight: 700; color: #111; margin-top: 1px; }
    .price-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 8px; padding: 10px 14px; background: #f9f9f9; border-radius: 8px; }
    .plabel { font-size: 12px; color: #555; }
    .pvalue { font-size: 24px; font-weight: 900; color: #009A44; }
    .st-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .st-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${statutBg}; color: ${statutColor}; }
    .src-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; background: #f0f0f0; color: #555; }
    .sep { border: none; border-top: 1px dashed #ddd; margin: 12px 0; }
    .codes-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 12px 22px; border-top: 1px dashed #ddd; background: #fff; }
    .barcode-block { flex: 1; text-align: center; }
    .barcode-block img { max-width: 100%; height: 52px; display: block; margin: 0 auto; }
    .bc-num { font-size: 10px; font-family: monospace; color: #555; margin-top: 3px; }
    .qr-block { flex: 0 0 auto; text-align: center; }
    .qr-block img { width: 120px; height: 120px; display: block; }
    .ql { font-size: 9px; color: #aaa; margin-top: 4px; }
    .footer { background: #f5f5f5; padding: 9px 22px; text-align: center; border-top: 1px solid #ddd; font-size: 9px; color: #999; }
    @media print { body { padding: 0; } @page { margin: 8mm; size: A5; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="hdr">
      <div class="co">${nomCompagnie}</div>
      <div class="sub">Billet de voyage officiel</div>
      <div class="num">${billet.numero_billet}</div>
    </div>

    <div class="route">
      <div class="cities">
        <span>${billet.arret_depart_ville ?? "—"}</span>
        <span class="arrow">→</span>
        <span>${billet.arret_arrivee_ville ?? "—"}</span>
      </div>
      <div class="rdate">${dateDepart}</div>
    </div>

    <div class="body">
      <div class="section-title">Informations passager</div>
      <div class="grid">
        <div><div class="fl">Prénom</div><div class="fv">${prenom || "—"}</div></div>
        <div><div class="fl">Nom</div><div class="fv">${nom || "—"}</div></div>
        <div><div class="fl">Téléphone</div><div class="fv">${billet.passager_telephone || "—"}</div></div>
        <div><div class="fl">Pièce d'identité</div><div class="fv">${billet.passager_piece_identite || "—"}</div></div>
        <div><div class="fl">Siège n°</div><div class="fv">${billet.siege_numero ?? "—"}</div></div>
      </div>

      <div class="section-title">Détails du voyage</div>
      <div class="grid">
        <div><div class="fl">Bus</div><div class="fv">${billet.bus_display ?? "—"}</div></div>
        <div><div class="fl">Ligne</div><div class="fv">${billet.ligne_display ?? "—"}</div></div>
        <div><div class="fl">Lieu départ</div><div class="fv">${billet.arret_depart_ville ?? "—"}</div></div>
        <div><div class="fl">Lieu arrivée</div><div class="fv">${billet.arret_arrivee_ville ?? "—"}</div></div>
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
      ${billet.barcode_image ? `
      <div class="barcode-block">
        <img src="${billet.barcode_image}" alt="Code-barres">
        <div class="bc-num">${billet.numero_billet}</div>
      </div>` : ""}
      ${billet.qr_image ? `
      <div class="qr-block">
        <img src="${billet.qr_image}" alt="QR Code">
        <div class="ql">Scanner pour embarquement</div>
      </div>` : ""}
    </div>` : ""}

    <div class="footer">
      <div>Émis le ${dateEmission} par ${nomCompagnie}</div>
      <div style="margin-top:3px">Ce billet est personnel et non cessible — Réservation ${sourceLabel}</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=540,height=820");
  win.document.write(html);
  win.document.close();
}

// ── Composants visuels ────────────────────────────────────────────────────────

function BusPlan({ plan, selected, onSelect }) {
  if (!plan.length) return <p style={{ color: "#6E7681", fontSize: "13px" }}>Aucun siège trouvé.</p>;
  const rows = [];
  for (let i = 0; i < plan.length; i += 4) rows.push(plan.slice(i, i + 4));
  return (
    <div style={{ maxWidth: "340px", margin: "0 auto" }}>
      <div style={st.busBody}>
        <div style={st.busDriver}>🚌 Conducteur</div>
        {rows.map((row, ri) => (
          <div key={ri} style={st.busRow}>
            <div style={st.seatPair}>
              {row[0] && <Seat s={row[0]} selected={selected?.id === row[0].id} onSelect={onSelect} />}
              {row[1] && <Seat s={row[1]} selected={selected?.id === row[1].id} onSelect={onSelect} />}
            </div>
            <div style={st.aisle} />
            <div style={st.seatPair}>
              {row[2] && <Seat s={row[2]} selected={selected?.id === row[2].id} onSelect={onSelect} />}
              {row[3] && <Seat s={row[3]} selected={selected?.id === row[3].id} onSelect={onSelect} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Seat({ s, selected, onSelect }) {
  const color  = selected ? "#58A6FF" : s.etat === "disponible" ? "#56D364" : s.etat === "guichet" ? "#F0883E" : "#FF7B72";
  const cursor = s.etat === "disponible" ? "pointer" : "not-allowed";
  return (
    <div
      title={s.etat !== "disponible" ? `${s.passager ?? "Occupé"} (${s.etat})` : `Siège ${s.numero}`}
      onClick={() => onSelect(s)}
      style={{ ...st.seat, backgroundColor: color + "22", border: `2px solid ${color}`, cursor, color }}
    >
      {s.numero}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#C9D1D9" }}>
      <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: color }} />
      {label}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div style={{ backgroundColor: "#21262D", borderRadius: "8px", padding: "8px 14px" }}>
      <div style={{ fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: "700", color: "#E6EDF3", marginTop: "2px" }}>{value ?? "—"}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label style={st.label}>{label}</label>
      <input style={st.input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function BilletField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "10px", color: "#6E7681", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#E6EDF3", fontWeight: "600", marginTop: "2px" }}>{value ?? "—"}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = {
  page:         { minHeight: "100vh", backgroundColor: "#0D1117", fontFamily: "'Segoe UI', Arial, sans-serif" },
  main:         { maxWidth: "700px", margin: "0 auto", padding: "28px 20px 48px", display: "flex", flexDirection: "column", gap: "20px" },
  stepper:      { display: "flex", alignItems: "center", gap: 0 },
  stepItem:     { display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  stepDot:      { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 },
  stepLabel:    { fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" },
  stepLine:     { flex: 1, height: "2px" },
  card:         { backgroundColor: "#161B22", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
  cardTitle:    { fontSize: "16px", fontWeight: "700", color: "#E6EDF3", margin: "0 0 18px", paddingBottom: "12px", borderBottom: "1px solid #21262D" },
  label:        { display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px", marginTop: "14px", fontWeight: "600" },
  select:       { width: "100%", padding: "10px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "14px", fontFamily: "inherit" },
  input:        { width: "100%", padding: "10px 12px", backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "8px", color: "#E6EDF3", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" },
  btnPrimary:   { marginTop: "18px", padding: "11px 24px", backgroundColor: "#009A44", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { marginTop: "18px", padding: "11px 24px", backgroundColor: "transparent", color: "#8B949E", border: "1px solid #30363D", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnDownload:  { marginTop: "18px", padding: "11px 24px", backgroundColor: "#1B2A3B", color: "#58A6FF", border: "1px solid #58A6FF44", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  btnRow:       { display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap" },
  legend:       { display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px" },
  busBody:      { backgroundColor: "#161B22", border: "2px solid #30363D", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  busDriver:    { fontSize: "11px", color: "#6E7681", textAlign: "center", padding: "6px", borderBottom: "1px dashed #30363D", marginBottom: "4px" },
  busRow:       { display: "flex", alignItems: "center", gap: "8px" },
  seatPair:     { display: "flex", gap: "6px", flex: 1 },
  aisle:        { width: "20px" },
  seat:         { flex: 1, height: "36px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", userSelect: "none" },
  infoRow:      { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "6px" },
  formGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" },
  errorBanner:  { backgroundColor: "#2D1117", border: "1px solid #FF7B72", color: "#FF7B72", borderRadius: "8px", padding: "10px 16px", fontSize: "13px" },
  muted:        { color: "#6E7681", fontSize: "13px" },
  successIcon:  { width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#1B3A2D", border: "2px solid #56D364", color: "#56D364", fontSize: "24px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  billetBox:    { backgroundColor: "#0D1117", borderRadius: "10px", padding: "20px", border: "1px solid #21262D", marginTop: "12px" },
  billetHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #21262D" },
  billetNum:    { fontSize: "18px", fontWeight: "800", color: "#E6EDF3", fontFamily: "monospace" },
  billetMode:   { fontSize: "12px", color: "#56D364", backgroundColor: "#1B3A2D", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" },
  billetGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  statutBadge:  { display: "inline-block", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700", border: "1px solid" },
  paiementBox:  { backgroundColor: "#0D1117", borderRadius: "10px", padding: "16px", marginTop: "18px", border: "1px solid #30363D" },
  paiementTitle:{ fontSize: "12px", color: "#8B949E", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" },
  paiementOpts: { display: "flex", gap: "10px" },
  paiementOpt:  { flex: 1, display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", border: "2px solid #30363D", cursor: "pointer", color: "#8B949E", backgroundColor: "transparent", transition: "all 0.15s" },
  paiementOptActif: { borderColor: "#009A44", color: "#56D364", backgroundColor: "#0D1F17" },
};
