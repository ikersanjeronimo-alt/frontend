import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBannedWords } from '../../hooks/useBannedWords'
import { maskWord } from '../../lib/bannedWords'
import styles from '../../pages/ModerationPage.module.css'

export function BannedWordsSection() {
  const { t } = useTranslation()
  const { words: bannedWords, add, remove, update } = useBannedWords()
  const [newWord, setNewWord]     = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draftWord, setDraftWord] = useState('')
  const [wordError, setWordError] = useState<string | null>(null)

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
    setWordError(null)
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setDraftWord(bannedWords[idx])
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
    <div className={styles.filterSection}>
      <p className={styles.sectionDesc}>
        {t('moderation.filterDescPre')} <strong>puta</strong> → <strong>p***</strong>{t('moderation.filterDescPost')}
      </p>

      <div className={styles.bannedAddRow}>
        <input
          type="text"
          className={styles.bannedAddInput}
          placeholder={t('moderation.filterPh')}
          value={newWord}
          onChange={e => { setNewWord(e.target.value); setWordError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          maxLength={40}
        />
        <button
          type="button"
          className={styles.bannedAddBtn}
          onClick={handleAdd}
          disabled={!newWord.trim()}
        >
          {t('moderation.filterAdd')}
        </button>
      </div>

      {wordError && <p className={styles.bannedError} role="alert">{wordError}</p>}

      {bannedWords.length === 0 ? (
        <div className={styles.bannedEmpty}>
          {t('moderation.filterEmpty')}
        </div>
      ) : (
        <ul className={styles.bannedList}>
          {bannedWords.map((w, i) => {
            const isEditing = editingIdx === i
            return (
              <li key={i} className={styles.bannedRow}>
                {isEditing ? (
                  <input
                    type="text"
                    className={styles.bannedEditInput}
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
                    <span className={styles.bannedWord}>{w}</span>
                    <span className={styles.bannedArrow}>→</span>
                    <span className={styles.bannedPreview}>{maskWord(w)}</span>
                  </>
                )}

                <div className={styles.bannedActions}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.bannedActionBtn} ${styles.bannedActionSave}`}
                        onClick={saveEdit}
                        disabled={!draftWord.trim()}
                      >
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        className={styles.bannedActionBtn}
                        onClick={cancelEdit}
                      >
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.bannedActionBtn}
                        onClick={() => startEdit(i)}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className={`${styles.bannedActionBtn} ${styles.bannedActionDelete}`}
                        onClick={() => handleDelete(i)}
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
