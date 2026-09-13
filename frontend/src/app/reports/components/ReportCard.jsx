"use client";

import { FiTrendingUp } from "react-icons/fi";

export default function ReportCard({
  title,
  value,
  subtext,
  icon,
  type = "sales", // 'sales' | 'purchases' | 'inventory' | 'warning'
}) {
  return (
    <div className="reports-kpi-card">
      <div className="kpi-details">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
        {subtext && <span className="kpi-sub">{subtext}</span>}
      </div>
      <div className={`kpi-icon-wrapper ${type}`}>
        {icon || <FiTrendingUp size={20} />}
      </div>
    </div>
  );
}
