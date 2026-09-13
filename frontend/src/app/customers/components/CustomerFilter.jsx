"use client";

export default function CustomerFilter({
  search,
  setSearch,
}) {
  return (
    <div className="mb-6">

      <input
        type="text"
        placeholder="Search customer..."
        className="border rounded-lg p-3 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

    </div>
  );
}