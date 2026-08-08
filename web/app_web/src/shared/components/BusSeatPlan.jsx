/** Plan de bus visuel : libre / payé / en attente. */

const ETAT_STYLE = {
  disponible: { color: "#26C2A1", label: "Libre" },
  paye: { color: "#304FFE", label: "Payé" },
  en_attente: { color: "#F0883E", label: "En attente de paiement" },
};

export function seatColor(etat, selected = false) {
  if (selected) return "#58A6FF";
  return ETAT_STYLE[etat]?.color ?? "#9CA3AF";
}

export function BusSeatPlan({
  plan = [],
  selected = null,
  onSelect,
  selectableOnlyLibre = true,
  showLegend = true,
  stats = null,
}) {
  if (!plan.length) {
    return <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Aucun siège trouvé.</p>;
  }

  const rows = [];
  for (let i = 0; i < plan.length; i += 4) rows.push(plan.slice(i, i + 4));

  function handleSelect(s) {
    if (!onSelect) return;
    if (selectableOnlyLibre && s.etat !== "disponible") return;
    onSelect(s);
  }

  return (
    <div>
      {showLegend && (
        <div style={st.legend}>
          <LegendDot color="#26C2A1" label="Libre" />
          <LegendDot color="#304FFE" label="Payé" />
          <LegendDot color="#F0883E" label="En attente" />
          {selected && <LegendDot color="#58A6FF" label={`Siège ${selected.numero}`} />}
        </div>
      )}

      {stats && (
        <div style={st.stats}>
          <span>{stats.disponibles ?? 0} libres</span>
          <span>·</span>
          <span>{stats.payes ?? 0} payés</span>
          <span>·</span>
          <span>{stats.en_attente ?? 0} en attente</span>
        </div>
      )}

      <div style={st.busWrap}>
        <div style={st.busBody}>
          <div style={st.busDriver}>Conducteur</div>
          {rows.map((row, ri) => (
            <div key={ri} style={st.busRow}>
              <div style={st.seatPair}>
                {row[0] && (
                  <Seat
                    s={row[0]}
                    selected={selected?.id === row[0].id}
                    onSelect={handleSelect}
                    selectableOnlyLibre={selectableOnlyLibre}
                  />
                )}
                {row[1] && (
                  <Seat
                    s={row[1]}
                    selected={selected?.id === row[1].id}
                    onSelect={handleSelect}
                    selectableOnlyLibre={selectableOnlyLibre}
                  />
                )}
              </div>
              <div style={st.aisle} />
              <div style={st.seatPair}>
                {row[2] && (
                  <Seat
                    s={row[2]}
                    selected={selected?.id === row[2].id}
                    onSelect={handleSelect}
                    selectableOnlyLibre={selectableOnlyLibre}
                  />
                )}
                {row[3] && (
                  <Seat
                    s={row[3]}
                    selected={selected?.id === row[3].id}
                    onSelect={handleSelect}
                    selectableOnlyLibre={selectableOnlyLibre}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Seat({ s, selected, onSelect, selectableOnlyLibre }) {
  const color = seatColor(s.etat, selected);
  const libre = s.etat === "disponible";
  const clickable = !selectableOnlyLibre || libre;
  const etatLabel = ETAT_STYLE[s.etat]?.label ?? s.etat;
  const tip = libre
    ? `Siège ${s.numero} — libre`
    : `Siège ${s.numero} — ${etatLabel}${s.passager ? ` · ${s.passager}` : ""}${s.segment ? ` · ${s.segment}` : ""}`;

  return (
    <button
      type="button"
      title={tip}
      onClick={() => onSelect?.(s)}
      disabled={!clickable}
      style={{
        ...st.seat,
        backgroundColor: `${color}22`,
        border: `2px solid ${color}`,
        color,
        cursor: clickable ? "pointer" : "not-allowed",
        opacity: clickable || !selectableOnlyLibre ? 1 : 0.95,
      }}
    >
      {s.numero}
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={st.legendItem}>
      <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      {label}
    </div>
  );
}

const st = {
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "12px",
    justifyContent: "center",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#6B7280",
    fontWeight: 600,
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#1A1348",
    fontWeight: 600,
    marginBottom: "14px",
  },
  busWrap: { maxWidth: 340, margin: "0 auto" },
  busBody: {
    background: "#F8FAFC",
    border: "1.5px solid #E5E7EB",
    borderRadius: 16,
    padding: "14px 16px 18px",
  },
  busDriver: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#6B7280",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px dashed #E5E7EB",
  },
  busRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  seatPair: { display: "flex", gap: 8 },
  aisle: { width: 28 },
  seat: {
    width: 44,
    height: 44,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default BusSeatPlan;
