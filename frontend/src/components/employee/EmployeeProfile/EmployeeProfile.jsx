"use client";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import styles from "./EmployeeProfile.module.css";

export default function EmployeeProfile() {
  const employee = {
    id: "EMP001",
    name: "Mohammed Afsal",
    email: "afsal@company.com",
    phone: "+91 9876543210",
    department: "IT",
    designation: "Full Stack Developer",
    role: "Admin",
    salary: "₹50,000",
    joiningDate: "01 Jan 2026",
    address: "Kozhikode, Kerala",
    status: "Active",
    image: "",
  };

  return (
    <div className={styles.container}>
      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {employee.image ? (
            <img src={employee.image} alt={employee.name} />
          ) : (
            <FiUser size={45} />
          )}
        </div>

        <h2>{employee.name}</h2>
        <p>{employee.designation}</p>

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

      {/* Details Card */}
      <div className={styles.detailsCard}>
        <h3>Employee Details</h3>

        <div className={styles.grid}>
          <div className={styles.item}>
            <FiBriefcase />
            <div>
              <label>Employee ID</label>
              <span>{employee.id}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiMail />
            <div>
              <label>Email</label>
              <span>{employee.email}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiPhone />
            <div>
              <label>Phone</label>
              <span>{employee.phone}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiBriefcase />
            <div>
              <label>Department</label>
              <span>{employee.department}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiShield />
            <div>
              <label>Role</label>
              <span>{employee.role}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiDollarSign />
            <div>
              <label>Salary</label>
              <span>{employee.salary}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiCalendar />
            <div>
              <label>Joining Date</label>
              <span>{employee.joiningDate}</span>
            </div>
          </div>

          <div className={styles.item}>
            <FiMapPin />
            <div>
              <label>Address</label>
              <span>{employee.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}