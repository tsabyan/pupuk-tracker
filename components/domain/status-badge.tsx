import { Badge } from '@/components/ui/badge'
import { STATUS_PENGIRIMAN, STATUS_PENYALURAN } from '@/lib/domain/status'
import type { StatusPengiriman, StatusPenyaluran } from '@/lib/domain/types'

export function BadgePengiriman({ status }: { status: StatusPengiriman }) {
  const meta = STATUS_PENGIRIMAN[status]
  return (
    <Badge tone={meta.tone} className="cursor-help">
      <span title={meta.deskripsi}>{meta.label}</span>
    </Badge>
  )
}

export function BadgePenyaluran({ status }: { status: StatusPenyaluran }) {
  const meta = STATUS_PENYALURAN[status]
  return (
    <Badge tone={meta.tone} className="cursor-help">
      <span title={meta.deskripsi}>{meta.label}</span>
    </Badge>
  )
}
