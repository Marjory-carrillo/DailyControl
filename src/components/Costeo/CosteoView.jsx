import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Pencil, ChefHat, TrendingUp, Package, X, Check, DollarSign, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const UNITS = ['kg', 'g', 'litro', 'ml', 'pieza', 'bolsa', 'caja', 'rollo', 'manojo'];

function loadIngredients() {
  try { return JSON.parse(localStorage.getItem('costeo_ingredientes') || '[]'); } catch { return []; }
}
function saveIngredients(data) {
  localStorage.setItem('costeo_ingredientes', JSON.stringify(data));
}
function loadRecipes() {
  try { return JSON.parse(localStorage.getItem('costeo_recetas') || '{}'); } catch { return {}; }
}
function saveRecipes(data) {
  localStorage.setItem('costeo_recetas', JSON.stringify(data));
}

const inputStyle = {
  padding: '10px 14px', borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.7)',
  fontFamily: 'inherit', fontSize: '0.95rem', color: '#222', outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '0.82rem', fontWeight: '700', color: '#777',
  marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px',
};

// ── Sub-views ────────────────────────────────────────────────────────────────

function IngredientsTab({ ingredients, setIngredients }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', unit: 'kg', buyPrice: '', portionCount: '' });
  const [editId, setEditId] = useState(null);

  const handleSave = () => {
    if (!form.name.trim() || !form.buyPrice || !form.portionCount) {
      addToast('Llena todos los campos.', 'error'); return;
    }
    if (editId) {
      const updated = ingredients.map(i => i.id === editId ? { ...i, ...form, buyPrice: parseFloat(form.buyPrice), portionCount: parseFloat(form.portionCount) } : i);
      setIngredients(updated); saveIngredients(updated);
      addToast('Ingrediente actualizado ✓', 'success');
    } else {
      const newItem = { id: Date.now().toString(), ...form, buyPrice: parseFloat(form.buyPrice), portionCount: parseFloat(form.portionCount) };
      const updated = [...ingredients, newItem];
      setIngredients(updated); saveIngredients(updated);
      addToast('Ingrediente agregado ✓', 'success');
    }
    setForm({ name: '', unit: 'kg', buyPrice: '', portionCount: '' });
    setEditId(null);
  };

  const startEdit = (ing) => {
    setEditId(ing.id);
    setForm({ name: ing.name, unit: ing.unit, buyPrice: String(ing.buyPrice), portionCount: String(ing.portionCount) });
  };

  const handleDelete = (id) => {
    const updated = ingredients.filter(i => i.id !== id);
    setIngredients(updated); saveIngredients(updated);
    addToast('Ingrediente eliminado', 'success');
  };

  const costPerPortion = (ing) => ing.portionCount > 0 ? ing.buyPrice / ing.portionCount : 0;

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>
      {/* Form */}
      <div style={{ width: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333', borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '10px' }}>
            {editId ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}
          </h3>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input style={{ ...inputStyle, width: '100%' }} placeholder="Ej: Carne de Pastor" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Unidad de Compra</label>
            <select style={{ ...inputStyle, width: '100%' }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Precio de Compra ($) por {form.unit || 'unidad'}</label>
            <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step="0.01" placeholder="0.00" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Porciones que Rinde</label>
            <input style={{ ...inputStyle, width: '100%' }} type="number" min="1" step="1" placeholder="Ej: 25 tacos por kg" value={form.portionCount} onChange={e => setForm(f => ({ ...f, portionCount: e.target.value }))} />
            {form.buyPrice && form.portionCount && (
              <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#27ae60', fontWeight: '700' }}>
                💰 Costo por porción: ${(parseFloat(form.buyPrice) / parseFloat(form.portionCount)).toFixed(3)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={handleSave}>
              <Check size={16} /> {editId ? 'Guardar' : 'Agregar'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm({ name: '', unit: 'kg', buyPrice: '', portionCount: '' }); }}
                style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: '700', color: '#999' }}>RESUMEN</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: '#555' }}>Total ingredientes:</span>
            <strong>{ingredients.length}</strong>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="glass-panel" style={{ flex: 1, padding: '22px', display: 'flex', flexDirection: 'column', minWidth: '260px', overflow: 'hidden' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Catálogo de Ingredientes ({ingredients.length})</h3>
        {ingredients.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>
            <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No hay ingredientes. Agrega el primero.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#888' }}>
              <span>INGREDIENTE</span><span>UNIDAD</span><span>PRECIO</span><span>COSTO/PORCIÓN</span><span></span>
            </div>
            {ingredients.map(ing => (
              <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', padding: '12px', background: 'white', borderRadius: '10px', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{ing.name}</span>
                <span style={{ color: '#666', fontSize: '0.88rem' }}>{ing.unit}</span>
                <span style={{ color: '#333', fontWeight: '600' }}>${ing.buyPrice.toFixed(2)}</span>
                <span style={{ color: '#27ae60', fontWeight: '700', fontSize: '0.88rem' }}>${costPerPortion(ing).toFixed(3)}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => startEdit(ing)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(ing.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: '4px' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipesTab({ ingredients, recipes, setRecipes }) {
  const { products } = useApp();
  const { addToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || null);
  const [addingLine, setAddingLine] = useState(false);
  const [newLine, setNewLine] = useState({ ingredientId: '', qty: '' });

  const productRecipe = useMemo(() => recipes[selectedProduct] || [], [recipes, selectedProduct]);

  const getIngredient = (id) => ingredients.find(i => i.id === id);

  const recipeCost = useMemo(() => {
    return productRecipe.reduce((sum, line) => {
      const ing = getIngredient(line.ingredientId);
      if (!ing) return sum;
      return sum + (ing.buyPrice / ing.portionCount) * line.qty;
    }, 0);
  }, [productRecipe, ingredients]);

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const margin = selectedProductData ? ((selectedProductData.price - recipeCost) / selectedProductData.price) * 100 : 0;
  const profit = selectedProductData ? selectedProductData.price - recipeCost : 0;

  const addLine = () => {
    if (!newLine.ingredientId || !newLine.qty || parseFloat(newLine.qty) <= 0) {
      addToast('Selecciona ingrediente y cantidad.', 'error'); return;
    }
    const updated = {
      ...recipes,
      [selectedProduct]: [...productRecipe, { ingredientId: newLine.ingredientId, qty: parseFloat(newLine.qty) }]
    };
    setRecipes(updated); saveRecipes(updated);
    setNewLine({ ingredientId: '', qty: '' });
    setAddingLine(false);
    addToast('Ingrediente añadido a la receta ✓', 'success');
  };

  const removeLine = (idx) => {
    const updated = { ...recipes, [selectedProduct]: productRecipe.filter((_, i) => i !== idx) };
    setRecipes(updated); saveRecipes(updated);
  };

  const marginColor = margin >= 60 ? '#27ae60' : margin >= 40 ? '#f39c12' : '#e74c3c';
  const marginLabel = margin >= 60 ? '✅ Excelente' : margin >= 40 ? '⚠️ Aceptable' : '🔴 Bajo';

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>
      {/* Product selector */}
      <div style={{ width: '220px', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Productos</p>
          {products.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Sin productos en el menú.</p>
          ) : products.map(p => {
            const r = recipes[p.id] || [];
            const cost = r.reduce((s, l) => {
              const ing = ingredients.find(i => i.id === l.ingredientId);
              return ing ? s + (ing.buyPrice / ing.portionCount) * l.qty : s;
            }, 0);
            const mg = p.price > 0 ? ((p.price - cost) / p.price * 100) : 0;
            return (
              <button key={p.id} onClick={() => setSelectedProduct(p.id)} style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: selectedProduct === p.id ? 'var(--primary-color)' : 'transparent',
                color: selectedProduct === p.id ? 'white' : '#333',
                marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.image} {p.name}</span>
                {r.length > 0 && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '20px',
                    background: selectedProduct === p.id ? 'rgba(255,255,255,0.2)' : (mg >= 50 ? '#27ae6022' : '#e74c3c22'),
                    color: selectedProduct === p.id ? 'white' : (mg >= 50 ? '#27ae60' : '#e74c3c'),
                  }}>{mg.toFixed(0)}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipe editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '280px', overflow: 'hidden' }}>
        {selectedProductData && (
          <>
            {/* Cost summary card */}
            <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#999' }}>PRECIO DE VENTA</p>
                <h2 style={{ margin: '4px 0 0', color: '#333', fontSize: '1.6rem' }}>${selectedProductData.price.toFixed(2)}</h2>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#999' }}>COSTO DE RECETA</p>
                <h2 style={{ margin: '4px 0 0', color: '#e74c3c', fontSize: '1.6rem' }}>${recipeCost.toFixed(2)}</h2>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#999' }}>GANANCIA / PIEZA</p>
                <h2 style={{ margin: '4px 0 0', color: '#27ae60', fontSize: '1.6rem' }}>${profit.toFixed(2)}</h2>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#999' }}>MARGEN</p>
                <h2 style={{ margin: '4px 0 0', color: marginColor, fontSize: '1.6rem' }}>{margin.toFixed(1)}%</h2>
                <span style={{ fontSize: '0.78rem', color: marginColor, fontWeight: '700' }}>{marginLabel}</span>
              </div>
            </div>

            {/* Ingredients list */}
            <div className="glass-panel" style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0 }}>🧾 Receta: {selectedProductData.image} {selectedProductData.name}</h3>
                {!addingLine && ingredients.length > 0 && (
                  <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }} onClick={() => setAddingLine(true)}>
                    <Plus size={15} /> Ingrediente
                  </button>
                )}
              </div>

              {ingredients.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>
                  <AlertTriangle size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p>Primero carga ingredientes en la pestaña "Ingredientes".</p>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {productRecipe.map((line, idx) => {
                  const ing = getIngredient(line.ingredientId);
                  if (!ing) return null;
                  const lineCost = (ing.buyPrice / ing.portionCount) * line.qty;
                  return (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', padding: '12px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontWeight: '600' }}>{ing.name}</span>
                      <span style={{ color: '#666', fontSize: '0.88rem' }}>{line.qty} porc.</span>
                      <span style={{ color: '#e74c3c', fontWeight: '700' }}>−${lineCost.toFixed(3)}</span>
                      <button onClick={() => removeLine(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ccc', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}

                {addingLine && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '10px', padding: '12px', background: '#fff9e6', borderRadius: '10px', border: '2px dashed #f39c12', alignItems: 'center' }}>
                    <select style={{ ...inputStyle }} value={newLine.ingredientId} onChange={e => setNewLine(l => ({ ...l, ingredientId: e.target.value }))}>
                      <option value="">— Selecciona ingrediente —</option>
                      {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (${(i.buyPrice/i.portionCount).toFixed(3)}/porc)</option>)}
                    </select>
                    <input style={inputStyle} type="number" min="0.1" step="0.1" placeholder="Porciones" value={newLine.qty} onChange={e => setNewLine(l => ({ ...l, qty: e.target.value }))} />
                    <button onClick={addLine} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}><Check size={16} /></button>
                    <button onClick={() => { setAddingLine(false); setNewLine({ ingredientId: '', qty: '' }); }} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                )}

                {productRecipe.length === 0 && !addingLine && ingredients.length > 0 && (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: '30px' }}>
                    <p>No hay ingredientes en esta receta. Haz clic en "+ Ingrediente" para comenzar.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MarginTab({ ingredients, recipes }) {
  const { products } = useApp();

  const data = useMemo(() => {
    return products.map(p => {
      const r = recipes[p.id] || [];
      const cost = r.reduce((s, l) => {
        const ing = ingredients.find(i => i.id === l.ingredientId);
        return ing ? s + (ing.buyPrice / ing.portionCount) * l.qty : s;
      }, 0);
      const margin = p.price > 0 ? ((p.price - cost) / p.price * 100) : 0;
      const hasRecipe = r.length > 0;
      return { ...p, cost, margin, profit: p.price - cost, hasRecipe };
    }).sort((a, b) => a.margin - b.margin);
  }, [products, ingredients, recipes]);

  const barColor = (m) => m >= 60 ? '#27ae60' : m >= 40 ? '#f39c12' : '#e74c3c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '14px' }}>
        {[
          { label: 'Productos con receta', value: data.filter(d => d.hasRecipe).length + '/' + data.length, color: '#0984e3' },
          { label: 'Margen promedio', value: data.length > 0 ? (data.filter(d=>d.hasRecipe).reduce((s,d)=>s+d.margin,0) / Math.max(data.filter(d=>d.hasRecipe).length,1)).toFixed(1) + '%' : '—', color: '#27ae60' },
          { label: 'Producto más rentable', value: data.filter(d=>d.hasRecipe).sort((a,b)=>b.margin-a.margin)[0]?.name || '—', color: '#6c5ce7' },
          { label: 'Producto menos rentable', value: data.filter(d=>d.hasRecipe).sort((a,b)=>a.margin-b.margin)[0]?.name || '—', color: '#e74c3c' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>{s.label}</p>
            <h3 style={{ margin: '4px 0 0', color: s.color, fontSize: '1.1rem', fontWeight: '800' }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px' }}>📊 Análisis de Márgenes por Producto</h3>
        {data.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center' }}>No hay productos en el menú.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map(p => (
              <div key={p.id} style={{ padding: '14px 18px', background: p.hasRecipe ? 'white' : '#f9f9f9', borderRadius: '12px', border: `1px solid ${p.hasRecipe ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.hasRecipe ? '10px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.image}</span>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.name}</span>
                      {!p.hasRecipe && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#aaa' }}>Sin receta</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#aaa' }}>Precio</p>
                      <span style={{ fontWeight: '700', color: '#333' }}>${p.price.toFixed(2)}</span>
                    </div>
                    {p.hasRecipe && <>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#aaa' }}>Costo</p>
                        <span style={{ fontWeight: '700', color: '#e74c3c' }}>${p.cost.toFixed(2)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#aaa' }}>Ganancia</p>
                        <span style={{ fontWeight: '700', color: '#27ae60' }}>${p.profit.toFixed(2)}</span>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '60px' }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#aaa' }}>Margen</p>
                        <span style={{ fontWeight: '800', color: barColor(p.margin), fontSize: '1.05rem' }}>{p.margin.toFixed(0)}%</span>
                      </div>
                    </>}
                  </div>
                </div>
                {p.hasRecipe && (
                  <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, p.margin))}%`, background: barColor(p.margin), borderRadius: '10px', transition: 'width 0.5s' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CosteoView() {
  const [tab, setTab] = useState('ingredientes');
  const [ingredients, setIngredients] = useState(loadIngredients);
  const [recipes, setRecipes] = useState(loadRecipes);
  const [showGuide, setShowGuide] = useState(false);

  const tabs = [
    { id: 'ingredientes', label: '📦 Ingredientes' },
    { id: 'recetas',      label: '🧾 Recetas'      },
    { id: 'margenes',     label: '📊 Márgenes'     },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
            <ChefHat size={28} color="var(--primary-color)" /> Costeo por Taco
          </h1>
          <button onClick={() => setShowGuide(!showGuide)} style={{
            background: showGuide ? 'var(--primary-color)' : 'rgba(0,0,0,0.06)',
            color: showGuide ? 'white' : '#888',
            border: 'none', borderRadius: '50%', width: '28px', height: '28px',
            cursor: 'pointer', fontWeight: '900', fontSize: '0.9rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
          }}>?</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: '700', fontSize: '0.88rem', transition: 'all 0.2s',
              background: tab === t.id ? 'var(--primary-color)' : 'transparent',
              color: tab === t.id ? 'white' : '#555',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── How-to Guide ── */}
      {showGuide && (
        <div className="glass-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(108,92,231,0.06), rgba(255,107,107,0.06))', border: '1px solid rgba(108,92,231,0.15)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#6c5ce7' }}>📖 ¿Cómo sacar el costeo por taco?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#444', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ background: '#6c5ce7', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>1</span>
              <div>
                <strong>Registra tus ingredientes</strong> (pestaña 📦 Ingredientes)<br/>
                Ejemplo: <em>Carne de pastor — compras 1 kg a $180 y te rinde para 25 tacos</em>.<br/>
                Pon: Precio = $180, Porciones = 25. El sistema calcula que cada porción te cuesta <strong>$7.20</strong>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ background: '#6c5ce7', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>2</span>
              <div>
                <strong>Arma la receta de cada taco</strong> (pestaña 🧾 Recetas)<br/>
                Selecciona un producto del menú y agrega los ingredientes que lleva. Ejemplo: <em>Taco de Pastor = 1 porción de carne ($7.20) + 1 porción de tortilla ($1.00) + 1 porción de piña ($0.80)</em> = <strong>Costo total: $9.00</strong>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ background: '#6c5ce7', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>3</span>
              <div>
                <strong>Revisa tus márgenes</strong> (pestaña 📊 Márgenes)<br/>
                Si vendes el taco a $25 y te cuesta $9, tu ganancia es <strong>$16 por taco (64% margen)</strong>. Lo ideal es que el margen sea mayor al 50%.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'ingredientes' && <IngredientsTab ingredients={ingredients} setIngredients={setIngredients} />}
        {tab === 'recetas'      && <RecipesTab ingredients={ingredients} recipes={recipes} setRecipes={setRecipes} />}
        {tab === 'margenes'     && <MarginTab ingredients={ingredients} recipes={recipes} />}
      </div>
    </div>
  );
}
