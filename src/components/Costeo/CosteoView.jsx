import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, ChefHat, TrendingUp, Package,
  X, Check, FlaskConical, ClipboardList, BarChart2,
  AlertTriangle, Loader2, Scale, Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useCosteo } from '../../context/CosteoContext';

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = {
  padding: '10px 13px', borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.75)',
  fontFamily: 'inherit', fontSize: '0.92rem', color: '#222',
  outline: 'none', boxSizing: 'border-box', width: '100%',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: '700', color: '#777',
  marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px',
};
const UNITS = ['kg', 'g', 'litro', 'ml', 'pieza', 'bolsa', 'caja', 'rollo', 'manojo'];

function Pill({ color, children }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px',
      borderRadius: '20px', background: color + '22', color,
    }}>{children}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px',
      border: '1px solid rgba(0,0,0,0.06)', padding: '14px 16px', ...style,
    }}>
      {children}
    </div>
  );
}

function StatBox({ label, value, color = '#333', sub = '' }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', padding: '14px 16px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '900', color }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: '0.73rem', color: '#aaa' }}>{sub}</p>}
    </div>
  );
}

// ── Tab 1: Ingredientes ───────────────────────────────────────────────────────
function IngredientesTab() {
  const { addToast } = useToast();
  const { ingredientes, addIngrediente, updateIngrediente, deleteIngrediente } = useCosteo();
  const empty = { nombre: '', unidad: 'kg', precio: '', porciones: '' };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const costoPorPorcion = (form.precio && form.porciones && parseFloat(form.porciones) > 0)
    ? (parseFloat(form.precio) / parseFloat(form.porciones)).toFixed(3) : null;

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.precio || !form.porciones) {
      addToast('Llena todos los campos.', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        precio: parseFloat(form.precio),
        porciones: parseFloat(form.porciones),
      };
      if (editId) {
        await updateIngrediente(editId, payload);
        addToast('Ingrediente actualizado ✓', 'success');
      } else {
        await addIngrediente(payload);
        addToast('Ingrediente agregado ✓', 'success');
      }
      setForm(empty); setEditId(null);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteIngrediente(id);
      addToast('Ingrediente eliminado', 'success');
    } catch (e) { addToast('Error: ' + e.message, 'error'); }
  };

  const startEdit = (ing) => {
    setEditId(ing.id);
    setForm({ nombre: ing.nombre, unidad: ing.unidad, precio: String(ing.precio), porciones: String(ing.porciones) });
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', overflowY: 'auto', height: '100%' }}>
      {/* Form */}
      <div style={{ width: '300px', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '10px' }}>
            {editId ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}
          </h3>
          <div>
            <label style={lbl}>Nombre</label>
            <input style={inp} placeholder="Ej: Pollo crudo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Unidad de compra</label>
            <select style={inp} value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Precio de compra ($) por {form.unidad}</label>
            <input style={inp} type="number" min="0" step="0.01" placeholder="0.00" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Porciones / tacos que rinde por {form.unidad}</label>
            <input style={inp} type="number" min="1" step="0.5" placeholder="Ej: 12 tacos por kg" value={form.porciones} onChange={e => setForm(f => ({ ...f, porciones: e.target.value }))} />
            {costoPorPorcion && (
              <p style={{ margin: '5px 0 0', fontSize: '0.82rem', color: '#27ae60', fontWeight: '700' }}>
                💰 Costo por porción: ${costoPorPorcion}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />} {editId ? 'Guardar' : 'Agregar'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(empty); }} style={{ padding: '11px 13px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        <Card>
          <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: '700', color: '#aaa' }}>TOTAL INGREDIENTES</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#333' }}>{ingredientes.length}</p>
        </Card>
      </div>

      {/* List */}
      <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', minWidth: '260px', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>📦 Catálogo de Ingredientes</h3>
        {ingredientes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', marginTop: '40px' }}>
            <Package size={48} style={{ marginBottom: '10px', opacity: 0.4 }} />
            <p>Agrega el primer ingrediente.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', padding: '6px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', color: '#999' }}>
              <span>NOMBRE</span><span>UNIDAD</span><span>PRECIO</span><span>$/PORCIÓN</span><span></span>
            </div>
            {ingredientes.map(ing => (
              <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{ing.nombre}</span>
                <Pill color="#0984e3">{ing.unidad}</Pill>
                <span style={{ fontWeight: '600' }}>${ing.precio.toFixed(2)}</span>
                <span style={{ color: '#27ae60', fontWeight: '700', fontSize: '0.88rem' }}>${(ing.precio / ing.porciones).toFixed(3)}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => startEdit(ing)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(ing.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: '4px' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Preparaciones ──────────────────────────────────────────────────────
function PreparacionesTab() {
  const { addToast } = useToast();
  const { ingredientes, preparaciones, addPreparacion, updatePreparacion, deletePreparacion, getCostoPreparacion } = useCosteo();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', porciones: '', gramos_por_porcion: '' });
  const [lines, setLines] = useState([]);   // [{source, source_id, cantidad}]
  const [addLine, setAddLine] = useState(false);
  const [newLine, setNewLine] = useState({ source: 'ingrediente', source_id: '', cantidad: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const allSources = [
    ...ingredientes.map(i => ({ label: `[Ing] ${i.nombre}`, value: i.id, source: 'ingrediente' })),
    ...preparaciones.filter(p => p.id !== editId).map(p => ({ label: `[Prep] ${p.nombre}`, value: p.id, source: 'preparacion' })),
  ];

  const costoTotal = lines.reduce((sum, l) => {
    if (l.source === 'ingrediente') {
      const ing = ingredientes.find(i => i.id === l.source_id);
      return ing ? sum + (ing.precio / ing.porciones) * l.cantidad : sum;
    }
    return sum + getCostoPreparacion(l.source_id) * l.cantidad;
  }, 0);

  const porciones = parseFloat(form.porciones) || 0;
  const costoPorcion = porciones > 0 ? costoTotal / porciones : 0;

  const resetForm = () => {
    setForm({ nombre: '', descripcion: '', porciones: '', gramos_por_porcion: '' });
    setLines([]); setEditId(null); setAddLine(false);
  };

  const startEdit = (prep) => {
    setEditId(prep.id);
    setForm({ nombre: prep.nombre, descripcion: prep.descripcion || '', porciones: String(prep.porciones || ''), gramos_por_porcion: String(prep.gramos_por_porcion || '') });
    setLines(prep.ingredientes || []);
    setSelected(null);
  };

  const handleAddLine = () => {
    if (!newLine.source_id || !newLine.cantidad || parseFloat(newLine.cantidad) <= 0) {
      addToast('Selecciona ingrediente y cantidad.', 'error'); return;
    }
    const src = allSources.find(s => s.value === newLine.source_id);
    setLines(prev => [...prev, { source: src.source, source_id: newLine.source_id, cantidad: parseFloat(newLine.cantidad) }]);
    setNewLine({ source: 'ingrediente', source_id: '', cantidad: '' });
    setAddLine(false);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.porciones || lines.length === 0) {
      addToast('Llena nombre, porciones y agrega al menos 1 ingrediente.', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        porciones: parseFloat(form.porciones),
        gramos_por_porcion: parseFloat(form.gramos_por_porcion) || null,
        ingredientes: lines,
      };
      if (editId) {
        await updatePreparacion(editId, payload);
        addToast('Preparación actualizada ✓', 'success');
      } else {
        await addPreparacion(payload);
        addToast('Preparación creada ✓', 'success');
      }
      resetForm();
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deletePreparacion(id); addToast('Preparación eliminada', 'success'); }
    catch (e) { addToast('Error: ' + e.message, 'error'); }
  };

  const getLineName = (l) => {
    if (l.source === 'ingrediente') return ingredientes.find(i => i.id === l.source_id)?.nombre || '—';
    return preparaciones.find(p => p.id === l.source_id)?.nombre || '—';
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>
      {/* Left: list */}
      <div style={{ width: '240px', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Preparaciones</p>
          {preparaciones.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.82rem' }}>Sin preparaciones aún.</p>
          ) : preparaciones.map(p => (
            <button key={p.id} onClick={() => { setSelected(p.id); resetForm(); }}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: selected === p.id ? 'var(--primary-color)' : 'transparent', color: selected === p.id ? 'white' : '#333', marginBottom: '4px', fontWeight: '600', fontSize: '0.88rem' }}>
              🍳 {p.nombre}
              <span style={{ display: 'block', fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>${getCostoPreparacion(p.id).toFixed(3)}/porción</span>
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.88rem' }}
          onClick={() => { resetForm(); setSelected('__new__'); }}>
          <Plus size={14} /> Nueva Preparación
        </button>
      </div>

      {/* Right: detail / form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px', overflowY: 'auto' }}>
        {selected === null && preparaciones.length > 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#ccc' }}>
            <FlaskConical size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Selecciona una preparación para ver el detalle.</p>
          </div>
        )}

        {/* Read-only detail */}
        {selected && selected !== '__new__' && !editId && (() => {
          const prep = preparaciones.find(p => p.id === selected);
          if (!prep) return null;
          const costo = getCostoPreparacion(prep.id);
          return (
            <>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🍳 {prep.nombre}</h3>
                    {prep.descripcion && <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>{prep.descripcion}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEdit(prep)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: '700' }}><Pencil size={13} /> Editar</button>
                    <button onClick={() => handleDelete(prep.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: '700' }}><Trash2 size={13} /> Eliminar</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '10px', marginBottom: '16px' }}>
                  <StatBox label="Porciones" value={prep.porciones} sub={prep.gramos_por_porcion ? `${prep.gramos_por_porcion}g c/u` : ''} color="#0984e3" />
                  <StatBox label="Costo total" value={`$${(costo * prep.porciones).toFixed(2)}`} color="#e74c3c" />
                  <StatBox label="Costo / porción" value={`$${costo.toFixed(3)}`} color="#27ae60" sub="con merma incl." />
                </div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#666' }}>Ingredientes que usa:</h4>
                {(prep.ingredientes || []).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '6px', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: '600' }}>{getLineName(l)}</span>
                    <span style={{ color: '#888' }}>{l.cantidad} porc.</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        {/* Form (new or edit) */}
        {(selected === '__new__' || editId) && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '10px' }}>
              {editId ? '✏️ Editar Preparación' : '➕ Nueva Preparación'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nombre de la preparación</label>
                <input style={inp} placeholder="Ej: Deshebrada guisada" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción (opcional)</label>
                <input style={inp} placeholder="Ej: Pollo cocido con chile rojo casero" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>¿Cuántas porciones / tacos rinde?</label>
                <input style={inp} type="number" min="1" placeholder="Ej: 40" value={form.porciones} onChange={e => setForm(f => ({ ...f, porciones: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Gramos por porción (opcional)</label>
                <input style={inp} type="number" min="1" placeholder="Ej: 80g por taco" value={form.gramos_por_porcion} onChange={e => setForm(f => ({ ...f, gramos_por_porcion: e.target.value }))} />
              </div>
            </div>

            {/* Ingredients of this preparation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...lbl, margin: 0 }}>Ingredientes que usa</label>
                {!addLine && <button onClick={() => setAddLine(true)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> Agregar</button>}
              </div>
              {lines.length === 0 && !addLine && (
                <p style={{ color: '#bbb', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>Agrega los ingredientes que usa esta preparación.</p>
              )}
              {lines.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '5px', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: '600' }}>
                    <Pill color={l.source === 'ingrediente' ? '#0984e3' : '#6c5ce7'}>{l.source === 'ingrediente' ? 'Ing' : 'Prep'}</Pill> {getLineName(l)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#888' }}>{l.cantidad} porc.</span>
                    <button onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: '2px' }}><Trash2 size={13} /></button>
                  </span>
                </div>
              ))}
              {addLine && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '8px', padding: '10px', background: '#fff9e6', borderRadius: '10px', border: '2px dashed #f39c12', alignItems: 'center', marginTop: '6px' }}>
                  <select style={inp} value={newLine.source_id} onChange={e => {
                    const src = allSources.find(s => s.value === e.target.value);
                    setNewLine(l => ({ ...l, source_id: e.target.value, source: src?.source || 'ingrediente' }));
                  }}>
                    <option value="">— Selecciona —</option>
                    {allSources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <input style={inp} type="number" min="0.1" step="0.1" placeholder="Porciones" value={newLine.cantidad} onChange={e => setNewLine(l => ({ ...l, cantidad: e.target.value }))} />
                  <button onClick={handleAddLine} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}><Check size={15} /></button>
                  <button onClick={() => setAddLine(false)} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}><X size={15} /></button>
                </div>
              )}
            </div>

            {/* Cost preview */}
            {lines.length > 0 && porciones > 0 && (
              <div style={{ background: 'rgba(39,174,96,0.08)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#555' }}>Costo estimado por porción:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#27ae60' }}>${costoPorcion.toFixed(3)}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} /> : <Check size={15} />} {editId ? 'Guardar Cambios' : 'Crear Preparación'}
              </button>
              <button onClick={resetForm} style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer' }}><X size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Recetas ────────────────────────────────────────────────────────────
function RecetasTab() {
  const { addToast } = useToast();
  const { products } = useApp();
  const { ingredientes, preparaciones, recetas, upsertReceta, getRecetaByProduct, getCostoIngrediente, getCostoPreparacion, getCostoReceta } = useCosteo();
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || null);
  const [lines, setLines] = useState([]);
  const [editing, setEditing] = useState(false);
  const [addLine, setAddLine] = useState(false);
  const [newLine, setNewLine] = useState({ source: 'ingrediente', source_id: '', qty: '' });
  const [saving, setSaving] = useState(false);

  const allSources = [
    ...ingredientes.map(i => ({ label: `[Ing] ${i.nombre}`, value: i.id, source: 'ingrediente' })),
    ...preparaciones.map(p => ({ label: `[Prep] ${p.nombre}`, value: p.id, source: 'preparacion' })),
  ];

  const receta = getRecetaByProduct(selectedProduct);
  const prod = products.find(p => p.id === selectedProduct);
  const costo = getCostoReceta(selectedProduct);
  const ganancia = prod ? prod.price - costo : 0;
  const margen = prod && prod.price > 0 ? (ganancia / prod.price * 100) : 0;
  const margenColor = margen >= 60 ? '#27ae60' : margen >= 40 ? '#f39c12' : '#e74c3c';

  const startEdit = () => {
    setLines(receta?.lines ? receta.lines.map(l => ({ ...l })) : []);
    setEditing(true);
  };

  const handleAddLine = () => {
    if (!newLine.source_id || !newLine.qty || parseFloat(newLine.qty) <= 0) {
      addToast('Selecciona fuente y cantidad.', 'error'); return;
    }
    const src = allSources.find(s => s.value === newLine.source_id);
    setLines(prev => [...prev, { source: src.source, source_id: newLine.source_id, qty: parseFloat(newLine.qty) }]);
    setNewLine({ source: 'ingrediente', source_id: '', qty: '' });
    setAddLine(false);
  };

  const linePreviewCost = (l) => {
    if (l.source === 'ingrediente') return getCostoIngrediente(l.source_id) * l.qty;
    return getCostoPreparacion(l.source_id) * l.qty;
  };

  const getLineName = (l) => {
    if (l.source === 'ingrediente') return ingredientes.find(i => i.id === l.source_id)?.nombre || '—';
    return preparaciones.find(p => p.id === l.source_id)?.nombre || '—';
  };

  const totalEditCost = lines.reduce((s, l) => s + linePreviewCost(l), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertReceta(selectedProduct, lines);
      addToast('Receta guardada ✓', 'success');
      setEditing(false);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Product list */}
      <div style={{ width: '220px', minWidth: '190px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Productos del Menú</p>
          {products.map(p => {
            const c = getCostoReceta(p.id);
            const hasReceta = !!getRecetaByProduct(p.id);
            const mg = p.price > 0 && hasReceta ? ((p.price - c) / p.price * 100) : null;
            return (
              <button key={p.id} onClick={() => { setSelectedProduct(p.id); setEditing(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: selectedProduct === p.id ? 'var(--primary-color)' : 'transparent', color: selectedProduct === p.id ? 'white' : '#333', marginBottom: '4px', fontWeight: '600', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{p.image} {p.name}</span>
                {mg !== null && <Pill color={selectedProduct === p.id ? 'white' : (mg >= 50 ? '#27ae60' : '#e74c3c')}>{mg.toFixed(0)}%</Pill>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipe detail / editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px', overflowY: 'auto' }}>
        {prod && (
          <>
            {/* Cost summary */}
            <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '12px' }}>
              <StatBox label="Precio de venta" value={`$${prod.price.toFixed(2)}`} color="#333" />
              <StatBox label="Costo de receta" value={`$${costo.toFixed(2)}`} color="#e74c3c" />
              <StatBox label="Ganancia / pieza" value={`$${ganancia.toFixed(2)}`} color="#27ae60" />
              <StatBox label="Margen" value={`${margen.toFixed(1)}%`} color={margenColor} sub={margen >= 60 ? '✅ Excelente' : margen >= 40 ? '⚠️ Aceptable' : receta ? '🔴 Bajo' : 'Sin receta'} />
            </div>

            {/* Lines */}
            <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>🌮 Receta: {prod.image} {prod.name}</h3>
                {!editing && (
                  <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem' }} onClick={startEdit}>
                    <Pencil size={14} /> {receta ? 'Editar receta' : 'Crear receta'}
                  </button>
                )}
              </div>

              {!editing && (!receta || !receta.lines || receta.lines.length === 0) && (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '40px' }}>
                  <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p>Este producto no tiene receta aún.<br />Haz clic en "Crear receta" para comenzar.</p>
                </div>
              )}

              {!editing && receta && receta.lines && receta.lines.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', marginBottom: '6px', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill color={l.source === 'ingrediente' ? '#0984e3' : '#6c5ce7'}>{l.source === 'ingrediente' ? 'Ingrediente' : 'Preparación'}</Pill>
                    {getLineName(l)}
                  </span>
                  <span style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ color: '#888', fontSize: '0.82rem' }}>{l.qty} porc.</span>
                    <span style={{ color: '#e74c3c', fontWeight: '700' }}>−${linePreviewCost(l).toFixed(3)}</span>
                  </span>
                </div>
              ))}

              {/* Edit mode */}
              {editing && (
                <>
                  {lines.map((l, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', marginBottom: '6px', alignItems: 'center', fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pill color={l.source === 'ingrediente' ? '#0984e3' : '#6c5ce7'}>{l.source === 'ingrediente' ? 'Ing' : 'Prep'}</Pill>
                        {getLineName(l)}
                      </span>
                      <span style={{ color: '#888' }}>{l.qty} porc.</span>
                      <span style={{ color: '#e74c3c', fontWeight: '700' }}>−${linePreviewCost(l).toFixed(3)}</span>
                      <button onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: '4px' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                  {!addLine && (
                    <button onClick={() => setAddLine(true)} style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '10px', padding: '10px', cursor: 'pointer', color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Plus size={14} /> Agregar ingrediente o preparación
                    </button>
                  )}
                  {addLine && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '8px', padding: '10px', background: '#fff9e6', borderRadius: '10px', border: '2px dashed #f39c12', alignItems: 'center', marginBottom: '10px' }}>
                      <select style={inp} value={newLine.source_id} onChange={e => {
                        const src = allSources.find(s => s.value === e.target.value);
                        setNewLine(l => ({ ...l, source_id: e.target.value, source: src?.source || 'ingrediente' }));
                      }}>
                        <option value="">— Selecciona —</option>
                        {allSources.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input style={inp} type="number" min="0.1" step="0.1" placeholder="Porciones" value={newLine.qty} onChange={e => setNewLine(l => ({ ...l, qty: e.target.value }))} />
                      <button onClick={handleAddLine} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}><Check size={15} /></button>
                      <button onClick={() => setAddLine(false)} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}><X size={15} /></button>
                    </div>
                  )}
                  {lines.length > 0 && (
                    <div style={{ background: 'rgba(39,174,96,0.08)', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.88rem', color: '#555' }}>Costo total de receta:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#27ae60' }}>${totalEditCost.toFixed(3)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 size={15} /> : <Check size={15} />} Guardar Receta
                    </button>
                    <button onClick={() => setEditing(false)} style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer' }}><X size={15} /></button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Lotes ──────────────────────────────────────────────────────────────
function LotesTab() {
  const { addToast } = useToast();
  const { preparaciones, lotes, addLote, deleteLote } = useCosteo();
  const [form, setForm] = useState({ preparacion_id: '', kg_comprados: '', precio_kg: '', g_rendidos: '', tacos_salieron: '', notas: '' });
  const [saving, setSaving] = useState(false);

  const prep = preparaciones.find(p => p.id === form.preparacion_id);
  const rawG = parseFloat(form.kg_comprados) * 1000 || 0;
  const rendidosG = parseFloat(form.g_rendidos) || 0;
  const mermaPct = rawG > 0 ? ((rawG - rendidosG) / rawG * 100) : null;
  const tacos = parseFloat(form.tacos_salieron) || 0;
  const precioKg = parseFloat(form.precio_kg) || 0;
  const costoTotal = parseFloat(form.kg_comprados) * precioKg || 0;
  const costoPorTaco = tacos > 0 ? costoTotal / tacos : null;

  const handleSave = async () => {
    if (!form.preparacion_id || !form.kg_comprados || !form.tacos_salieron) {
      addToast('Selecciona preparación, cantidad y tacos.', 'error'); return;
    }
    setSaving(true);
    try {
      await addLote({
        preparacion_id: form.preparacion_id,
        preparacion_nombre: prep?.nombre || '',
        kg_comprados: parseFloat(form.kg_comprados),
        precio_kg: precioKg,
        g_rendidos: rendidosG || null,
        tacos_salieron: tacos,
        merma_pct: mermaPct,
        costo_por_taco: costoPorTaco,
        notas: form.notas.trim(),
      });
      addToast('Lote registrado ✓', 'success');
      setForm({ preparacion_id: '', kg_comprados: '', precio_kg: '', g_rendidos: '', tacos_salieron: '', notas: '' });
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>
      {/* Form */}
      <div style={{ width: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '10px' }}>
            📋 Registrar Lote de Producción
          </h3>
          <div>
            <label style={lbl}>¿Qué preparación hiciste?</label>
            <select style={inp} value={form.preparacion_id} onChange={e => setForm(f => ({ ...f, preparacion_id: e.target.value }))}>
              <option value="">— Selecciona preparación —</option>
              {preparaciones.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Kg comprados</label>
              <input style={inp} type="number" min="0.1" step="0.1" placeholder="Ej: 5" value={form.kg_comprados} onChange={e => setForm(f => ({ ...f, kg_comprados: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Precio / kg ($)</label>
              <input style={inp} type="number" min="0" step="0.01" placeholder="Ej: 28" value={form.precio_kg} onChange={e => setForm(f => ({ ...f, precio_kg: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Gramos rendidos (opcional)</label>
              <input style={inp} type="number" min="1" placeholder="Ej: 3200" value={form.g_rendidos} onChange={e => setForm(f => ({ ...f, g_rendidos: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Tacos que salieron</label>
              <input style={inp} type="number" min="1" placeholder="Ej: 40" value={form.tacos_salieron} onChange={e => setForm(f => ({ ...f, tacos_salieron: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notas (opcional)</label>
            <input style={inp} placeholder="Ej: El pollo estaba más gordo hoy" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>

          {/* Live preview */}
          {(mermaPct !== null || costoPorTaco !== null) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: '8px' }}>
              {mermaPct !== null && <StatBox label="Merma" value={`${mermaPct.toFixed(1)}%`} color={mermaPct > 40 ? '#e74c3c' : '#f39c12'} />}
              {tacos > 0 && <StatBox label="Tacos" value={tacos} color="#6c5ce7" />}
              {costoPorTaco !== null && <StatBox label="$/taco" value={`$${costoPorTaco.toFixed(2)}`} color="#27ae60" sub="costo real" />}
            </div>
          )}

          <button className="btn-primary" style={{ padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={15} /> : <Check size={15} />} Registrar Lote
          </button>
        </div>
      </div>

      {/* History */}
      <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', minWidth: '260px', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>📜 Historial de Lotes ({lotes.length})</h3>
        {lotes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', marginTop: '40px' }}>
            <ClipboardList size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <p>Aún no hay lotes registrados.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lotes.map(l => (
              <div key={l.id} style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>🍳 {l.preparacion_nombre}</span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>
                      {new Date(l.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <button onClick={() => deleteLote(l.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ddd', padding: '4px' }}><Trash2 size={13} /></button>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: '#555' }}>🐓 {l.kg_comprados} kg</span>
                  {l.precio_kg > 0 && <span style={{ fontSize: '0.82rem', color: '#555' }}>💲 ${l.precio_kg}/kg</span>}
                  <span style={{ fontSize: '0.82rem', color: '#6c5ce7', fontWeight: '700' }}>🌮 {l.tacos_salieron} tacos</span>
                  {l.merma_pct !== null && <Pill color={l.merma_pct > 40 ? '#e74c3c' : '#f39c12'}>Merma {l.merma_pct?.toFixed(1)}%</Pill>}
                  {l.costo_por_taco !== null && <Pill color="#27ae60">${l.costo_por_taco?.toFixed(2)}/taco</Pill>}
                </div>
                {l.notas && <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>💬 {l.notas}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 5: Márgenes ───────────────────────────────────────────────────────────
function MargenesTab() {
  const { products } = useApp();
  const { getCostoReceta, getRecetaByProduct } = useCosteo();

  const data = useMemo(() => {
    return products.map(p => {
      const costo = getCostoReceta(p.id);
      const hasReceta = !!getRecetaByProduct(p.id);
      const margen = p.price > 0 ? ((p.price - costo) / p.price * 100) : 0;
      return { ...p, costo, margen, ganancia: p.price - costo, hasReceta };
    }).sort((a, b) => a.margen - b.margen);
  }, [products, getCostoReceta, getRecetaByProduct]);

  const conReceta = data.filter(d => d.hasReceta);
  const margenProm = conReceta.length > 0 ? (conReceta.reduce((s, d) => s + d.margen, 0) / conReceta.length) : 0;
  const mejor = [...conReceta].sort((a, b) => b.margen - a.margen)[0];
  const peor = [...conReceta].sort((a, b) => a.margen - b.margen)[0];
  const barColor = (m) => m >= 60 ? '#27ae60' : m >= 40 ? '#f39c12' : '#e74c3c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px' }}>
        <StatBox label="Con receta" value={`${conReceta.length}/${data.length}`} color="#0984e3" />
        <StatBox label="Margen promedio" value={`${margenProm.toFixed(1)}%`} color="#27ae60" />
        <StatBox label="Más rentable" value={mejor?.name || '—'} color="#6c5ce7" />
        <StatBox label="Menos rentable" value={peor?.name || '—'} color="#e74c3c" />
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>📊 Análisis por Producto</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.map(p => (
            <div key={p.id} style={{ padding: '14px 18px', background: p.hasReceta ? 'white' : '#fafafa', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.hasReceta ? '10px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{p.image}</span>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.name}</span>
                    {!p.hasReceta && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#bbb' }}>Sin receta</span>}
                  </div>
                </div>
                {p.hasReceta && (
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa' }}>Precio</p>
                      <span style={{ fontWeight: '700' }}>${p.price.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa' }}>Costo</p>
                      <span style={{ fontWeight: '700', color: '#e74c3c' }}>${p.costo.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa' }}>Ganancia</p>
                      <span style={{ fontWeight: '700', color: '#27ae60' }}>${p.ganancia.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '55px' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa' }}>Margen</p>
                      <span style={{ fontWeight: '900', fontSize: '1.05rem', color: barColor(p.margen) }}>{p.margen.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
              {p.hasReceta && (
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, p.margen))}%`, background: barColor(p.margen), borderRadius: '10px', transition: 'width 0.5s' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CosteoView() {
  const { loading } = useCosteo();
  const [tab, setTab] = useState('ingredientes');

  const tabs = [
    { id: 'ingredientes', label: '📦 Ingredientes', icon: <Package size={15} /> },
    { id: 'preparaciones', label: '🍳 Preparaciones', icon: <Flame size={15} /> },
    { id: 'recetas', label: '🌮 Recetas', icon: <ChefHat size={15} /> },
    { id: 'lotes', label: '📋 Lotes', icon: <ClipboardList size={15} /> },
    { id: 'margenes', label: '📊 Márgenes', icon: <BarChart2 size={15} /> },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#aaa' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Cargando datos de costeo...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
          <Scale size={26} color="var(--primary-color)" /> Costeo Inteligente
        </h1>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s',
              background: tab === t.id ? 'var(--primary-color)' : 'transparent',
              color: tab === t.id ? 'white' : '#555',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'ingredientes'  && <IngredientesTab />}
        {tab === 'preparaciones' && <PreparacionesTab />}
        {tab === 'recetas'       && <RecetasTab />}
        {tab === 'lotes'         && <LotesTab />}
        {tab === 'margenes'      && <MargenesTab />}
      </div>
    </div>
  );
}
