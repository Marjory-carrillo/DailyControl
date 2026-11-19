// Escapa texto antes de meterlo en HTML armado a mano (tickets, comandas, reportes).
// Sin esto, una nota como <img onerror=...> se ejecutaría en el dispositivo que imprime.
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => MAP[ch]);
