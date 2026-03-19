function SubHeader({ title }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    textAlign: "left",
    
  },
  title: {
    margin: 0,
    color: "#1f3c88",
  },
};

export default SubHeader;