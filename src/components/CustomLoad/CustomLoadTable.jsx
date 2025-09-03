export default function CustomLoadTable({ items, setItems, removeItem }) {
  return (
    <div className="overflow-x-auto bg-white border rounded-xl shadow mb-4">
      <table className="min-w-full text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Carga</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-center">W</th>
            <th className="p-2 text-center">cosφ</th>
            <th className="p-2 text-center">Trifásico</th>
            <th className="p-2 text-center">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((it) => (
            <tr key={it.id}>
              <td className="p-2">
                <input
                  value={it.name}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x))
                    )
                  }
                  className="w-full border rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-400"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((x) => (x.id === it.id ? { ...x, qty: parseInt(e.target.value) || 1 } : x))
                    )
                  }
                  className="border rounded-lg px-2 py-1 w-16 text-center focus:ring-1 focus:ring-blue-400"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  min={1}
                  value={it.P}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((x) => (x.id === it.id ? { ...x, P: parseFloat(e.target.value) || 0 } : x))
                    )
                  }
                  className="border rounded-lg px-2 py-1 w-20 text-center focus:ring-1 focus:ring-blue-400"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  step="0.05"
                  min={0.5}
                  max={1}
                  value={it.cosphi}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((x) => (x.id === it.id ? { ...x, cosphi: parseFloat(e.target.value) || 1 } : x))
                    )
                  }
                  className="border rounded-lg px-2 py-1 w-20 text-center focus:ring-1 focus:ring-blue-400"
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={it.trifasico}
                  onChange={(e) =>
                    setItems((s) =>
                      s.map((x) => (x.id === it.id ? { ...x, trifasico: e.target.checked } : x))
                    )
                  }
                  className="w-5 h-5"
                />
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
