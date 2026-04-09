import { Link } from "wouter";
import MobileApp from "../mobile/MobileApp";

export default function MobilePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        backgroundColor: "#1e293b",
        borderBottom: "1px solid #334155",
      }}>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>
          Versão Mobile (React Native Web)
        </span>
        <Link href="/" style={{
          color: "#60a5fa",
          fontSize: 13,
          textDecoration: "none",
          fontWeight: 600,
        }}>
          ← Versão Web
        </Link>
      </div>
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
