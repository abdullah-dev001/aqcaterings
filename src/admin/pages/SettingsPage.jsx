import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminKeys, getSettingsRow, saveSettings } from '../lib/adminApi.js'
import { cleanupOnSave } from '../lib/storage.js'
import { invalidateSettings } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import ImageUpload from '../components/ImageUpload.jsx'
import { Btn, Card, Field, PageHeader, Pair, inputClass, urInputClass } from '../components/ui.jsx'
import LoadError from '../../components/ui/LoadError.jsx'
import { DEFAULT_TEMPLATE, fillTemplate } from '../../lib/whatsapp.js'

const TEXT_FIELDS = [
  'brand_name',
  'brand_name_ur',
  'tagline',
  'tagline_ur',
  'whatsapp_number',
  'message_template',
  'message_template_ur',
  'event_button_text',
  'event_button_text_ur',
  'dish_button_text',
  'dish_button_text_ur',
  'phone',
  'email',
  'address',
  'address_ur',
  'city',
  'city_ur',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'footer_about',
  'footer_about_ur',
]

const TOKENS = [
  ['{title}', 'name of the setup or dish'],
  ['{section}', 'category, e.g. Mehndi'],
  ['{link}', 'link to the photo'],
]

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: adminKeys.settings, queryFn: getSettingsRow })

  return (
    <>
      <PageHeader title="Settings" subtitle="Your business details, WhatsApp number and button texts, in English and Urdu." />
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

/** WhatsApp-style message bubble. */
function Bubble({ label, text, rtl = false }) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="mb-2 text-[12px] uppercase tracking-[2px] text-plum-soft">{label}</p>
      <p
        dir={rtl ? 'rtl' : 'ltr'}
        lang={rtl ? 'ur' : 'en'}
        className={`max-w-md whitespace-pre-line break-words rounded-2xl bg-[#DCF8C6] px-4 py-3 text-[14px] text-[#1F2C1A] ${
          rtl ? 'rounded-tr-sm font-urdu leading-[2.1]' : 'rounded-tl-sm leading-relaxed'
        }`}
      >
        {text}
      </p>
    </div>
  )
}

