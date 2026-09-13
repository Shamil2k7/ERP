"use client";

import Link from "next/link";
import {
  FiMail,
  FiPhone,
  FiBriefcase,
  FiUser,
  FiEye,
  FiEdit,
} from "react-icons/fi";
import styles from "./EmployeeCard.module.css";

export default function EmployeeCard({ employee }) {
  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {employee.image ? (
            <img src={employee.image} alt={employee.name} />
          ) : (
            <FiUser size={32} />
          )}
        </div>

        <div>
          <h3>{employee.name}</h3>
          <p>{employee.employeeId}</p>
        </div>
      </div>

      {/* Status */}
      <div className={styles.statusWrapper}>
        <span
          className={`${styles.status} ${
            employee.status === "Active"
              ? styles.active
              : styles.inactive
          }`}
        >
          {employee.status}
        </span>
      </div>

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.item}>
          <FiMail />
          <span>{employee.email}</span>
        </div>

        <div className={styles.item}>
          <FiPhone />
          <span>{employee.phone}</span>
        </div>

        <div className={styles.item}>
          <FiBriefcase />
          <span>{employee.department}</span>
        </div>

        <div className={styles.item}>
          <strong>Role:</strong>
          <span>{employee.role}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.actions}>
        <Link
          href={`/dashboard/employees/${employee.id}`}
          className={styles.viewBtn}
        >
          <FiEye />
          View
        </Link>

        <Link
          href={`/dashboard/employees/${employee.id}/edit`}
          className={styles.editBtn}
        >
          <FiEdit />
          Edit
        </Link>
      </div>
    </div>
  );
}