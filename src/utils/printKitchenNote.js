/**
 * Imprime la comanda para la cocina (nota del taquero).
 * Sin precios, solo artículos, cantidad, notas y destino.
 */
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 15px; color: #000; width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
          .header .time { font-size: 12px; }
          .badge { text-align: center; font-size: 16px; font-weight: 900; background: #000; color: #fff; padding: 6px 10px; border-radius: 4px; margin: 8px 0; letter-spacing: 1px; }
          .dest-line { font-size: 13px; padding: 2px 4px; }
          .item { display: flex; gap: 8px; align-items: baseline; padding: 5px 0; border-bottom: 1px dashed #ccc; }
          .qty { font-size: 22px; font-weight: 900; min-width: 32px; }
          .name { font-size: 15px; font-weight: bold; }
          .nota { margin-top: 10px; padding: 8px; border: 2px dashed #000; font-size: 13px; background: #fffde7; }
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
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
    </html>
  `;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;

  if (isMobile) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:320px; height:600px;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html.replace('window.print();', ''));
    doc.close();
    setTimeout(() => {
      try { iframe.contentWindow.print(); } catch { window.open('').document.write(html); }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  } else {
    const win = window.open('', '_blank', 'width=320,height=600');
    if (win) { win.document.write(html); win.document.close(); }
  }
}
