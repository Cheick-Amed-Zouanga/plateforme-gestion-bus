import { useNavigate } from "react-router-dom";

function SubHeader({ title, backPath }) {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        {backPath && (
          <button style={styles.backBtn} onClick={() => navigate(backPath)}>
            ← Retour
          </button>
        )}
        <h2 style={styles.title}>{title}</h2>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#0D1117",
    padding: "14px 28px",
    borderBottom: "1px solid #21262D",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  backBtn: {
    background: "none",
    border: "1px solid #30363D",
    color: "#8B949E",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#E6EDF3",
  },
};

export default SubHeader;
