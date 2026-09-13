"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiUserCheck,
  FiShield,
  FiActivity,
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiLogIn,
  FiLogOut,
  FiInfo,
  FiX,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMail,
  FiPhone,
  FiArrowLeft,
  FiKey,
} from "react-icons/fi";
import { getAuditLogs } from "@/services/auditService";
import styles from "./auditLogs.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};

const getTimeAgo = (iso) => {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

// Timeline icon + colour per action
const ACTION_META = {
  LOGIN:    { icon: FiLogIn,      color: "#10b981", bg: "#d1fae5", label: "Logged In" },
  LOGOUT:   { icon: FiLogOut,     color: "#64748b", bg: "#f1f5f9", label: "Logged Out" },
  CREATE:   { icon: FiPlusCircle, color: "#6366f1", bg: "#ede9fe", label: "Created" },
  UPDATE:   { icon: FiEdit,       color: "#f59e0b", bg: "#fef3c7", label: "Updated" },
  DELETE:   { icon: FiTrash2,     color: "#ef4444", bg: "#fee2e2", label: "Deleted" },
  CHANGE_PASSWORD: { icon: FiKey, color: "#8b5cf6", bg: "#ede9fe", label: "Password Changed" },
};

const getActionMeta = (action) =>
  ACTION_META[(action || "").toUpperCase()] || {
    icon: FiInfo, color: "#64748b", bg: "#f1f5f9", label: action || "Event",
  };

// Group logs by calendar date
const groupByDate = (logs) => {
  const groups = {};
  logs.forEach((log) => {
    const key = formatDate(log.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return groups;
};

// Extract target employee name from a log entry
const getEmpName = (log) =>
  log.details?.fullName || log.details?.name || log.userName || "";

const getEmpEmail = (log) =>
  log.details?.email || log.userEmail || "";

const getEmpId = (log) =>
  log.details?.employeeId || log.entityId || "";

// Build a friendly one-line event label for the timeline
const getEventLabel = (log) => {
  const { label } = getActionMeta(log.action);
  const action = (log.action || "").toUpperCase();
  if (action === "LOGIN")  return `Logged in at ${formatTime(log.createdAt)}`;
  if (action === "LOGOUT") return `Logged out at ${formatTime(log.createdAt)}`;
  if (action === "CREATE") return `Account created at ${formatTime(log.createdAt)}`;
  if (action === "UPDATE") {
    const fields = log.details?.updatedFields;
    const fieldStr = Array.isArray(fields) && fields.length
      ? ` (${fields.join(", ")})`
      : "";
    return `Profile updated${fieldStr} at ${formatTime(log.createdAt)}`;
  }
  if (action === "DELETE") return `Account deleted at ${formatTime(log.createdAt)}`;
  if (action === "CHANGE_PASSWORD") return `Password changed at ${formatTime(log.createdAt)}`;
  return `${label} at ${formatTime(log.createdAt)}`;
};

// Badge for action type in the main table
const renderActionBadge = (action) => {
  const act = (action || "").toUpperCase();
  const cls = {
    CREATE: styles.badgeCreate,
    UPDATE: styles.badgeUpdate,
    DELETE: styles.badgeDelete,
    LOGIN:  styles.badgeLogin,
  }[act] || styles.badgeDefault;
  return <span className={`${styles.badge} ${cls}`}>{act}</span>;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Employee detail view — all logs for a specific searched employee
  const [employeeView, setEmployeeView] = useState(null); // { name, email, empId, logs[] }
  const [empLoading, setEmpLoading] = useState(false);

  // Single-log detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter, fetchTrigger]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search.trim())  params.search = search.trim();
      if (actionFilter)   params.action = actionFilter;
      if (entityFilter)   params.entity = entityFilter;
      const res = await getAuditLogs(params);
      if (res?.success) {
        setLogs(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch ALL logs for a specific employee (no pagination limit) to show full timeline
  const openEmployeeTimeline = async (empName, empEmail, empEmpId) => {
    setEmpLoading(true);
    setEmployeeView({ name: empName, email: empEmail, empId: empEmpId, logs: [] });
    try {
      // Search by name first, fall back to email
      const query = empName || empEmail || empEmpId;
      const res = await getAuditLogs({ search: query, limit: 200, page: 1 });
      if (res?.success) {
        // Filter to only logs that actually belong to this person
        const filtered = (res.data || []).filter((log) => {
          const name  = getEmpName(log).toLowerCase();
          const email = getEmpEmail(log).toLowerCase();
          const id    = getEmpId(log).toLowerCase();
          const q = query.toLowerCase();
          return name.includes(q) || email.includes(q) || id.includes(q);
        });
        setEmployeeView({ name: empName, email: empEmail, empId: empEmpId, logs: filtered });
      }
    } catch (e) {
      console.error("Failed to load employee activity:", e);
    } finally {
      setEmpLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch(""); setActionFilter(""); setEntityFilter(""); setPage(1);
    setFetchTrigger((t) => t + 1);
  };

  const handleRefresh = () => { setRefreshing(true); fetchLogs(); };

  // Stats
  const totalCount    = pagination.total || logs.length;
  const employeeCount = logs.filter((l) => (l.entity || "").toLowerCase() === "employee").length;
  const authCount     = logs.filter((l) => (l.entity || "").toLowerCase() === "auth").length;
  const todayCount    = logs.filter((l) => l.createdAt && new Date(l.createdAt).toDateString() === new Date().toDateString()).length;

  // ─── Employee Timeline View ──────────────────────────────────────────────
  if (employeeView) {
    const grouped = groupByDate(employeeView.logs);
    const initial = (employeeView.name || employeeView.email || "?").charAt(0).toUpperCase();

    return (
      <div className={styles.layout}>
        <div className={styles.container}>
          {/* Back button */}
          <button
            className={styles.backButton}
            onClick={() => setEmployeeView(null)}
          >
            <FiArrowLeft size={16} /> Back to All Audit Logs
          </button>

          {/* Employee Profile Header */}
          <div className={styles.empProfileCard}>
            <div className={styles.empAvatar}>{initial}</div>
            <div className={styles.empProfileInfo}>
              <h2 className={styles.empName}>{employeeView.name || "Unknown Employee"}</h2>
              {employeeView.email && (
                <div className={styles.empMeta}><FiMail size={14} /> {employeeView.email}</div>
              )}
              {employeeView.empId && (
                <div className={styles.empMeta}><FiUser size={14} /> Employee ID: <strong>{employeeView.empId}</strong></div>
              )}
            </div>
            <div className={styles.empStats}>
              <div className={styles.empStatBox}>
                <span className={styles.empStatVal}>{employeeView.logs.length}</span>
                <span className={styles.empStatLabel}>Total Activities</span>
              </div>
              <div className={styles.empStatBox}>
                <span className={styles.empStatVal}>
                  {employeeView.logs.filter((l) => l.action === "LOGIN").length}
                </span>
                <span className={styles.empStatLabel}>Logins</span>
              </div>
              <div className={styles.empStatBox}>
                <span className={styles.empStatVal}>
                  {employeeView.logs.filter((l) => l.action === "UPDATE").length}
                </span>
                <span className={styles.empStatLabel}>Updates</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {empLoading ? (
            <div className={styles.stateContainer}>
              <FiRefreshCw className={styles.spinning} size={32} />
              <p style={{ marginTop: 12 }}>Loading activity timeline...</p>
            </div>
          ) : employeeView.logs.length === 0 ? (
            <div className={styles.stateContainer}>
              <FiLayers size={40} />
              <h3>No activity found</h3>
              <p>No audit events were recorded for this employee.</p>
            </div>
          ) : (
            <div className={styles.timelineContainer}>
              {Object.entries(grouped).map(([dateLabel, dayLogs]) => (
                <div key={dateLabel} className={styles.timelineGroup}>
                  {/* Date separator */}
                  <div className={styles.timelineDateLabel}>{dateLabel}</div>

                  <div className={styles.timelineEvents}>
                    {dayLogs.map((log, idx) => {
                      const meta = getActionMeta(log.action);
                      const Icon = meta.icon;
                      const label = getEventLabel(log);
                      const updatedFields = log.details?.updatedFields;

                      return (
                        <div key={log.id || idx} className={styles.timelineItem}>
                          {/* Icon dot */}
                          <div
                            className={styles.timelineDot}
                            style={{ background: meta.bg, border: `2px solid ${meta.color}` }}
                          >
                            <Icon size={14} color={meta.color} />
                          </div>

                          {/* Content */}
                          <div className={styles.timelineContent}>
                            <div className={styles.timelineEventRow}>
                              <span className={styles.timelineEventLabel} style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              <span className={styles.timelineEventTime}>
                                {formatTime(log.createdAt)}
                              </span>
                            </div>

                            <div className={styles.timelineEventDesc}>{label}</div>

                            {/* Extra info for updates */}
                            {Array.isArray(updatedFields) && updatedFields.length > 0 && (
                              <div className={styles.timelineFields}>
                                Fields changed:{" "}
                                {updatedFields.map((f) => (
                                  <span key={f} className={styles.fieldTag}>{f}</span>
                                ))}
                              </div>
                            )}

                            {/* IP if available */}
                            {log.ipAddress && (
                              <div className={styles.timelineIp}>IP: {log.ipAddress}</div>
                            )}

                            {/* Performed by (for admin actions like create/delete) */}
                            {log.action !== "LOGIN" && log.userName && log.userName !== employeeView.name && (
                              <div className={styles.timelineBy}>
                                By: <strong>{log.userName}</strong>
                                {log.userEmail ? ` (${log.userEmail})` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main Audit Log Table ────────────────────────────────────────────────
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <FiClock className={styles.titleIcon} />
              Audit Logs & Activity History
            </h1>
            <p className={styles.subtitle}>
              Monitor real-time system events. Click on any employee row to see their full activity timeline.
            </p>
          </div>
          <button className={styles.refreshButton} onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? styles.spinning : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: FiActivity,  color: styles.indigo,  val: totalCount,    label: "Total Logs" },
            { icon: FiUserCheck, color: styles.emerald, val: employeeCount, label: "Employee Events" },
            { icon: FiShield,    color: styles.amber,   val: authCount,     label: "Auth Events" },
            { icon: FiClock,     color: styles.rose,    val: todayCount,    label: "Today" },
          ].map(({ icon: Icon, color, val, label }) => (
            <div key={label} className={styles.statCard}>
              <div className={`${styles.iconWrapper} ${color}`}><Icon /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{val}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filterCard}>
          <form className={styles.filterGrid} onSubmit={handleSearchSubmit}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search employee name, email, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className={styles.selectInput}>
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
            <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className={styles.selectInput}>
              <option value="">All Modules</option>
              <option value="Employee">Employee</option>
              <option value="Auth">Auth</option>
              <option value="Customer">Customer</option>
              <option value="Product">Product</option>
            </select>
            <button type="button" className={styles.resetButton} onClick={handleResetFilters}>Reset</button>
          </form>
        </div>

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.stateContainer}>
                <FiRefreshCw className={styles.spinning} size={32} />
                <p style={{ marginTop: 12 }}>Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className={styles.stateContainer}>
                <FiLayers size={40} />
                <h3>No audit logs found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Date & Time</th>
                    <th className={styles.th}>Employee</th>
                    <th className={styles.th}>Action</th>
                    <th className={styles.th}>Module</th>
                    <th className={styles.th}>Description</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const empName  = getEmpName(log);
                    const empEmail = getEmpEmail(log);
                    const empId    = getEmpId(log);
                    const initial  = (empName || empEmail || "?").charAt(0).toUpperCase();
                    const meta     = getActionMeta(log.action);
                    const Icon     = meta.icon;

                    return (
                      <tr key={log.id} className={styles.tr}>
                        <td className={styles.td}>
                          <div className={styles.timestampText}>
                            {formatDateTime(log.createdAt)}
                            <span className={styles.timeAgo}>({getTimeAgo(log.createdAt)})</span>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <div className={styles.userInfo}>
                            <div className={styles.avatar}>{initial}</div>
                            <div>
                              <div className={styles.userName}>{empName || "System"}</div>
                              {empEmail && <div className={styles.userEmail}>{empEmail}</div>}
                              {empId    && <div className={styles.userEmail}>ID: {empId}</div>}
                            </div>
                          </div>
                        </td>

                        <td className={styles.td}>{renderActionBadge(log.action)}</td>

                        <td className={styles.td}>
                          <span className={styles.entityTag}>{log.entity || "System"}</span>
                        </td>

                        <td className={styles.td}>
                          <div className={styles.descriptionText} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon size={13} color={meta.color} style={{ flexShrink: 0 }} />
                            {getEventLabel(log)}
                          </div>
                        </td>

                        <td className={styles.td} style={{ textAlign: "right" }}>
                          {(empName || empEmail) && (
                            <button
                              className={styles.detailsButton}
                              onClick={() => openEmployeeTimeline(empName, empEmail, empId)}
                            >
                              <FiActivity size={13} /> View Timeline
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className={styles.pagination}>
              <div>Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)</div>
              <div className={styles.pageControls}>
                <button className={styles.pageButton} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <FiChevronLeft /> Previous
                </button>
                <button className={styles.pageButton} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}>
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
