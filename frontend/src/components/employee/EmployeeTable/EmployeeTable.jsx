"use client";

import Link from "next/link";
import {
  FiEdit,
  FiEye,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

const employees = [
  {
    id: "EMP001",
    name: "Mohammed Afsal",
    email: "afsal@company.com",
    department: "IT",
    role: "Admin",
    phone: "+91 9876543210",
    status: "Active",
  },
  {
    id: "EMP002",
    name: "Rahul Kumar",
    email: "rahul@company.com",
    department: "Sales",
    role: "Manager",
    phone: "+91 9123456789",
    status: "Active",
  },
  {
    id: "EMP003",
    name: "Amina",
    email: "amina@company.com",
    department: "HR",
    role: "HR",
    phone: "+91 9988776655",
    status: "Inactive",
  },
];

export default function EmployeeTable() {
  return (
    <div className="employee-table-container">
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Employee ID</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
            <th>Phone</th>
            <th>Status</th>
            <th align="center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <div className="employee-info">
                  <div className="avatar">
                    <FiUser />
                  </div>

                  <span>{employee.name}</span>
                </div>
              </td>

              <td>{employee.id}</td>

              <td>{employee.email}</td>

              <td>{employee.department}</td>

              <td>{employee.role}</td>

              <td>{employee.phone}</td>

              <td>
                <span
                  className={
                    employee.status === "Active"
                      ? "status active"
                      : "status inactive"
                  }
                >
                  {employee.status}
                </span>
              </td>

              <td>
                <div className="actions">
                  <Link href={`/dashboard/employees/${employee.id}`}>
                    <FiEye />
                  </Link>

                  <Link href={`/dashboard/employees/${employee.id}/edit`}>
                    <FiEdit />
                  </Link>

                  <button>
                    <FiTrash2 />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}