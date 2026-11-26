import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from './Modal.jsx'
import ImageUpload from './ImageUpload.jsx'
import { Btn, Field, Toggle, inputClass } from './ui.jsx'
import { insertRow, uniqueSlug, updateRow } from '../lib/adminApi.js'
import { cleanupOnCancel, cleanupOnSave } from '../lib/storage.js'
import { invalidateContent } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import slugify from '../lib/slugify.js'
import { COPY } from '../copy.js'

const orNull = (v) => (v && String(v).trim() ? String(v).trim() : null)

/** Add / edit a section (event category or menu category). */
export default function SectionForm({ kind, section, sortOrder, onClose }) {
  const qc = useQueryClient()
  const copy = COPY[kind]
  const isEvent = kind === 'event'

  const [name, setName] = useState(section?.name ?? '')
  const [slug, setSlug] = useState(section?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(section))
  const [cover, setCover] = useState(section?.cover_url ?? null)
  const [eyebrow, setEyebrow] = useState(section?.eyebrow ?? '')
  const [tagline, setTagline] = useState(section?.tagline ?? '')
  const [accent, setAccent] = useState(section?.tagline_accent ?? '')
  const [description, setDescription] = useState(section?.description ?? '')
  const [visible, setVisible] = useState(section?.is_visible ?? true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const uploaded = useRef([])

  const original = [section?.cover_url].filter(Boolean)
  const accentMissing = accent.trim() && tagline.trim() && !tagline.includes(accent.trim())

  function handleName(value) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function cancel() {
    if (saving) return
    cleanupOnCancel(original, uploaded.current)
    onClose()
  }

  async function save(e) {
    e?.preventDefault()
    if (!name.trim()) return toast.error('Please enter a name.')
    setSaving(true)
    try {
      const base = slugify(slug || name)
      const finalSlug = await uniqueSlug('sections', base, section?.id)
      const values = {
        name: name.trim(),
        slug: finalSlug,
        cover_url: cover || null,
        is_visible: visible,
        ...(isEvent && {
          eyebrow: orNull(eyebrow),
          tagline: orNull(tagline),
          tagline_accent: orNull(accent),
          description: orNull(description),
        }),
      }

      if (section) await updateRow('sections', section.id, values)
      else await insertRow('sections', { ...values, kind, sort_order: sortOrder })

      cleanupOnSave(original, uploaded.current, [cover])
      invalidateContent(qc)
      toast.success(section ? 'Changes saved' : `“${values.name}” added`, {
        description: finalSlug !== base ? `The link “${base}” was taken, so it is “${finalSlug}”.` : undefined,
      })
      onClose()
    } catch (err) {
      toast.error(friendlyError(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={cancel}
      locked={saving}
      title={section ? `Edit ${section.name}` : `Add ${isEvent ? 'event category' : 'menu category'}`}
      footer={
        <>
          <Btn variant="secondary" onClick={cancel} disabled={saving}>
            Cancel
          </Btn>
          <Btn onClick={save} loading={saving} disabled={uploading > 0 || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
        </>
      }
    >
      <form onSubmit={save} className="flex flex-col gap-5">
        <Field label="Name" htmlFor="sec-name">
          <input
            id="sec-name"
            autoFocus={!section}
            value={name}
            onChange={(e) => handleName(e.target.value)}
            placeholder={isEvent ? 'e.g. Mehndi' : 'e.g. BBQ'}
            className={inputClass}
          />
        </Field>

        <Field label="Web address" htmlFor="sec-slug" hint="Filled in for you from the name. Only change it if you need to.">
          <div className="flex items-center rounded-2xl border border-[#EBD3DA] bg-cream pl-4 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
            <span className="shrink-0 text-[14px] text-plum-soft">{copy.publicPath}</span>
            <input
              id="sec-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
              }}
              onBlur={() => setSlug((s) => (s ? slugify(s) : slugify(name)))}
              className="w-full min-w-0 rounded-r-2xl bg-transparent px-1 py-3 text-base text-plum outline-none"
            />
          </div>
        </Field>

        <Field label="Cover photo" optional hint={`Shown on the home page. If empty, the first ${copy.item} photo is used.`}>
          <ImageUpload
            value={cover}
            onChange={setCover}
            folder="sections"
            onUploaded={(u) => uploaded.current.push(u)}
            onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
          />
        </Field>

        {isEvent && (
          <>
            <Field label="Small label above the title" htmlFor="sec-eyebrow" optional hint={`If empty, shows “${name || 'Name'} collection”.`}>
              <input id="sec-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Page title" htmlFor="sec-tagline" optional hint="e.g. Colourful nights, full of joy">
              <input id="sec-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} />
            </Field>
            <Field
              label="Words to show in gold italic"
              htmlFor="sec-accent"
              optional
              hint={accentMissing ? '⚠️ These words must appear exactly in the page title above.' : 'Copy a few words from the title, e.g. full of joy'}
            >
              <input id="sec-accent" value={accent} onChange={(e) => setAccent(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Short description" htmlFor="sec-desc" optional>
              <textarea
                id="sec-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </Field>
          </>
        )}

        <Toggle checked={visible} onChange={setVisible} label="Visible on the website" />
      </form>
    </Modal>
  )
}
