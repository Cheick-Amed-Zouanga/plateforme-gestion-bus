function SubHeader({ title }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#0D1117",
    padding: "18px 28px",
    borderBottom: "1px solid #21262D",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#E6EDF3",
  },
};

export default SubHeader;
