export const VOLTAGES = { monofasico: 220, trifasico: 380 };

export const R_mOhm_per_m = { 1.5:12.1,2.5:7.41,4:4.61,6:3.08,10:1.83,16:1.15,25:0.727,35:0.524,50:0.387,70:0.268,95:0.193 };
export const AMPACITY_A = { 1.5:14,2.5:20,4:26,6:34,10:46,16:61,25:80,35:99,50:119,70:151,95:184 };
export const SECCIONES = Object.keys(R_mOhm_per_m).map(Number).sort((a,b)=>a-b);
export const BREAKER_STEPS_A = [6,10,13,16,20,25,32,40,50,63,80,100,125];
export const BREAKING_CAPACITY_KA = [3,4.5,6,10,15,25];

export const COMMON_LOADS = [
  { name: "Iluminación LED (circuito)", P: 300, cosphi: 1.0 },
  { name: "Tomacorrientes (circuito)", P: 1500, cosphi: 0.95 },
  { name: "Heladera", P: 250, cosphi: 0.8 },
  { name: "Microondas", P: 1200, cosphi: 0.95 },
  { name: "Hervidor", P: 2000, cosphi: 1.0 },
  { name: "Horno eléctrico", P: 2500, cosphi: 1.0 },
  { name: "Cocina placa", P: 2000, cosphi: 1.0 },
  { name: "Aire 9000 BTU", P: 1000, cosphi: 0.85 },
  { name: "Aire 12000 BTU", P: 1500, cosphi: 0.85 },
  { name: "Lavarropas", P: 1500, cosphi: 0.8 },
  { name: "Secadora", P: 2000, cosphi: 0.85 },
  { name: "Termofón", P: 1200, cosphi: 1.0 },
];
