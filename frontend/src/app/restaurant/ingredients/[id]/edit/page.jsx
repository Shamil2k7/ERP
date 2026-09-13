"use client";

import { use } from "react";
import RestaurantIngredientEdit from "@/components/restaurant/RestaurantIngredientEdit";

export default function RestaurantIngredientEditRoutePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  return <RestaurantIngredientEdit ingredientId={id} />;
}
