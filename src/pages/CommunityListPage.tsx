import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCommunities } from '../hooks/useCommunities'
import { joinCommunity, leaveCommunity } from '../services/communities'
import { PageState } from '../components/ui/PageState'
import { IconSearch } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './CommunityListPage.module.css'

export function CommunityListPage() {
  const { t } = useTranslation()
  const { data: communities, setData: setCommunities, loading, error } = useCommunities()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const FILTERS = useMemo(() => [
    { id: 'all',         label: t('communities.categories.all') },
    { id: 'ansiedad',    label: t('communities.categories.ansiedad') },
    { id: 'depresion',   label: t('communities.categories.depresion') },
    { id: 'autoestima',  label: t('communities.categories.autoestima') },
    { id: 'relaciones',  label: t('communities.categories.relaciones') },
    { id: 'duelo',       label: t('communities.categories.duelo') },
    { id: 'mindfulness', label: t('communities.categories.mindfulness') },
  ], [t])

  const filtered = useMemo(() => communities.filter(c => {
    const matchesFilter = filter === 'all' || c.category === filter
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.desc.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  }), [communities, filter, search])

  const toggleJoin = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const current = communities.find(c => c.id === id)
    if (!current) return
    const wasJoined = current.joined
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, joined: !wasJoined } : c))
    void (wasJoined ? leaveCommunity(id) : joinCommunity(id)).catch(() => {
      setCommunities(prev => prev.map(c => c.id === id ? { ...c, joined: wasJoined } : c))
    })
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('communities.title')}</h1>
          <p className={styles.subtitle}>{t('communities.subtitle')}</p>
        </div>
        <SleepingCat
          color={catFor('/comunidades').color}
          seed={catFor('/comunidades').seed}
          size={100}
          className={styles.pageCat}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <IconSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('communities.searchPh')}
            aria-label={t('communities.searchAria')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!loading && filtered.length === 0} emptyMessage={t('communities.emptyMsg')} />

      <div className={styles.grid}>
        {filtered.map((c, i) => (
          <article
            key={c.id}
            className={`${styles.card} hover-lift animate-fadeInUp delay-${Math.min(i + 1, 6)}`}
          >
            {/* Link "stretched" que captura el click sobre toda la card */}
            <Link
              to={`/comunidades/${c.id}`}
              className={styles.cardLinkOverlay}
              aria-label={`Abrir comunidad ${c.name}`}
            />

            <div className={styles.cardTop}>
              <div className={styles.cardEmoji}>{c.emoji}</div>
              <div className={styles.onlinePill}>{c.online} en línea</div>
            </div>

            <h3 className={styles.cardName}>{c.name}</h3>
            <p className={styles.cardMod}>{t('communities.modPrefix')} {c.mod}</p>
            <p className={styles.cardDesc}>{c.desc}</p>

            <div className={styles.cardFooter}>
              <span className={styles.cardMembers}>{c.members} {t('common.members')}</span>
              <button
                type="button"
                className={`${styles.joinBtn} ${c.joined ? styles.joinBtnJoined : ''}`}
                onClick={e => toggleJoin(c.id, e)}
              >
                {c.joined ? t('communities.joined') : t('communities.join')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
