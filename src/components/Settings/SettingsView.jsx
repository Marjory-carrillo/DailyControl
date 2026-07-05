import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, Upload, Building2, Lock, Banknote, Bike, Users, Trash2, Clock, Download, RefreshCw, AlertTriangle, Printer } from 'lucide-react';
import DeliveryEmployees from './DeliveryEmployees';
import { useConfirm } from '../../context/ToastContext';

// ── Backup helpers ────────────────────────────────────────────────────────────
const BACKUP_KEYS = [
  'businessConfig', 'menuCategories', 'menuProducts', 'businessMeseros',
  'orderHistory', 'openAccounts', 'cajaChica', 'currentShift', 'shiftHistory',
  'costeo_ingredientes', 'costeo_recetas', 'dataVersion',
];

function exportBackup() {
  const data = {};
  BACKUP_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dailycontrol-backup-${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      BACKUP_KEYS.forEach(k => {
        if (data[k] !== undefined) localStorage.setItem(k, data[k]);
      });
      onSuccess();
    } catch {
      onError();
    }
  };
  reader.readAsText(file);
}

const ALL_TABS = [
  { id: 'pos',       label: 'Ventas (POS)' },
  { id: 'turno',     label: 'Turno / Corte de Caja' },
  { id: 'caja',      label: 'Caja Chica' },
  { id: 'costeo',    label: 'Costeo por Taco' },
  { id: 'dashboard', label: 'Ventas / Dashboard' },
  { id: 'menu',      label: 'Editor de Menú' },
];

