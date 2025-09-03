export default function CommonLoadButton({ load, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col justify-between p-3 rounded-xl shadow hover:shadow-lg transition bg-white border border-gray-200 hover:bg-gray-50"
    >
      <span className="font-semibold text-gray-800">{load.name}</span>
      <span className="text-gray-500 text-sm">{load.P} W · cosφ {load.cosphi}</span>
    </button>
  );
}
