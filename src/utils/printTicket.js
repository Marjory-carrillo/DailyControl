export function printTicket(order, config = {}) {
  const businessName = config?.businessName || 'Mi Negocio';
  const slogan = config?.slogan || '';
  const phone = config?.phone || '';
  const displayId = order.order_number || order.id;

  const renderItems = () => order.items.map(i => `
    <div class="row">
      <span>${i.quantity}x ${i.name}${i.persona ? ` <em style="color:#888;">(${i.persona})</em>` : ''}</span>
      <span>$${(i.price * i.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  // Group items by persona for persona summary
  const renderPersonaSummary = () => {
    const personas = {};
    order.items.forEach(i => {
      const p = i.persona || 'General';
      if (!personas[p]) personas[p] = { items: [], total: 0 };
      personas[p].items.push(i);
      personas[p].total += i.price * i.quantity;
    });
    const keys = Object.keys(personas);
    if (keys.length <= 1 && keys[0] === 'General') return '';
    
    let html = `<div style="margin-top:10px; padding-top:10px; border-top:1px dashed #000;">
      <strong style="display:block; margin-bottom:6px; font-size:12px;">DESGLOSE POR PERSONA:</strong>`;
    keys.forEach(k => {
      html += `<div class="row" style="font-size:12px; margin-left:8px;">
        <span>${k}</span><span>$${personas[k].total.toFixed(2)}</span>
      </div>`;
    });
    html += '</div>';
    return html;
  };

  const renderTotals = () => {
    let html = '';
    if (order.discount > 0) {
      html += `
        <div class="row" style="font-weight:normal; font-size:12px; margin-top:8px;">
          <span>Subtotal:</span>
          <span>$${order.subtotal?.toFixed(2) || (order.total + order.discount).toFixed(2)}</span>
        </div>
        <div class="row" style="font-weight:normal; font-size:12px; color:#555;">
          <span>Descuento:</span>
          <span>-$${order.discount.toFixed(2)}</span>
        </div>
      `;
    }
    
    if (order.delivery && order.delivery.deliveryFee > 0) {
      html += `
        <div class="row" style="font-weight:normal; font-size:12px; margin-top:4px;">
          <span>Envío:</span>
          <span>+$${order.delivery.deliveryFee.toFixed(2)}</span>
        </div>
      `;
    }

    html += `
      <div class="total" style="margin-top:8px;">TOTAL: $${order.total.toFixed(2)}</div>
      <div class="row" style="font-size:11px; color:#666; justify-content:flex-end;">
        <span>Pago: ${order.paymentMethod || 'Efectivo'}</span>
      </div>
    `;
    
    // Mostrar número de cuenta si el pago es por Transferencia
    if ((order.paymentMethod || '').toLowerCase() === 'transferencia' && config?.transferAccount) {
      html += `
        <div style="margin-top:8px; background:#f0f8ff; border:1px solid #bee3f8; border-radius:6px; padding:8px 10px; font-size:12px; text-align:center;">
          <strong>📲 Cuenta para Transferencia:</strong><br/>
          <span style="font-weight:bold;">${config.transferAccount}</span>
        </div>
      `;
    }
    
    return html;
  };

  const renderNote = () => order.note ? `
    <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #000;">
      <strong>Nota:</strong> ${order.note}
    </div>
  ` : '';

  const renderDelivery = () => {
    if (!order.delivery) return '';
    const { calle, numero, colonia, phone, clientName } = order.delivery;
    const addressLine = `${calle} ${numero ? '#' + numero : ''}`.trim();
    
    return `
    <div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed #000; font-size:12px;">
      <strong style="display:block; margin-bottom:4px; font-size:14px;">🛵 ENTREGA A DOMICILIO</strong>
      ${clientName ? `<strong>Cliente:</strong> ${clientName}<br/>` : ''}
      <strong>Colonia:</strong> ${colonia}<br/>
      <strong>Calle:</strong> ${addressLine}
      ${phone ? `<br/><strong>Tel:</strong> ${phone}` : ''}
    </div>
  `;
  };

  const renderTable = () => {
    if (order.table && !order.delivery) {
      return `
      <div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #000; font-size:14px; text-align:center;">
        <strong>🪑 ${order.table}</strong>
      </div>
      `;
    }
    return '';
  };

  const renderMesero = () => order.mesero ? `
    <div style="text-align:center; font-size:11px; margin-top:2px; margin-bottom:6px;">
      <strong>Atiende:</strong> ${order.mesero}
    </div>
  ` : '';

  const clienteCopy = `
    <div class="ticket">
      <div class="header">
        <strong>${businessName.toUpperCase()}</strong>
        ${slogan ? `<br/><span>${slogan}</span>` : ''}
        ${phone ? `<br/><span>Tel: ${phone}</span>` : ''}
        <br/><span style="margin-top:6px; display:inline-block;">Orden #${displayId} — ${order.time}</span>
      </div>
      ${renderDelivery()}
      ${renderTable()}
      ${renderMesero()}
      <div class="items">
        ${renderItems()}
      </div>
      ${renderTotals()}
      ${renderPersonaSummary()}
      ${renderNote()}
      <p class="thanks" style="margin-top:10px;">¡Gracias por su preferencia!</p>
    </div>
  `;

  const ticketHTML = `
    <html>
      <head>
        <title>Ticket Orden #${displayId}</title>
        <style>
          @page { margin: 0; size: 58mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 14px; color: #000; width: 100%; margin: 0; padding: 8px; }
          .ticket { padding: 4px 0; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; line-height: 1.4; margin-bottom: 8px; }
          .header strong { font-size: 18px; font-weight: bold; }
          .header span { font-size: 12px; color: #333; }
          .items { margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #000; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
          .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 6px; }
          .thanks { text-align: center; font-size: 12px; margin-top: 12px; }
        </style>
      </head>
      <body>
        ${clienteCopy}
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;

  // On mobile, window.open() often fails or shows blank pages for Android.
  // Use an iframe approach instead for more reliable cross-device printing on Android.
  // iOS Safari blocks iframe printing, so we use window.open for iOS and Desktop.
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768 || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function safeExtract(htmlStr, startTag, endTag) {
    const startIdx = htmlStr.indexOf(startTag);
    if (startIdx === -1) return '';
    const endIdx = htmlStr.indexOf(endTag, startIdx + startTag.length);
    if (endIdx === -1) return htmlStr.substring(startIdx + startTag.length);
    return htmlStr.substring(startIdx + startTag.length, endIdx);
  }

  if (isMobile) {
    alert("DEBUG [Ticket] 1: Iniciando...");
    let printContainer = document.getElementById('mobile-print-container');
    if (!printContainer) {
      alert("DEBUG [Ticket] 2: Creando printContainer...");
      printContainer = document.createElement('div');
      printContainer.id = 'mobile-print-container';
      document.body.appendChild(printContainer);
    } else {
      alert("DEBUG [Ticket] 2: Ya existe printContainer");
    }
    
    // Extract body and styles safely
    const bodyContent = safeExtract(ticketHTML, '<body>', '</body>').replace(/<script>.*?<\/script>/g, '');
    const stylesContent = safeExtract(ticketHTML, '<style>', '</style>');
    
    alert("DEBUG [Ticket] 3: bodyContent largo: " + bodyContent.length);
    
    printContainer.innerHTML = `<style>@media print { ${stylesContent} }</style><div class="print-content" style="width: 100%; color: #000;">${bodyContent}</div>`;

    // Add global style to hide everything else during print (if not already added)
    let globalStyle = document.getElementById('mobile-print-style');
    if (!globalStyle) {
      alert("DEBUG [Ticket] 4: Creando styles globales...");
      globalStyle = document.createElement('style');
      globalStyle.id = 'mobile-print-style';
      globalStyle.innerHTML = `
        #mobile-print-container { display: none; }
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: none !important;
          }
          body > *:not(#mobile-print-container) { display: none !important; }
          #mobile-print-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
        }
      `;
      document.head.appendChild(globalStyle);
    } else {
      alert("DEBUG [Ticket] 4: Ya existen styles globales");
    }

    try {
      alert("DEBUG [Ticket] 5: Llamando a window.print()...");
      if (typeof window.print === 'function') {
        window.print();
        alert("DEBUG [Ticket] 6: window.print() llamado con éxito.");
      } else {
        alert("DEBUG [Ticket] 6: ERROR: window.print NO es una función.");
      }
    } catch (err) {
      alert("DEBUG ERROR [Ticket]: " + err.message);
      console.error('Failed to trigger native print:', err);
    }
  } else {
    // Desktop: classic window.open approach
    try {
      const printWindow = window.open('', '_blank', 'width=220,height=800');
      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Failed to open print window:', err);
    }
  }
}
