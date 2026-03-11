import React from 'react'
import type { QueueReason } from '../../types'

const BADGE_CONFIG: Record<QueueReason, { label: string; className: string }> = {
  due:     { label: 'Due Now',      className: 'badge-due' },
  weak:    { label: 'Weak Spot',    className: 'badge-weak' },
  new:     { label: 'New',          className: 'badge-new' },
  variety: { label: 'Variety',      className: 'badge-variety' },
}

interface ReasonBadgeProps {
  reason: QueueReason
}

export function ReasonBadge({ reason }: ReasonBadgeProps) {
  const { label, className } = BADGE_CONFIG[reason]
  return <span className={className}>{label}</span>
}
