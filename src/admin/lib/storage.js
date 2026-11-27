import imageCompression from 'browser-image-compression'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase.js'

const BUCKET = 'media'
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`

/** POSTs one blob to media/<path> with real upload progress (supabase-js doesn't expose it). */
function putObject(path, blob, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
    xhr.setRequestHeader('Content-Type', 'image/webp')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      let message = `Upload failed (${xhr.status})`
      try {
        message = JSON.parse(xhr.responseText).message || message
      } catch {
        /* keep default message */
      }
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error('Network error while uploading'))
    xhr.send(blob)
  })
}

/**
 * Compresses an image in the browser and uploads two copies:
 *   media/<folder>/<uuid>.webp     max 1600px, q0.8  (hero / full size)
 *   media/<folder>/<uuid>-sm.webp  max 800px,  q0.7  (cards / thumbnails, see lib/images.js)
 * Returns the full-size public URL. onProgress receives 0–100
 * (0–50 compressing, 50–100 uploading both files).
 */
export async function uploadImage(file, folder, onProgress = () => {}) {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image`)

  onProgress(0)
  const full = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    fileType: 'image/webp',
    initialQuality: 0.8,
    useWebWorker: true,
    onProgress: (p) => onProgress(Math.round(p * 0.4)),
  })
  const small = await imageCompression(file, {
    maxWidthOrHeight: 800,
    fileType: 'image/webp',
    initialQuality: 0.7,
    useWebWorker: true,
    onProgress: (p) => onProgress(40 + Math.round(p * 0.1)),
  })

  const base = `${folder}/${crypto.randomUUID()}`
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token ?? SUPABASE_ANON_KEY

  // Upload both in parallel; progress is weighted by file size.
  const total = full.size + small.size
  const done = { full: 0, small: 0 }
  const report = () => onProgress(50 + Math.round(((done.full * full.size + done.small * small.size) / total) * 50))
  try {
    await Promise.all([
      putObject(`${base}.webp`, full, token, (f) => ((done.full = f), report())),
      putObject(`${base}-sm.webp`, small, token, (f) => ((done.small = f), report())),
    ])
  } catch (err) {
    removeFiles([supabase.storage.from(BUCKET).getPublicUrl(`${base}.webp`).data.publicUrl])
    throw err
  }

  onProgress(100)
  return supabase.storage.from(BUCKET).getPublicUrl(`${base}.webp`).data.publicUrl
}

/** media/<path> for one of our public URLs, or null for anything else. */
function pathFromUrl(url) {
  if (typeof url !== 'string') return null
  const i = url.indexOf(PUBLIC_MARKER)
  return i === -1 ? null : decodeURIComponent(url.slice(i + PUBLIC_MARKER.length).split('?')[0])
}

/** Best-effort delete of stored files. Never throws, never blocks the caller. */
export function removeFiles(urls = []) {
  // Each image also has a "-sm" copy; delete both.
  const paths = [
    ...new Set(
      urls
        .map(pathFromUrl)
        .filter(Boolean)
        .flatMap((p) => (p.endsWith('.webp') && !p.endsWith('-sm.webp') ? [p, p.replace(/\.webp$/, '-sm.webp')] : [p])),
    ),
  ]
  if (!paths.length) return
  supabase.storage
    .from(BUCKET)
    .remove(paths)
    .then(({ error }) => error && console.warn('Could not delete files from storage', error))
    .catch((err) => console.warn('Could not delete files from storage', err))
}

/**
 * Storage cleanup for a form with images:
 * - on save: delete original images that are gone + uploads that were removed again
 * - on cancel: delete everything uploaded during this edit
 */
export function cleanupOnSave(original = [], uploaded = [], final = []) {
  const keep = new Set(final.filter(Boolean))
  removeFiles([...original, ...uploaded].filter((u) => u && !keep.has(u)))
}

export function cleanupOnCancel(original = [], uploaded = []) {
  const orig = new Set(original.filter(Boolean))
  removeFiles(uploaded.filter((u) => !orig.has(u)))
}
