import React, { useState } from 'react';
import { ChefHat, Navigation, Mail, Lock, Key } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

export default function LoginView({ onLoginSuccess }) {
  const [view, setView] = useState('selection'); // 'selection', 'owner_login', 'owner_register', 'employee_login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleOwnerAuth = async (e, isRegister) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        // Registrar usuario
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          // Crear restaurante por defecto para este dueño
          const { data: restData, error: restError } = await supabase
            .from('restaurants')
            .insert([{ owner_id: data.user.id, name: 'Mi Restaurante' }])
            .select()
            .single();
            
          if (restError) throw restError;
          addToast('Registro exitoso', 'success');
          onLoginSuccess({ role: 'admin', restaurant_id: restData.id, user: data.user });
        }
      } else {
        // Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Obtener el restaurante del dueño
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', data.user.id)
          .single();
          
        if (restError) throw restError;
        addToast('Bienvenido', 'success');
        onLoginSuccess({ role: 'admin', restaurant_id: restData.id, user: data.user });
      }
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Buscar empleado por código
      const { data, error } = await supabase
        .from('employees')
        .select('*, restaurants(name)')
        .eq('access_code', accessCode)
        .single();
        
      if (error || !data) throw new Error('Código incorrecto o no existe.');
      
      addToast(`Conectado a ${data.restaurants.name}`, 'success');
      onLoginSuccess({ role: data.role, restaurant_id: data.restaurant_id, employeeInfo: data });
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' };

  if (view === 'selection') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)', gap: '20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌮</div>
        <h1 style={{ color: 'var(--text-dark)' }}>Ingresar al Sistema</h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setView('owner_login')} className="glass-panel" style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ChefHat size={48} color="var(--primary-color)" />
            <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>Dueño / Admin</h2>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '0 10px' }}>Gestiona tu restaurante y ventas</p>
          </button>
          
          <button onClick={() => setView('employee_login')} className="glass-panel" style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Navigation size={48} color="#FF9800" />
            <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>Empleado</h2>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '0 10px' }}>Repartidores y Staff (Código)</p>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'employee_login') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '340px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '2.5rem' }}>🛵</div>
          <h2>Acceso Empleado</h2>
          <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-light)' }} />
              <input type="text" autoFocus value={accessCode} onChange={e => setAccessCode(e.target.value.toUpperCase())} placeholder="Código (Ej: REP-123)" style={{ ...inputStyle, paddingLeft: '40px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }} required />
            </div>
            <button className="btn-primary" type="submit" style={{ padding: '14px', fontSize: '1.05rem' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setView('selection')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>Volver</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '360px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ textAlign: 'center', margin: 0 }}>{view === 'owner_login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <form onSubmit={(e) => handleOwnerAuth(e, view === 'owner_register')} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-light)' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" style={{ ...inputStyle, paddingLeft: '40px' }} required />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-light)' }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" style={{ ...inputStyle, paddingLeft: '40px' }} required minLength={6} />
          </div>
          <button className="btn-primary" type="submit" style={{ padding: '14px', fontSize: '1.05rem', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Cargando...' : (view === 'owner_login' ? 'Ingresar' : 'Registrarme')}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button type="button" onClick={() => setView(view === 'owner_login' ? 'owner_register' : 'owner_login')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 'bold' }}>
              {view === 'owner_login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button type="button" onClick={() => setView('selection')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.9rem' }}>Volver</button>
          </div>
        </form>
      </div>
    </div>
  );
}
