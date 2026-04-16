import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Target, Sparkles, Activity, AlertCircle, Info } from 'lucide-react';

// ⚠️ IMPORTANT: Tailwind can't scan dynamic class strings like `bg-${color}-50`.
// All color variants MUST be written as complete static strings here.
const THEMES = {
  red: {
    bg: '#fff1f2',
    border: '#fecdd3',
    text: '#b91c1c',
    accent: '#dc2626',
    iconBg: '#fee2e2',
    Icon: AlertCircle,
  },
  orange: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    accent: '#d97706',
    iconBg: '#fef3c7',
    Icon: Zap,
  },
  green: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#15803d',
    accent: '#16a34a',
    iconBg: '#dcfce7',
    Icon: Target,
  },
  blue: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    accent: '#2563eb',
    iconBg: '#dbeafe',
    Icon: Sparkles,
  },
};

const AIInsightPanel = ({ data }) => {
  if (!data) return null;

  const {
    label,
    explanation,
    memory_status,
    retention_pct,
    suggested_action,
    next_step,
    color = 'blue',
  } = data;

  const theme = THEMES[color] || THEMES.blue;
  const { Icon } = theme;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: theme.bg,
        border: `2px solid ${theme.border}`,
        borderRadius: '2rem',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      }}
    >
      {/* Background watermark */}
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.04, pointerEvents: 'none' }}>
        <Brain style={{ width: 100, height: 100, color: '#0f172a' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem',
              background: theme.accent,
              borderRadius: '0.875rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              boxShadow: `0 4px 14px ${theme.accent}40`,
            }}>
              <Icon style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 2 }}>
                Neural Intelligence Protocol
              </p>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: theme.text, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                {label}
              </h3>
            </div>
          </div>

          {retention_pct !== null && retention_pct !== undefined && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Memory Stability
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.text, lineHeight: 1 }}>
                {Math.round(retention_pct)}%
              </p>
            </div>
          )}
        </div>

        {/* Two-column info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', paddingTop: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Info style={{ width: 12, height: 12, color: theme.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Cognitive Reason
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', lineHeight: 1.65 }}>
              {explanation}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity style={{ width: 12, height: 12, color: theme.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Suggested Action
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', lineHeight: 1.65 }}>
              {suggested_action}
            </p>
          </div>
        </div>

        {/* Footer strip */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: `1px dashed ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Current Readiness:{' '}
              <span style={{ color: theme.text }}>{memory_status}</span>
            </span>
          </div>

          <div style={{
            padding: '0.4rem 1rem',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '0.75rem',
            border: `1px solid ${theme.border}`,
          }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginRight: 6 }}>
              Next Step:
            </span>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {next_step}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightPanel;
