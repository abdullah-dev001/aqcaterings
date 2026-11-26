import { useRef, useState } from 'react'
import { ImagePlus, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage } from '../lib/storage.js'
import { friendlyError } from '../lib/errors.js'
import { Btn } from './ui.jsx'

/** Progress bar used by all uploaders. */
export function Progress({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
      <div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${value}%` }} />
    </div>
  )
}

/**
 * Single image (section cover, logo). Uploads immediately and calls
 * onChange(url). onUploaded(url) lets the form clean up if it is cancelled.
 */
export default function ImageUpload({ value, onChange, folder, onUploaded, onBusyChange, aspect = 'aspect-[16/10]', round = false }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)

  async function handleFile(file) {
    if (!file) return
    setProgress(0)
    onBusyChange?.(true)
    try {
      const url = await uploadImage(file, folder, setProgress)
      onUploaded?.(url)
      onChange(url)
    } catch (err) {
      toast.error(`Upload failed: ${friendlyError(err)}`)
    } finally {
      setProgress(null)
      onBusyChange?.(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const uploading = progress !== null
  const shape = round ? 'size-28 rounded-full' : `w-full ${aspect} rounded-2xl`

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value && !uploading ? (
        <div className={`flex ${round ? 'items-center gap-4' : 'flex-col gap-3'}`}>
          <img src={value} alt="" className={`${shape} border border-[#F3D9E1] object-cover`} />
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="size-4" /> Replace
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 className="size-4" /> Remove
            </Btn>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`${shape} flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E8C4D0] bg-cream p-4 text-plum-soft transition-colors hover:border-gold hover:text-plum disabled:cursor-wait`}
        >
          {uploading ? (
            <div className="flex w-full max-w-[220px] flex-col items-center gap-2">
              <span className="text-[13px]">{progress < 50 ? 'Preparing…' : 'Uploading…'} {progress}%</span>
              <Progress value={progress} />
            </div>
          ) : (
            <>
              <ImagePlus className="size-7" />
              <span className="text-[14px] font-medium">Tap to upload</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
