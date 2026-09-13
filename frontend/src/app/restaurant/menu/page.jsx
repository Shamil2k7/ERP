"use client";

import { useState, useEffect } from "react";
import { restaurantService } from "@/services/restaurantService";
import { getProducts } from "@/services/productService";
import { FiPlus, FiEdit, FiTrash2, FiBox, FiPackage, FiLayers, FiDollarSign, FiCheck } from "react-icons/fi";
import { showSuccess, showError, showWarning, showConfirm } from "@/utils/swal";

export default function RestaurantMenuPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories"); // categories | items | recipes | modifiers

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);

  // Category State
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  // Menu Item State
  const [menuItems, setMenuItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    categoryId: "",
    sellingPrice: "",
    description: "",
  });

  // Recipe BOM State
  const [selectedMenuItemForRecipe, setSelectedMenuItemForRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  // Modifiers State
  const [modifierGroups, setModifierGroups] = useState([]);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierGroupForm, setModifierGroupForm] = useState({
    name: "",
    modifiers: [{ name: "", price: 0 }],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [restRes, prodRes] = await Promise.all([
        restaurantService.getRestaurants(),
        getProducts({ type: "RAW_MATERIAL" }),
      ]);

      const restList = restRes.data || [];
      setRestaurants(restList);
      if (restList.length > 0) {
        setSelectedRestaurantId(restList[0].id);
      }

      setRawMaterials(prodRes.data || prodRes || []);
    } catch (err) {
      console.error("Error loading menu page initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [selectedRestaurantId, activeTab]);

  const loadTabData = async () => {
    const outletParam = selectedRestaurantId && selectedRestaurantId !== "ALL" ? selectedRestaurantId : undefined;
    try {
      if (activeTab === "categories") {
        const res = await restaurantService.getMenuCategories(outletParam);
        setCategories(res.data || []);
      } else if (activeTab === "items" || activeTab === "recipes") {
        const [itemRes, catRes] = await Promise.all([
          restaurantService.getMenuItems(outletParam),
          restaurantService.getMenuCategories(outletParam),
        ]);
        setMenuItems(itemRes.data || []);
        setCategories(catRes.data || []);
      } else if (activeTab === "modifiers") {
        const res = await restaurantService.getModifierGroups(outletParam);
        setModifierGroups(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching tab data:", err);
    }
  };

  // Category Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showWarning("Name Required", "Please enter a category name.");
      return;
    }
    try {
      await restaurantService.createMenuCategory({
        name: categoryName,
        restaurantId: selectedRestaurantId,
      });
      setCategoryName("");
      setShowCategoryModal(false);
      loadTabData();
      showSuccess("Category Created", "Menu category created successfully!");
    } catch (err) {
      showError("Failed", err.message);
    }
  };
  const handleCreateCategory = handleSaveCategory;

  const handleDeleteCategory = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Category?",
      text: "Are you sure you want to delete this menu category?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.deleteMenuCategory(id);
      loadTabData();
      showSuccess("Deleted", "Category deleted successfully!");
    } catch (err) { showError("Delete Failed", err.response?.data?.message || err.message); }
  };

  // Item Handlers
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", itemForm.name);
      formData.append("categoryId", itemForm.categoryId);
      formData.append("sellingPrice", itemForm.sellingPrice);
      formData.append("description", itemForm.description || "");
      formData.append("restaurantId", selectedRestaurantId);

      await restaurantService.createMenuItem(formData);
      setShowItemModal(false);
      setItemForm({ name: "", categoryId: "", sellingPrice: "", description: "" });
      loadTabData();
      showSuccess("Item Created", "Menu item created successfully!");
    } catch (err) { showError("Failed", err.message); }
  };

  const handleDeleteMenuItem = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Item?",
      text: "Are you sure you want to delete this menu item?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.deleteMenuItem(id);
      loadTabData();
      showSuccess("Deleted", "Menu item deleted successfully!");
    } catch (err) { showError("Delete Failed", err.response?.data?.message || err.message); }
  };

  // Recipe BOM Handlers
  const handleOpenRecipeBuilder = (item) => {
    setSelectedMenuItemForRecipe(item);
    if (item.recipe && item.recipe.ingredients) {
      setRecipeIngredients(
        item.recipe.ingredients.map((ing) => ({
          productId: ing.productId,
          quantity: ing.quantity,
          unit: ing.unit || "g",
        }))
      );
    } else {
      setRecipeIngredients([]);
    }
  };

  const handleAddIngredientRow = () => {
    if (rawMaterials.length === 0) {
      showWarning("Raw Materials Missing", "No raw materials found in Product inventory. Add raw material products first.");
      return;
    }
    setRecipeIngredients([
      ...recipeIngredients,
      { productId: rawMaterials[0]?.id, quantity: 1, unit: rawMaterials[0]?.unit?.name || "g" },
    ]);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuItemForRecipe) return;
    try {
      await restaurantService.saveRecipe(selectedMenuItemForRecipe.id, {
        ingredients: recipeIngredients,
      });
      showSuccess("Recipe Saved", "Recipe / BOM saved successfully!");
      setSelectedMenuItemForRecipe(null);
      loadTabData();
    } catch (err) { showError("Failed", err.message); }
  };

  const handleDeleteRecipe = async (recipeId) => {
    const isConfirmed = await showConfirm({
      title: "Delete Recipe?",
      text: "Are you sure you want to delete this recipe BOM?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      if (recipeId) {
        await restaurantService.deleteRecipe(recipeId);
      }
      setRecipeIngredients([]);
      setSelectedMenuItemForRecipe(null);
      loadTabData();
      showSuccess("Deleted", "Recipe deleted successfully!");
    } catch (err) { showError("Delete Failed", err.response?.data?.message || err.message); }
  };

  // Modifier Handlers
  const handleSaveModifierGroup = async (e) => {
    e.preventDefault();
    try {
      await restaurantService.createModifierGroup({
        name: modifierGroupForm.name,
        restaurantId: selectedRestaurantId,
        modifiers: modifierGroupForm.modifiers,
      });
      setShowModifierModal(false);
      setModifierGroupForm({ name: "", modifiers: [{ name: "", price: 0 }] });
      loadTabData();
      showSuccess("Group Created", "Modifier group created successfully!");
    } catch (err) { showError("Failed", err.message); }
  };

  const handleDeleteModifierGroup = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Modifier Group?",
      text: "Are you sure you want to delete this modifier group?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.deleteModifierGroup(id);
      loadTabData();
      showSuccess("Deleted", "Modifier group deleted successfully!");
    } catch (err) { showError("Delete Failed", err.response?.data?.message || err.message); }
  };

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Menu & Recipes...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Menu & Recipe Engineering</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage categories, dishes, and ingredients BOM.</p>
        </div>

        {restaurants.length > 0 && (
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
          >
            {restaurants.length > 1 && <option value="ALL">All Outlets</option>}
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs Bar */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
        {[
          { key: "categories", label: "Menu Categories", icon: FiBox },
          { key: "items", label: "Menu Items / Dishes", icon: FiPackage },
          { key: "recipes", label: "Recipes / BOM Builder", icon: FiLayers },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "none",
                background: "none",
                fontSize: "15px",
                fontWeight: "700",
                color: active ? "#2563eb" : "#64748b",
                borderBottom: active ? "3px solid #2563eb" : "3px solid transparent",
                cursor: "pointer",
                marginBottom: "-2px",
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATEGORIES */}
      {activeTab === "categories" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Categories</h3>
            <button onClick={() => setShowCategoryModal(true)} style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
              + Add Category
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
            {categories.map((c) => (
              <div key={c.id} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #3b82f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{c.name}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{c.menuItems?.length || 0} menu items</p>
                </div>
                <button onClick={() => handleDeleteCategory(c.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }} title="Delete Category">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MENU ITEMS */}
      {activeTab === "items" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Menu Items / Dishes</h3>
            <button
              onClick={() => {
                if (categories.length === 0) { showWarning("Category Required", "Please create a menu category first."); return; }
                setItemForm({ ...itemForm, categoryId: categories[0]?.id });
                setShowItemModal(true);
              }}
              style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
            >
              + Add Menu Item
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {menuItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "6px" }}>
                      {item.category?.name}
                    </span>
                    <h4 style={{ margin: "8px 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{item.name}</h4>
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#059669" }}>
                    ₹{parseFloat(item.sellingPrice).toFixed(2)}
                  </span>
                </div>

                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                  <span>Recipe Cost: ₹{parseFloat(item.costPrice || 0).toFixed(2)}</span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button onClick={() => handleDeleteMenuItem(item.id)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }} title="Delete Item">
                      <FiTrash2 size={14} />
                    </button>
                    <button onClick={() => handleOpenRecipeBuilder(item)} style={{ padding: "4px 10px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                      {item.recipe ? "Edit Recipe" : "+ Add Recipe"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECIPES / BOM */}
      {activeTab === "recipes" && (
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
            Bill of Materials (BOM) / Recipe Builder
          </h3>

          {selectedMenuItemForRecipe ? (
            <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: "800px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h4 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                    Recipe for: {selectedMenuItemForRecipe.name}
                  </h4>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    Specify exact raw material ingredient quantities consumed per portion.
                  </p>
                </div>
                {selectedMenuItemForRecipe.recipe?.id && (
                  <button onClick={() => handleDeleteRecipe(selectedMenuItemForRecipe.recipe.id)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiTrash2 size={14} /> Delete Recipe
                  </button>
                )}
              </div>

              {recipeIngredients.map((ing, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                  <select
                    value={ing.productId}
                    onChange={(e) => {
                      const list = [...recipeIngredients];
                      list[idx].productId = e.target.value;
                      setRecipeIngredients(list);
                    }}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    {rawMaterials.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} (Cost: ₹{parseFloat(rm.costPrice || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.001"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const list = [...recipeIngredients];
                      list[idx].quantity = e.target.value;
                      setRecipeIngredients(list);
                    }}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />

                  <input
                    type="text"
                    placeholder="Unit (g, ml, kg)"
                    value={ing.unit}
                    onChange={(e) => {
                      const list = [...recipeIngredients];
                      list[idx].unit = e.target.value;
                      setRecipeIngredients(list);
                    }}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />

                  <button
                    onClick={() => {
                      setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
                    }}
                    style={{ padding: "8px", color: "#ef4444", border: "none", background: "none", cursor: "pointer" }}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button onClick={handleAddIngredientRow} style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                  + Add Ingredient Line
                </button>
                <button onClick={handleSaveRecipe} style={{ padding: "8px 20px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
                  Save Recipe & Recalculate Cost
                </button>
                <button onClick={() => setSelectedMenuItemForRecipe(null)} style={{ padding: "8px 16px", backgroundColor: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px" }}>
              <p style={{ color: "#64748b" }}>Select a menu item below to construct its recipe BOM:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginTop: "16px" }}>
                {menuItems.map((item) => (
                  <div key={item.id} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{item.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {item.recipe ? `${item.recipe.ingredients?.length} Ingredients` : "No Recipe Yet"}
                      </div>
                    </div>
                    <button onClick={() => handleOpenRecipeBuilder(item)} style={{ padding: "6px 12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      Build Recipe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontWeight: "700" }}>Create Menu Category</h3>
            <form onSubmit={handleSaveCategory}>
              <input
                type="text"
                placeholder="e.g. Biryani, Starters, Drinks"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "20px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#fff" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontWeight: "700" }}>Add Menu Item</h3>
            <form onSubmit={handleSaveMenuItem}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Biryani"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Category</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="180.00"
                  value={itemForm.sellingPrice}
                  onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#fff" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
