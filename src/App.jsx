import React, { useMemo, useState ,useEffect} from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";


// Calculadora de instalaciones BT estilo UTE/IEC (simplificada)
// Asume conductores de cobre, aislamiento PVC, 30°C, método típico empotrado.
// Incluye: demanda (con simultaneidad), corrientes, selección de sección por
// capacidad de corriente y caída de tensión, térmica sugerida y poder de corte,
// diferencial 30 mA por circuito (vivienda). ¡Ajusta parámetros si tu caso difiere!

// ---- Datos base ----
const VOLTAGES = {
  monofasico: 220, // V entre fase y neutro en UY
  trifasico: 380,  // V entre fases en UY
};

// Resistencias DC aprox. a 20°C en mΩ/m para cobre (IEC 60228)
const R_mOhm_per_m = {
  1.5: 12.1,
  2.5: 7.41,
  4: 4.61,
  6: 3.08,
  10: 1.83,
  16: 1.15,
  25: 0.727,
  35: 0.524,
  50: 0.387,
  70: 0.268,
  95: 0.193,
};

// Capacidad de corriente aproximada (A) para Cu PVC 2 conductores cargados
// (guía rápida; verifica contra tablas si cambian condiciones)
const AMPACITY_A = {
  1.5: 14,
  2.5: 20,
  4: 26,
  6: 34,
  10: 46,
  16: 61,
  25: 80,
  35: 99,
  50: 119,
  70: 151,
  95: 184,
};

const SECCIONES = Object.keys(R_mOhm_per_m).map(Number).sort((a,b)=>a-b);

const BREAKER_STEPS_A = [6,10,13,16,20,25,32,40,50,63,80,100,125];
const BREAKING_CAPACITY_KA = [3,4.5,6,10,15,25]; // elegir ≥ Icc presumida (kA)

// PE segun IEC 60364-5-54 (simplificado)
function peSectionFromPhase(S) {
  if (S <= 16) return S;
  if (S > 16 && S <= 35) return 16;
  return Math.round(S/2);
}

// Electrodomésticos comunes (potencia nominal W y cosφ estimado)
const COMMON_LOADS = [
  { name: "Iluminación LED (por circuito)", P: 300, cosphi: 1.0 },
  { name: "Tomacorrientes generales (circuito)", P: 1500, cosphi: 0.95 },
  { name: "Heladera", P: 250, cosphi: 0.8 },
  { name: "Microondas", P: 1200, cosphi: 0.95 },
  { name: "Hervidor", P: 2000, cosphi: 1.0 },
  { name: "Horno eléctrico", P: 2500, cosphi: 1.0 },
  { name: "Cocina placa (hornalla)", P: 2000, cosphi: 1.0 },
  { name: "Aire 9000 BTU", P: 1000, cosphi: 0.85 },
  { name: "Aire 12000 BTU", P: 1500, cosphi: 0.85 },
  { name: "Lavarropas", P: 1500, cosphi: 0.8 },
  { name: "Secadora", P: 2000, cosphi: 0.85 },
  { name: "Termofón", P: 1200, cosphi: 1.0 },
  { name: "Bomba de agua 1/2 HP", P: 370, cosphi: 0.8 },
  { name: "PC de escritorio", P: 250, cosphi: 0.95 },
  { name: "TV 50\"", P: 120, cosphi: 0.95 },
  { name: "Aspiradora", P: 1200, cosphi: 0.85 },
  { name: "Plancha", P: 1200, cosphi: 1.0 },
];

function nearestBreaker(I) {
  for (const b of BREAKER_STEPS_A) if (b >= I) return b;
  return BREAKER_STEPS_A[BREAKER_STEPS_A.length-1];
}

function breakingCapacityKaNeeded(icc_kA) {
  for (const ka of BREAKING_CAPACITY_KA) if (ka >= icc_kA) return ka;
  return BREAKING_CAPACITY_KA[BREAKING_CAPACITY_KA.length-1];
}

