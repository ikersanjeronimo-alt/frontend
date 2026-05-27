import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBannedWords } from '../../hooks/useBannedWords'
import { maskWord } from '../../lib/bannedWords'
import styles from './BannedWordsSection.module.css'

export function BannedWordsSection() {
  const { t } = useTranslation()
  const { words: bannedWords, add, remove, update } = useBannedWords()
  const [newWord, setNewWord]           = useState('')
  const [editingIdx, setEditingIdx]     = useState<number | null>(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const [draftWord, setDraftWord]       = useState('')
  const [wordError, setWordError]       = useState<string | null>(null)

  const handleAdd = () => {
    const res = add(newWord)
    if (!res.ok) { setWordError(res.error ?? 'No se pudo añadir.'); return }
    setNewWord('')
    setWordError(null)
  }

  const handleDelete = (idx: number) => {
    remove(idx)
    if (editingIdx === idx) {
      setEditingIdx(null)
      setDraftWord('')
    }
    setConfirmDeleteIdx(null)
    setWordError(null)
  }

  const startEdit = (idx: number) => {
    const word = bannedWords[idx]
    if (word === undefined) return
    setEditingIdx(idx)
    setDraftWord(word)
    setWordError(null)
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setDraftWord('')
    setWordError(null)
  }

  const saveEdit = () => {
    if (editingIdx === null) return
    const res = update(editingIdx, draftWord)
    if (!res.ok) { setWordError(res.error ?? 'No se pudo guardar.'); return }
    setEditingIdx(null)
    setDraftWord('')
    setWordError(null)
  }

  return (
    <div className={styles.section}>
      <p className={styles.desc}>
        {t('moderation.filterDescPre')} <strong>puta</strong> → <strong>p***</strong>{t('moderation.filterDescPost')}
      </p>

      <div className={styles.addRow}>
        <input
          type="text"
          className={styles.addInput}
          placeholder={t('moderation.filterPh')}
          value={newWord}
          onChange={e => { setNewWord(e.target.value); setWordError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          maxLength={40}
        />
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={!newWord.trim()}
        >
          {t('moderation.filterAdd')}
        </button>
      </div>

      {wordError && <p className={styles.error} role="alert">{wordError}</p>}

      {bannedWords.length === 0 ? (
        <div className={styles.empty}>
          {t('moderation.filterEmpty')}
        </div>
      ) : (
        <ul className={styles.list}>
          {bannedWords.map((w, i) => {
            const isEditing         = editingIdx === i
            const isConfirmingDelete = confirmDeleteIdx === i
            return (
              <li key={w} className={styles.row}>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.editInput}
                    value={draftWord}
                    onChange={e => { setDraftWord(e.target.value); setWordError(null) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { e.preventDefault(); saveEdit() }
                      if (e.key === 'Escape') { cancelEdit() }
                    }}
                    maxLength={40}
                    autoFocus
                  />
                ) : (
                  <>
                    <span className={styles.word}>{w}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.preview}>{maskWord(w)}</span>
                  </>
                )}

                <div className={styles.actions}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionSave}`}
                        onClick={saveEdit}
                        disabled={!draftWord.trim()}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={cancelEdit}
                      >
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : isConfirmingDelete ? (
                    <>
                      <span className={styles.confirmText}>{t('moderation.deleteConfirm')}</span>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionDelete}`}
                        onClick={() => handleDelete(i)}
                      >
                        {t('common.confirm')}
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setConfirmDeleteIdx(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => startEdit(i)}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionDelete}`}
                        onClick={() => setConfirmDeleteIdx(i)}
                      >
                        {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
