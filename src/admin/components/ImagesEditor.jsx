import { useRef, useState } from 'react'
import { ImagePlus, X, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uploadImage } from '../lib/storage.js'
import { friendlyError } from '../lib/errors.js'
import { Progress } from './ImageUpload.jsx'

function SortableImage({ url, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-square touch-none overflow-hidden rounded-2xl border border-[#F3D9E1] bg-blush ${
        isDragging ? 'z-10 opacity-80 ring-2 ring-gold' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <img src={url} alt="" draggable="false" className="size-full select-none object-cover" />
      {index === 0 && (
        <span className="absolute bottom-2 left-2 rounded-full bg-gold px-2.5 py-1 text-[11px] font-medium text-ink">
          Cover
        </span>
      )}
      <span className="absolute left-2 top-2 rounded-full bg-white/90 p-1 text-plum-soft">
        <GripVertical className="size-3.5" />
      </span>
      <button
        type="button"
        aria-label="Remove photo"
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(url)}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-plum shadow-sm transition-colors hover:bg-[#B4232A] hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/**
 * Multi-image editor: upload several, drag to reorder, remove.
 * The first image is the cover. `images` is an array of URLs.
 */
export default function ImagesEditor({ images, onChange, folder, onUploaded, onBusyChange }) {
  const inputRef = useRef(null)
  const [uploads, setUploads] = useState([]) // { id, preview, progress }
  const latest = useRef(images)
  latest.current = images

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleFiles(fileList) {
    const files = [...(fileList ?? [])]
    if (!files.length) return
    const batch = files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), progress: 0 }))
    setUploads((u) => [...u, ...batch])
    onBusyChange?.(true)

    await Promise.all(
      batch.map(async ({ id, file, preview }) => {
        try {
          const url = await uploadImage(file, folder, (p) =>
            setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
          )
          onUploaded?.(url)
          latest.current = [...latest.current, url]
          onChange(latest.current)
        } catch (err) {
          toast.error(`Upload failed: ${friendlyError(err)}`)
        } finally {
          URL.revokeObjectURL(preview)
          setUploads((u) => u.filter((x) => x.id !== id))
        }
      }),
    )

    onBusyChange?.(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    onChange(arrayMove(images, images.indexOf(active.id), images.indexOf(over.id)))
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <SortableImage key={url} url={url} index={i} onRemove={(u) => onChange(images.filter((x) => x !== u))} />
            ))}

            {uploads.map((u) => (
              <div key={u.id} className="relative aspect-square overflow-hidden rounded-2xl border border-[#F3D9E1]">
                <img src={u.preview} alt="" className="size-full object-cover opacity-50" />
                <div className="absolute inset-x-2 bottom-2 flex flex-col gap-1">
                  <span className="text-center text-[11px] font-medium text-plum">{u.progress}%</span>
                  <Progress value={u.progress} />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#E8C4D0] bg-cream text-plum-soft transition-colors hover:border-gold hover:text-plum"
            >
              <ImagePlus className="size-6" />
              <span className="text-[12px] font-medium">Add photos</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {images.length > 1 && (
        <p className="text-[13px] text-plum-soft">Drag photos to change the order. The first photo is the cover.</p>
      )}
    </div>
  )
}
