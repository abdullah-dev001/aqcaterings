import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { IconBtn, Toggle } from './ui.jsx'

/**
 * The control strip on each list row: reorder, Visible, extras, Edit, Delete.
 * On mobile it sits on its own line under the row.
 */
export default function RowControls({ index, total, onMove, moving, visible, onToggleVisible, onEdit, onDelete, children }) {
  return (
    <div className="flex w-full items-center justify-between gap-1 border-t border-[#F3D9E1] pt-2 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
      <div className="flex items-center">
        <IconBtn label="Move up" onClick={() => onMove(-1)} disabled={moving || index === 0}>
          <ArrowUp className="size-[18px]" />
        </IconBtn>
        <IconBtn label="Move down" onClick={() => onMove(1)} disabled={moving || index === total - 1}>
          <ArrowDown className="size-[18px]" />
        </IconBtn>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="px-1">
          <Toggle checked={visible} onChange={onToggleVisible} label="Visible" />
        </div>
        {children}
        <IconBtn label="Edit" onClick={onEdit}>
          <Pencil className="size-[18px]" />
        </IconBtn>
        <IconBtn label="Delete" onClick={onDelete} className="hover:!bg-[#FDECEC] hover:text-[#B4232A]">
          <Trash2 className="size-[18px]" />
        </IconBtn>
      </div>
    </div>
  )
}
