/**
 * Unit Converter Utility for Restaurant ERP and Inventory Management
 * 
 * Provides robust unit normalization and cross-unit conversions for:
 * - Mass: g, kg, mg, oz, lb
 * - Volume: ml, l, cl, cup, tbsp, tsp
 * - Count / Pieces: pcs, pc, piece, pieces, unit, units, nos, item, items, packet, etc.
 */

// Dimension base factors (Mass base: g, Volume base: ml, Count base: pcs)
const UNIT_FACTORS = {
  // Mass (base unit: g)
  g: { dimension: "mass", factor: 1, label: "g" },
  gram: { dimension: "mass", factor: 1, label: "g" },
  grams: { dimension: "mass", factor: 1, label: "g" },
  gm: { dimension: "mass", factor: 1, label: "g" },
  gms: { dimension: "mass", factor: 1, label: "g" },
  kg: { dimension: "mass", factor: 1000, label: "kg" },
  kilogram: { dimension: "mass", factor: 1000, label: "kg" },
  kilograms: { dimension: "mass", factor: 1000, label: "kg" },
  kgs: { dimension: "mass", factor: 1000, label: "kg" },
  mg: { dimension: "mass", factor: 0.001, label: "mg" },
  milligram: { dimension: "mass", factor: 0.001, label: "mg" },
  milligrams: { dimension: "mass", factor: 0.001, label: "mg" },
  oz: { dimension: "mass", factor: 28.3495, label: "oz" },
  ounce: { dimension: "mass", factor: 28.3495, label: "oz" },
  ounces: { dimension: "mass", factor: 28.3495, label: "oz" },
  lb: { dimension: "mass", factor: 453.592, label: "lb" },
  lbs: { dimension: "mass", factor: 453.592, label: "lb" },
  pound: { dimension: "mass", factor: 453.592, label: "lb" },
  pounds: { dimension: "mass", factor: 453.592, label: "lb" },

  // Volume (base unit: ml)
  ml: { dimension: "volume", factor: 1, label: "ml" },
  milliliter: { dimension: "volume", factor: 1, label: "ml" },
  milliliters: { dimension: "volume", factor: 1, label: "ml" },
  "milli-liter": { dimension: "volume", factor: 1, label: "ml" },
  millilitre: { dimension: "volume", factor: 1, label: "ml" },
  millilitres: { dimension: "volume", factor: 1, label: "ml" },
  l: { dimension: "volume", factor: 1000, label: "L" },
  liter: { dimension: "volume", factor: 1000, label: "L" },
  liters: { dimension: "volume", factor: 1000, label: "L" },
  litre: { dimension: "volume", factor: 1000, label: "L" },
  litres: { dimension: "volume", factor: 1000, label: "L" },
  ltr: { dimension: "volume", factor: 1000, label: "L" },
  ltrs: { dimension: "volume", factor: 1000, label: "L" },
  cl: { dimension: "volume", factor: 10, label: "cl" },
  centiliter: { dimension: "volume", factor: 10, label: "cl" },
  centiliters: { dimension: "volume", factor: 10, label: "cl" },
  cup: { dimension: "volume", factor: 240, label: "cup" },
  cups: { dimension: "volume", factor: 240, label: "cup" },
  tbsp: { dimension: "volume", factor: 15, label: "tbsp" },
  tablespoon: { dimension: "volume", factor: 15, label: "tbsp" },
  tablespoons: { dimension: "volume", factor: 15, label: "tbsp" },
  tsp: { dimension: "volume", factor: 5, label: "tsp" },
  teaspoon: { dimension: "volume", factor: 5, label: "tsp" },
  teaspoons: { dimension: "volume", factor: 5, label: "tsp" },

  // Count / Discrete (base unit: pcs)
  pcs: { dimension: "count", factor: 1, label: "pcs" },
  pc: { dimension: "count", factor: 1, label: "pcs" },
  piece: { dimension: "count", factor: 1, label: "pcs" },
  pieces: { dimension: "count", factor: 1, label: "pcs" },
  unit: { dimension: "count", factor: 1, label: "pcs" },
  units: { dimension: "count", factor: 1, label: "pcs" },
  nos: { dimension: "count", factor: 1, label: "pcs" },
  no: { dimension: "count", factor: 1, label: "pcs" },
  item: { dimension: "count", factor: 1, label: "pcs" },
  items: { dimension: "count", factor: 1, label: "pcs" },
  can: { dimension: "count", factor: 1, label: "can" },
  cans: { dimension: "count", factor: 1, label: "can" },
  bottle: { dimension: "count", factor: 1, label: "bottle" },
  bottles: { dimension: "count", factor: 1, label: "bottle" },
  packet: { dimension: "count", factor: 1, label: "packet" },
  packets: { dimension: "count", factor: 1, label: "packet" },
  pack: { dimension: "count", factor: 1, label: "pack" },
  packs: { dimension: "count", factor: 1, label: "pack" },
  box: { dimension: "count", factor: 1, label: "box" },
  boxes: { dimension: "count", factor: 1, label: "box" },
  slice: { dimension: "count", factor: 1, label: "slice" },
  slices: { dimension: "count", factor: 1, label: "slice" },
  portion: { dimension: "count", factor: 1, label: "portion" },
  portions: { dimension: "count", factor: 1, label: "portion" },
};

/**
 * Normalizes a unit string to lower-case key for dictionary lookup.
 */
export function normalizeUnit(unitStr) {
  if (!unitStr) return "";
  const cleaned = String(unitStr).trim().toLowerCase();
  const info = UNIT_FACTORS[cleaned];
  return info ? cleaned : cleaned;
}

/**
 * Gets a clean display label for a unit string.
 */
export function formatUnitLabel(unitStr) {
  if (!unitStr) return "";
  const cleaned = String(unitStr).trim().toLowerCase();
  const info = UNIT_FACTORS[cleaned];
  return info?.label || unitStr;
}

/**
 * Converts a quantity from one unit to another.
 * 
 * @param {number|string} quantity - The numeric quantity to convert.
 * @param {string} fromUnitStr - The source unit (e.g., 'g', 'gram', 'ml', 'piece').
 * @param {string} toUnitStr - The target unit (e.g., 'kg', 'L', 'pcs').
 * @returns {number} The converted quantity in the target unit.
 */
export function convertUnit(quantity, fromUnitStr, toUnitStr) {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return 0;

  const fromKey = normalizeUnit(fromUnitStr);
  const toKey = normalizeUnit(toUnitStr);

  if (!fromKey || !toKey || fromKey === toKey) {
    return qty;
  }

  const fromInfo = UNIT_FACTORS[fromKey];
  const toInfo = UNIT_FACTORS[toKey];

  // If both units belong to known dimensions and have the same dimension (e.g., mass -> mass)
  if (fromInfo && toInfo && fromInfo.dimension === toInfo.dimension) {
    const baseQuantity = qty * fromInfo.factor;
    return baseQuantity / toInfo.factor;
  }

  // Fallback 1:1 if units are incompatible or custom
  return qty;
}
