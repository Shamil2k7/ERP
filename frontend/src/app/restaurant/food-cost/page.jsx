"use client";

import { useState, useEffect } from "react";
import { restaurantService } from "@/services/restaurantService";
import { FiTrendingUp, FiPieChart, FiDollarSign } from "react-icons/fi";

export default function FoodCostingPage() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [foodCostData, setFoodCostData] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchFoodCostReport();
    }
  }, [selectedRestaurantId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
      if (list.length > 0) setSelectedRestaurantId(list[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodCostReport = async () => {
    try {
      const res = await restaurantService.getFoodCostReport(selectedRestaurantId);
      setFoodCostData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const avgFoodCostPct =
    foodCostData.length > 0
      ? (foodCostData.reduce((sum, i) => sum + (i.foodCostPercentage || 0), 0) / foodCostData.length).toFixed(1)
      : 0;

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Food Cost Analytics...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Food Costing & Margin Analysis</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Calculate recipe ingredient cost vs menu selling price & gross profit margin.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Total Dishes Analyzed</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", marginTop: "8px" }}>{foodCostData.length}</div>
        </div>

        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #10b981" }}>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Avg Food Cost %</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981", marginTop: "8px" }}>{avgFoodCostPct}%</div>
        </div>
      </div>

      {/* Food Cost Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {foodCostData.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            <FiTrendingUp size={48} />
            <h3 style={{ marginTop: "16px", color: "#334155" }}>No Menu Items Found</h3>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "13px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Menu Item / Dish</th>
                <th style={{ padding: "14px 20px" }}>Category</th>
                <th style={{ padding: "14px 20px" }}>Selling Price</th>
                <th style={{ padding: "14px 20px" }}>Recipe Cost</th>
                <th style={{ padding: "14px 20px" }}>Gross Margin</th>
                <th style={{ padding: "14px 20px" }}>Food Cost %</th>
              </tr>
            </thead>
            <tbody>
              {foodCostData.map((item) => {
                const costPct = item.foodCostPercentage || 0;
                const badgeBg = costPct < 30 ? "#d1fae5" : costPct <= 45 ? "#fef3c7" : "#fee2e2";
                const badgeColor = costPct < 30 ? "#065f46" : costPct <= 45 ? "#92400e" : "#991b1b";

                return (
                  <tr key={item.menuItemId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                      {item.name}
                      {!item.hasRecipe && <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>(No BOM recipe created)</span>}
                    </td>
                    <td style={{ padding: "16px 20px", color: "#64748b" }}>{item.categoryName}</td>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>₹{parseFloat(item.sellingPrice).toFixed(2)}</td>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#ef4444" }}>₹{parseFloat(item.recipeCost).toFixed(2)}</td>
                    <td style={{ padding: "16px 20px", fontWeight: "800", color: "#059669" }}>₹{parseFloat(item.grossMargin).toFixed(2)}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", backgroundColor: badgeBg, color: badgeColor }}>
                        {costPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
