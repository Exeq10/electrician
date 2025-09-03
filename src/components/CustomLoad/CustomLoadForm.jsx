export default function CustomLoadForm({ custom, setCustom, addCustom }) {
  return (
    <div className="grid md:grid-cols-6 gap-3 p-3 bg-white border rounded-xl shadow mb-4">
      <label className="flex flex-col text-sm">
        Nombre
        <input
          value={custom.name}
          onChange={(e) => setCustom({ ...custom, name: e.target.value })}
          className="mt-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <label className="flex flex-col text-sm">
        Potencia (W)
        <input
          type="number"
          min={1}
          value={custom.P}
          onChange={(e) => setCustom({ ...custom, P: parseFloat(e.target.value) || 0 })}
          className="mt-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <label className="flex flex-col text-sm">
        cosφ
        <input
          type="number"
          step="0.05"
          min={0.5}
          max={1}
          value={custom.cosphi}
          onChange={(e) => setCustom({ ...custom, cosphi: parseFloat(e.target.value) || 1 })}
          className="mt-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <label className="flex flex-col text-sm">
        Cantidad
        <input
          type="number"
          min={1}
          value={custom.qty}
          onChange={(e) => setCustom({ ...custom, qty: parseInt(e.target.value) || 1 })}
          className="mt-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={custom.trifasico}
          onChange={(e) => setCustom({ ...custom, trifasico: e.target.checked })}
          className="w-5 h-5"
        />
        Trifásico
      </label>

      <button
        onClick={addCustom}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Agregar
      </button>
    </div>
  );
}
