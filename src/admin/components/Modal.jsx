import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Btn, IconBtn } from './ui.jsx'

/**
 * Bottom sheet on mobile, centered dialog on larger screens.
 * `footer` sticks to the bottom so Save is always reachable.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md', locked = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !locked && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, locked, onClose])

  if (!open) return null

  const width = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-xl'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/40" onClick={() => !locked && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white sm:rounded-3xl ${width}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#F3D9E1] px-5 py-4 sm:px-6">
          <h2 className="font-heading text-[22px] font-medium text-plum">{title}</h2>
          <IconBtn label="Close" onClick={onClose} disabled={locked} className="-mr-2">
            <X className="size-5" />
          </IconBtn>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#F3D9E1] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, title, message, confirmText = 'Delete', onConfirm, onClose, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      locked={loading}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Btn>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-plum-soft">{message}</p>
    </Modal>
  )
}
