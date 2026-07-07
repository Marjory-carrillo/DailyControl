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
          @page { margin: 0; size: 58mm 2000mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 13px; color: #000; width: 100%; max-width: 200px; margin: 0 auto; padding: 5px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    // On Android: hidden iframe works best to prevent multiple tabs
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:200px; height:600px;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html.replace('window.print();', ''));
    doc.close();
    setTimeout(() => {
      try { iframe.contentWindow.print(); } catch { window.open('').document.write(html); }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
  } else if (isIOS) {
    // iOS Safari blocks popups and iframe printing. 
    // Best workaround: inject content directly into body, print, and remove.
    const printContainer = document.createElement('div');
    printContainer.id = 'ios-print-container';
    
    // Extract body and styles
    const bodyContent = html.split('<body>')[1].split('</body>')[0].replace('<script>window.onload = function() { window.print(); }</script>', '');
    const stylesContent = html.split('<style>')[1].split('</style>')[0];
    
    printContainer.innerHTML = `<style>${stylesContent}</style><div class="print-content" style="width: 200px; margin: 0 auto; color: #000;">${bodyContent}</div>`;
    document.body.appendChild(printContainer);

    // Add global style to hide everything else during print
    const globalStyle = document.createElement('style');
    globalStyle.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #ios-print-container, #ios-print-container * { visibility: visible; }
        #ios-print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
      }
    `;
    document.head.appendChild(globalStyle);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
        if (document.head.contains(globalStyle)) document.head.removeChild(globalStyle);
      }, 1000);
    }, 300);
  } else {
    // Desktop: classic window.open approach
    const win = window.open('', '_blank', 'width=220,height=600');
    if (win) { 
      win.document.write(html); 
      win.document.close(); 
    }
  }
}
