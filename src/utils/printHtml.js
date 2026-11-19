// Cola de impresión: cada trabajo espera a que termine el anterior. Sin esto, imprimir
// comanda y ticket seguidos hace que el segundo reemplace al primero antes de imprimirse.
let queue = Promise.resolve();

function printOne(html) {
  return new Promise((resolve) => {
    const container = document.getElementById('print-container');
    if (!container) {
      const printWindow = window.open('', '_blank', 'width=220,height=800');
      if (printWindow) {
        printWindow.document.write(`<html><body>${html}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); resolve(); }, 100);
      } else {
        resolve();
      }
      return;
    }

    container.innerHTML = html;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('afterprint', finish);
      resolve();
    };
    window.addEventListener('afterprint', finish);
    setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(finish, 1500); // por si el navegador no dispara afterprint (o print falla)
      }
    }, 100);
  });
}

export function printHtml(html) {
  queue = queue.then(() => printOne(html)).catch(err => console.error('Error al imprimir:', err));
  return queue;
}
