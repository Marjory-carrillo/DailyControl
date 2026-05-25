import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Phone, Printer, Clock, ClipboardList, Info, Bike, Calendar, Filter, Download, FileText, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { printTicket } from '../../utils/printTicket';

// ─── helpers ─────────────────────────────────────────────────────────────────

const toDateStr = (d) => d.toLocaleDateString('es-MX');
const todayStr = () => toDateStr(new Date());

const parseDate = (str) => {
  if (!str) return new Date();
  const [d, m, y] = str.split('/').map(Number);
  return new Date(y, m - 1, d);
};

const isDateInRange = (dateStr, startStr, endStr) => {
  const d = parseDate(dateStr).getTime();
  const s = parseDate(startStr).setHours(0,0,0,0);
  const e = parseDate(endStr).setHours(23,59,59,999);
  return d >= s && d <= e;
};

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(now.setDate(diff));
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

function exportToCSV(orders, cajaMovements, dateLabel) {
  // Sales sheet
  const header = ['#Orden', 'Hora', 'Tipo', 'Total', 'Método de Pago', 'Mesero', 'Estado'];
  const rows = orders.map(o => [
    `#${o.id}`,
    o.time || '',
    o.delivery ? 'Domicilio' : 'Local',
    `$${(parseFloat(o.total) || 0).toFixed(2)}`,
    o.paymentMethod || 'Efectivo',
    o.mesero || '-',
    o.status === 'ready' ? 'Listo' : o.status === 'completed' ? 'Entregado' : 'Pendiente',
  ]);
  // Caja chica section
  const cajaHeader = ['', '', '', '', '', '', ''];
  const cajaTitle = ['--- CAJA CHICA ---', '', '', '', '', '', ''];
  const cajaHead = ['Tipo', 'Monto', 'Concepto', 'Hora', '', '', ''];
  const cajaRows = cajaMovements.map(m => [
    m.type === 'egreso' ? 'Egreso' : 'Ingreso',
    `$${m.amount.toFixed(2)}`,
    m.description,
    m.time || '',
    '', '', ''
  ]);

  const allRows = [header, ...rows, cajaHeader, cajaTitle, cajaHead, ...cajaRows];
  const csvContent = allRows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-${dateLabel.replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(stats, orders, cajaMovements, dateLabel, config) {
  const businessName = config?.businessName || 'Mi Negocio';

  // Grouping logic
  const allDates = [...new Set([
    ...orders.map(o => o.date || 'Sin fecha'),
    ...cajaMovements.map(m => m.date || 'Sin fecha')
  ])].sort((a,b) => parseDate(a) - parseDate(b));

  const ordersByDate = {};
  orders.forEach(o => { (ordersByDate[o.date || 'Sin fecha'] = ordersByDate[o.date || 'Sin fecha'] || []).push(o); });

  const cajaByDate = {};
  cajaMovements.forEach(m => { (cajaByDate[m.date || 'Sin fecha'] = cajaByDate[m.date || 'Sin fecha'] || []).push(m); });

  const sectionsHtml = allDates.map(date => {
    const dayOrders = ordersByDate[date] || [];
    const dayCaja = cajaByDate[date] || [];

    // Day Stats
    let dTotal = 0, dEfectivo = 0, dTarjeta = 0, dTrans = 0, dLocal = 0, dDom = 0;
    dayOrders.forEach(o => {
      const t = parseFloat(o.total) || 0;
      dTotal += t;
      const m = (o.paymentMethod || 'Efectivo').toLowerCase();
      if (m === 'efectivo') dEfectivo += t;
      else if (m === 'tarjeta') dTarjeta += t;
      else if (m === 'transferencia') dTrans += t;
      if (o.delivery) dDom += t; else dLocal += t;
    });

    const dCajaIng = dayCaja.filter(m => m.type !== 'egreso').reduce((a, m) => a + m.amount, 0);
    const dCajaEgr = dayCaja.filter(m => m.type === 'egreso').reduce((a, m) => a + m.amount, 0);

    const orderRows = dayOrders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.time || ''}</td>
        <td>${o.delivery ? '🛵 Dom.' : 'Local'}</td>
        <td style="text-align:right;font-weight:bold;">$${(parseFloat(o.total)||0).toFixed(2)}</td>
        <td>${o.paymentMethod || 'Efectivo'}</td>
        <td>${o.mesero || '-'}</td>
      </tr>`).join('');

    const cajaRows = dayCaja.map(m => `
      <tr>
        <td style="color:${m.type === 'egreso' ? '#e74c3c' : '#27ae60'}">${m.type === 'egreso' ? 'Egreso' : 'Ingreso'}</td>
        <td>${m.time || ''}</td>
        <td>${m.description}</td>
        <td style="text-align:right;font-weight:bold;color:${m.type === 'egreso' ? '#e74c3c' : '#27ae60'}">${m.type === 'egreso' ? '-' : '+'}$${m.amount.toFixed(2)}</td>
      </tr>`).join('');

    return `
      <div class="day-section">
        <h2 class="day-title">${date}</h2>
        
        <div class="day-summary-row">
          <div class="day-summary-card">
            <strong>Pagos</strong>
            <div>Efectivo: $${dEfectivo.toFixed(2)}</div>
            <div>Tarjeta: $${dTarjeta.toFixed(2)}</div>
            <div>Trans: $${dTrans.toFixed(2)}</div>
            <div class="total-line">Ventas: $${dTotal.toFixed(2)}</div>
          </div>
          <div class="day-summary-card">
            <strong>Entrega</strong>
            <div>Local: $${dLocal.toFixed(2)}</div>
            <div>Domicilio: $${dDom.toFixed(2)}</div>
          </div>
          <div class="day-summary-card">
            <strong>Caja Chica</strong>
            <div style="color:#27ae60">+ Ingres: $${dCajaIng.toFixed(2)}</div>
            <div style="color:#e74c3c">- Egres: $${dCajaEgr.toFixed(2)}</div>
            <div class="total-line">Saldo: $${(dCajaIng - dCajaEgr).toFixed(2)}</div>
          </div>
        </div>

        ${dayOrders.length > 0 ? `
        <h4 style="margin: 15px 0 5px; color:#444; font-size:11px; text-transform:uppercase;">Detalle de Ventas (${dayOrders.length})</h4>
        <table>
          <thead><tr><th>#</th><th>Hora</th><th>Tipo</th><th>Total</th><th>Método</th><th>Atiende</th></tr></thead>
          <tbody>${orderRows}</tbody>
        </table>` : ''}

        ${dayCaja.length > 0 ? `
        <h4 style="margin: 15px 0 5px; color:#444; font-size:11px; text-transform:uppercase;">Movimientos de Caja</h4>
        <table>
          <thead><tr><th>Tipo</th><th>Hora</th><th>Concepto</th><th>Monto</th></tr></thead>
          <tbody>${cajaRows}</tbody>
        </table>` : ''}
      </div>
    `;
  }).join('');

  const win = window.open('', '_blank', 'width=850,height=900');
  win.document.write(`
    <html><head><title>Reporte POS – ${dateLabel}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;font-size:12px;padding:30px;color:#111; line-height:1.4;}
      h1{font-size:22px;margin-bottom:4px; text-align:center;}
      .header-sub{text-align:center; color:#555; margin-bottom:30px; border-bottom:1px solid #ddd; padding-bottom:10px;}
      
      h2.global-title{font-size:16px; margin:10px 0; color:#444; border-left:4px solid var(--primary-color); padding-left:10px;}
      .stats-global{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:40px;}
      .stat-g{border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center; background:#fcfcfc;}
      .stat-g div:first-child{font-size:10px; color:#888; text-transform:uppercase; font-weight:bold;}
      .stat-g .val{font-size:16px;font-weight:bold;color:#e74c3c;margin-top:4px;}

      .day-section{margin-bottom:40px; border-top:2px solid #333; padding-top:20px; page-break-inside: avoid;}
      .day-title{font-size:18px; color:#111; margin-bottom:15px; display:flex; align-items:center; gap:8px;}
      .day-summary-row{display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-bottom:15px;}
      .day-summary-card{background:#f9f9f9; border:1px solid #eee; padding:10px; border-radius:6px;}
      .day-summary-card strong{display:block; margin-bottom:6px; font-size:10px; color:#555; border-bottom:1px solid #eee; padding-bottom:3px;}
      .total-line{margin-top:5px; padding-top:5px; border-top:1px dashed #ccc; font-weight:bold; color:#111;}

      table{width:100%;border-collapse:collapse;margin-bottom:20px;}
      th{background:#f4f4f4;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;font-size:11px;}
      td{padding:5px 8px;border-bottom:1px solid #eee; font-size:11px;}
      
      .footer{margin-top:40px;text-align:center;color:#aaa;font-size:10px; border-top:1px solid #eee; padding-top:20px;}
      @media print {
        .day-section { page-break-after: auto; }
        hr { display: none; }
      }
    </style></head><body>
    <h1>${businessName}</h1>
    <p class="header-sub">Reporte de Ventas: <strong>${dateLabel}</strong><br>Generado: ${new Date().toLocaleString()}</p>

    <h2 class="global-title">RESUMEN GLOBAL DEL PERIODO</h2>
    <div class="stats-global">
      <div class="stat-g"><div>Total Ventas</div><div class="val">$${stats.total.toFixed(2)}</div></div>
      <div class="stat-g"><div>Efectivo</div><div class="val" style="color:#10ac84">$${stats.efectivo.toFixed(2)}</div></div>
      <div class="stat-g"><div>Tarjeta</div><div class="val" style="color:#0984e3">$${stats.tarjeta.toFixed(2)}</div></div>
      <div class="stat-g"><div>Transferencia</div><div class="val" style="color:#6c5ce7">$${stats.transferencia.toFixed(2)}</div></div>
    </div>

    ${sectionsHtml}

    <div class="footer">
      DailyControl POS — Sistema de Punto de Venta Premium<br>
      ${orders.length} órdenes registradas en este periodo
    </div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
  win.document.close();
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DashboardView() {
  const { config } = useApp();

  // ── state
  const [allOrders, setAllOrders] = useState([]);
  const [dateRange, setDateRange] = useState({ start: todayStr(), end: todayStr() });
  const [rangeType, setRangeType] = useState('hoy'); // hoy, semana, mes, personalizado
  const [filterMesero, setFilterMesero] = useState('Todos');
  const [filterMethod, setFilterMethod] = useState('Todos');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [expandedOrder, setExpandedOrder] = useState(null); // order index to expand
  const [cajaMovements, setCajaMovements] = useState([]);
  const [showRangePicker, setShowRangePicker] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── load all orders + caja chica from localStorage, poll every 5s
  useEffect(() => {
    const load = () => {
      setAllOrders(JSON.parse(localStorage.getItem('orderHistory') || '[]'));
      setCajaMovements(JSON.parse(localStorage.getItem('cajaChica') || '[]'));
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  // ── unique meseros list for filter
  const meseroList = useMemo(() => {
    const names = new Set();
    allOrders.forEach(o => { if (o.mesero) names.add(o.mesero); });
    return ['Todos', ...Array.from(names)];
  }, [allOrders]);

  // ── filter orders by date range + optional filters
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const inRange = isDateInRange(o.date || '', dateRange.start, dateRange.end);
      const matchMesero = filterMesero === 'Todos' || o.mesero === filterMesero;
      const matchMethod = filterMethod === 'Todos' || (o.paymentMethod || 'Efectivo') === filterMethod;
      return inRange && matchMesero && matchMethod;
    }).reverse();
  }, [allOrders, dateRange, filterMesero, filterMethod]);

  // ── stats for filtered orders
  const stats = useMemo(() => {
    let total = 0, efectivo = 0, tarjeta = 0, transferencia = 0;
    const productData = {}; // { name: { count, revenue } }
    filteredOrders.forEach(o => {
      const t = parseFloat(o.total) || 0;
      total += t;
      const m = (o.paymentMethod || 'Efectivo').toLowerCase();
      if (m === 'efectivo') efectivo += t;
      else if (m === 'tarjeta') tarjeta += t;
      else if (m === 'transferencia') transferencia += t;
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (item?.name) {
            const qty = item.quantity || 1;
            const rev = (parseFloat(item.price) || 0) * qty;
            if (!productData[item.name]) productData[item.name] = { count: 0, revenue: 0 };
            productData[item.name].count += qty;
            productData[item.name].revenue += rev;
          }
        });
      }
    });
    const allProducts = Object.entries(productData)
      .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }))
      .sort((a, b) => b.count - a.count);
    const topProducts = allProducts.slice(0, 5);
    const totalUnits = allProducts.reduce((s, p) => s + p.count, 0);
    const totalProductRevenue = allProducts.reduce((s, p) => s + p.revenue, 0);
    return { total, efectivo, tarjeta, transferencia, count: filteredOrders.length, topProducts, allProducts, totalUnits, totalProductRevenue };
  }, [filteredOrders]);

  // ── caja chica stats for selected range
  const rangeCaja = useMemo(() => {
    const filtered = cajaMovements.filter(m => isDateInRange(m.date || '', dateRange.start, dateRange.end));
    const ingresos = filtered.filter(m => m.type !== 'egreso').reduce((a, m) => a + m.amount, 0);
    const egresos = filtered.filter(m => m.type === 'egreso').reduce((a, m) => a + m.amount, 0);
    return { items: filtered, ingresos, egresos, saldo: ingresos - egresos };
  }, [cajaMovements, dateRange]);

  const handleRangePreset = (type) => {
    setRangeType(type);
    if (type === 'hoy') {
      setDateRange({ start: todayStr(), end: todayStr() });
    } else if (type === 'semana') {
      setDateRange({ start: toDateStr(getStartOfWeek()), end: todayStr() });
    } else if (type === 'mes') {
      setDateRange({ start: toDateStr(getStartOfMonth()), end: todayStr() });
    }
    setShowRangePicker(false);
  };

  const handleCustomDate = (key, val) => {
    const d = new Date(val + 'T00:00:00');
    setDateRange(prev => ({ ...prev, [key]: toDateStr(d) }));
    setRangeType('personalizado');
  };

  const toInputVal = (str) => {
    const parts = str.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
    return '';
  };

  const rangeLabel = rangeType === 'hoy' ? 'Hoy'
    : rangeType === 'semana' ? 'Esta Semana'
    : rangeType === 'mes' ? 'Este Mes'
    : `${dateRange.start} - ${dateRange.end}`;

  return (
    <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '20px', height: isMobile ? 'auto' : '100%', overflowY: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '20px' : '0' }}>

      {/* ── Header bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={28} /> Resumen de Ventas
        </h1>

        {/* Date range picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', position: 'relative' }}>
          <div
            onClick={() => setShowRangePicker(!showRangePicker)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px 18px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
          >
            <Calendar size={18} color="var(--primary-color)" />
            <span style={{ fontWeight: '700', color: '#444', fontSize: '0.95rem' }}>{rangeLabel}</span>
            <Filter size={14} color="#999" />
          </div>

          {showRangePicker && (
            <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, padding: '16px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', background: 'white' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleRangePreset('hoy')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: rangeType === 'hoy' ? 'var(--primary-color)' : 'white', color: rangeType === 'hoy' ? 'white' : '#666', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Hoy</button>
                <button onClick={() => handleRangePreset('semana')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: rangeType === 'semana' ? 'var(--primary-color)' : 'white', color: rangeType === 'semana' ? 'white' : '#666', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Semana</button>
                <button onClick={() => handleRangePreset('mes')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: rangeType === 'mes' ? 'var(--primary-color)' : 'white', color: rangeType === 'mes' ? 'white' : '#666', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Mes</button>
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '700', color: '#999' }}>RANGO PERSONALIZADO</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Desde:</span>
                    <input type="date" value={toInputVal(dateRange.start)} onChange={(e) => handleCustomDate('start', e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Hasta:</span>
                    <input type="date" value={toInputVal(dateRange.end)} onChange={(e) => handleCustomDate('end', e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>
              <button onClick={() => setShowRangePicker(false)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#f5f5f5', color: '#444', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>Cerrar</button>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={() => exportToCSV(filteredOrders, rangeCaja.items, rangeLabel)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '14px', border: 'none', background: '#1dd1a1', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(29,209,161,0.2)' }}
          >
            <Download size={16} /> Exportar CSV
          </button>

          <button
            onClick={() => printReport(stats, filteredOrders, rangeCaja.items, rangeLabel, config)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '14px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(231,76,60,0.2)' }}
          >
            <FileText size={16} /> Imprimir Reporte
          </button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard icon={<DollarSign />} title="Total Ventas" value={`$${stats.total.toFixed(2)}`} color="#e74c3c" />
        <StatCard icon={<DollarSign />} title="Efectivo" value={`$${stats.efectivo.toFixed(2)}`} color="#1dd1a1" />
        <StatCard icon={<CreditCard />} title="Tarjeta" value={`$${stats.tarjeta.toFixed(2)}`} color="#0984e3" />
        <StatCard icon={<Phone />} title="Transferencias" value={`$${stats.transferencia.toFixed(2)}`} color="#6c5ce7" />
        <StatCard icon={<ShoppingBag />} title="Órdenes" value={stats.count} color="#ff9f43" />
      </div>

      {/* ── Sales Bar Chart ── */}
      {(() => {
        // Group all orders (not just filtered) by date within range
        const salesByDate = {};
        allOrders.forEach(o => {
          if (o.date && isDateInRange(o.date, dateRange.start, dateRange.end)) {
            salesByDate[o.date] = (salesByDate[o.date] || 0) + (parseFloat(o.total) || 0);
          }
        });
        const entries = Object.entries(salesByDate).sort((a, b) => parseDate(a[0]) - parseDate(b[0]));
        if (entries.length <= 1) return null; // No chart for single day
        const maxVal = Math.max(...entries.map(e => e[1]), 1);
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Ventas por Día
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', padding: '0 4px' }}>
              {entries.map(([date, amount]) => {
                const pct = (amount / maxVal) * 100;
                const d = parseDate(date);
                const dayLabel = dayNames[d.getDay()];
                const dateLabel = date.split('/').slice(0, 2).join('/');
                return (
                  <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                      ${amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount.toFixed(0)}
                    </span>
                    <div style={{
                      width: '100%', maxWidth: '40px', borderRadius: '6px 6px 2px 2px',
                      height: `${Math.max(pct, 4)}%`,
                      background: 'linear-gradient(180deg, #ff6b6b 0%, #ee5a24 100%)',
                      transition: 'height 0.4s ease',
                      minHeight: '4px',
                    }} />
                    <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#555', display: 'block' }}>{dayLabel}</span>
                      <span style={{ fontSize: '0.6rem', color: '#999' }}>{dateLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Caja Chica summary ── */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '1rem', color: 'var(--text-dark)' }}>
          💼 Caja Chica ({rangeLabel})
          <span style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)' }}>{rangeCaja.items.length} movimientos</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', display: 'block' }}>INGRESOS CAJA</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1dd1a1' }}>+${rangeCaja.ingresos.toFixed(2)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', display: 'block' }}>EGRESOS CAJA</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#e74c3c' }}>-${rangeCaja.egresos.toFixed(2)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', display: 'block' }}>SALDO CAJA</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0984e3' }}>${rangeCaja.saldo.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Middle row (Top products + Filters) ── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* Top Products */}
        {/* Product Sales Breakdown */}
        <div className="glass-panel" style={{ flex: '1 1 260px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: isMobile ? 'none' : '340px' }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--primary-color)" /> Desglose por Producto
          </h2>
          {stats.allProducts.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin ventas en este periodo.</p>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, background: 'white' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '700', color: '#888', fontSize: '0.75rem' }}>PRODUCTO</th>
                      <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: '700', color: '#888', fontSize: '0.75rem' }}>CANT</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '700', color: '#888', fontSize: '0.75rem' }}>VENTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.allProducts.map((p, i) => (
                      <tr key={p.name} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                        <td style={{ padding: '7px 8px', fontWeight: '600' }}>{p.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(108,92,231,0.1)', color: '#6c5ce7', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.82rem' }}>{p.count}</span>
                        </td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: '600', color: '#333' }}>${p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Grand totals */}
              <div style={{ borderTop: '2px solid var(--primary-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-dark)' }}>TOTAL</span>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ background: '#6c5ce7', color: 'white', padding: '3px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem' }}>{stats.totalUnits} pzas</span>
                  <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--primary-color)' }}>${stats.totalProductRevenue.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="glass-panel" style={{ flex: '1 1 260px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} color="var(--primary-color)" /> Filtros
          </h2>

          {/* Method filter */}
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)' }}>MÉTODO DE PAGO</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Todos', 'Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                <button key={m} onClick={() => setFilterMethod(m)} style={{
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.82rem', transition: 'all 0.2s',
                  background: filterMethod === m ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
                  color: filterMethod === m ? '#fff' : 'var(--text-dark)',
                  border: filterMethod === m ? 'none' : '1px solid rgba(0,0,0,0.1)',
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Mesero filter */}
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)' }}>MESERO</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {meseroList.map(m => (
                <button key={m} onClick={() => setFilterMesero(m)} style={{
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.82rem', transition: 'all 0.2s',
                  background: filterMesero === m ? '#6c5ce7' : 'rgba(0,0,0,0.04)',
                  color: filterMesero === m ? '#fff' : 'var(--text-dark)',
                  border: filterMesero === m ? 'none' : '1px solid rgba(0,0,0,0.1)',
                }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Active filter badge */}
          {(filterMesero !== 'Todos' || filterMethod !== 'Todos') && (
            <button onClick={() => { setFilterMesero('Todos'); setFilterMethod('Todos'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.85rem', alignSelf: 'flex-start' }}>
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Orders history table ── */}
      <div className="glass-panel" style={{ padding: '20px', flex: isMobile ? 'none' : 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: isMobile ? '0' : '200px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={20} color="var(--primary-color)" />
          Historial — {rangeLabel}
          <span style={{ marginLeft: 6, background: 'var(--primary-color)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px' }}>{filteredOrders.length} órdenes</span>
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', borderRadius: '10px', border: isMobile ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px' }}>
              {filteredOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No hay órdenes para este periodo/filtro.</p>
              ) : filteredOrders.map((order, i) => {
                const safeTotal = parseFloat(order.total) || 0;
                const method = order.paymentMethod || 'Efectivo';
                const methodColor = method === 'Efectivo' ? { bg: 'rgba(29,209,161,0.12)', fg: '#10ac84' }
                  : method === 'Tarjeta' ? { bg: 'rgba(9,132,227,0.12)', fg: '#0984e3' }
                  : { bg: 'rgba(108,92,231,0.12)', fg: '#6c5ce7' };
                const isExpanded = expandedOrder === `m-${i}`;
                return (
                  <div key={`${order.id}-${i}`} style={{ background: '#fff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    {/* Header — tappable */}
                    <div onClick={() => setExpandedOrder(isExpanded ? null : `m-${i}`)} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-dark)' }}>#{order.id}</span>
                          <span style={{ color: '#888', fontSize: '0.8rem' }}><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{order.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {order.delivery
                            ? <span style={{ color: 'var(--primary-color)', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid var(--primary-color)', padding: '2px 4px', borderRadius: '4px' }}><Bike size={10} style={{ verticalAlign: 'middle' }} /> DOM</span>
                            : <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 'bold' }}>Local</span>}
                          <span style={{ background: methodColor.bg, color: methodColor.fg, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>{method}</span>
                          {order.mesero && <span style={{ fontSize: '0.75rem', color: '#666' }}>👤 {order.mesero}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-color)' }}>${safeTotal.toFixed(2)}</span>
                        <span style={{ fontSize: '0.7rem', color: '#aaa', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>
                    </div>
                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding: '0 14px 12px', borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                        {order.table && <p style={{ margin: '8px 0 4px', fontSize: '0.82rem', color: '#2980b9', fontWeight: '700' }}>🪑 {order.table}</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              <span><strong>{item.quantity}x</strong> {item.name}{item.persona ? <em style={{ color: '#6c5ce7', fontSize: '0.75rem', marginLeft: 4 }}>({item.persona})</em> : ''}</span>
                              <span style={{ color: '#555', fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {order.note && <p style={{ margin: '8px 0 4px', fontSize: '0.82rem', color: '#b97a00', background: 'rgba(254,202,87,0.15)', padding: '6px 8px', borderRadius: '6px' }}>📝 {order.note}</p>}
                        {order.discount > 0 && <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#10ac84' }}>Descuento: -${order.discount.toFixed(2)}</p>}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button onClick={(e) => { e.stopPropagation(); printTicket(order, config); }}
                            style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', background: '#fcfcfc', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700', borderRadius: '8px', padding: '8px', fontFamily: 'inherit' }}>
                            <Printer size={14} /> Reimprimir Ticket
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
              <tr>
                {['ID', 'Hora', 'Tipo', 'Total', 'Método', 'Atiende', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', borderBottom: '1px solid #e8e8e8', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>No hay órdenes para este periodo/filtro.</td></tr>
              ) : filteredOrders.map((order, i) => {
                const safeTotal = parseFloat(order.total) || 0;
                const method = order.paymentMethod || 'Efectivo';
                const methodColor = method === 'Efectivo' ? { bg: 'rgba(29,209,161,0.12)', fg: '#10ac84' }
                  : method === 'Tarjeta' ? { bg: 'rgba(9,132,227,0.12)', fg: '#0984e3' }
                  : { bg: 'rgba(108,92,231,0.12)', fg: '#6c5ce7' };
                const isExpanded = expandedOrder === `d-${i}`;
                return (
                  <React.Fragment key={`${order.id}-${i}`}>
                  <tr onClick={() => setExpandedOrder(isExpanded ? null : `d-${i}`)} style={{ borderBottom: isExpanded ? 'none' : '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 'bold' }}>#{order.id}</td>
                    <td style={{ padding: '11px 14px', color: '#888', whiteSpace: 'nowrap' }}>
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{order.time}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {order.delivery
                        ? <span style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--primary-color)', padding: '2px 6px', borderRadius: '6px' }}><Bike size={11} style={{ verticalAlign: 'middle' }} /> DOM</span>
                        : <span style={{ fontSize: '0.8rem', color: '#555' }}>Local</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 'bold' }}>${safeTotal.toFixed(2)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: methodColor.bg, color: methodColor.fg, padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>{method}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>{order.mesero || '-'}</td>
                    <td style={{ padding: '11px 14px', color: order.status === 'completed' ? '#1dd1a1' : '#888' }}>
                      {order.status === 'ready' ? '✓ Listo' : order.status === 'completed' ? '✓ Entregado' : 'Pendiente'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={(e) => { e.stopPropagation(); printTicket(order, config); }}
                        style={{ border: '1px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: '600', borderRadius: '7px', padding: '5px 10px', fontFamily: 'inherit' }}>
                        <Printer size={14} /> Imprimir
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: '#f9f9ff', borderBottom: '1px solid #f0f0f0' }}>
                      <td colSpan="8" style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '0.85rem', color: '#333' }}>📋 Productos:</p>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '3px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                <span><strong>{item.quantity}x</strong> {item.name}{item.persona ? <em style={{ color: '#6c5ce7', fontSize: '0.78rem', marginLeft: 4 }}>({item.persona})</em> : ''}</span>
                                <span style={{ color: '#555', fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ minWidth: '150px' }}>
                            {order.table && <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#2980b9', fontWeight: '600' }}>🪑 {order.table}</p>}
                            {order.note && <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#b97a00', background: 'rgba(254,202,87,0.15)', padding: '4px 6px', borderRadius: '4px' }}>📝 {order.note}</p>}
                            {order.discount > 0 && <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#10ac84' }}>Descuento: -${order.discount.toFixed(2)}</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ padding: '12px', background: `${color}22`, borderRadius: '12px', color }}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: '600' }}>{title}</p>
        <h2 style={{ margin: '3px 0 0', fontSize: '1.5rem', color: 'var(--text-dark)' }}>{value}</h2>
      </div>
    </div>
  );
}
