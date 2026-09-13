"use client";
import pos from "../pos.css";


export default function Cart({
  cart,

  removeItem,

  updateQuantity,
}) {
  return (
    <div className="border rounded p-4">
      <h2 className="text-xl font-bold mb-4">Cart</h2>

      {cart.length === 0 ? (
        <p>No products added</p>
      ) : (
        cart.map((item) => (
          <div key={item.id} className="border-b py-3">
            <h3>{item.name}</h3>

            <p>
              ₹{item.price}x {item.quantity}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => updateQuantity(item.id, "increase")}
                className="px-2 border"
              >
                +
              </button>

              <button
                onClick={() => updateQuantity(item.id, "decrease")}
                className="px-2 border"
              >
                -
              </button>

              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
