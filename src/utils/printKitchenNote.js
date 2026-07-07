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
    <html>
      <head>
        <title>Comanda #${order.order_number || order.id}</title>
        <style>
          @page { margin: 0; size: 58mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 14px; color: #000; width: 100%; margin: 0; padding: 8px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .header h1 { font-size: 22px; font-weight: 900; letter-spacing: 2px; }
          .header .time { font-size: 13px; }
          .badge { text-align: center; font-size: 18px; font-weight: 900; background: #000; color: #fff; padding: 6px 10px; border-radius: 4px; margin: 8px 0; letter-spacing: 1px; }
          .dest-line { font-size: 14px; padding: 2px 4px; }
          .item { display: flex; gap: 8px; align-items: baseline; padding: 5px 0; border-bottom: 1px dashed #ccc; }
          .qty { font-size: 24px; font-weight: 900; min-width: 32px; }
          .name { font-size: 16px; font-weight: bold; }
          .nota { margin-top: 10px; padding: 8px; border: 2px dashed #000; font-size: 14px; background: #fffde7; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COMANDA #${order.order_number || order.id}</h1>
          <div class="time">${order.time || new Date().toLocaleTimeString()}</div>
        </div>
        ${renderDestino()}
        <div style="margin-top:10px;">
          ${renderItems()}
        </div>
        ${renderNote()}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank', 'width=220,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert("El navegador bloqueó la ventana de impresión. Por favor, permite ventanas emergentes para este sitio.");
    }
  } catch (err) {
    console.error('Failed to open print window:', err);
  }
}
