/**
 * Eyebrow + heading. Pass `accent` to render one word (or phrase) inside the
 * title in italic gold, e.g. title="Our signature events" accent="signature".
 */
export default function SectionHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  align = 'center',
  as: Tag = 'h2',
  className = '',
}) {
  const alignment = align === 'left' ? 'text-start items-start' : 'text-center items-center mx-auto'

  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignment} ${className}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag className="text-3xl leading-tight text-plum sm:text-4xl md:text-5xl rtl:text-[27px] sm:rtl:text-[32px] md:rtl:text-[43px]">
        {renderTitle(title, accent)}
      </Tag>
      {subtitle && <p className="text-base text-plum-soft sm:text-lg">{subtitle}</p>}
    </div>
  )
}

function renderTitle(title, accent) {
  if (!accent || !title?.includes(accent)) return title
  const [before, ...rest] = title.split(accent)
  return (
    <>
      {before}
      <em className="italic text-gold">{accent}</em>
      {rest.join(accent)}
    </>
  )
}
