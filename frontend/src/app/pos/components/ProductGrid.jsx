"use client";

import { IconPlus } from "./icons";

export default function ProductGrid({ products = [], totalProducts = 0, addToCart, onAddToCart }) {
  const handleAddToCart = addToCart || onAddToCart;

  if (!products || products.length === 0) {
    return (
      <div className="pos-products-empty">
        <p>
          {totalProducts === 0
            ? "No products available. Add products to start selling."
            : "No products match the selected criteria."}
        </p>
      </div>
    );
  }

  return (
    <div className="pos-products-list-view">
      {products.map((product) => {
        const isOutOfStock = (product.stock ?? product.available ?? 0) <= 0;
        const isLowStock = (product.stock ?? product.available ?? 0) > 0 && (product.stock ?? product.available ?? 0) <= 10;

        return (
          <div
            key={product.id}
            className="pos-product-list-item"
            onClick={() => handleAddToCart && handleAddToCart(product)}
          >
            {/* Left: Thumbnail & Main Info */}
            <div className="pos-product-item-main">
              <div className="pos-product-item-thumb">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="pos-product-item-placeholder"
                  style={{ display: product.imageUrl ? "none" : "flex" }}
                >
                  {product.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
              </div>

              {/* Text Info */}
              <div className="pos-product-item-info">
                <div className="pos-product-item-title-row">
                  <h4 className="pos-product-item-title" title={product.name}>
                    {product.name}
                  </h4>
                  {product.brand && product.brand !== "Generic" && (
                    <span className="pos-product-brand-tag">
                      {product.brand}
                    </span>
                  )}
                  {product.category && (
                    <span className="pos-product-cat-tag">
                      {product.category}
                    </span>
                  )}
                </div>
                <div className="pos-product-item-meta">
                  <span>SKU: <strong>{product.sku || product.code || "N/A"}</strong></span>
                  {product.barcode && product.barcode !== product.sku && (
                    <span>Barcode: <strong>{product.barcode}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stock, Price & Add Action */}
            <div className="pos-product-item-actions">
              {/* Stock Status */}
              <div className="pos-product-item-stock-box">
                <span className={`pos-stock-badge ${isOutOfStock ? "out" : isLowStock ? "low" : "in"}`}>
                  {isOutOfStock ? "Out of Stock" : `${product.stock ?? 0} in stock`}
                </span>
              </div>

              {/* Price */}
              <div className="pos-product-item-price">
                ₹{Number(product.price).toFixed(2)}
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (handleAddToCart) handleAddToCart(product);
                }}
                className="pos-product-item-add-btn"
                title="Add to Cart"
                aria-label={`Add ${product.name} to cart`}
              >
                <IconPlus width={15} height={15} />
                <span>Add</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
