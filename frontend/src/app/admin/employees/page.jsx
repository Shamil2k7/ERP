"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminEmployeesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/employees/view");
  }, [router]);

  return null;
}
