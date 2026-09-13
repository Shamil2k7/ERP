"use client";

import RestaurantRoleGuard from "@/components/restaurant/RestaurantRoleGuard";

export default function RestaurantLayout({ children }) {
  return <RestaurantRoleGuard>{children}</RestaurantRoleGuard>;
}
