import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminKeys, getSettingsRow, saveSettings } from '../lib/adminApi.js'
import { cleanupOnSave } from '../lib/storage.js'
import { invalidateSettings } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import ImageUpload from '../components/ImageUpload.jsx'
import { Btn, Card, Field, PageHeader, inputClass } from '../components/ui.jsx'
import LoadError from '../../components/ui/LoadError.jsx'
import { DEFAULT_TEMPLATE, fillTemplate } from '../../lib/whatsapp.js'

const TEXT_FIELDS = [
  'brand_name',
  'tagline',
  'whatsapp_number',
  'message_template',
  'event_button_text',
  'dish_button_text',
  'phone',
  'email',
  'address',
  'city',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'footer_about',
]

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: adminKeys.settings, queryFn: getSettingsRow })

  return (
    <>
      <PageHeader title="Settings" subtitle="Your business details, WhatsApp number and button texts." />
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-56 animate-pulse rounded-3xl bg-blush" />
          ))}
        </div>
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : (
        <SettingsForm initial={data} />
      )}
    </>
  )
}

function SettingsForm({ initial }) {
  const qc = useQueryClient()
  const [values, setValues] = useState(() =>
    Object.fromEntries(TEXT_FIELDS.map((k) => [k, initial?.[k] ?? ''])),
  )
  const [logo, setLogo] = useState(initial?.logo_url ?? null)
  const [savedLogo, setSavedLogo] = useState(initial?.logo_url ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const uploaded = useRef([])
  const templateRef = useRef(null)

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const sampleLink = `${window.location.origin}/events/mehndi#floral-jhoola`
  const preview = fillTemplate(values.message_template, 'Floral Jhoola', 'Mehndi', sampleLink)
  const numberDigits = values.whatsapp_number.replace(/\D/g, '')
  const numberWarning =
    values.whatsapp_number && (values.whatsapp_number.trim().startsWith('+') || values.whatsapp_number.trim().startsWith('0'))

  function insertToken(token) {
    const el = templateRef.current
    const text = values.message_template
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    const next = text.slice(0, start) + token + text.slice(end)
    setValues((v) => ({ ...v, message_template: next }))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        TEXT_FIELDS.map((k) => [k, values[k].trim() ? values[k].trim() : null]),
      )
      payload.whatsapp_number = numberDigits || null
      payload.logo_url = logo || null
      await saveSettings(payload)

      cleanupOnSave([savedLogo], uploaded.current, [logo])
      uploaded.current = []
      setSavedLogo(logo)
      setValues((v) => ({ ...v, whatsapp_number: numberDigits }))
      invalidateSettings(qc)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-5 p-5 sm:p-7">
        <h2 className="font-heading text-[22px] text-plum">Your brand</h2>
        <Field label="Business name" htmlFor="s-brand">
          <input id="s-brand" value={values.brand_name} onChange={set('brand_name')} className={inputClass} />
        </Field>
        <Field label="Tagline" htmlFor="s-tagline" optional hint="A short line about your business.">
          <input id="s-tagline" value={values.tagline} onChange={set('tagline')} className={inputClass} />
        </Field>
        <Field label="Logo" optional hint="A square image works best. If empty, the first letter of your name is shown in a gold circle.">
          <ImageUpload
            value={logo}
            onChange={setLogo}
            folder="settings"
            round
            onUploaded={(u) => uploaded.current.push(u)}
            onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5 p-5 sm:p-7">
        <h2 className="font-heading text-[22px] text-plum">WhatsApp</h2>
        <Field
          label="WhatsApp number"
          htmlFor="s-wa"
          hint={
            numberWarning
              ? '⚠️ Use international format without + or a leading 0, e.g. 923001234567'
              : 'International format without +, e.g. 923001234567'
          }
        >
          <input
            id="s-wa"
            inputMode="numeric"
            autoComplete="tel"
            value={values.whatsapp_number}
            onChange={set('whatsapp_number')}
            placeholder="923001234567"
            className={inputClass}
          />
        </Field>

        <Field label="Booking message" htmlFor="s-template">
          <textarea
            id="s-template"
            ref={templateRef}
            rows={3}
            value={values.message_template}
            onChange={set('message_template')}
            placeholder={DEFAULT_TEMPLATE}
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-plum-soft">
            <span>Tap to insert:</span>
            {[
              ['{title}', 'name of the setup or dish'],
              ['{section}', 'category, e.g. Mehndi'],
              ['{link}', 'link to the photo'],
            ].map(([token, label]) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                title={label}
                className="rounded-full border border-[#EBD3DA] bg-cream px-3 py-1 font-mono text-[12px] text-plum transition-colors hover:border-gold"
              >
                {token}
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-2xl bg-cream p-4">
            <p className="mb-2 text-[12px] uppercase tracking-[2px] text-plum-soft">Preview</p>
            <p className="max-w-md whitespace-pre-line break-words rounded-2xl rounded-tl-sm bg-[#DCF8C6] px-4 py-3 text-[14px] leading-relaxed text-[#1F2C1A]">
              {preview}
            </p>
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Button on event photos" htmlFor="s-ebtn" hint="e.g. Book this look">
            <input id="s-ebtn" value={values.event_button_text} onChange={set('event_button_text')} placeholder="Book this look" className={inputClass} />
          </Field>
          <Field label="Button on dishes" htmlFor="s-dbtn" hint="e.g. Add to my menu">
            <input id="s-dbtn" value={values.dish_button_text} onChange={set('dish_button_text')} placeholder="Add to my menu" className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-5 p-5 sm:p-7">
        <div>
          <h2 className="font-heading text-[22px] text-plum">Contact and footer</h2>
          <p className="mt-1 text-[13px] text-plum-soft">Shown at the bottom of every page. Empty fields are hidden.</p>
        </div>
        <Field label="About text" htmlFor="s-about" optional hint="Two or three short sentences about your business.">
          <textarea
            id="s-about"
            rows={3}
            value={values.footer_about}
            onChange={set('footer_about')}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="s-phone" optional>
            <input id="s-phone" type="tel" value={values.phone} onChange={set('phone')} placeholder="+92 300 1234567" className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="s-email" optional>
            <input id="s-email" type="email" value={values.email} onChange={set('email')} placeholder="hello@yourbrand.com" className={inputClass} />
          </Field>
          <Field label="Address" htmlFor="s-address" optional>
            <input id="s-address" value={values.address} onChange={set('address')} placeholder="Street, area" className={inputClass} />
          </Field>
          <Field label="City" htmlFor="s-city" optional>
            <input id="s-city" value={values.city} onChange={set('city')} placeholder="Lahore" className={inputClass} />
          </Field>
        </div>
        <Field label="Instagram link" htmlFor="s-ig" optional hint="The full link, e.g. https://instagram.com/yourbrand">
          <input id="s-ig" type="url" value={values.instagram_url} onChange={set('instagram_url')} className={inputClass} />
        </Field>
        <Field label="Facebook link" htmlFor="s-fb" optional hint="e.g. https://facebook.com/yourbrand">
          <input id="s-fb" type="url" value={values.facebook_url} onChange={set('facebook_url')} className={inputClass} />
        </Field>
        <Field label="TikTok link" htmlFor="s-tt" optional hint="e.g. https://tiktok.com/@yourbrand">
          <input id="s-tt" type="url" value={values.tiktok_url} onChange={set('tiktok_url')} className={inputClass} />
        </Field>
      </Card>

      {/* Save bar stays in reach above the mobile tab bar */}
      <div className="sticky bottom-[84px] z-10 md:bottom-4">
        <Card className="flex items-center justify-between gap-3 p-3 pl-5">
          <span className="text-[13px] text-plum-soft">{uploading > 0 ? 'Uploading logo…' : 'Changes show on the website after saving.'}</span>
          <Btn type="submit" loading={saving} disabled={uploading > 0}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
        </Card>
      </div>
    </form>
  )
}