function voltageDropPercent({I, L_m, S_mm2, system, cosphi, V}) {
  // ΔV% monofásico ≈ (2 * L * I * R) / V * 100 ; trifásico ≈ (\u221A3 * L * I * R) / V * 100
  const R = (R_mOhm_per_m[S_mm2] || 0) / 1000; // Ω/m
  if (!R) return 0;
  const k = system === 'monofasico' ? 2 : Math.sqrt(3);
  const dV = k * L_m * I * R; // voltios
  return (dV / V) * 100;
}

function designCurrent({P_W, V, cosphi, system, phases=1}) {
  // Trifásico balanceado: I = P / (\u221A3 V cosφ)
  if (system === 'trifasico') return P_W / (Math.sqrt(3) * V * (cosphi||1));
  // Monofásico: I = P / (V cosφ)
  return P_W / (V * (cosphi||1));
}

function pickSection({I, L_m, system, cosphi, V, maxDropPercent}) {
  for (const S of SECCIONES) {
    const ampacity = AMPACITY_A[S];
    if (!ampacity) continue;
    const drop = voltageDropPercent({I, L_m, S_mm2: S, system, cosphi, V});
    if (I <= ampacity && drop <= maxDropPercent) {
      return { S, ampacity, drop: Number(drop.toFixed(2)) };
    }
  }
  // Si ninguna cumple, devolver la mayor con su caída
  const last = SECCIONES[SECCIONES.length-1];
  const dropLast = voltageDropPercent({I, L_m, S_mm2: last, system, cosphi, V});
  return { S: last, ampacity: AMPACITY_A[last], drop: Number(dropLast.toFixed(2)) };
}

function round2(n){return Math.round(n*100)/100}

