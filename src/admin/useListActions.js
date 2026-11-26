import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { updateRow, saveOrder } from './lib/adminApi.js'
import { friendlyError } from './lib/errors.js'

/**
 * Optimistic toggles and up/down reordering for an admin list
 * whose rows live in the React Query cache under `queryKey`.
 */
export default function useListActions({ table, queryKey, invalidate }) {
  const qc = useQueryClient()
  const [moving, setMoving] = useState(false)

  async function patch(row, values, successMessage) {
    const prev = qc.getQueryData(queryKey)
    qc.setQueryData(queryKey, (rows = []) => rows.map((r) => (r.id === row.id ? { ...r, ...values } : r)))
    try {
      await updateRow(table, row.id, values)
      if (successMessage) toast.success(successMessage)
    } catch (err) {
      qc.setQueryData(queryKey, prev)
      toast.error(friendlyError(err))
    } finally {
      invalidate(qc)
    }
  }

  async function move(rows, index, direction) {
    const target = index + direction
    if (moving || target < 0 || target >= rows.length) return
    const next = arrayMove(rows, index, target)
    const prev = qc.getQueryData(queryKey)
    qc.setQueryData(queryKey, next.map((r, i) => ({ ...r, sort_order: i })))
    setMoving(true)
    try {
      await saveOrder(table, next)
      toast.success('Order saved')
    } catch (err) {
      qc.setQueryData(queryKey, prev)
      toast.error(friendlyError(err))
    } finally {
      setMoving(false)
      invalidate(qc)
    }
  }

  return { patch, move, moving }
}
