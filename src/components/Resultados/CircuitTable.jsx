export default function CircuitTable({ rows }) {
  return (
    <div className="overflow-x-auto bg-white border rounded-xl shadow mb-4">
      <table className="min-w-full text-xs md:text-sm divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Circuito</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-center">P (W)</th>
            <th className="p-2 text-center">I (A)</th>
            <th className="p-2 text-center">S (mm²)</th>
            <th className="p-2 text-center">ΔV %</th>
            <th className="p-2 text-center">Breaker (A)</th>
            <th className="p-2 text-center">PE (mm²)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((it) => (
            <tr key={it.id}>
              <td className="p-2">{it.name}</td>
              <td className="p-2 text-center">{it.qty}</td>
              <td className="p-2 text-center">{it.P}</td>
              <td className="p-2 text-center">{it.I_A}</td>
              <td className="p-2 text-center">{it.S_mm2}</td>
              <td className="p-2 text-center">{it.drop_pct}</td>
              <td className="p-2 text-center">{it.breaker_A}</td>
              <td className="p-2 text-center">{it.pe_mm2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
