import { R_mOhm_per_m, AMPACITY_A, SECCIONES, BREAKER_STEPS_A, BREAKING_CAPACITY_KA } from './constants';

export function designCurrent({P_W, V, cosphi=1, system}) {
  return system==='trifasico' ? P_W/(Math.sqrt(3)*V*cosphi) : P_W/(V*cosphi);
}

export function voltageDropPercent({I, L_m, S_mm2, system, V}) {
  const R = (R_mOhm_per_m[S_mm2]||0)/1000;
  if(!R) return 0;
  const k = system==='monofasico'?2:Math.sqrt(3);
  return (k*L_m*I*R/V)*100;
}

export function pickSection({I,L_m,system,V,maxDropPercent}) {
  for(const S of SECCIONES){
    const amp = AMPACITY_A[S];
    const drop = voltageDropPercent({I,L_m,S_mm2:S,system,V});
    if(I<=amp && drop<=maxDropPercent) return {S, ampacity: amp, drop: Number(drop.toFixed(2))};
  }
  const last = SECCIONES[SECCIONES.length-1];
  const dropLast = voltageDropPercent({I,L_m,S_mm2:last,system,V});
  return {S:last, ampacity: AMPACITY_A[last], drop:Number(dropLast.toFixed(2))};
}

export function nearestBreaker(I) {
  for(const b of BREAKER_STEPS_A) if(b>=I) return b;
  return BREAKER_STEPS_A[BREAKER_STEPS_A.length-1];
}

export function breakingCapacityKaNeeded(icc_kA){
  for(const ka of BREAKING_CAPACITY_KA) if(ka>=icc_kA) return ka;
  return BREAKING_CAPACITY_KA[BREAKING_CAPACITY_KA.length-1];
}

export function peSectionFromPhase(S){
  if(S<=16) return S;
  if(S>16 && S<=35) return 16;
  return Math.round(S/2);
}

export function round2(n){return Math.round(n*100)/100;}
