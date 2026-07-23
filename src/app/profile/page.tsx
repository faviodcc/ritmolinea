'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AVATARS, THEMES } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import { getSupabaseBrowserClient, ensureSession } from '@/lib/supabase/client';
import { avatarEmoji } from '@/lib/utils';
import { KeyRound, LogIn, LogOut, MailCheck, Save, ShieldCheck, UserRound } from 'lucide-react';

type Profile = {
  id: string;
  display_name: string | null;
  avatar_id: string;
  role: string;
  theme: string;
  is_public: boolean;
  games_played: number;
  wins: number;
  total_score: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await apiFetch<{ profile: Profile; user: { email: string | null; isAnonymous: boolean } }>('/api/profile');
      setProfile(data.profile);
      setEmail(data.user.email);
      setAnonymous(data.user.isAnonymous);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el perfil.');
    }
  }

  useEffect(() => { void load(); }, []);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const supabase = getSupabaseBrowserClient();
    try {
      if (authMode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: authEmail, password: loginPassword });
        if (authError) throw authError;
        setNotice('Sesión iniciada.');
      } else {
        const { error: authError } = await supabase.auth.updateUser({ email: authEmail });
        if (authError) throw authError;
        setNotice('Te enviamos un enlace de verificación. Ábrelo para conservar este mismo perfil y luego establece tu contraseña aquí.');
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar la autenticación.');
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.updateUser({ password: newPassword });
      if (authError) throw authError;
      setNewPassword('');
      setNotice('Contraseña establecida. Ya puedes volver a entrar desde cualquier dispositivo.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!profile) return;
    try {
      const data = await apiFetch<{ profile: Profile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: profile.display_name || 'Jugador', avatar_id: profile.avatar_id, theme: profile.theme, is_public: profile.is_public })
      });
      setProfile(data.profile);
      setNotice('Perfil actualizado.');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.');
    }
  }

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    await ensureSession();
    setNotice('Sesión cerrada. Ahora usas un perfil invitado nuevo.');
    await load();
  }

  return <AppShell>
    <div className="pageHead"><div><span className="eyebrow">Identidad de jugador</span><h1>Tu perfil</h1><p>Personaliza tu avatar, conserva estadísticas y habilita una cuenta permanente.</p></div></div>
    {error && <div className="errorBox" style={{ marginBottom: 14 }}>{error}</div>}
    {notice && <div className="successBox" style={{ marginBottom: 14 }}>{notice}</div>}
    {!profile ? <div className="formCard glass">Cargando perfil...</div> : <div className="profileGrid">
      <aside className="profileCard glass">
        <div className="profileAvatar">{avatarEmoji(profile.avatar_id)}</div><h2>{profile.display_name || 'Jugador'}</h2>
        <span className="tag">{profile.role === 'admin' ? 'Administrador' : 'Jugador'}</span>
        <p style={{ color: 'var(--muted)' }}>{anonymous ? 'Perfil invitado de este navegador' : email}</p>
        <div className="statsGrid" style={{ gridTemplateColumns: 'repeat(3,1fr)', margin: '22px 0' }}>
          <div><strong>{profile.games_played}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>Partidas</small></div>
          <div><strong>{profile.wins}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>Victorias</small></div>
          <div><strong>{profile.total_score}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>Puntos</small></div>
        </div>
        {!anonymous && <Button variant="ghost" className="buttonFull" onClick={logout}><LogOut size={17}/>Cerrar sesión</Button>}
      </aside>
      <section className="formCard glass">
        <div className="formSection">
          <h3><UserRound size={18}/> Apariencia en partida</h3>
          <Field label="Nombre visible" value={profile.display_name || ''} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} maxLength={24}/>
          <label className="field" style={{ marginTop: 18 }}><span>Avatar</span><div className="avatarGrid">{AVATARS.map((avatar) => <button type="button" className={`avatarBtn ${profile.avatar_id === avatar.id ? 'selected' : ''}`} key={avatar.id} onClick={() => setProfile({ ...profile, avatar_id: avatar.id })}>{avatar.emoji}</button>)}</div></label>
          <label className="field" style={{ marginTop: 18 }}><span>Tema favorito</span><select value={profile.theme} onChange={(event) => setProfile({ ...profile, theme: event.target.value })}>{THEMES.map((theme) => <option value={theme.id} key={theme.id}>{theme.name}</option>)}</select></label>
          <label className="toggleRow"><span><strong>Ranking público</strong><small style={{ display: 'block', color: 'var(--muted)' }}>Permite mostrar tu nombre y puntaje histórico.</small></span><button type="button" className={`switch ${profile.is_public ? 'on' : ''}`} onClick={() => setProfile({ ...profile, is_public: !profile.is_public })}><i/></button></label>
          <Button onClick={save}><Save size={17}/>Guardar cambios</Button>
        </div>

        {anonymous ? <form className="formSection" onSubmit={authenticate}>
          <h3><ShieldCheck size={18}/> Convierte tu perfil en permanente</h3>
          <p style={{ color: 'var(--muted)' }}>{authMode === 'signup' ? 'Vincula un correo al usuario invitado actual para conservar sus estadísticas. Primero verifica el correo; después podrás establecer una contraseña.' : 'Entra a una cuenta existente. Esto cambia del perfil invitado actual al historial guardado en esa cuenta.'}</p>
          <div className="formGrid">
            <Field label="Correo" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required/>
            {authMode === 'login' && <Field label="Contraseña" type="password" minLength={8} value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required/>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Button disabled={busy}>{authMode === 'login' ? <LogIn size={17}/> : <MailCheck size={17}/>} {busy ? 'Procesando...' : authMode === 'login' ? 'Iniciar sesión' : 'Enviar verificación'}</Button>
            <Button type="button" variant="ghost" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Crear cuenta conservando este perfil' : 'Ya tengo cuenta'}</Button>
          </div>
        </form> : <form className="formSection" onSubmit={updatePassword}>
          <h3><KeyRound size={18}/> Contraseña de acceso</h3>
          <p style={{ color: 'var(--muted)' }}>Establece o cambia la contraseña de tu cuenta verificada.</p>
          <Field label="Nueva contraseña" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required/>
          <Button disabled={busy || newPassword.length < 8}><KeyRound size={17}/>{busy ? 'Guardando...' : 'Establecer contraseña'}</Button>
        </form>}
      </section>
    </div>}
  </AppShell>;
}