export default function SettingsView({ restaurantId, restaurantName, onLogout }) {
  const { config, setConfig } = useApp();
  const showConfirm = useConfirm();
  const [form, setForm] = useState({ 
    ...config,
    protectedTabs: config.protectedTabs ?? ['dashboard', 'menu', 'settings', 'caja', 'turno'],
    appBackgroundColor: config.appBackgroundColor ?? '#f5f5f7',
    tables: config.tables || [],
    pinProtectionEnabled: config.pinProtectionEnabled ?? true
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();
  const backupImportRef = useRef();
  const [backupMsg, setBackupMsg] = useState(null); // { type: 'success'|'error', text }
  

  const [newTable, setNewTable] = useState('');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => localStorage.getItem('autoPrintKitchen') === 'true');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, logo: reader.result }));
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleProtected = (tabId) => {
    setForm(prev => {
      const current = prev.protectedTabs || [];
      const updated = current.includes(tabId)
        ? current.filter(t => t !== tabId)
        : [...current, tabId];
      return { ...prev, protectedTabs: updated };
    });
    setSaved(false);
  };

  const handleSave = () => {
    // Settings tab is always protected — enforce it
    const finalForm = { 
      ...form, 
      protectedTabs: [...new Set([...(form.protectedTabs || []), 'settings'])] 
    };
    setConfig(finalForm);
    setSaved(true);
  };

  const handleAddTable = () => {
    if (!newTable.trim()) return;
    setForm(prev => ({
      ...prev,
      tables: [...(prev.tables || []), { id: Date.now().toString(), name: newTable.trim() }]
    }));
    setNewTable('');
    setSaved(false);
  };

  const handleRemoveTable = (id) => {
    setForm(prev => ({
      ...prev,
      tables: (prev.tables || []).filter(t => t.id !== id)
    }));
    setSaved(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.5)',
    fontFamily: 'inherit',
    fontSize: '1rem',
    color: 'var(--text-dark)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-light)',
    marginBottom: '8px',
    display: 'block',
  };

  const sectionStyle = {
    padding: '20px',
    background: 'rgba(0,0,0,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  return (
    <div style={{ padding: '10px', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Building2 /> Ajustes del Negocio
      </h1>

      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Logo */}
        <div>
          <label style={labelStyle}>Logo del Negocio</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '16px',
              background: 'rgba(0,0,0,0.05)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              border: '2px dashed rgba(0,0,0,0.1)'
            }}>
              {form.logo
                ? <img src={form.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2rem' }}>🏪</span>
              }
            </div>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.07)', color: 'var(--text-dark)' }}
              onClick={() => fileRef.current.click()}
            >
              <Upload size={16} /> Subir Logo
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
          </div>
        </div>

        {/* Business name */}
        <div>
          <label style={labelStyle}>Nombre del Negocio</label>
          <input style={inputStyle} name="businessName" value={form.businessName} onChange={handleChange} placeholder="Ej: La Esquina Popular" />
        </div>

        {/* Slogan */}
        <div>
          <label style={labelStyle}>Eslogan (aparece en el ticket)</label>
          <input style={inputStyle} name="slogan" value={form.slogan} onChange={handleChange} placeholder="Ej: El sabor que siempre buscabas" />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Teléfono de Contacto</label>
          <input style={inputStyle} name="phone" value={form.phone} onChange={handleChange} placeholder="Ej: 55 1234 5678" />
        </div>

        {/* Background Color */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎨</span>
            <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Color de Fondo de la App</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '5px' }}>
            {[
              { label: 'Gris Claro', value: '#f5f5f7' },
              { label: 'Blanco', value: '#ffffff' },
              { label: 'Crema', value: '#faf8f5' },
              { label: 'Azul Hielo', value: '#e0f2fe' },
              { label: 'Oscuro', value: '#1e293b' }
            ].map(c => (
              <button
                key={c.value}
                onClick={() => {
                  setForm(prev => ({ ...prev, appBackgroundColor: c.value }));
                  setSaved(false);
                }}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: c.value, 
                  border: form.appBackgroundColor === c.value ? '4px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer', outline: 'none', transition: 'transform 0.2s',
                  transform: form.appBackgroundColor === c.value ? 'scale(1.1)' : 'scale(1)'
                }}
                title={c.label}
              />
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <input 
                type="color" 
                value={form.appBackgroundColor || '#f5f5f7'}
                onChange={e => {
                  setForm(prev => ({ ...prev, appBackgroundColor: e.target.value }));
                  setSaved(false);
                }}
                style={{
                  width: '46px', height: '46px', padding: 0, border: 'none', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden'
                }}
                title="Color personalizado"
              />
            </div>
          </div>
        </div>


        {/* Default Fondo de Caja */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Banknote size={18} color="var(--text-light)" />
            <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Fondo de Caja Predeterminado</span>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', margin: 0 }}>
            Se usará como el monto inicial sugerido al abrir un turno.
          </p>
          <input
            style={{ ...inputStyle, width: '200px' }}
            type="number"
            min="0"
            step="0.01"
            name="defaultFondo"
            value={form.defaultFondo || ''}
            onChange={handleChange}
            placeholder="Ej: 500.00"
          />
        </div>

        {/* Delivery Toggle */}
        <div style={sectionStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-dark)' }}>
            <input
              type="checkbox"
              name="deliveryEnabled"
              checked={form.deliveryEnabled || false}
              onChange={e => {
                setForm(prev => ({ ...prev, deliveryEnabled: e.target.checked }));
                setSaved(false);
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <Bike size={18} color="var(--text-light)" />
            Habilitar Módulo "Entrega a Domicilio"
          </label>
          {form.deliveryEnabled && (
            <div style={{ marginTop: '12px', paddingLeft: '28px' }}>
              <label style={labelStyle}>Tarifa de Envío Predeterminada ($)</label>
              <input
                style={{ ...inputStyle, width: '200px' }}
                type="number"
                min="0"
                step="0.01"
                name="defaultDeliveryFee"
                value={form.defaultDeliveryFee || ''}
                onChange={handleChange}
                placeholder="Ej: 25.00"
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px', margin: 0 }}>
                Se sugerirá automáticamente al seleccionar envío a domicilio, con opción de modificarla en la comanda.
              </p>
            </div>
          )}
        </div>

        {/* Auto Print Toggle */}
        <div style={sectionStyle}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-dark)' }}>
            <input
              type="checkbox"
              checked={autoPrintEnabled}
              onChange={e => {
                setAutoPrintEnabled(e.target.checked);
                localStorage.setItem('autoPrintKitchen', e.target.checked ? 'true' : 'false');
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <Printer size={18} color="var(--text-light)" />
            Imprimir Comandas Automáticamente
          </label>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', margin: 0 }}>
            Al activarse, cualquier comanda nueva enviada por los meseros desde otros dispositivos se mandará a imprimir automáticamente en este dispositivo.
          </p>
        </div>




        {/* Tables Management */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🪑</span>
            <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Mesas Fijas del Local</span>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', margin: 0 }}>
            Si agregas mesas aquí, el POS mostrará un selector para asignarlas. Las mesas ocupadas no se podrán elegir.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Ej: Mesa 1, Barra, Terraza..."
              value={newTable}
              onChange={e => setNewTable(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ padding: '0 20px', borderRadius: '10px' }}
              onClick={handleAddTable}
              disabled={!newTable.trim()}
            >
              Agregar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {(form.tables || []).map(t => (
              <div key={t.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white' }}>
                <span style={{ fontWeight: '600' }}>{t.name}</span>
                <button onClick={() => handleRemoveTable(t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!form.tables || form.tables.length === 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem', padding: '10px' }}>
                No hay mesas registradas. Se ingresará el texto libremente al cobrar.
              </div>
            )}
          </div>
        </div>

        {/* Delivery Employees */}
        {restaurantId && (
          <div style={sectionStyle}>
            <DeliveryEmployees restaurantId={restaurantId} restaurantName={restaurantName || 'REP'} />
          </div>
        )}

        {/* ── Backup & Restore ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Download size={18} color="var(--text-light)" />
            <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Backup y Restauración de Datos</span>
          </div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-light)', margin: 0 }}>
            ⚠️ Todos tus datos están guardados en este navegador. Exporta un respaldo regularmente para no perderlos.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            {/* Export */}
            <button
              onClick={() => { exportBackup(); setBackupMsg({ type: 'success', text: '✅ Backup descargado correctamente.' }); setTimeout(() => setBackupMsg(null), 4000); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#0984e3', color: 'white', fontFamily: 'inherit', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <Download size={16} /> Exportar Backup (.json)
            </button>

            {/* Import */}
            <button
              onClick={() => backupImportRef.current.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: '2px solid #0984e3', background: 'white', color: '#0984e3', fontFamily: 'inherit', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <RefreshCw size={16} /> Restaurar Backup
            </button>
            <input
              ref={backupImportRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const confirmed = await showConfirm('⚠️ Esto reemplazará TODOS tus datos actuales con los del backup. ¿Continuar?');
                if (!confirmed) return;
                importBackup(
                  file,
                  () => { setBackupMsg({ type: 'success', text: '✅ Datos restaurados. Recarga la página para ver los cambios.' }); e.target.value = ''; },
                  () => { setBackupMsg({ type: 'error', text: '❌ El archivo no es válido o está dañado.' }); e.target.value = ''; }
                );
              }}
            />
          </div>

          {backupMsg && (
            <div style={{
              marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '600',
              background: backupMsg.type === 'success' ? 'rgba(29,209,161,0.12)' : 'rgba(231,76,60,0.12)',
              color: backupMsg.type === 'success' ? '#10ac84' : '#e74c3c',
              border: `1px solid ${backupMsg.type === 'success' ? '#1dd1a1' : '#e74c3c'}`,
            }}>
              {backupMsg.text}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button
            className="btn-primary"
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', fontSize: '1rem', background: saved ? 'var(--success-color)' : undefined }}
            onClick={handleSave}
          >
            <Save size={18} /> {saved ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
          
          <button
            onClick={onLogout}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', fontSize: '1rem', background: 'transparent', border: '2px solid #e74c3c', color: '#e74c3c', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Lock size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}


