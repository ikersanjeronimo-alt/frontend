import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '../../pages/EventDetailPage.module.css'

type FormKind = 'choice' | 'text'

type ChoiceForm = {
  kind: 'choice'
  question: string
  options: string[]
}

type TextForm = {
  kind: 'text'
  question: string
}

type EventForm = ChoiceForm | TextForm

interface EventFormSectionProps {
  isMod: boolean
}

/**
 * Encapsula el formulario embebido en /eventos/:id:
 *   - Botón "+ Añadir formulario" (solo mod, cuando no hay form ni se está editando).
 *   - Editor de formulario (selección de tipo, pregunta, opciones).
 *   - Vista del formulario (votación o respuesta de texto + resultados).
 *
 * Estado puramente local — sin persistencia. Cuando exista el backend,
 * sustituir los useState por useApi/useApiMutation con los endpoints:
 *   POST   /api/events/:id/form
 *   DELETE /api/events/:id/form
 *   POST   /api/events/:id/form/vote
 *   POST   /api/events/:id/form/response
 */
export function EventFormSection({ isMod }: EventFormSectionProps) {
  const { t } = useTranslation()
  const [form, setForm]               = useState<EventForm | null>(null)
  const [editing, setEditing]         = useState(false)
  const [draftKind, setDraftKind]     = useState<FormKind>('choice')
  const [draftQuestion, setDraftQ]    = useState('')
  const [draftOptions, setDraftOpts]  = useState<string[]>(['', ''])

  const [votes, setVotes]             = useState<number[]>([])
  const [myVote, setMyVote]           = useState<number | null>(null)
  const [pendingVote, setPendingVote] = useState<number | null>(null)
  const [textResponses, setTextResps] = useState<string[]>([])
  const [pendingText, setPendingText] = useState('')
  const [mySent, setMySent]           = useState(false)

  const openEditor = () => {
    setDraftKind('choice')
    setDraftQ('')
    setDraftOpts(['', ''])
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

  const saveForm = () => {
    if (!canSaveForm) return
    if (draftKind === 'choice') {
      const cleaned = draftOptions.map(o => o.trim()).filter(Boolean)
      setForm({ kind: 'choice', question: draftQuestion.trim(), options: cleaned })
      setVotes(new Array(cleaned.length).fill(0))
      setMyVote(null)
      setPendingVote(null)
    } else {
      setForm({ kind: 'text', question: draftQuestion.trim() })
      setTextResps([])
      setPendingText('')
      setMySent(false)
    }
    setEditing(false)
  }

  const deleteForm = () => {
    setForm(null)
    setVotes([])
    setMyVote(null)
    setPendingVote(null)
    setTextResps([])
    setPendingText('')
    setMySent(false)
  }

  const submitVote = () => {
    if (pendingVote === null || myVote !== null) return
    setVotes(prev => prev.map((v, i) => i === pendingVote ? v + 1 : v))
    setMyVote(pendingVote)
  }

  const submitText = () => {
    const value = pendingText.trim()
    if (!value || mySent) return
    setTextResps(prev => [...prev, value])
    setMySent(true)
  }

  const totalVotes = votes.reduce((a, b) => a + b, 0)

  return (
    <>
      {isMod && !form && !editing && (
        <button className={styles.addFormBtn} onClick={openEditor}>
          {t('events.addForm')}
        </button>
      )}

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
              disabled={!canSaveForm}
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
              <button type="button" className={styles.deleteFormBtn} onClick={deleteForm}>
                {t('events.formDelete')}
              </button>
            )}
          </div>

          {form.kind === 'choice' && myVote === null && (
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
                disabled={pendingVote === null}
              >
                {t('events.vote')}
              </button>
            </>
          )}

          {form.kind === 'choice' && myVote !== null && (
            <div className={styles.resultsList}>
              {form.options.map((opt, i) => {
                const count = votes[i] ?? 0
                const pct   = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
                return (
                  <div key={i} className={styles.resultRow}>
                    <div className={styles.resultLabel}>
                      <span>{opt}{myVote === i ? ` · ${t('events.yourVote')}` : ''}</span>
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

          {form.kind === 'text' && !mySent && (
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
                disabled={!pendingText.trim()}
              >
                {t('events.sendResponse')}
              </button>
            </>
          )}

          {form.kind === 'text' && mySent && (
            <div className={styles.resultsList}>
              <p className={styles.resultsMeta}>
                {textResponses.length} {textResponses.length === 1 ? t('events.responseSg') : t('events.responsePl')}
              </p>
              {textResponses.map((r, i) => (
                <div key={i} className={styles.responseRow}>{r}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
