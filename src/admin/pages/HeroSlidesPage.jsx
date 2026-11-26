import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminKeys, deleteHeroSlide, insertRow, listHeroSlides, nextSortOrder } from '../lib/adminApi.js'
import { uploadImage } from '../lib/storage.js'
import { invalidateHero } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import useListActions from '../useListActions.js'
import { Progress } from '../components/ImageUpload.jsx'
import { ConfirmDialog } from '../components/Modal.jsx'
import { Btn, Card, EmptyState, IconBtn, PageHeader, Toggle } from '../components/ui.jsx'
import LoadError from '../../components/ui/LoadError.jsx'

export default function HeroSlidesPage() {
  const qc = useQueryClient()
  const key = adminKeys.hero
  const inputRef = useRef(null)
  const { data: slides = [], isLoading, isError, refetch } = useQuery({ queryKey: key, queryFn: listHeroSlides })
  const { patch, move, moving } = useListActions({ table: 'hero_slides', queryKey: key, invalidate: invalidateHero })

  const [uploads, setUploads] = useState([]) // { id, preview, progress }
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  async function handleFiles(fileList) {
    const files = [...(fileList ?? [])]
    if (inputRef.current) inputRef.current.value = ''
    if (!files.length) return

    const start = nextSortOrder(qc.getQueryData(key) ?? slides)
    const batch = files.map((file, i) => ({ id: crypto.randomUUID(), file, order: start + i, preview: URL.createObjectURL(file), progress: 0 }))
    setUploads((u) => [...u, ...batch])

    const results = await Promise.all(
      batch.map(async ({ id, file, order, preview }) => {
        try {
          const url = await uploadImage(file, 'hero', (p) =>
            setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))),
          )
          await insertRow('hero_slides', { image_url: url, sort_order: order, is_visible: true })
          return true
        } catch (err) {
          toast.error(`Upload failed: ${friendlyError(err)}`)
          return false
        } finally {
          URL.revokeObjectURL(preview)
          setUploads((u) => u.filter((x) => x.id !== id))
        }
      }),
    )

    const ok = results.filter(Boolean).length
    if (ok) toast.success(ok === 1 ? 'Slide added' : `${ok} slides added`)
    invalidateHero(qc)
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deleteHeroSlide(deleting)
      toast.success('Slide deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setDeleteBusy(false)
      invalidateHero(qc)
    }
  }

  const uploadButton = (
    <Btn onClick={() => inputRef.current?.click()}>
      <ImagePlus className="size-5" /> Upload photos
    </Btn>
  )

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <PageHeader
        title="Hero slides"
        subtitle="The big photos at the top of the home page. They change every 5 seconds."
        action={(slides.length > 0 || uploads.length > 0) && uploadButton}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((k) => (
            <div key={k} className="aspect-[16/11] animate-pulse rounded-3xl bg-blush" />
          ))}
        </div>
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : slides.length === 0 && uploads.length === 0 ? (
        <EmptyState
          title="No slides yet"
          text="Upload a few wide photos of your best setups. Until then, the home page shows soft plum colours."
          action={uploadButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {slides.map((s, i) => (
            <Card key={s.id} className="overflow-hidden p-2">
              <div className="relative">
                <img
                  src={s.image_url}
                  alt=""
                  loading="lazy"
                  className={`aspect-video w-full rounded-[18px] object-cover ${s.is_visible ? '' : 'opacity-40'}`}
                />
                <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/95 text-[13px] font-medium text-plum">
                  {i + 1}
                </span>
                {!s.is_visible && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[12px] font-medium text-plum">Hidden</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-1 pt-2">
                <div className="flex items-center">
                  <IconBtn label="Move earlier" onClick={() => move(slides, i, -1)} disabled={moving || i === 0}>
                    <ArrowUp className="size-[18px] sm:hidden" />
                    <ArrowLeft className="hidden size-[18px] sm:block" />
                  </IconBtn>
                  <IconBtn label="Move later" onClick={() => move(slides, i, 1)} disabled={moving || i === slides.length - 1}>
                    <ArrowDown className="size-[18px] sm:hidden" />
                    <ArrowRight className="hidden size-[18px] sm:block" />
                  </IconBtn>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={s.is_visible}
                    onChange={(v) => patch(s, { is_visible: v }, v ? 'Slide is now visible' : 'Slide is now hidden')}
                    label="Visible"
                  />
                  <IconBtn label="Delete slide" onClick={() => setDeleting(s)} className="hover:!bg-[#FDECEC] hover:text-[#B4232A]">
                    <Trash2 className="size-[18px]" />
                  </IconBtn>
                </div>
              </div>
            </Card>
          ))}

          {uploads.map((u) => (
            <Card key={u.id} className="p-2">
              <div className="relative">
                <img src={u.preview} alt="" className="aspect-video w-full rounded-[18px] object-cover opacity-50" />
                <div className="absolute inset-x-6 bottom-6 flex flex-col items-center gap-2">
                  <span className="text-[13px] font-medium text-plum">{u.progress < 50 ? 'Preparing…' : 'Uploading…'} {u.progress}%</span>
                  <Progress value={u.progress} />
                </div>
              </div>
              <div className="h-12" />
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this slide?"
        message="The photo will be removed from the home page. This can't be undone."
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => !deleteBusy && setDeleting(null)}
      />
    </>
  )
}
