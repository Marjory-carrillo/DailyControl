/**
 * Imprime la comanda para la cocina (nota del taquero).
 * Sin precios, solo artículos, cantidad, notas y destino.
 */
function safeExtract(htmlStr, startTag, endTag) {
  const startIdx = htmlStr.indexOf(startTag);
  if (startIdx === -1) return '';
  const endIdx = htmlStr.indexOf(endTag, startIdx + startTag.length);
  if (endIdx === -1) return htmlStr.substring(startIdx + startTag.length);
  return htmlStr.substring(startIdx + startTag.length, endIdx);
}

export function printKitchenNote(order) {
  const renderItems = () => {
    const byPersona = {};
    order.items.forEach(i => {
      const p = i.persona || 'Orden 1';
      if (!byPersona[p]) byPersona[p] = [];
      byPersona[p].push(i);
    });

    const personas = Object.keys(byPersona).sort();
    let html = '';

    personas.forEach((p, idx) => {
      if (personas.length > 1) {
        html += `<div style="font-size:20px; font-weight:900; background:#000; color:#fff; padding:4px; margin: 8px 0; text-align:center;">--- ${p.toUpperCase()} ---</div>`;
      }
      
      byPersona[p].forEach(i => {
        html += `
          <div class="item">
            <div style="display: flex; gap: 8px; align-items: baseline;">
              <span class="qty">${i.quantity}x</span>
              <span class="name">${i.name}</span>
            </div>
            ${i.itemNote ? `<div style="margin-left: 40px; font-size: 16px; font-weight: bold; padding: 2px 4px; border: 1px solid #000; display: inline-block; margin-top: 4px;">📝 ${i.itemNote}</div>` : ''}
          </div>
        `;
      });
      
      if (idx < personas.length - 1) {
        html += `<div style="border-bottom: 4px solid #000; margin: 12px 0;"></div>`;
      }
    });

    return html;
  };

  const renderDestino = () => {
    if (order.delivery) {
      return `
        <div class="badge">🛵 DOMICILIO</div>
      `;
    }
    if (order.table) {
      return `<div class="badge">🪑 ${order.table}</div>`;
    }
    return `<div class="badge">🏠 MOSTRADOR</div>`;
  };

  const renderNote = () =>
    order.note
      ? `<div class="nota">
           <div style="text-align:center; font-size:18px; margin-bottom:4px;">⚠ NOTA GENERAL DE LA ORDEN ⚠</div>
           <div style="text-align:center;">${order.note}</div>
         </div>`
      : '';

  const html = `
    <div class="kitchen-wrapper">
      <style>
        @page { margin: 0; size: 58mm auto; }
        .kitchen-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }
        .kitchen-wrapper { font-family: monospace; font-size: 16px; font-weight: bold; color: #000; width: 100%; margin: 0; padding: 8px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header h1 { font-size: 24px; font-weight: 900; letter-spacing: 2px; }
        .header .time { font-size: 15px; }
        .badge { text-align: center; font-size: 20px; font-weight: 900; background: #000; color: #fff; padding: 6px 10px; border-radius: 4px; margin: 8px 0; letter-spacing: 1px; }
        .dest-line { font-size: 16px; padding: 2px 4px; font-weight: bold; }
        .item { display: flex; flex-direction: column; padding: 8px 0; border-bottom: 2px dashed #000; }
        .qty { font-size: 26px; font-weight: 900; min-width: 32px; }
        .name { font-size: 18px; font-weight: bold; }
        .nota { margin-top: 10px; padding: 8px; border: 3px dashed #000; font-size: 16px; background: #fffde7; font-weight: bold; }
      </style>
      <div class="header">
        <h1>COMANDA #${order.order_number || order.id}</h1>
        <div class="time">${order.time || new Date().toLocaleTimeString()}</div>
      </div>
      ${renderDestino()}
      <div style="margin-top:10px;">
        ${renderItems()}
      </div>
      ${renderNote()}
      <div style="text-align: center; margin-top: 20px; font-weight: bold; font-size: 14px;">
        <br/><br/>
        . . . . . . . . . . . . . . .
        <br/><br/>
      </div>
    </div>
  `;

  try {
    const printContainer = document.getElementById('print-container');
    if (printContainer) {
      printContainer.innerHTML = html;
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      console.error("El contenedor de impresión (#print-container) no existe en el DOM.");
      // Fallback a window.open si no existe el contenedor
      const printWindow = window.open('', '_blank', 'width=220,height=600');
      if (printWindow) {
        printWindow.document.write(`<html><body>${html}</body></html>`);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 100);
      }
    }
  } catch (err) {
    console.error('Failed to trigger print:', err);
  }
}
