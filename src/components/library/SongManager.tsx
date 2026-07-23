'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, Edit3, FileJson, ImageUp, Music2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, SelectField } from '@/components/ui/Field';
import { apiFetch } from '@/lib/api';
import { ensureSession } from '@/lib/supabase/client';
import type { Song } from '@/types/game';

type Draft = Omit<Song, 'id'>;
type DeleteResult = { deleted: boolean; archived: boolean; song?: Song };

const empty: Draft = {
  title: '',
  artist: '',
  release_year: new Date().getFullYear(),
  decade: 2020,
  genre: 'Pop',
  country: 'Perú',
  spotify_url: '',
  difficulty: 2,
  image_url: null,
  tags: [],
  is_active: true
};

export function SongManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Song | null | undefined>(undefined);
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<{ songs: Song[] }>('/api/songs');
      setSongs(data.songs);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la biblioteca.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return songs.filter((song) => `${song.title} ${song.artist} ${song.genre} ${song.country}`.toLowerCase().includes(term));
  }, [songs, q]);

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta canción? Si ya fue usada en una partida se archivará para conservar el historial.')) return;
    try {
      const result = await apiFetch<DeleteResult>(`/api/songs/${id}`, { method: 'DELETE' });
      if (result.archived && result.song) {
        setSongs((current) => current.map((song) => song.id === id ? result.song! : song));
        setNotice('La canción fue archivada porque forma parte del historial de una partida.');
      } else {
        setSongs((current) => current.filter((song) => song.id !== id));
        setNotice('Canción eliminada.');
      }
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo eliminar.');
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const data = await apiFetch<{ imported: number }>('/api/library/import', { method: 'POST', body: JSON.stringify(json) });
      setNotice(`${data.imported} canciones importadas.`);
      setError('');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'JSON inválido.');
    } finally {
      event.target.value = '';
    }
  }

  async function exportJson() {
    try {
      const session = await ensureSession();
      const response = await fetch('/api/library/export', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) throw new Error('No se pudo exportar.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'ritmolinea-biblioteca.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo exportar.');
    }
  }

  if (error && songs.length === 0 && !loading) {
    return <div className="formCard glass" style={{ textAlign: 'center' }}>
      <Music2 size={54}/><h2>Biblioteca protegida</h2><p style={{ color: 'var(--muted)' }}>{error}</p>
      <p>Inicia sesión con una cuenta marcada como <b>admin</b> en Supabase.</p>
      <Button onClick={() => { location.href = '/profile'; }}>Ir a Perfil</Button>
    </div>;
  }

  return <>
    <div className="tableToolbar">
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--muted)' }}/>
        <input className="searchInput" style={{ paddingLeft: 42 }} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar por canción, artista, género o país..."/>
      </div>
      <label className="button button-ghost"><Upload size={17}/>Importar JSON<input type="file" accept="application/json" hidden onChange={importFile}/></label>
      <Button variant="ghost" onClick={exportJson}><Download size={17}/>Exportar</Button>
      <Button onClick={() => setEditing(null)}><Plus size={17}/>Agregar canción</Button>
    </div>
    {notice && <div className="successBox" style={{ marginBottom: 12 }}>{notice}</div>}
    {error && <div className="errorBox" style={{ marginBottom: 12 }}>{error}</div>}
    <div className="songTable glass"><table>
      <thead><tr><th>Canción</th><th>Año</th><th>Género</th><th>País</th><th>Dificultad</th><th>Tags</th><th>Estado</th><th/></tr></thead>
      <tbody>{loading ? <tr><td colSpan={8}>Cargando biblioteca...</td></tr> : filtered.map((song) => <tr key={song.id}>
        <td><div className="songIdentity"><div className="songThumb">{song.image_url ? <img src={song.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }}/> : '♪'}</div><div><strong>{song.title}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{song.artist}</small></div></div></td>
        <td>{song.release_year}</td><td>{song.genre}</td><td>{song.country}</td>
        <td>{'●'.repeat(song.difficulty)}<span style={{ opacity: .2 }}>{'●'.repeat(5 - song.difficulty)}</span></td>
        <td>{song.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</td>
        <td><span className="tag" style={{ color: song.is_active ? 'var(--success)' : 'var(--danger)' }}>{song.is_active ? 'Activa' : 'Archivada'}</span></td>
        <td><div className="actions"><button className="iconBtn" onClick={() => setEditing(song)} aria-label="Editar"><Edit3 size={16}/></button><button className="iconBtn" onClick={() => { void remove(song.id); }} aria-label="Eliminar"><Trash2 size={16}/></button></div></td>
      </tr>)}</tbody>
    </table></div>
    {editing !== undefined && <SongModal initial={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={(song) => {
      setSongs((current) => editing ? current.map((item) => item.id === song.id ? song : item) : [song, ...current]);
      setEditing(undefined);
    }}/>} 
  </>;
}

