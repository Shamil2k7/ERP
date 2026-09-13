"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditProductPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/products/view");
  }, [router]);

  return null;
}
