"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import "./pos.css";

import PosToolbar from "./components/PosToolbar";
import ProductGrid from "./components/ProductGrid";
import OrderPanel from "./components/OrderPanel";
import API_URL from "@/config/api";
import Swal from "sweetalert2";
import apiClient from "@/services/apiClient";
import { useAlert } from "@/context/AlertContext";
import PrintInvoice from "@/app/invoices/components/PrintInvoice";

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const activeTaxRate = taxes[0]?.rate ? Number(taxes[0].rate) : 10;

  const [activeTab, setActiveTab] = useState("Products");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [query, setQuery] = useState("");

  const [customer, setCustomer] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("Cash");
  const [cart, setCart] = useState([]);
  const [localHeldDrafts, setLocalHeldDrafts] = useState([]);

  useEffect(() => {
    if (customer === "" && selectedPayment === "Credit") {
      setSelectedPayment("Cash");
    }
  }, [customer, selectedPayment]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const items = JSON.parse(localStorage.getItem("pos_held_drafts") || "[]");
      setLocalHeldDrafts(items);
    }
  }, [activeTab]);

  // Fetch all POS dependencies from the database using authenticated apiClient
  const loadData = useCallback(async () => {
    try {
      const [prodRes, catRes, brandRes, custRes, taxRes, discRes] = await Promise.all([
        apiClient.get("/products").then((r) => r.data).catch(() => ({ success: false, data: [] })),
        apiClient.get("/categories").then((r) => r.data).catch(() => ({ success: false, data: [] })),
        apiClient.get("/brands").then((r) => r.data).catch(() => ({ success: false, data: [] })),
        apiClient.get("/customers").then((r) => r.data).catch(() => ({ success: false, data: [] })),
        apiClient.get("/taxes").then((r) => r.data).catch(() => ({ success: false, data: [] })),
        apiClient.get("/discounts").then((r) => r.data).catch(() => ({ success: false, data: [] })),
      ]);

      const rawProductList = Array.isArray(prodRes?.data) ? prodRes.data : Array.isArray(prodRes) ? prodRes : [];
      const rawCategoryList = Array.isArray(catRes?.data) ? catRes.data : Array.isArray(catRes) ? catRes : [];
      const rawBrandList = Array.isArray(brandRes?.data) ? brandRes.data : Array.isArray(brandRes) ? brandRes : (brandRes?.brands || []);
      const rawCustList = Array.isArray(custRes?.data) ? custRes.data : Array.isArray(custRes) ? custRes : [];
      const rawTaxList = Array.isArray(taxRes?.data) ? taxRes.data : Array.isArray(taxRes) ? taxRes : [];
      const rawDiscList = Array.isArray(discRes?.data) ? discRes.data : Array.isArray(discRes) ? discRes : [];

      setCategories(rawCategoryList);
      setBrands(rawBrandList);
      setCustomers(rawCustList);
      setTaxes(rawTaxList);
      setDiscounts(rawDiscList);

      if (rawProductList.length > 0) {
        const retailOnly = rawProductList.filter(
          (p) => p.productType !== "RAW_MATERIAL" && p.status !== "INACTIVE"
        );

        const mapped = retailOnly.map((p) => {
          const stockQty = (p.inventories && p.inventories.length > 0)
            ? p.inventories.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0)
            : (p.currentStock !== undefined && p.currentStock !== null
                ? Number(p.currentStock)
                : (p.stock !== undefined && p.stock !== null ? Number(p.stock) : Number(p.initialStock || 0)));

          const brandObj = p.brand || rawBrandList.find((b) => b.id === p.brandId);
          const brandName = typeof brandObj === "object" ? (brandObj?.name || brandObj?.brandName) : (brandObj || "");

          const categoryObj = p.category || rawCategoryList.find((c) => c.id === p.categoryId);
          const categoryName = typeof categoryObj === "object" ? (categoryObj?.name || categoryObj?.categoryName) : (categoryObj || "");

          return {
            id: p.id || p._id,
            _id: p.id || p._id,
            name: p.name,
            sku: p.sku || p.code || p.id,
            code: p.sku || p.code || p.id,
            barcode: p.barcode || p.sku || p.code || "",
            price: Number(p.sellingPrice) || 0,
            sellingPrice: Number(p.sellingPrice) || 0,
            costPrice: Number(p.costPrice) || 0,
            stock: stockQty,
            category: categoryName || "General",
            categoryId: p.categoryId || categoryObj?.id || null,
            brand: brandName || "Generic",
            brandId: p.brandId || brandObj?.id || null,
            imageUrl: p.image
              ? p.image.startsWith("http")
                ? p.image
                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.image.startsWith("/") ? "" : "/"}${p.image}`
              : "",
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Error loading POS dynamic data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoryNames = useMemo(() => {
    const fromApi = categories.map((c) => (typeof c === "object" ? c.name : c)).filter(Boolean);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const unique = Array.from(new Set([...fromApi, ...fromProducts])).filter((c) => c !== "All");
    return ["All", ...unique];
  }, [categories, products]);

  const brandNames = useMemo(() => {
    const fromApi = brands.map((b) => (typeof b === "object" ? (b.name || b.brandName) : b)).filter(Boolean);
    const fromProducts = products.map((p) => p.brand).filter((b) => Boolean(b) && b !== "Generic");
    const unique = Array.from(new Set([...fromApi, ...fromProducts])).filter((b) => b !== "All");
    return ["All", ...unique];
  }, [brands, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "All" ||
        p.category === activeCategory ||
        p.category?.toLowerCase() === activeCategory?.toLowerCase();
      const matchesBrand =
        selectedBrand === "All" ||
        p.brand === selectedBrand ||
        p.brand?.toLowerCase() === selectedBrand?.toLowerCase();
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q);
      return matchesCategory && matchesBrand && matchesQuery;
    });
  }, [products, activeCategory, selectedBrand, query]);

  const addToCart = (product) => {
    const available = Number(product.stock ?? 0);
    if (available <= 0) {
      Swal.fire({
        title: "Out of Stock",
        text: `"${product.name}" is currently out of stock (0 available).`,
        icon: "warning",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].qty;
        if (currentQty + 1 > available) {
          Swal.fire({
            title: "Stock Limit Reached",
            text: `Cannot add more than ${available} unit(s) of "${product.name}".`,
            icon: "warning",
            confirmButtonColor: "#f59e0b",
          });
          return prev;
        }
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartId: Date.now(),
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
          stock: available,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const addScannedBarcode = async (code) => {
    try {
      const res = await apiClient.get(`/barcodes/scan/${code}`).then((r) => r.data);
      
      if (res.success && res.data) {
        const p = res.data;
        const stockQty = (p.inventories && p.inventories.length > 0)
          ? p.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
          : (p.stock !== undefined && p.stock !== null ? Number(p.stock) : 100);

        const mapped = {
          id: p.id,
          name: p.name,
          sku: p.sku || p.id,
          code: p.sku || p.id,
          price: Number(p.sellingPrice) || 0,
          stock: stockQty,
          category: p.category?.name || "Others",
          brand: p.brand?.name || "Generic",
          imageUrl: p.image
            ? p.image.startsWith("http")
              ? p.image
              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.image.startsWith("/") ? "" : "/"}${p.image}`
            : "",
        };
        addToCart(mapped);
        return;
      }
    } catch (err) {
      console.warn("Barcode not found, checking products SKU locally/dynamically...", err.message);
    }

    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === code.toLowerCase()) ||
        (p.id && p.id.toLowerCase() === code.toLowerCase())
    );

    if (found) {
      addToCart(found);
      return;
    }

    try {
      const res = await apiClient.get("/products").then((r) => r.data);
      if (res.success && res.data) {
        const foundDb = res.data.find(
          (p) =>
            (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
            p.sku?.toLowerCase() === code.toLowerCase() ||
            p.id?.toLowerCase() === code.toLowerCase()
        );
        if (foundDb) {
          const p = foundDb;
          const stockQty = (p.inventories && p.inventories.length > 0)
            ? p.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
            : (p.stock !== undefined && p.stock !== null ? Number(p.stock) : 100);

          const mapped = {
            id: p.id,
            name: p.name,
            sku: p.sku || p.id,
            code: p.sku || p.id,
            price: Number(p.sellingPrice) || 0,
            stock: stockQty,
            category: p.category?.name || "Others",
            brand: p.brand?.name || "Generic",
            imageUrl: p.image
              ? p.image.startsWith("http")
                ? p.image
                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.image.startsWith("/") ? "" : "/"}${p.image}`
              : "",
          };
          addToCart(mapped);
          return;
        }
      }
    } catch (err) {
      console.error("Dynamic product lookup error:", err);
    }

    addToCart({
      id: `scanned-${Date.now()}`,
      name: `Scanned Item (${code})`,
      sku: code,
      price: 50.0,
      imageUrl: "",
    });
  };

  const removeItem = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, nextQty) => {
    if (nextQty <= 0) {
      removeItem(cartId);
      return;
    }
    const item = cart.find((i) => i.cartId === cartId);
    if (item && item.stock !== undefined && nextQty > item.stock) {
      Swal.fire({
        title: "Stock Limit Exceeded",
        text: `Cannot exceed available stock of ${item.stock} unit(s) for "${item.name}".`,
        icon: "warning",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, qty: nextQty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleAddCustomer = async ({ name, phone, email }) => {
    try {
      const res = await apiClient.post("/customers", {
        name,
        phone,
        email,
      }).then((r) => r.data);

      if (res.success) {
        setCustomers((prev) => [...prev, res.data]);
        setCustomer(res.data.id);
        Swal.fire({
          title: "Customer Added!",
          text: `Customer ${name} added successfully.`,
          icon: "success",
          confirmButtonColor: "#2563eb",
        });
      } else {
        Swal.fire({
          title: "Failed to Add",
          text: res.message || "Failed to add customer",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (err) {
      console.error("Error adding customer:", err);
      Swal.fire({
        title: "Error!",
        text: "Error adding customer: " + (err.response?.data?.message || err.message),
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const [recentSales, setRecentSales] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const items = JSON.parse(localStorage.getItem("pos_recent_sales") || "[]");
      setRecentSales(items);
    }
  }, [activeTab]);

  const saveRecentSaleLocally = (saleData) => {
    const existing = JSON.parse(localStorage.getItem("pos_recent_sales") || "[]");
    const updated = [saleData, ...existing];
    localStorage.setItem("pos_recent_sales", JSON.stringify(updated));
    setRecentSales(updated);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      Swal.fire({
        title: "Cart Empty!",
        text: "Please add products to cart before checkout.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // Pre-validate that all cart items have enough stock
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.id);
      if (prod && item.qty > (prod.stock ?? 0)) {
        Swal.fire({
          title: "Insufficient Stock",
          text: `Cannot sell ${item.qty} unit(s) of "${item.name}". Only ${prod.stock ?? 0} available in stock.`,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        return;
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxAmount = (subtotal - Number(discountValue)) * (activeTaxRate / 100);
    const totalAmount = subtotal;
    const netAmount = subtotal + taxAmount - Number(discountValue);

    const selectedCustObj = customers.find((c) => c.id === customer);
    const customerName = selectedCustObj ? selectedCustObj.name : "Walk-in Customer";

    const salePayload = {
      customerId: customer || null,
      orderNumber: `SO-${Date.now()}`,
      status: "COMPLETED",
      orderDate: new Date().toISOString(),
      totalAmount,
      taxAmount,
      discountAmount: Number(discountValue),
      netAmount,
      paymentMethod: selectedPayment,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
      })),
    };

    try {
      const res = await apiClient.post("/sales", salePayload).then((r) => r.data);
      if (res.success || res.id || res.data) {
        const orderData = res.data || res;
        const inventoryUpdates = orderData.inventoryUpdates || [];

        // 1. Immediately update products stock in local state
        if (inventoryUpdates.length > 0) {
          setProducts((prev) =>
            prev.map((p) => {
              const upd = inventoryUpdates.find((u) => u.productId === p.id);
              return upd ? { ...p, stock: upd.newQuantity } : p;
            })
          );
        }

        // 2. Re-fetch all dynamic product & inventory data from database
        loadData();

        const completedRecord = {
          id: orderData.id || `sale-${Date.now()}`,
          orderNumber: salePayload.orderNumber,
          customerName,
          totalAmount,
          taxAmount,
          netAmount,
          paymentMethod: selectedPayment,
          date: new Date().toLocaleString(),
          cart: [...cart],
        };
        saveRecentSaleLocally(completedRecord);

        // Build stock summary string for alert
        const stockSummary = inventoryUpdates
          .map((u) => `• ${u.productName}: ${u.previousQuantity} → ${u.newQuantity} in stock`)
          .join("<br/>");

        Swal.fire({
          title: "Sale Completed!",
          html: `<div>
            <p>Invoice <strong>#${salePayload.orderNumber}</strong> created successfully! Total: <strong>₹${netAmount.toFixed(2)}</strong></p>
            ${stockSummary ? `<div style="margin-top:10px; font-size:13px; color:#059669; text-align:left; background:#ecfdf5; padding:10px; border-radius:8px;"><strong>Inventory Updated:</strong><br/>${stockSummary}</div>` : ""}
          </div>`,
          icon: "success",
          confirmButtonColor: "#2563eb",
        });

        clearCart();
        setDiscountValue(0);
        setAmountReceived(0);
        setCustomer("");
      } else {
        Swal.fire({
          title: "Notice",
          text: res.message || "Sale could not be verified.",
          icon: "warning",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (err) {
      console.error("Error completing sale:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to process sale in database.";

      Swal.fire({
        title: "Sale Failed",
        text: errorMsg,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      // Do NOT clear cart so cashier can fix quantity or remove unavailable item
    }
  };

  const saveCartLocally = (type) => {
    if (cart.length === 0) {
      Swal.fire({
        title: "Cart Empty!",
        text: `Cannot ${type.toLowerCase()} an empty cart.`,
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxAmount = (subtotal - Number(discountValue)) * (activeTaxRate / 100);
    const totalAmount = subtotal;
    const netAmount = subtotal + taxAmount - Number(discountValue);

    const selectedCustObj = customers.find((c) => c.id === customer);
    const customerName = selectedCustObj ? selectedCustObj.name : "Walk-in Customer";

    const newEntry = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      orderNumber: `HOLD-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString(),
      customer,
      customerName,
      cart: [...cart],
      discountValue,
      amountReceived,
      selectedPayment,
      totalAmount,
      taxAmount,
      netAmount,
    };

    const existing = JSON.parse(localStorage.getItem("pos_held_drafts") || "[]");
    localStorage.setItem("pos_held_drafts", JSON.stringify([newEntry, ...existing]));
    setLocalHeldDrafts([newEntry, ...existing]);
    return true;
  };

  const handleHoldSale = async () => {
    const success = saveCartLocally("Hold");
    if (!success) return;

    Swal.fire({
      title: "Bill Held!",
      text: "Current bill has been placed on hold.",
      icon: "success",
      confirmButtonColor: "#2563eb",
    });
    clearCart();
    setDiscountValue(0);
    setAmountReceived(0);
    setCustomer("");
  };

  const handleSaveDraft = async () => {
    const success = saveCartLocally("Draft");
    if (!success) return;

    Swal.fire({
      title: "Draft Saved!",
      text: "Draft bill saved successfully.",
      icon: "success",
      confirmButtonColor: "#2563eb",
    });
    clearCart();
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) {
      Swal.fire({
        title: "Cart Empty!",
        text: "Please add products to cart before printing a receipt.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxAmount = (subtotal - Number(discountValue)) * (activeTaxRate / 100);
    const totalAmount = subtotal;
    const netAmount = subtotal + taxAmount - Number(discountValue);

    const selectedCustObj = customers.find((c) => c.id === customer);
    const customerName = selectedCustObj ? selectedCustObj.name : "Walk-in Customer";

    const completedRecord = {
      id: `active-sale-${Date.now()}`,
      orderNumber: `SO-ACTIVE-${Date.now()}`,
      customerName,
      totalAmount,
      taxAmount,
      discountAmount: Number(discountValue),
      netAmount,
      paymentMethod: selectedPayment,
      date: new Date().toLocaleString(),
      cart: [...cart],
    };

    setSelectedReceipt(completedRecord);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleRestoreDraft = (draft) => {
    setCart(draft.cart || []);
    setCustomer(draft.customer || "");
    setDiscountValue(draft.discountValue || 0);
    setAmountReceived(draft.amountReceived || 0);
    if (draft.selectedPayment) setSelectedPayment(draft.selectedPayment);

    const remaining = localHeldDrafts.filter((item) => item.id !== draft.id);
    localStorage.setItem("pos_held_drafts", JSON.stringify(remaining));
    setLocalHeldDrafts(remaining);
    setActiveTab("Products");

    Swal.fire({
      title: "Bill Resumed!",
      text: `Order ${draft.orderNumber} loaded back into active cart.`,
      icon: "info",
      confirmButtonColor: "#2563eb",
    });
  };

  const handleDeleteDraft = (draftId) => {
    const remaining = localHeldDrafts.filter((item) => item.id !== draftId);
    localStorage.setItem("pos_held_drafts", JSON.stringify(remaining));
    setLocalHeldDrafts(remaining);
  };

  return (
    <>
      <div className="pos-app-container no-print">
      <div className="pos-left-column pos-left-section">
        <PosToolbar
          query={query}
          onQueryChange={setQuery}
          selectedCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categories={categoryNames}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          brands={brandNames}
          onBarcodeScan={addScannedBarcode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onReset={() => {
            setQuery("");
            setActiveCategory("All");
            setSelectedBrand("All");
          }}
        />

        {activeTab === "Products" && (
          <ProductGrid
            products={filteredProducts}
            totalProducts={products.length}
            addToCart={addToCart}
            onAddToCart={addToCart}
          />
        )}

        {activeTab === "Recent" && (
          <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", margin: "10px 0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>Recent Completed Bills</h2>
            {recentSales.length === 0 ? (
              <p style={{ color: "#64748b", padding: "20px 0", textAlign: "center" }}>No recent completed sales transactions found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 12px" }}>Order #</th>
                      <th style={{ padding: "10px 12px" }}>Date</th>
                      <th style={{ padding: "10px 12px" }}>Customer</th>
                      <th style={{ padding: "10px 12px" }}>Payment</th>
                      <th style={{ padding: "10px 12px" }}>Total</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#2563eb" }}>{sale.orderNumber}</td>
                        <td style={{ padding: "12px", color: "#64748b" }}>{sale.date}</td>
                        <td style={{ padding: "12px", color: "#334155" }}>{sale.customerName}</td>
                        <td style={{ padding: "12px" }}><span style={{ padding: "4px 8px", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>{sale.paymentMethod || "Cash"}</span></td>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#059669" }}>₹{Number(sale.netAmount || sale.totalAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(sale)}
                            style={{ padding: "6px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginRight: "6px" }}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "Drafts & Holds" && (
          <div style={{ padding: "20px", background: "#fff", borderRadius: "12px", margin: "10px 0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", color: "#1e293b" }}>Held Bills & Saved Drafts</h2>
            {localHeldDrafts.length === 0 ? (
              <p style={{ color: "#64748b", padding: "20px 0", textAlign: "center" }}>No held bills or saved drafts currently active.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 12px" }}>Hold #</th>
                      <th style={{ padding: "10px 12px" }}>Date</th>
                      <th style={{ padding: "10px 12px" }}>Customer</th>
                      <th style={{ padding: "10px 12px" }}>Items</th>
                      <th style={{ padding: "10px 12px" }}>Total Amount</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localHeldDrafts.map((draft) => (
                      <tr key={draft.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#d97706" }}>{draft.orderNumber}</td>
                        <td style={{ padding: "12px", color: "#64748b" }}>{draft.date}</td>
                        <td style={{ padding: "12px", color: "#334155" }}>{draft.customerName}</td>
                        <td style={{ padding: "12px", color: "#475569" }}>{draft.cart?.reduce((acc, i) => acc + i.qty, 0) || 0} Items</td>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#059669" }}>₹{Number(draft.netAmount || draft.totalAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleRestoreDraft(draft)}
                            style={{ padding: "6px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginRight: "6px" }}
                          >
                            Resume Bill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pos-right-column pos-right-section">
        <OrderPanel
          cart={cart}
          customers={customers}
          customer={customer}
          setCustomer={setCustomer}
          onCustomerChange={setCustomer}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          onDiscountChange={setDiscountValue}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          onAmountReceivedChange={setAmountReceived}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          onSelectPayment={setSelectedPayment}
          activeTaxRate={activeTaxRate}
          taxRate={activeTaxRate}
          updateQuantity={updateQuantity}
          onUpdateQty={updateQuantity}
          removeItem={removeItem}
          onRemoveItem={removeItem}
          clearCart={clearCart}
          onClearCart={clearCart}
          onAddCustomer={handleAddCustomer}
          onCompleteSale={handleCompleteSale}
          onHoldSale={handleHoldSale}
          onSaveDraft={handleSaveDraft}
          onPrintReceipt={handlePrintReceipt}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          heldDrafts={localHeldDrafts}
          onRestoreDraft={handleRestoreDraft}
          onDeleteDraft={handleDeleteDraft}
        />
      </div>

      {selectedReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} className="no-print">
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", maxWidth: "420px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ textAlign: "center", fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>RECEIPT INVOICE</h3>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: "12px", marginBottom: "16px" }}>{selectedReceipt.orderNumber} - {selectedReceipt.date}</p>
            <div style={{ borderTop: "1px dashed #cbd5e1", borderBottom: "1px dashed #cbd5e1", padding: "12px 0", margin: "12px 0" }}>
              {selectedReceipt.cart?.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span>{item.name} x {item.qty}</span>
                  <span style={{ fontWeight: "600" }}>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", margin: "12px 0", color: "#059669" }}>
              <span>Total Paid:</span>
              <span>₹{Number(selectedReceipt.netAmount || selectedReceipt.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button type="button" onClick={() => window.print()} style={{ flex: 1, padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Print Receipt</button>
              <button type="button" onClick={() => setSelectedReceipt(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Close</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {selectedReceipt && (
        <PrintInvoice
          invoice={{
            invoiceNo: selectedReceipt.orderNumber,
            customer: selectedReceipt.customerName,
            cashier: "Admin",
            date: selectedReceipt.date,
            paymentMethod: selectedReceipt.paymentMethod,
            subTotal: selectedReceipt.totalAmount,
            discount: selectedReceipt.discountAmount || 0,
            tax: selectedReceipt.taxAmount || 0,
            total: selectedReceipt.netAmount,
            items: selectedReceipt.cart?.map(item => ({
              productName: item.name,
              quantity: item.qty,
              unitPrice: item.price,
              totalPrice: item.qty * item.price,
            })) || [],
          }}
        />
      )}
    </>
  );
}