function SongModal({ initial, onClose, onSaved }: { initial?: Song; onClose: () => void; onSaved: (song: Song) => void }) {
  const [draft, setDraft] = useState<Draft>(initial ? {
    title: initial.title, artist: initial.artist, release_year: initial.release_year, decade: initial.decade,
    genre: initial.genre, country: initial.country, spotify_url: initial.spotify_url, difficulty: initial.difficulty,
    image_url: initial.image_url, tags: initial.tags, is_active: initial.is_active
  } : empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft((current) => ({ ...current, [key]: value })); }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const session = await ensureSession();
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/library/image', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo subir la portada.');
      patch('image_url', payload.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo subir la portada.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...draft, decade: Math.floor(draft.release_year / 10) * 10, image_url: draft.image_url || null };
      const data = await apiFetch<{ song: Song }>(initial ? `/api/songs/${initial.id}` : '/api/songs', { method: initial ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved(data.song);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.');
      setBusy(false);
    }
  }

  return <div className="modalBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="modal glass" onSubmit={submit}>
      <div className="modalHead"><div><span className="eyebrow">Administrador</span><h2>{initial ? 'Editar canción' : 'Nueva canción'}</h2></div><button type="button" className="iconBtn" onClick={onClose}><X/></button></div>
      <div className="formGrid">
        <Field label="Título" value={draft.title} onChange={(event) => patch('title', event.target.value)} required/>
        <Field label="Artista" value={draft.artist} onChange={(event) => patch('artist', event.target.value)} required/>
        <Field label="Año" type="number" min={1900} max={2100} value={draft.release_year} onChange={(event) => patch('release_year', Number(event.target.value))} required/>
        <Field label="Género" value={draft.genre} onChange={(event) => patch('genre', event.target.value)} required/>
        <Field label="País" value={draft.country} onChange={(event) => patch('country', event.target.value)} required/>
        <SelectField label="Dificultad" value={draft.difficulty} onChange={(event) => patch('difficulty', Number(event.target.value))}>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} / 5</option>)}</SelectField>
        <label className="field" style={{ gridColumn: '1/-1' }}><span>Spotify URL</span><input value={draft.spotify_url} onChange={(event) => patch('spotify_url', event.target.value)} placeholder="https://open.spotify.com/track/..." required/></label>
        <label className="field" style={{ gridColumn: '1/-1' }}><span>Imagen URL</span><input value={draft.image_url ?? ''} onChange={(event) => patch('image_url', event.target.value || null)} placeholder="https://..."/></label>
        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {draft.image_url && <img src={draft.image_url} alt="Vista previa de portada" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 14 }}/>} 
          <label className="button button-ghost"><ImageUp size={17}/>{uploading ? 'Subiendo...' : 'Subir portada'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={uploadCover}/></label>
          <small style={{ color: 'var(--muted)' }}>JPG, PNG o WebP · máximo 5 MB</small>
        </div>
        <label className="field" style={{ gridColumn: '1/-1' }}><span>Tags separados por coma</span><input value={draft.tags.join(', ')} onChange={(event) => patch('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} placeholder="latino, women, tiktok, band..."/></label>
        <label className="toggleRow" style={{ gridColumn: '1/-1' }}><span><strong>Canción activa</strong><small style={{ display: 'block', color: 'var(--muted)' }}>Disponible para nuevas partidas</small></span><input type="checkbox" checked={draft.is_active} onChange={(event) => patch('is_active', event.target.checked)}/></label>
      </div>
      {error && <div className="errorBox">{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={busy || uploading}><FileJson size={17}/>{busy ? 'Guardando...' : 'Guardar canción'}</Button></div>
    </form>
  </div>;
}
