"use client";

import { useState, useRef, useEffect } from "react";
import { FiDownload, FiFileText } from "react-icons/fi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function ExportButton({ data = [], columns = [], filename = "report" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleExportExcel = () => {
    setIsOpen(false);
    if (!data || data.length === 0) return;

    // Map data to custom headers
    const exportData = data.map((item) => {
      const row = {};
      columns.forEach((col) => {
        const val = item[col.key];
        row[col.header] = val !== undefined && val !== null ? val : "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
    
    // Auto-fit column widths
    const maxLens = columns.map(col => {
      let maxLen = col.header.length;
      exportData.forEach(row => {
        const val = String(row[col.header] || "");
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = maxLens;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExportPDF = () => {
    setIsOpen(false);
    if (!data || data.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4"); // Landscape layout fits more data
    
    // Add Report Header details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(filename.replace(/_/g, " ").toUpperCase(), 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);

    const tableHeaders = columns.map((col) => col.header);
    const tableRows = data.map((item) =>
      columns.map((col) => {
        const val = item[col.key];
        if (val === undefined || val === null) return "";
        
        // Format currencies
        if (col.isCurrency) {
          return `₹${Number(val).toFixed(2)}`;
        }
        
        // Format dates
        if (col.isDate) {
          return new Date(val).toLocaleDateString();
        }

        return String(val);
      })
    );

    doc.autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: 26,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 25, bottom: 15 },
    });

    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="export-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="btn-export-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!data || data.length === 0}
        style={{ opacity: (!data || data.length === 0) ? 0.6 : 1, cursor: (!data || data.length === 0) ? "not-allowed" : "pointer" }}
      >
        <FiDownload size={16} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="export-menu">
          <button type="button" className="export-menu-item" onClick={handleExportExcel}>
            <FiFileText size={14} color="#16a34a" />
            <span>Excel (.xlsx)</span>
          </button>
          <button type="button" className="export-menu-item" onClick={handleExportPDF}>
            <FiFileText size={14} color="#dc2626" />
            <span>PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
