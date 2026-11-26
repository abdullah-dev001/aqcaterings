import { useSettings } from '../../hooks/useSiteData.js'

/** Logo (or initial circle) + brand name, from settings. */
export default function BrandMark({ size = 'md', showName = true }) {
  const { data: settings } = useSettings()
  const name = settings?.brand_name || 'Dashboard'
  const initial = /^[a-z]/i.test(name) ? name[0].toUpperCase() : 'B'
  const box = size === 'lg' ? 'size-16 text-[30px]' : 'size-10 text-[20px]'

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {settings?.logo_url ? (
        <img src={settings.logo_url} alt="" className={`${box} shrink-0 rounded-full object-cover`} />
      ) : (
        <span className={`${box} flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-gold font-heading italic text-plum`}>
          {initial}
        </span>
      )}
      {showName && (
        <span className={`truncate font-heading font-semibold text-plum ${size === 'lg' ? 'text-[26px]' : 'text-[19px]'}`}>
          {name}
        </span>
      )}
    </span>
  )
}
