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
  const renderItems = () =>
    order.items
      .map(
        i => `
      <div class="item">
        <span class="qty">${i.quantity}x</span>
        <span class="name">${i.name}${i.persona ? ` <em>(${i.persona})</em>` : ''}</span>
      </div>`
      )
      .join('');

  const renderDestino = () => {
    if (order.delivery) {
      const { calle, numero, colonia, phone, clientName } = order.delivery;
      const addr = `${calle || ''} ${numero ? '#' + numero : ''}`.trim();
      return `
        <div class="badge">🛵 DOMICILIO</div>
        ${colonia ? `<div class="dest-line"><b>Colonia:</b> ${colonia}</div>` : ''}
        ${addr ? `<div class="dest-line"><b>Dir:</b> ${addr}</div>` : ''}
        ${clientName ? `<div class="dest-line"><b>Cliente:</b> ${clientName}</div>` : ''}
        ${phone ? `<div class="dest-line"><b>Tel:</b> ${phone}</div>` : ''}
      `;
    }
    if (order.table) {
      return `<div class="badge">🪑 ${order.table}</div>`;
    }
    return `<div class="badge">🏠 MOSTRADOR</div>`;
  };

  const renderNote = () =>
    order.note
      ? `<div class="nota"><b>⚠ NOTA:</b> ${order.note}</div>`
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
        .item { display: flex; gap: 8px; align-items: baseline; padding: 6px 0; border-bottom: 2px dashed #000; }
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
