import React, { useState } from 'react';
import { ChefHat, Navigation, Mail, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

export default function LoginView({ onLoginSuccess }) {
  const [view, setView] = useState('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const addToast = useToast(); // devuelve la función directamente

  const showError = (msg) => {
    setErrorMsg(msg);
    if (addToast) addToast(msg, 'error');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Busca el restaurante del dueño o lo crea si no existe
  const getOrCreateRestaurant = async (user) => {
    let { data: restData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (!restData) {
      const defaultName = email.split('@')[0];
      const { data: newRest, error: createErr } = await supabase
        .from('restaurants')
        .insert([{ owner_id: user.id, name: `Negocio de ${defaultName}` }])
        .select()
        .single();
      if (createErr) throw new Error(`Error al crear restaurante: ${createErr.message}`);
      restData = newRest;
    }
    return restData;
  };

  const finishLogin = (user, restData) => {
    const sessionData = { role: 'admin', restaurant_id: restData.id, user, restaurantName: restData.name };
    if (rememberMe) localStorage.setItem('appSession', JSON.stringify(sessionData));
    if (addToast) addToast(`¡Bienvenido!`, 'success');
    onLoginSuccess(sessionData);
  };

  // ── Iniciar sesión (dueño) ─────────────────────────────────────────────────
  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const restData = await getOrCreateRestaurant(data.user);
      finishLogin(data.user, restData);
    } catch (err) {
      showError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Registrarse (dueño) ────────────────────────────────────────────────────
  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      // Intento 1: signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

      let user = signUpData?.user;

      // Si el correo ya existe, hacer login directo
      if (signUpError || !user) {
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw new Error('Correo ya registrado. Usa la opción "Iniciar sesión" o revisa tu contraseña.');
        user = loginData.user;
      }

      const restData = await getOrCreateRestaurant(user);
      finishLogin(user, restData);
    } catch (err) {
      showError(err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  // ── Empleado (código) ──────────────────────────────────────────────────────
  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const code = accessCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from('employees')
        .select('*, restaurants(name)')
        .eq('access_code', code)
        .single();

      if (error || !data) throw new Error('Código incorrecto. Verifica con tu empleador.');

      if (addToast) addToast(`Conectado a ${data.restaurants?.name || 'tu restaurante'} ✓`, 'success');
      const sessionData = { role: data.role, restaurant_id: data.restaurant_id, employeeInfo: data };
      if (rememberMe) localStorage.setItem('appSession', JSON.stringify(sessionData));
      onLoginSuccess(sessionData);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Estilos ────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px',
    borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.8)', fontFamily: 'inherit',
    fontSize: '1rem', outline: 'none',
  };

  // ── Pantalla de selección ──────────────────────────────────────────────────
  if (view === 'selection') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)', gap: '20px', padding: '20px' }}>
        <div style={{ fontSize: '3.5rem' }}>🌮</div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, color: 'var(--text-dark)' }}>DailyControl</h1>
          <p style={{ color: 'var(--text-light)', margin: '6px 0 0 0' }}>¿Cómo deseas ingresar?</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '480px', width: '100%' }}>
          <button onClick={() => setView('owner_login')} className="glass-panel"
            style={{ flex: '1 1 160px', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <ChefHat size={42} color="var(--primary-color)" />
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '1rem' }}>Dueño / Admin</div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>Correo y contraseña</div>
            </div>
          </button>
          <button onClick={() => setView('employee_login')} className="glass-panel"
            style={{ flex: '1 1 160px', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Navigation size={42} color="#FF9800" />
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '1rem' }}>Empleado</div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>Mesero o Repartidor</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Empleado ───────────────────────────────────────────────────────────────
  if (view === 'employee_login') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '36px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🛵 🍽️</div>
            <h2 style={{ margin: 0 }}>Acceso Empleado</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>Ingresa el código que te dio tu empleador</p>
          </div>
          <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <Key size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input autoFocus value={accessCode} onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Ej: TACOSM-K7R2"
                style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.05rem' }}
                required />
            </div>
            <RememberMeCheck checked={rememberMe} onChange={setRememberMe} />
            {errorMsg && <ErrorBanner msg={errorMsg} />}
            <button className="btn-primary" type="submit" style={{ padding: '14px', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => { setView('selection'); setErrorMsg(''); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontFamily: 'inherit' }}>
              ← Volver
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dueño: Login / Registro ────────────────────────────────────────────────
  const isRegister = view === 'owner_register';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '36px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ textAlign: 'center' }}>
          <ChefHat size={40} color="var(--primary-color)" style={{ marginBottom: '8px' }} />
          <h2 style={{ margin: 0 }}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            {isRegister ? 'Crea tu cuenta de restaurante' : 'Bienvenido de vuelta'}
          </p>
        </div>

        <form onSubmit={isRegister ? handleOwnerRegister : handleOwnerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico" style={inputStyle} required autoFocus />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña (mínimo 6 caracteres)"
              style={{ ...inputStyle, paddingRight: '42px' }} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex' }}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <RememberMeCheck checked={rememberMe} onChange={setRememberMe} />
          {errorMsg && <ErrorBanner msg={errorMsg} />}

          <button className="btn-primary" type="submit" style={{ padding: '14px', fontSize: '1rem', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Cargando...' : (isRegister ? '✓ Crear cuenta y entrar' : 'Iniciar sesión')}
          </button>
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="button" onClick={() => { setView(isRegister ? 'owner_login' : 'owner_register'); setErrorMsg(''); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: '700', fontFamily: 'inherit', fontSize: '0.92rem' }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Crea tu cuenta gratis'}
          </button>
          <button type="button" onClick={() => { setView('selection'); setErrorMsg(''); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontFamily: 'inherit', fontSize: '0.85rem' }}>
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}

function RememberMeCheck({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-light)', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
      Guardar inicio de sesión en este dispositivo
    </label>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.87rem', color: '#c0392b', fontWeight: '600' }}>
      ⚠ {msg}
    </div>
  );
}
