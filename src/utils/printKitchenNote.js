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
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768 || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isMobile) {
    // Mobile workaround (both Android & iOS): 
    // Inject print container directly into body and use media query to hide main app.
    // Bypasses popup blockers and iframe rendering bugs in Chrome/Safari.
    let printContainer = document.getElementById('mobile-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'mobile-print-container';
      printContainer.style.display = 'none';
      document.body.appendChild(printContainer);
    }
    
    // Extract body and styles safely
    const bodyContent = safeExtract(html, '<body>', '</body>').replace(/<script>.*?<\/script>/g, '');
    const stylesContent = safeExtract(html, '<style>', '</style>');
    
    printContainer.innerHTML = `<style>@media print { ${stylesContent} }</style><div class="print-content" style="width: 100%; color: #000;">${bodyContent}</div>`;

    // Add global style to hide everything else during print (if not already added)
    let globalStyle = document.getElementById('mobile-print-style');
    if (!globalStyle) {
      globalStyle = document.createElement('style');
      globalStyle.id = 'mobile-print-style';
      globalStyle.innerHTML = `
        #mobile-print-container { display: none; }
        @media print {
          body > *:not(#mobile-print-container) { display: none !important; }
          #mobile-print-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
        }
      `;
      document.head.appendChild(globalStyle);
    }

    setTimeout(() => {
      try {
        if (typeof window.print === 'function') {
          window.print();
        }
      } catch (err) {
        console.error('Failed to trigger native print:', err);
      }
    }, 300);
  } else {
    // Desktop: classic window.open approach
    try {
      const win = window.open('', '_blank', 'width=220,height=600');
      if (win) { 
        win.document.write(html); 
        win.document.close(); 
      }
    } catch (err) {
      console.error('Failed to open print window:', err);
    }
  }
}