function SettingsForm({ initial }) {
  const qc = useQueryClient()
  const [values, setValues] = useState(() => Object.fromEntries(TEXT_FIELDS.map((k) => [k, initial?.[k] ?? ''])))
  const [logo, setLogo] = useState(initial?.logo_url ?? null)
  const [savedLogo, setSavedLogo] = useState(initial?.logo_url ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const uploaded = useRef([])
  const refs = { message_template: useRef(null), message_template_ur: useRef(null) }

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const sampleLink = `${window.location.origin}/share/e/floral-jhoola`
  const preview = fillTemplate(values.message_template, 'Floral Jhoola', 'Mehndi', sampleLink)
  const previewUr = fillTemplate(
    values.message_template_ur || values.message_template,
    'پھولوں والا جھولا',
    'مہندی',
    sampleLink,
  )
  const numberDigits = values.whatsapp_number.replace(/\D/g, '')
  const numberWarning =
    values.whatsapp_number && (values.whatsapp_number.trim().startsWith('+') || values.whatsapp_number.trim().startsWith('0'))

  function insertToken(field, token) {
    const el = refs[field].current
    const text = values[field]
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    const next = text.slice(0, start) + token + text.slice(end)
    setValues((v) => ({ ...v, [field]: next }))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const tokenButtons = (field) => (
    <div className="flex flex-wrap items-center gap-2 text-[13px] text-plum-soft">
      <span>Tap to insert:</span>
      {TOKENS.map(([token, label]) => (
        <button
          key={token}
          type="button"
          onClick={() => insertToken(field, token)}
          title={label}
          className="rounded-full border border-[#EBD3DA] bg-cream px-3 py-1 font-mono text-[12px] text-plum transition-colors hover:border-gold"
        >
          {token}
        </button>
      ))}
    </div>
  )

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = Object.fromEntries(TEXT_FIELDS.map((k) => [k, values[k].trim() ? values[k].trim() : null]))
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

  // Urdu input helper: right-to-left, Nastaliq font.
  const urInput = (key, id, placeholder) => (
    <input id={id} dir="rtl" lang="ur" value={values[key]} onChange={set(key)} placeholder={placeholder} className={urInputClass} />
  )

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-5 p-5 sm:p-7">
        <h2 className="font-heading text-[22px] text-plum">Your brand</h2>
        <Pair>
          <Field label="Business name" htmlFor="s-brand">
            <input id="s-brand" value={values.brand_name} onChange={set('brand_name')} className={inputClass} />
          </Field>
          <Field label="Business name (Urdu)" htmlFor="s-brand-ur" optional>
            {urInput('brand_name_ur', 's-brand-ur', 'اے کیو کیٹرنگز')}
          </Field>
        </Pair>
        <Pair>
          <Field label="Tagline" htmlFor="s-tagline" optional hint="A short line about your business.">
            <input id="s-tagline" value={values.tagline} onChange={set('tagline')} className={inputClass} />
          </Field>
          <Field label="Tagline (Urdu)" htmlFor="s-tagline-ur" optional>
            {urInput('tagline_ur', 's-tagline-ur')}
          </Field>
        </Pair>
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
            ref={refs.message_template}
            rows={3}
            value={values.message_template}
            onChange={set('message_template')}
            placeholder={DEFAULT_TEMPLATE}
            className={`${inputClass} resize-y leading-relaxed`}
          />
          {tokenButtons('message_template')}
        </Field>

        <Field label="Booking message (Urdu)" htmlFor="s-template-ur" optional hint="Sent when the visitor uses the Urdu site. If empty, the English message is used.">
          <textarea
            id="s-template-ur"
            ref={refs.message_template_ur}
            dir="rtl"
            lang="ur"
            rows={3}
            value={values.message_template_ur}
            onChange={set('message_template_ur')}
            placeholder="السلام علیکم! میں یہ بک کرنا چاہتا ہوں: {title} ({section})۔ {link}"
            className={`${urInputClass} resize-y`}
          />
          {tokenButtons('message_template_ur')}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Bubble label="Preview" text={preview} />
          <Bubble label="Urdu preview" text={previewUr} rtl />
        </div>

        <Pair>
          <Field label="Button on event photos" htmlFor="s-ebtn" hint="e.g. Book this look">
            <input id="s-ebtn" value={values.event_button_text} onChange={set('event_button_text')} placeholder="Book this look" className={inputClass} />
          </Field>
          <Field label="Button on event photos (Urdu)" htmlFor="s-ebtn-ur" optional>
            {urInput('event_button_text_ur', 's-ebtn-ur', 'یہ انداز بک کریں')}
          </Field>
        </Pair>
        <Pair>
          <Field label="Button on dishes" htmlFor="s-dbtn" hint="e.g. Add to my menu">
            <input id="s-dbtn" value={values.dish_button_text} onChange={set('dish_button_text')} placeholder="Add to my menu" className={inputClass} />
          </Field>
          <Field label="Button on dishes (Urdu)" htmlFor="s-dbtn-ur" optional>
            {urInput('dish_button_text_ur', 's-dbtn-ur', 'میرے مینو میں شامل کریں')}
          </Field>
        </Pair>
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
        <Field label="About text (Urdu)" htmlFor="s-about-ur" optional>
          <textarea
            id="s-about-ur"
            dir="rtl"
            lang="ur"
            rows={3}
            value={values.footer_about_ur}
            onChange={set('footer_about_ur')}
            className={`${urInputClass} resize-y`}
          />
        </Field>
        <Pair>
          <Field label="Phone" htmlFor="s-phone" optional>
            <input id="s-phone" type="tel" value={values.phone} onChange={set('phone')} placeholder="+92 300 1234567" className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="s-email" optional>
            <input id="s-email" type="email" value={values.email} onChange={set('email')} placeholder="hello@yourbrand.com" className={inputClass} />
          </Field>
        </Pair>
        <Pair>
          <Field label="Address" htmlFor="s-address" optional>
            <input id="s-address" value={values.address} onChange={set('address')} placeholder="Street, area" className={inputClass} />
          </Field>
          <Field label="Address (Urdu)" htmlFor="s-address-ur" optional>
            {urInput('address_ur', 's-address-ur')}
          </Field>
        </Pair>
        <Pair>
          <Field label="City" htmlFor="s-city" optional>
            <input id="s-city" value={values.city} onChange={set('city')} placeholder="Lahore" className={inputClass} />
          </Field>
          <Field label="City (Urdu)" htmlFor="s-city-ur" optional>
            {urInput('city_ur', 's-city-ur', 'لاہور')}
          </Field>
        </Pair>
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
