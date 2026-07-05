import React, { useState, useEffect } from 'react';
import { Bike, Plus, Trash2, Copy, RefreshCw, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast, useConfirm } from '../../context/ToastContext';

function generateCode(restaurantName = '', role = 'repartidor') {
  const prefix = restaurantName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'NEG';
  const roleTag = role === 'mesero' ? 'M' : 'R';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}${roleTag}-${random}`;
}

const ROLE_LABELS = {
  repartidor: { label: '🛵 Repartidor', color: '#FF9800', bg: '#FFF3E0' },
  mesero:     { label: '🍽️ Mesero',     color: '#6c5ce7', bg: '#F3E5F5' },
};

export default function StaffEmployees({ restaurantId, restaurantName }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('repartidor');
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const { addToast } = useToast();
  const showConfirm = useConfirm();

  useEffect(() => {
    if (!restaurantId) return;
    fetchEmployees();
  }, [restaurantId]);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (!error) setEmployees(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      let code;
      let tries = 0;
      while (tries < 5) {
        code = generateCode(restaurantName, newRole);
        const { data } = await supabase.from('employees').select('id').eq('access_code', code).single();
        if (!data) break;
        tries++;
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([{ restaurant_id: restaurantId, name: newName.trim(), role: newRole, access_code: code }])
        .select()
        .single();

      if (error) throw error;
      setEmployees(prev => [data, ...prev]);
      setNewName('');
      addToast(`${ROLE_LABELS[newRole].label} ${data.name} creado ✓`, 'success');
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(`¿Eliminar a ${name}? Su código dejará de funcionar.`);
    if (!confirmed) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      addToast(`${name} eliminado`, 'success');
    }
  };

  const handleRegenerateCode = async (employee) => {
    const confirmed = await showConfirm(`¿Generar nuevo código para ${employee.name}? El anterior dejará de funcionar.`);
    if (!confirmed) return;
    const newCode = generateCode(restaurantName, employee.role);
    const { data, error } = await supabase
      .from('employees')
      .update({ access_code: newCode })
      .eq('id', employee.id)
      .select()
      .single();
    if (!error) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? data : e));
      addToast('Código regenerado ✓', 'success');
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      addToast('Código copiado', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const inputStyle = {
    padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '0.95rem',
    color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box',
  };

  // Group by role for display
  const byRole = { repartidor: [], mesero: [] };
  employees.forEach(e => (byRole[e.role] || byRole.repartidor).push(e));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={18} color="var(--text-light)" />
        <span style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '1rem' }}>Personal del Negocio</span>
      </div>

      <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', margin: 0 }}>
        Crea cuentas para tus <strong>Meseros</strong> y <strong>Repartidores</strong>. Cada uno recibe un código único
        con el sello de tu negocio. Los meseros solo ven el POS y su turno — sin acceso a finanzas ni configuración.
      </p>

      {/* Form */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 160px' }}>
          <User size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            style={{ ...inputStyle, width: '100%', paddingLeft: '34px' }}
            placeholder="Nombre del empleado..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <select
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          style={{ ...inputStyle, flex: '0 0 140px', cursor: 'pointer' }}
        >
          <option value="repartidor">🛵 Repartidor</option>
          <option value="mesero">🍽️ Mesero</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || adding}
          style={{ padding: '0 18px', borderRadius: '10px', border: 'none', background: 'var(--primary-color)', color: 'white', fontFamily: 'inherit', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: (!newName.trim() || adding) ? 0.5 : 1, whiteSpace: 'nowrap' }}
        >
          <Plus size={16} /> {adding ? '...' : 'Agregar'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>Cargando...</p>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
          👥 No hay empleados registrados aún.
        </div>
      ) : (
        Object.entries(byRole).map(([role, list]) =>
          list.length === 0 ? null : (
            <div key={role}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: ROLE_LABELS[role].color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                {ROLE_LABELS[role].label}s ({list.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {list.map(emp => (
                  <div key={emp.id} style={{ background: 'white', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${ROLE_LABELS[role].color}, ${role === 'mesero' ? '#a29bfe' : '#F44336'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '700' }}>{emp.name}</span>
                      </div>
                      <button onClick={() => handleDelete(emp.id, emp.name)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Access code */}
                    <div style={{ background: ROLE_LABELS[role].bg, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: ROLE_LABELS[role].color, fontWeight: '800', letterSpacing: '1px', marginBottom: '1px' }}>CÓDIGO</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '900', color: ROLE_LABELS[role].color, letterSpacing: '3px' }}>{emp.access_code}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => copyCode(emp.access_code, emp.id)} style={{ background: copiedId === emp.id ? '#4CAF50' : ROLE_LABELS[role].color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          <Copy size={12} /> {copiedId === emp.id ? '✓' : 'Copiar'}
                        </button>
                        <button onClick={() => handleRegenerateCode(emp)} title="Nuevo código" style={{ background: 'transparent', border: `1px solid ${ROLE_LABELS[role].color}`, color: ROLE_LABELS[role].color, borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
