import { cardStyle } from "../../styles/constants";

export default function MetricCard({ title, value, subtitle, color, icon }) {
  return (
    <div style={{
      ...cardStyle,
      padding: 20,
      textAlign: "center",
      borderTop: `4px solid ${color}`
    }}>
      <div style={{
        fontSize: 24,
        marginBottom: 8
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 8
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: color,
        marginBottom: 4
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 11,
          color: "#999",
          marginTop: 4
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}


