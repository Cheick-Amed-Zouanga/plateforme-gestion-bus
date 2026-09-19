import { useEffect, useState, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/shared/AdminLayout'
import { DataTable } from '@/components/shared/DataTable'
import type { Column } from '@/components/shared/DataTable'
import { SimpleModal } from '@/components/shared/SimpleModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDashboardUser } from '@/shared/hooks/useDashboardUser'
import apiFetch from '@/shared/services/api'

interface Message {
  id: number
  auteur_client: boolean
  contenu: string
  cree_le: string
}

interface Ticket {
  id: number
  sujet: string
  description: string
  client_display: string
  client_nom: string
  client_telephone: string
  client_email: string
  numero_billet: string
  priorite: string
  priorite_display: string
  statut: string
  statut_display: string
  cree_le: string
  messages?: Message[]
}

const EMPTY = {
  sujet: '',
  description: '',
  client_nom: '',
  client_telephone: '',
  client_email: '',
  numero_billet: '',
  priorite: 'MOYENNE',
}

function badgeStatut(s: string) {
  if (s === 'OUVERT') return 'warning' as const
  if (s === 'EN_COURS') return 'info' as const
  if (s === 'RESOLU') return 'success' as const
  return 'secondary' as const
}

function badgePriorite(p: string) {
  if (p === 'HAUTE') return 'destructive' as const
  if (p === 'MOYENNE') return 'warning' as const
  return 'secondary' as const
}

export default function SupportTicketsPage() {
  const { userRole, userEmail, handleLogout, isSuperAdmin, hasPermission } = useDashboardUser()
  const canCreate = hasPermission('sav.create') || hasPermission('sav.update') || hasPermission('billet.update')
  const canUpdate = hasPermission('sav.update') || hasPermission('billet.update')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtre, setFiltre] = useState('TOUS')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detail, setDetail] = useState<Ticket | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [reponse, setReponse] = useState('')
  const [savingMsg, setSavingMsg] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgCountRef = useRef(0)

  const charger = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch('/sav/tickets/')
      .then(data => setTickets(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    const id = window.setInterval(() => {
      apiFetch('/sav/tickets/')
        .then(data => setTickets(Array.isArray(data) ? data : data.results || []))
        .catch(() => {})
    }, 8000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!detailId) return undefined
    let cancelled = false

    async function refreshChat() {
      try {
        const full = await apiFetch(`/sav/tickets/${detailId}/`)
        if (cancelled) return
        setDetail(full)
        const n = (full.messages || []).length
        if (n > msgCountRef.current) {
          msgCountRef.current = n
          requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          })
        }
      } catch {
        // ignore poll errors
      }
    }

    refreshChat()
    const id = window.setInterval(refreshChat, 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [detailId])

  async function creer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await apiFetch('/sav/tickets/', { method: 'POST', body: JSON.stringify(form) })
      setModalOpen(false)
      setForm(EMPTY)
      charger()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function ouvrirDetail(t: Ticket) {
    msgCountRef.current = 0
    setDetailId(t.id)
    setDetail(null)
    setReponse('')
    try {
      const full = await apiFetch(`/sav/tickets/${t.id}/`)
      setDetail(full)
      msgCountRef.current = (full.messages || []).length
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' })
      })
    } catch (e: any) {
      setError(e.message)
      setDetailId(null)
    }
  }

  function fermerDetail() {
    setDetail(null)
    setDetailId(null)
    charger()
  }

  async function changerStatut(statut: string) {
    if (!detail || !canUpdate) return
    try {
      const updated = await apiFetch(`/sav/tickets/${detail.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      })
      setDetail(updated)
      charger()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function envoyerReponse(e: React.FormEvent) {
    e.preventDefault()
    if (!detail || !reponse.trim()) return
    setSavingMsg(true)
    try {
      await apiFetch(`/sav/tickets/${detail.id}/messages/`, {
        method: 'POST',
        body: JSON.stringify({ contenu: reponse }),
      })
      const full = await apiFetch(`/sav/tickets/${detail.id}/`)
      setDetail(full)
      msgCountRef.current = (full.messages || []).length
      setReponse('')
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingMsg(false)
    }
  }

  const list = filtre === 'TOUS' ? tickets : tickets.filter(t => t.statut === filtre)

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      label: 'N°',
      render: v => <span className="font-mono text-sm">#{v}</span>,
    },
    { key: 'sujet', label: 'Sujet', sortable: true },
    { key: 'client_display', label: 'Client' },
    {
      key: 'priorite',
      label: 'Priorité',
      render: (_, row) => (
        <Badge variant={badgePriorite(row.priorite)}>{row.priorite_display || row.priorite}</Badge>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (_, row) => (
        <Badge variant={badgeStatut(row.statut)}>{row.statut_display || row.statut}</Badge>
      ),
    },
    {
      key: 'cree_le',
      label: 'Créé le',
      render: v => (v ? new Date(v).toLocaleString('fr-FR') : '—'),
    },
  ]

  return (
    <AdminLayout userRole={userRole} userEmail={userEmail} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support client</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tickets issus de l’app mobile — ouvrez un ticket pour la conversation en direct.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connectez-vous avec un compte SAV / Manager de compagnie pour gérer les tickets.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex flex-wrap gap-2">
          {['TOUS', 'OUVERT', 'EN_COURS', 'RESOLU', 'FERME'].map(s => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={filtre === s ? 'default' : 'outline'}
              onClick={() => setFiltre(s)}
            >
              {s === 'TOUS' ? `Tous (${tickets.length})` : s.replace('_', ' ')}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={list}
          loading={loading}
          onAdd={canCreate ? () => { setForm(EMPTY); setFormError(null); setModalOpen(true) } : undefined}
          onEdit={ouvrirDetail}
          emptyMessage="Aucun ticket support."
        />
      </div>

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau ticket">
        <form onSubmit={creer} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <div>
            <Label className="mb-1 block">Sujet</Label>
            <Input required value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1 block">Description</Label>
            <Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">Client (nom)</Label>
              <Input value={form.client_nom} onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block">Téléphone</Label>
              <Input value={form.client_telephone} onChange={e => setForm(f => ({ ...f, client_telephone: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Email</Label>
            <Input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block">N° billet (optionnel)</Label>
              <Input value={form.numero_billet} onChange={e => setForm(f => ({ ...f, numero_billet: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block">Priorité</Label>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.priorite}
                onChange={e => setForm(f => ({ ...f, priorite: e.target.value }))}
              >
                <option value="BASSE">Basse</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="HAUTE">Haute</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Création…' : 'Créer'}</Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={!!detailId}
        wide
        onClose={fermerDetail}
        title={detail ? `Conversation en direct — #${detail.id}` : 'Conversation…'}
      >
        {!detail ? (
          <p className="text-sm text-slate-500">Chargement de la conversation…</p>
        ) : (
          <div className="flex flex-col gap-4" style={{ minHeight: 420 }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                En direct
              </span>
              <Badge variant={badgeStatut(detail.statut)}>{detail.statut_display}</Badge>
              <Badge variant={badgePriorite(detail.priorite)}>{detail.priorite_display}</Badge>
              <span className="text-sm font-medium text-slate-800">{detail.sujet}</span>
            </div>

            <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              <p><span className="font-medium text-slate-800">Client :</span> {detail.client_display}</p>
              <p><span className="font-medium text-slate-800">Tél :</span> {detail.client_telephone || '—'}</p>
              <p><span className="font-medium text-slate-800">Email :</span> {detail.client_email || '—'}</p>
              <p><span className="font-medium text-slate-800">Billet :</span> {detail.numero_billet || '—'}</p>
            </div>

            {canUpdate && (
              <div className="flex flex-wrap gap-2">
                {['OUVERT', 'EN_COURS', 'RESOLU', 'FERME'].map(s => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={detail.statut === s ? 'default' : 'outline'}
                    onClick={() => changerStatut(s)}
                  >
                    {s.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-slate-50">
              <div className="max-h-72 flex-1 space-y-3 overflow-y-auto p-4">
                {(detail.messages || []).length === 0 && (
                  <p className="text-center text-sm text-slate-500">Aucun message encore.</p>
                )}
                {(detail.messages || []).map(m => (
                  <div
                    key={m.id}
                    className={`flex ${m.auteur_client ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        m.auteur_client
                          ? 'rounded-bl-md bg-white text-slate-800'
                          : 'rounded-br-md bg-emerald-600 text-white'
                      }`}
                    >
                      <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                        m.auteur_client ? 'text-slate-400' : 'text-emerald-100'
                      }`}>
                        {m.auteur_client ? 'Client (app)' : 'Vous (SAV)'} ·{' '}
                        {new Date(m.cree_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="whitespace-pre-wrap">{m.contenu}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {canUpdate && detail.statut !== 'FERME' && (
                <form onSubmit={envoyerReponse} className="flex gap-2 border-t border-slate-200 bg-white p-3">
                  <Textarea
                    placeholder="Écrire au client…"
                    value={reponse}
                    onChange={e => setReponse(e.target.value)}
                    rows={2}
                    className="min-h-[44px] flex-1"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        envoyerReponse(e as unknown as React.FormEvent)
                      }
                    }}
                  />
                  <Button type="submit" disabled={savingMsg || !reponse.trim()} className="self-end">
                    {savingMsg ? '…' : 'Envoyer'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </SimpleModal>
    </AdminLayout>
  )
}
