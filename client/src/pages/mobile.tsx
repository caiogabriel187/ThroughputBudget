import MobileApp from "../mobile/MobileApp";

export default function MobilePage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#f8fafc",
    }}>
      <div style={{
        flex: 1,
        maxWidth: 430,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        boxShadow: "0 0 40px rgba(0,0,0,0.15)",
        overflow: "hidden",
        minHeight: 0,
      }}>
        <MobileApp />
      </div>
    </div>
  );
}