export default function CalculadoraUTE() {

const [tutorial, setTutorial] = useState(false);

  const handleTutorial = () => {
    setTutorial(true);
  };
 useEffect(() => {
    if (!tutorial) return;

    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: "#sistema",
          popover: {
            title: "⚡ Tipo de instalación",
            description:
              "Elegí si tu casa usa monofásico (220 V, lo más común en Uruguay) o trifásico (380/220 V, usado en casas grandes o comercios).",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#parametros",
          popover: {
            title: "📐 Parámetros globales",
            description:
              "Definí las condiciones generales: la corriente de cortocircuito (Icc), la caída de tensión permitida, la simultaneidad y la longitud de los cables. Si no entendés, dejá los valores por defecto.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#inventario",
          popover: {
            title: "📦 Inventario rápido",
            description:
              "Agregá los electrodomésticos más comunes con un clic: heladera, aire acondicionado, horno, etc. La app ya conoce su potencia típica.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "#custom",
          popover: {
            title: "➕ Cargas personalizadas",
            description:
              "Si un aparato no está en la lista, lo podés agregar manualmente con su potencia, cosφ, cantidad y si es trifásico. Ejemplo: una bomba de agua especial.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#tabla-resultados",
          popover: {
            title: "📊 Resultados por circuito",
            description:
              "Acá ves los cálculos de cada circuito: corriente (A), cable sugerido (mm²), caída de tensión (%) y el interruptor automático recomendado (MCB). También muestra el cable de tierra (PE).",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#totales-resumen",
          popover: {
            title: "📈 Totales de la instalación",
            description:
              "La app resume toda la instalación: potencia total, potencia máxima probable y corriente de diseño. Esto sirve para dimensionar el cable principal.",
            side: "top",
            align: "center",
          },
        },
        {
          element: "#totales-alimentador",
          popover: {
            title: "🔌 Alimentador principal",
            description:
              "Aquí ves qué cable principal (fase y tierra) y qué interruptor general (IGA) necesitás. También el poder de corte mínimo del interruptor (Icu) según la Icc.",
            side: "bottom",
            align: "center",
          },
        },
      ],
    });

    driverObj.drive();
    setTutorial(false);
  }, [tutorial]);

  const [system, setSystem] = useState('monofasico');
  const V = system === 'monofasico' ? VOLTAGES.monofasico : VOLTAGES.trifasico;

  const [iccPresunto, setIccPresunto] = useState(6); // kA en punto de instalación
  const [maxDropMain, setMaxDropMain] = useState(3); // % hasta tablero principal
  const [maxDropCircuito, setMaxDropCircuito] = useState(5); // % hasta receptor
  const [fsGlobal, setFsGlobal] = useState(0.7); // simultaneidad global

  const [longitudTramo, setLongitudTramo] = useState(20); // m (longitud típica por circuito)

  const [items, setItems] = useState([
    { id: 1, name: 'Iluminación LED (circuito)', P: 300, qty: 1, cosphi: 1.0, fs: 0.9, trifasico: false },
    { id: 2, name: 'Tomacorrientes (circuito)', P: 1500, qty: 2, cosphi: 0.95, fs: 0.6, trifasico: false },
    { id: 3, name: 'Termofón', P: 1200, qty: 1, cosphi: 1.0, fs: 1.0, trifasico: false },
  ]);

  const [custom, setCustom] = useState({ name: '', P: 1000, cosphi: 1.0, fs: 1.0, qty: 1, trifasico: false });

  const addCommon = (c) => {
    setItems(prev => [...prev, { id: Date.now(), name: c.name, P: c.P, qty: 1, cosphi: c.cosphi, fs: 1.0, trifasico: false }]);
  }

  const addCustom = () => {
    if(!custom.name) return;
    setItems(prev => [...prev, { id: Date.now(), ...custom }]);
    setCustom({ name: '', P: 1000, cosphi: 1.0, fs: 1.0, qty: 1, trifasico: false });
  }

  const removeItem = (id) => setItems(prev=>prev.filter(i=>i.id!==id));

  const rows = useMemo(()=>{
    const rowsCalc = items.map((it)=>{
      const sys = it.trifasico ? 'trifasico' : system; // circuito puede forzar trifásico
      const VV = sys==='trifasico' ? VOLTAGES.trifasico : VOLTAGES.monofasico;
      const Ptot = it.P * it.qty; // W
      const I = designCurrent({P_W: Ptot, V: VV, cosphi: it.cosphi, system: sys});
      const section = pickSection({I, L_m: longitudTramo, system: sys, cosphi: it.cosphi, V: VV, maxDropPercent: maxDropCircuito});
      const breakerA = nearestBreaker(I * 1.25); // margen 25%
      const pe = peSectionFromPhase(section.S);
      return {
        name: it.name,
        qty: it.qty,
        P_W: Ptot,
        cosphi: it.cosphi,
        system: sys,
        V: VV,
        I_A: round2(I),
        S_mm2: section.S,
        drop_pct: section.drop,
        breaker_A: breakerA,
        pe_mm2: pe,
      };
    });
    return rowsCalc;
  }, [items, system, longitudTramo, maxDropCircuito]);

  const totales = useMemo(()=>{
    const Pinstalada = rows.reduce((acc,r)=>acc + r.P_W, 0);
    const PMP = Pinstalada * fsGlobal; // potencia máxima probable
    const I_diseño = designCurrent({P_W: PMP, V, cosphi: 0.95, system});
    return { Pinstalada, PMP, I_diseño };
  }, [rows, fsGlobal, V, system]);

  const icuNecesaria = breakingCapacityKaNeeded(iccPresunto);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header id="sistema" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Calculadora UTE – BT (viviendas/comercial liviano)</h1>
            <p className="text-sm text-gray-600">Cálculos orientativos según prácticas UTE/IEC. Ajustá parámetros para tu caso.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm">Sistema</label>
            <select value={system} onChange={e=>setSystem(e.target.value)} className="border rounded-xl px-3 py-2 bg-white">
              <option value="monofasico">Monofásico 220 V</option>
              <option value="trifasico">Trifásico 380/220 V</option>
            </select>
          </div>
              {/* Botón para tutorial */}
      <button
        onClick={handleTutorial}
        className="bg-blue-600 text-white rounded-xl px-3 py-2 hover:bg-blue-700 transition"
      >
        Ver tutorial
      </button>
        </header>

        {/* Parámetros globales */}
        <section id="parametros" className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">Parámetros de cálculo</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col">Icc presunta en tablero (kA)
                <input type="number" step="0.5" min={1} value={iccPresunto} onChange={e=>setIccPresunto(parseFloat(e.target.value)||0)} className="border rounded-xl px-3 py-2"/>
              </label>
              <label className="flex flex-col">Caída máx. circuito (%)
                <input type="number" step="0.1" min={1} value={maxDropCircuito} onChange={e=>setMaxDropCircuito(parseFloat(e.target.value)||0)} className="border rounded-xl px-3 py-2"/>
              </label>
              <label className="flex flex-col">Caída máx. alimentador (%)
                <input type="number" step="0.1" min={1} value={maxDropMain} onChange={e=>setMaxDropMain(parseFloat(e.target.value)||0)} className="border rounded-xl px-3 py-2"/>
              </label>
              <label className="flex flex-col">Simultaneidad global (0-1)
                <input type="number" step="0.05" min={0.1} max={1} value={fsGlobal} onChange={e=>setFsGlobal(parseFloat(e.target.value)||0)} className="border rounded-xl px-3 py-2"/>
              </label>
              <label className="flex flex-col">Longitud típica por circuito (m)
                <input type="number" step="1" min={1} value={longitudTramo} onChange={e=>setLongitudTramo(parseFloat(e.target.value)||0)} className="border rounded-xl px-3 py-2"/>
              </label>
            </div>
            <div className="text-xs text-gray-500">Sugerencia: UTE suele admitir ~3% al tablero y 5% al último receptor. Para cortocircuito, seleccioná poder de corte ≥ Icc.</div>
          </div>

          <div id="inventario" className="bg-white rounded-2xl shadow p-4 space-y-2">
            <h2 className="font-semibold">Inventario rápido</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {COMMON_LOADS.map(c=> (
                <button key={c.name} onClick={()=>addCommon(c)} className="border rounded-xl px-3 py-2 text-left hover:shadow">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.P} W · cosφ {c.cosphi}</div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Agregar manual */}
        <section  id="custom" className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Agregar carga personalizada</h2>
          <div className="grid md:grid-cols-6 gap-3 text-sm items-end">
            <label className="flex flex-col">Nombre
              <input value={custom.name} onChange={e=>setCustom({...custom, name:e.target.value})} className="border rounded-xl px-3 py-2"/>
            </label>
            <label className="flex flex-col">Potencia (W)
              <input type="number" min={1} value={custom.P} onChange={e=>setCustom({...custom, P: parseFloat(e.target.value)||0})} className="border rounded-xl px-3 py-2"/>
            </label>
            <label className="flex flex-col">cosφ
              <input type="number" step="0.05" min={0.5} max={1} value={custom.cosphi} onChange={e=>setCustom({...custom, cosphi: parseFloat(e.target.value)||1})} className="border rounded-xl px-3 py-2"/>
            </label>
            <label className="flex flex-col">Cantidad
              <input type="number" min={1} value={custom.qty} onChange={e=>setCustom({...custom, qty: parseInt(e.target.value)||1})} className="border rounded-xl px-3 py-2"/>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={custom.trifasico} onChange={e=>setCustom({...custom, trifasico: e.target.checked})}/> Trifásico</label>
            <button onClick={addCustom} className="bg-black text-white rounded-xl px-4 py-2">Agregar</button>
          </div>

          {/* Lista editable */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Carga</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">W</th>
                  <th className="p-2">cosφ</th>
                  <th className="p-2">Trifásico</th>
                  <th className="p-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it=> (
                  <tr key={it.id} className="border-b">
                    <td className="p-2"><input className="border rounded-lg px-2 py-1 w-full" value={it.name} onChange={e=>setItems(s=>s.map(x=>x.id===it.id?{...x,name:e.target.value}:x))}/></td>
                    <td className="p-2"><input type="number" min={1} className="border rounded-lg px-2 py-1 w-20 text-center" value={it.qty} onChange={e=>setItems(s=>s.map(x=>x.id===it.id?{...x,qty:parseInt(e.target.value)||1}:x))}/></td>
                    <td className="p-2"><input type="number" min={1} className="border rounded-lg px-2 py-1 w-24 text-center" value={it.P} onChange={e=>setItems(s=>s.map(x=>x.id===it.id?{...x,P:parseFloat(e.target.value)||0}:x))}/></td>
                    <td className="p-2"><input type="number" step="0.05" min={0.5} max={1} className="border rounded-lg px-2 py-1 w-24 text-center" value={it.cosphi} onChange={e=>setItems(s=>s.map(x=>x.id===it.id?{...x,cosphi:parseFloat(e.target.value)||1}:x))}/></td>
                    <td className="p-2 text-center"><input type="checkbox" checked={it.trifasico} onChange={e=>setItems(s=>s.map(x=>x.id===it.id?{...x,trifasico:e.target.checked}:x))}/></td>
                    <td className="p-2 text-center"><button onClick={()=>removeItem(it.id)} className="text-red-600 hover:underline">Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resultados por circuito */}
        <section  id="tabla-resultados" className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">Resultados por circuito</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Circuito</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">P (W)</th>
                  <th className="p-2">cosφ</th>
                  <th className="p-2">Sistema</th>
                  <th className="p-2">V</th>
                  <th className="p-2">I (A)</th>
                  <th className="p-2">Sección (mm²)</th>
                  <th className="p-2">Caída (%)</th>
                  <th className="p-2">MCB (A)</th>
                  <th className="p-2">PE (mm²)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx)=> (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-center">{r.qty}</td>
                    <td className="p-2 text-center">{r.P_W}</td>
                    <td className="p-2 text-center">{r.cosphi}</td>
                    <td className="p-2 text-center">{r.system==='trifasico'?'3F':'1F'}</td>
                    <td className="p-2 text-center">{r.V}</td>
                    <td className="p-2 text-center">{r.I_A}</td>
                    <td className="p-2 text-center">{r.S_mm2}</td>
                    <td className="p-2 text-center">{r.drop_pct}</td>
                    <td className="p-2 text-center">{r.breaker_A}</td>
                    <td className="p-2 text-center">{r.pe_mm2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">Protección diferencial sugerida por circuito: 30 mA (tipo A/AC según cargas).</div>
        </section>

        {/* Totales y alimentador */}
        <section id="totales-resumen" className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Totales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="border rounded-xl p-3"><div className="text-gray-500">Potencia instalada</div><div className="text-lg font-semibold">{Math.round(totales.Pinstalada)} W</div></div>
            <div className="border rounded-xl p-3"><div className="text-gray-500">PMP (con simultaneidad)</div><div className="text-lg font-semibold">{Math.round(totales.PMP)} W</div></div>
            <div className="border rounded-xl p-3"><div className="text-gray-500">I de diseño total</div><div className="text-lg font-semibold">{round2(totales.I_diseño)} A</div></div>
          </div>

          <h3  className="font-medium">Alimentador principal sugerido</h3>
          <AlimentadorSugerido  I_total={totales.I_diseño} system={system} V={V} maxDropMain={maxDropMain} iccPresunto={iccPresunto} />
        </section>

        <footer className="text-xs text-gray-500">
          Nota: Esta herramienta es orientativa. Para aprobación UTE/Unidad Control de Obras, verificá contra RIE vigente, tablas UNIT-IEC, método de instalación, temperatura, número de conductores cargados y condiciones particulares.
        </footer>
      </div>
    </div>
  );
}

function AlimentadorSugerido({I_total, system, V, maxDropMain, iccPresunto}){
  const L_m = 15; // suposición corta entre medidor y tablero; editable si se desea ampliar
  const section = pickSection({I: I_total, L_m, system, cosphi: 0.95, V, maxDropPercent: maxDropMain});
  const breaker = nearestBreaker(I_total*1.25);
  const pe = peSectionFromPhase(section.S);
  const icu = breakingCapacityKaNeeded(iccPresunto);
  return (
    <div id="totales-alimentador" className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
      <div className="border rounded-xl p-3"><div className="text-gray-500">Sección fase</div><div className="text-lg font-semibold">{section.S} mm²</div></div>
      <div className="border rounded-xl p-3"><div className="text-gray-500">Caída estimada</div><div className="text-lg font-semibold">{section.drop}%</div></div>
      <div className="border rounded-xl p-3"><div className="text-gray-500">MCB/IGA</div><div className="text-lg font-semibold">{breaker} A</div></div>
      <div className="border rounded-xl p-3"><div className="text-gray-500">PE</div><div className="text-lg font-semibold">{pe} mm²</div></div>
      <div className="border rounded-xl p-3"><div className="text-gray-500">Icu mín. (poder corte)</div><div className="text-lg font-semibold">{icu} kA</div></div>
    </div>
  );
}
