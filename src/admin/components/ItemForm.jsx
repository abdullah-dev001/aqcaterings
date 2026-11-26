import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from './Modal.jsx'
import ImagesEditor from './ImagesEditor.jsx'
import { Btn, Field, Toggle, inputClass } from './ui.jsx'
import { insertRow, uniqueSlug, updateRow } from '../lib/adminApi.js'
import { cleanupOnCancel, cleanupOnSave } from '../lib/storage.js'
import { invalidateContent } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import slugify from '../lib/slugify.js'
import { COPY } from '../copy.js'

const orNull = (v) => (v && String(v).trim() ? String(v).trim() : null)

/** Add / edit an item (event setup or dish). */
export default function ItemForm({ kind, section, item, sortOrder, onClose }) {
  const qc = useQueryClient()
  const copy = COPY[kind]
  const isMenu = kind === 'menu'

  const [title, setTitle] = useState(item?.title ?? '')
  const [details, setDetails] = useState(item?.details ?? '')
  const [price, setPrice] = useState(item?.price ?? '')
  const [images, setImages] = useState(item?.images ?? [])
  const [visible, setVisible] = useState(item?.is_visible ?? true)
  const [featured, setFeatured] = useState(item?.is_featured ?? false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const uploaded = useRef([])
  const original = item?.images ?? []

  function cancel() {
    if (saving) return
    cleanupOnCancel(original, uploaded.current)
    onClose()
  }

  async function save(e) {
    e?.preventDefault()
    if (!title.trim()) return toast.error('Please enter a title.')
    setSaving(true)
    try {
      const values = {
        title: title.trim(),
        details: orNull(details),
        price: orNull(price),
        images,
        is_visible: visible,
        ...(isMenu && { is_featured: featured }),
      }

      if (item) {
        await updateRow('items', item.id, values)
      } else {
        // The slug is made once, on create, so shared links keep working after renames.
        const slug = await uniqueSlug('items', slugify(values.title))
        await insertRow('items', { ...values, slug, section_id: section.id, sort_order: sortOrder })
      }

      cleanupOnSave(original, uploaded.current, images)
      invalidateContent(qc)
      toast.success(item ? 'Changes saved' : `“${values.title}” added`)
      onClose()
    } catch (err) {
      toast.error(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={cancel}
      locked={saving}
      title={item ? `Edit ${item.title}` : `${copy.addItem} to ${section.name}`}
      footer={
        <>
          <Btn variant="secondary" onClick={cancel} disabled={saving}>
            Cancel
          </Btn>
          <Btn onClick={save} loading={saving} disabled={uploading > 0 || !title.trim()}>
            {saving ? 'Saving…' : uploading > 0 ? 'Uploading photos…' : 'Save'}
          </Btn>
        </>
      }
    >
      <form onSubmit={save} className="flex flex-col gap-5">
        <Field label="Title" htmlFor="item-title">
          <input
            id="item-title"
            autoFocus={!item}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isMenu ? 'e.g. Mutton Biryani' : 'e.g. Pink Floral Stage'}
            className={inputClass}
          />
        </Field>

        <Field label="Photos" hint={images.length === 0 ? 'Add one or more photos. The first photo is the cover.' : undefined}>
          <ImagesEditor
            images={images}
            onChange={setImages}
            folder={copy.folder}
            onUploaded={(u) => uploaded.current.push(u)}
            onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
          />
        </Field>

        <Field label="Details" htmlFor="item-details" optional hint="Price, what's included, anything you want to show. Line breaks are kept.">
          <textarea
            id="item-details"
            rows={6}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className={`${inputClass} min-h-[140px] resize-y leading-relaxed`}
          />
        </Field>

        <Field label="Price" htmlFor="item-price" optional hint="Shown as a small label on the photo, e.g. From Rs 85,000 or Per head">
          <input id="item-price" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </Field>

        <div className="flex flex-col gap-4 rounded-2xl bg-cream p-4">
          <Toggle checked={visible} onChange={setVisible} label="Visible on the website" />
          {isMenu && <Toggle checked={featured} onChange={setFeatured} label="Featured on the home page (up to 4 are shown)" />}
        </div>
      </form>
    </Modal>
  )
}
