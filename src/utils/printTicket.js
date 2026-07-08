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
      <div style="text-align: center; margin-top: 15px; font-weight: bold; font-size: 14px;">
        . . . . . . . . . . . . . . .
        <br/><br/>
        . . . . . . . . . . . . . . .
        <br/><br/>
      </div>
    </div>
  `;

  const ticketHTML = `
    <div class="ticket-wrapper">
      <style>
        @page { margin: 0; size: 58mm auto; }
        .ticket-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }
        .ticket-wrapper { font-family: monospace; font-size: 16px; font-weight: bold; color: #000; width: 100%; margin: 0; padding: 8px; line-height: 1.4; }
        .ticket { padding: 4px 0; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; line-height: 1.4; margin-bottom: 8px; }
        .header strong { font-size: 20px; font-weight: 900; }
        .header span { font-size: 14px; font-weight: bold; }
        .items { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 2px solid #000; }
        .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 16px; font-weight: bold; }
        .total { text-align: right; font-weight: 900; font-size: 19px; margin-top: 6px; }
        .thanks { text-align: center; font-size: 14px; font-weight: bold; margin-top: 12px; }
      </style>
      ${clienteCopy}
    </div>
  `;

  try {
    const printContainer = document.getElementById('print-container');
    if (printContainer) {
      printContainer.innerHTML = ticketHTML;
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      console.error("El contenedor de impresión (#print-container) no existe en el DOM.");
      // Fallback a window.open si no existe el contenedor
      const printWindow = window.open('', '_blank', 'width=220,height=800');
      if (printWindow) {
        printWindow.document.write(`<html><body>${ticketHTML}</body></html>`);
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
