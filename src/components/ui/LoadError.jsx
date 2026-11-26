import Button from './Button.jsx'

export default function LoadError({ onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center gap-3 py-10 text-center ${className}`}>
      <p className="text-[14px] text-plum-soft">Couldn't load. Try again.</p>
      <Button variant="outline" size="sm" onClick={() => onRetry?.()}>
        Retry
      </Button>
    </div>
  )
}
