import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2, Check, X, UtensilsCrossed } from 'lucide-react';

const EMOJIS = [
  '🌮','🫔','🌯','🥪','🥟','🍔','🌭','🍗','🥩','🍖',
  '🧀','🌶️','🫙','🥑','🥤','🍊','🍋','🥛','☕','🧃','🍺','💧',
];

export default function MenuEditorView() {
  const { categories, products, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct } = useApp();
  const { addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Category editing
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', image: '🌮', description: '' });

  const filteredProducts = products.filter(p => p.category === activeCategory);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const added = { id: Date.now().toString(), name: newCatName.trim() };
    addCategory(added);
    setActiveCategory(added.id);
    setNewCatName('');
    setShowAddCat(false);
    addToast('Categoría creada', 'success');
  };

  const handleSaveCatEdit = (id) => {
    updateCategory(id, { name: editingCatName });
    setEditingCatId(null);
    addToast('Categoría actualizada', 'success');
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', price: '', image: '🌮', description: '' });
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ name: product.name, price: product.price, image: product.image, description: product.description || '' });
    setShowProductForm(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name.trim() || !productForm.price) return;
    const data = { ...productForm, price: parseFloat(productForm.price), category: activeCategory };
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
      addToast('Producto actualizado', 'success');
    } else {
      addProduct(data);
      addToast('Producto agregado ✓', 'success');
    }
    setShowProductForm(false);
  };

  const inputStyle = {
    padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.7)',
    fontFamily: 'inherit', fontSize: '1rem',
    color: '#222', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  // ── MOBILE layout ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UtensilsCrossed size={20} /> Catálogo
          </h1>
          {activeCategory && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', fontSize: '0.88rem' }} onClick={openAddProduct}>
              <Plus size={15} /> Producto
            </button>
          )}
        </div>

        {/* Categories — horizontal scroll tabs */}
        <div style={{ flexShrink: 0, marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {editingCatId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingCatName}
                      onChange={e => setEditingCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveCatEdit(cat.id)}
                      style={{ ...inputStyle, width: '120px', padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    <button onClick={() => handleSaveCatEdit(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success-color)', padding: '4px' }}><Check size={15} /></button>
                    <button onClick={() => setEditingCatId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: '4px' }}><X size={15} /></button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', background: activeCategory === cat.id ? 'var(--primary-color)' : 'rgba(0,0,0,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        padding: '8px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontWeight: '600', fontSize: '0.88rem', whiteSpace: 'nowrap',
                        background: 'transparent',
                        color: activeCategory === cat.id ? 'white' : '#555',
                      }}
                    >{cat.name}</button>
                    {activeCategory === cat.id && (
                      <>
                        <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: '6px 4px' }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => { deleteCategory(cat.id); addToast('Categoría eliminada'); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: '6px 8px 6px 2px' }}>
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add category button */}
            {!showAddCat ? (
              <button onClick={() => setShowAddCat(true)}
                style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '20px', border: '2px dashed rgba(0,0,0,0.15)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.88rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Nueva
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                <input
                  autoFocus
                  style={{ ...inputStyle, width: '130px', padding: '7px 10px', fontSize: '0.85rem' }}
                  placeholder="Nombre..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                />
                <button onClick={handleAddCategory} style={{ background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer' }}><Check size={15} /></button>
                <button onClick={() => { setShowAddCat(false); setNewCatName(''); }} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer' }}><X size={15} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Products grid */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {filteredProducts.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem' }}>{p.image}</div>
                <h3 style={{ margin: 0, textAlign: 'center', fontSize: '0.9rem', fontWeight: '700' }}>{p.name}</h3>
                <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', textAlign: 'center', margin: 0, fontSize: '0.95rem' }}>${parseFloat(p.price).toFixed(2)}</p>
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                  <button onClick={() => openEditProduct(p)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '4px', fontFamily: 'inherit', fontSize: '0.8rem' }}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button onClick={() => { deleteProduct(p.id); addToast('Producto eliminado'); }} style={{ padding: '7px 10px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && activeCategory && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '40px 20px', fontSize: '0.95rem' }}>
                No hay productos aquí. Toca <strong>+ Producto</strong> para agregar el primero.
              </div>
            )}
          </div>
        </div>

        {/* Product Form Modal */}
        {showProductForm && <ProductModal inputStyle={inputStyle} productForm={productForm} setProductForm={setProductForm} editingProduct={editingProduct} onSave={handleSaveProduct} onClose={() => setShowProductForm(false)} />}
      </div>
    );
  }

  // ── DESKTOP layout ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Left: Categories panel */}
      <div className="glass-panel" style={{ width: '220px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--text-light)' }}>CATEGORÍAS</h2>
        {categories.map(cat => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingCatId === cat.id ? (
              <>
                <input style={{ ...inputStyle, flex: 1, padding: '6px 10px' }} value={editingCatName} onChange={e => setEditingCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveCatEdit(cat.id)} autoFocus />
                <button onClick={() => handleSaveCatEdit(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success-color)' }}><Check size={16} /></button>
                <button onClick={() => setEditingCatId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setActiveCategory(cat.id)} style={{ flex: 1, textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: activeCategory === cat.id ? 'var(--primary-color)' : 'transparent', color: activeCategory === cat.id ? 'white' : 'var(--text-dark)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                  {cat.name}
                </button>
                <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><Pencil size={14} /></button>
                <button onClick={() => { deleteCategory(cat.id); addToast('Categoría eliminada'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '0.9rem' }} placeholder="Nueva categoría" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
          <button onClick={handleAddCategory} style={{ background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}><Plus size={16} /></button>
        </div>
      </div>

      {/* Right: Products panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><UtensilsCrossed /> Editor de Catálogo</h1>
          {activeCategory && (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openAddProduct}>
              <Plus size={16} /> Agregar Producto
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '15px', overflowY: 'auto' }}>
          {filteredProducts.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>{p.image}</div>
              <h3 style={{ margin: 0, textAlign: 'center' }}>{p.name}</h3>
              <p style={{ color: 'var(--primary-color)', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>${parseFloat(p.price).toFixed(2)}</p>
              {p.description && <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>{p.description}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => openEditProduct(p)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => { deleteProduct(p.id); addToast('Producto eliminado'); }} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && activeCategory && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>
              No hay productos en esta categoría. ¡Agrega el primero!
            </div>
          )}
        </div>
      </div>

      {showProductForm && <ProductModal inputStyle={inputStyle} productForm={productForm} setProductForm={setProductForm} editingProduct={editingProduct} onSave={handleSaveProduct} onClose={() => setShowProductForm(false)} />}
    </div>
  );
}

// ── Shared Modal Component ────────────────────────────────────────────────────
function ProductModal({ inputStyle, productForm, setProductForm, editingProduct, onSave, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{
        padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh',
        overflowY: 'auto', borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'white',
      }}>
        {/* Handle bar */}
        <div style={{ width: '40px', height: '4px', background: '#ddd', borderRadius: '4px', margin: '0 auto -4px' }} />

        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h2>

        {/* Emoji picker */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Ícono</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setProductForm(p => ({ ...p, image: emoji }))}
                style={{ fontSize: '1.5rem', padding: '6px', background: productForm.image === emoji ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '10px', cursor: 'pointer', lineHeight: 1 }}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Nombre</label>
          <input style={inputStyle} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Taco de Pastor" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Precio ($)</label>
          <input style={inputStyle} type="number" min="0" step="0.50" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#999', textTransform: 'uppercase' }}>Descripción (opcional)</label>
          <input style={inputStyle} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} placeholder="Ej: Con piña y chile" />
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingBottom: '8px' }}>
          <button className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: '1rem' }} onClick={onSave}>
            {editingProduct ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
          <button onClick={onClose} style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
