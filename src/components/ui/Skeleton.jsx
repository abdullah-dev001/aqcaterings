/**
 * Soft loading block. Size it with className (h-*, w-*, rounded-*).
 * tone="deep" is a slightly darker pink for use on blush backgrounds.
 */
export default function Skeleton({ tone = 'blush', className = '' }) {
  const bg = tone === 'deep' ? 'bg-[#F0CBD6]' : 'bg-blush'
  return <div aria-hidden="true" className={`animate-pulse ${bg} ${className}`} />
}
