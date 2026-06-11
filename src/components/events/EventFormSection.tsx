import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiEventForm } from '../../types/api'
import {
  getEventForm,
  createEventForm,
  deleteEventForm,
  voteEventForm,
  respondEventForm,
} from '../../services/events'
import { subscribeEventForm } from '../../services/eventsWS'
import styles from './EventFormSection.module.css'

type FormKind = 'choice' | 'text'

interface EventFormSectionProps {
  eventId: string
  isMod: boolean
}

/**
 * Formulario embebido en /eventos/:id, persistido en el backend:
 *   - Botón "+ Añadir formulario" (solo mod, cuando no hay form ni se está editando).
 *   - Editor de formulario (selección de tipo, pregunta, opciones) → POST /form.
 *   - Vista del formulario: votación / respuesta de texto + resultados.
 *
 * El estado vive en el backend y se refresca en vivo por WebSocket
 * (/topic/events/:id/form): cuando otra persona vota o responde, el recuento se
 * actualiza al momento. Los campos por-usuario (myVote/myResponded/responses) se
 * conservan en local porque el broadcast es público (no los incluye).
 */
export function EventFormSection({ eventId, isMod }: EventFormSectionProps) {
  const { t } = useTranslation()

  const [form, setForm]       = useState<ApiEventForm | null>(null)
  const [loaded, setLoaded]   = useState(false)
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')

  // Editor (mod)
  const [editing, setEditing]        = useState(false)
  const [draftKind, setDraftKind]    = useState<FormKind>('choice')
  const [draftQuestion, setDraftQ]   = useState('')
  const [draftOptions, setDraftOpts] = useState<string[]>(['', ''])

  // Borradores de participación
  const [pendingVote, setPendingVote] = useState<number | null>(null)
  const [pendingText, setPendingText] = useState('')

  // Carga inicial + suscripción en vivo.
  useEffect(() => {
    let active = true
    getEventForm(eventId)
      .then(f => { if (active) { setForm(f ?? null); setLoaded(true) } })
      .catch(() => { if (active) setLoaded(true) })

    const unsubscribe = subscribeEventForm(eventId, incoming => {
      setForm(prev => {
        if (incoming === null) return null
        // Mismo formulario → conservar lo del usuario y actualizar recuentos.
        const same = prev
          && prev.kind === incoming.kind
          && prev.question === incoming.question
          && prev.options.length === incoming.options.length
        if (!same || !prev) return incoming
        return {
          ...incoming,
          myVote: prev.myVote,
          myResponded: prev.myResponded,
          responses: prev.myResponded ? prev.responses : incoming.responses,
        }
      })
    })

    return () => { active = false; unsubscribe() }
  }, [eventId])

  const openEditor = () => {
    setDraftKind('choice')
    setDraftQ('')
    setDraftOpts(['', ''])
    setError('')
    setEditing(true)
  }

  const canSaveForm = (() => {
    if (!draftQuestion.trim()) return false
    if (draftKind === 'choice') {
      const cleaned = draftOptions.map(o => o.trim()).filter(Boolean)
      if (cleaned.length < 2) return false
    }
    return true
  })()

  const saveForm = async () => {
    if (!canSaveForm || busy) return
    setBusy(true)
    setError('')
    try {
      const payload = draftKind === 'choice'
        ? { kind: 'choice' as const, question: draftQuestion.trim(), options: draftOptions.map(o => o.trim()).filter(Boolean) }
        : { kind: 'text' as const, question: draftQuestion.trim() }
      const saved = await createEventForm(eventId, payload)
      setForm(saved)
      setEditing(false)
      setPendingVote(null)
      setPendingText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const removeForm = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await deleteEventForm(eventId)
      setForm(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const submitVote = async () => {
    if (pendingVote === null || busy || !form || form.myVote !== null) return
    setBusy(true)
    setError('')
    try {
      const updated = await voteEventForm(eventId, pendingVote)
      setForm(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const submitText = async () => {
    const value = pendingText.trim()
    if (!value || busy || !form || form.myResponded) return
    setBusy(true)
    setError('')
    try {
      const updated = await respondEventForm(eventId, value)
      setForm(updated)
      setPendingText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const totalVotes = form?.totalVotes ?? 0

  return (
    <>
      {isMod && loaded && !form && !editing && (
        <button className={styles.addFormBtn} onClick={openEditor}>
          {t('events.addForm')}
        </button>
      )}

      {error && <p className={styles.formError} role="alert">{error}</p>}

      {editing && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('events.formNew')}</h2>

          <div className={styles.kindRow}>
            <label className={`${styles.kindOpt} ${draftKind === 'choice' ? styles.kindOptActive : ''}`}>
              <input
                type="radio"
                name="formKind"
                checked={draftKind === 'choice'}
                onChange={() => setDraftKind('choice')}
              />
              {t('events.formChoice')}
            </label>
            <label className={`${styles.kindOpt} ${draftKind === 'text' ? styles.kindOptActive : ''}`}>
              <input
                type="radio"
                name="formKind"
                checked={draftKind === 'text'}
                onChange={() => setDraftKind('text')}
              />
              {t('events.formText')}
            </label>
          </div>

          <label className={styles.fieldLabel} htmlFor="ev-question">{t('events.formQuestion')}</label>
          <input
            id="ev-question"
            className={styles.input}
            type="text"
            placeholder={t('events.formQuestPh')}
            value={draftQuestion}
            onChange={e => setDraftQ(e.target.value)}
            maxLength={140}
          />

          {draftKind === 'choice' && (
            <>
              <p className={styles.fieldLabel}>{t('events.formOptions')}</p>
              <div className={styles.optionList}>
                {draftOptions.map((opt, i) => (
                  <div key={i} className={styles.optionRow}>
                    <input
                      id={`ev-option-${i}`}
                      name={`ev-option-${i}`}
                      className={styles.input}
                      type="text"
                      placeholder={`${t('events.formOptPh')} ${i + 1}`}
                      value={opt}
                      onChange={e => setDraftOpts(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                      maxLength={80}
                    />
                    {draftOptions.length > 2 && (
                      <button
                        type="button"
                        className={styles.removeOptBtn}
                        onClick={() => setDraftOpts(prev => prev.filter((_, j) => j !== i))}
                        aria-label={t('events.formRemoveOpt')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.addOptBtn}
                onClick={() => setDraftOpts(prev => [...prev, ''])}
              >
                {t('events.formAddOpt')}
              </button>
            </>
          )}

          <div className={styles.editorActions}>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={saveForm}
              disabled={!canSaveForm || busy}
            >
              {t('events.formSave')}
            </button>
          </div>
        </div>
      )}

      {form && (
        <div className={styles.section}>
          <div className={styles.formHeader}>
            <h2 className={styles.sectionTitle}>{form.question}</h2>
            {isMod && (
              <button type="button" className={styles.deleteFormBtn} onClick={removeForm} disabled={busy}>
                {t('events.formDelete')}
              </button>
            )}
          </div>

          {form.kind === 'choice' && form.myVote === null && (
            <>
              <div className={styles.choiceList}>
                {form.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`${styles.choiceRow} ${pendingVote === i ? styles.choiceRowActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="eventFormVote"
                      checked={pendingVote === i}
                      onChange={() => setPendingVote(i)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={submitVote}
                disabled={pendingVote === null || busy}
              >
                {t('events.vote')}
              </button>
            </>
          )}

          {form.kind === 'choice' && form.myVote !== null && (
            <div className={styles.resultsList}>
              {form.options.map((opt, i) => {
                const count = form.counts[i] ?? 0
                const pct   = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
                return (
                  <div key={i} className={styles.resultRow}>
                    <div className={styles.resultLabel}>
                      <span>{opt}{form.myVote === i ? ` · ${t('events.yourVote')}` : ''}</span>
                      <span className={styles.resultPct}>{pct}%</span>
                    </div>
                    <div className={styles.resultBar}>
                      <div className={styles.resultBarFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <p className={styles.resultsMeta}>
                {totalVotes} {totalVotes === 1 ? t('events.votesTotalSg') : t('events.votesTotalPl')}
              </p>
            </div>
          )}

          {form.kind === 'text' && !form.myResponded && (
            <>
              <textarea
                className={styles.textarea}
                placeholder={t('events.textPh')}
                value={pendingText}
                onChange={e => setPendingText(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={submitText}
                disabled={!pendingText.trim() || busy}
              >
                {t('events.sendResponse')}
              </button>
            </>
          )}

          {form.kind === 'text' && form.myResponded && (
            <div className={styles.resultsList}>
              <p className={styles.resultsMeta}>
                {form.responseCount} {form.responseCount === 1 ? t('events.responseSg') : t('events.responsePl')}
              </p>
              {form.responses.map((r, i) => (
                <div key={i} className={styles.responseRow}>{r}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
