export default function Totales({ totales }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm shadow">
      <div className="mb-1"><span className="font-semibold">P instalada:</span> {totales.Pinstalada} W</div>
      <div className="mb-1"><span className="font-semibold">P simultáneo (PMP):</span> {totales.PMP} W</div>
      <div><span className="font-semibold">I de diseño:</span> {totales.I_diseño.toFixed(2)} A</div>
    </div>
  );
}
