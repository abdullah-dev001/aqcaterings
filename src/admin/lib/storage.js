import imageCompression from 'browser-image-compression'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase.js'

const BUCKET = 'media'
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`

/**
 * Compresses an image in the browser (max 1600px, webp, ~0.8 quality),
 * uploads it to media/<folder>/<uuid>.webp and returns its public URL.
 * onProgress receives 0–100 (first half = compressing, second half = uploading).
 */
export async function uploadImage(file, folder, onProgress = () => {}) {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image`)

  onProgress(0)
  const blob = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    fileType: 'image/webp',
    initialQuality: 0.8,
    useWebWorker: true,
    onProgress: (p) => onProgress(Math.round(p * 0.5)),
  })

  const path = `${folder}/${crypto.randomUUID()}.webp`
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Plain XHR so we get real upload progress (supabase-js doesn't expose it).
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`)
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
    xhr.setRequestHeader('Content-Type', 'image/webp')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(50 + Math.round((e.loaded / e.total) * 50))
    }
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

  onProgress(100)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** media/<path> for one of our public URLs, or null for anything else. */
function pathFromUrl(url) {
  if (typeof url !== 'string') return null
  const i = url.indexOf(PUBLIC_MARKER)
  return i === -1 ? null : decodeURIComponent(url.slice(i + PUBLIC_MARKER.length).split('?')[0])
}

/** Best-effort delete of stored files. Never throws, never blocks the caller. */
export function removeFiles(urls = []) {
  const paths = [...new Set(urls.map(pathFromUrl).filter(Boolean))]
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
