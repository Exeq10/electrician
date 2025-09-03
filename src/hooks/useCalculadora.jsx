import { useState, useMemo } from 'react';
import { designCurrent, pickSection, nearestBreaker, peSectionFromPhase, round2 } from '../utils/calculos';

export function useCalculadora(systemInit='monofasico') {
  const [system, setSystem] = useState(systemInit);
  const [items, setItems] = useState([]);
  const [longitudTramo, setLongitudTramo] = useState(20);
  const [fsGlobal, setFsGlobal] = useState(0.7);
  const [maxDropCircuito, setMaxDropCircuito] = useState(5);

  const addItem = item => setItems(prev=>[...prev,{id:Date.now(),...item}]);
  const removeItem = id => setItems(prev=>prev.filter(i=>i.id!==id));

  const rows = useMemo(()=>items.map(it=>{
    const VV = system==='trifasico'?380:220;
    const I = designCurrent({P_W:it.P*it.qty,V:VV,cosphi:it.cosphi,system});
    const section = pickSection({I,L_m:longitudTramo,system,V:VV,maxDropPercent:maxDropCircuito});
    return {
      ...it,
      I_A: round2(I),
      S_mm2: section.S,
      drop_pct: section.drop,
      breaker_A: nearestBreaker(I*1.25),
      pe_mm2: peSectionFromPhase(section.S)
    };
  }),[items,system,longitudTramo,maxDropCircuito]);

  const totales = useMemo(()=>{
    const Pinstalada = rows.reduce((acc,r)=>acc+r.P_W||0,0);
    const PMP = Pinstalada*fsGlobal;
    const I_diseño = designCurrent({P_W:PMP,V:system==='trifasico'?380:220,cosphi:0.95,system});
    return {Pinstalada,PMP,I_diseño};
  },[rows,fsGlobal,system]);

  return {system,setSystem,items,addItem,removeItem,rows,totales,longitudTramo,setLongitudTramo,fsGlobal,setFsGlobal,maxDropCircuito,setMaxDropCircuito};
}
