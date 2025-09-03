import jsPDF from "jspdf";
import "jspdf-autotable";

// Exportar resultados a PDF
export function exportarPDF() {
  const tabla = document.querySelector("#tabla-resultados table");
  if (!tabla) {
    alert("No hay resultados para exportar");
    return;
  }

  const doc = new jsPDF();
  doc.text("Resultados de la Instalación BT", 14, 15);

  // 👇 convierte la tabla HTML en PDF
  doc.autoTable({ html: tabla, startY: 25, styles: { fontSize: 8 } });

  doc.save("instalacion_BT.pdf");
}

// Imprimir resultados en tabla
export function imprimirResultados() {
  const tabla = document.getElementById("tabla-resultados");
  if (!tabla) {
    alert("No hay resultados para imprimir");
    return;
  }

  const ventana = window.open("", "", "height=700,width=900");
  ventana.document.write("<html><head><title>Resultados Instalación BT</title>");
  ventana.document.write(
    "<style>table {border-collapse: collapse; width: 100%;} table, th, td {border: 1px solid #444; padding: 6px; text-align: center; font-size: 12px;} h2 {font-family: sans-serif;}</style>"
  );
  ventana.document.write("</head><body>");
  ventana.document.write("<h2>Resultados de la Instalación BT</h2>");
  ventana.document.write(tabla.innerHTML);
  ventana.document.write("</body></html>");
  ventana.document.close();
  ventana.print();
}
