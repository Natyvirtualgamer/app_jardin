import { colors, shadows } from '../theme.js'

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <section style={styles.header}>
      <div>
        {eyebrow && <p style={styles.eyebrow}>{eyebrow}</p>}
        <h1 style={styles.title}>{title}</h1>
        {description && <p style={styles.description}>{description}</p>}
      </div>
      {actions && <div style={styles.actions}>{actions}</div>}
    </section>
  )
}

export function PageToolbar({ children }) {
  return <div style={styles.toolbar}>{children}</div>
}

export function DataSection({ children }) {
  return <section style={styles.section}>{children}</section>
}

export function EmptyState({ title, description }) {
  return (
    <div style={styles.empty}>
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  )
}

export function StatusBadge({ tone = 'neutral', children }) {
  return <span style={{ ...styles.badge, ...styles.tones[tone] }}>{children}</span>
}

export function ActionGroup({ children }) {
  return <div style={styles.actionGroup}>{children}</div>
}

const styles = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.2rem', boxShadow: shadows.card, marginBottom: '1rem', flexWrap: 'wrap' },
  eyebrow: { margin: '0 0 0.3rem', color: colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', fontSize: '0.75rem' },
  title: { margin: '0 0 0.35rem', color: colors.primaryDark, fontSize: '1.4rem' },
  description: { margin: 0, color: colors.textMuted, lineHeight: 1.5, fontSize: '0.92rem' },
  actions: { display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' },
  toolbar: { display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '0.9rem', boxShadow: shadows.card },
  section: { background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '14px', boxShadow: shadows.card, overflow: 'hidden' },
  empty: { display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, padding: '2rem', textAlign: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', borderRadius: '999px', padding: '0.22rem 0.6rem', fontSize: '0.78rem', fontWeight: '800' },
  tones: {
    neutral: { background: '#eceff1', color: colors.textMuted },
    info: { background: colors.primaryLight, color: colors.primaryDark },
    success: { background: '#e8f7ef', color: colors.success },
    danger: { background: colors.dangerLight, color: colors.danger },
    warning: { background: '#fff3e0', color: colors.accent },
  },
  actionGroup: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
}
