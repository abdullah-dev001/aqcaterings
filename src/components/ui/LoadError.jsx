import Button from './Button.jsx'
import { useLang } from '../../i18n/LanguageContext.jsx'

export default function LoadError({ onRetry, className = '' }) {
  const { t } = useLang() // English outside the public site's LanguageProvider (dashboard)
  return (
    <div role="alert" className={`flex flex-col items-center gap-3 py-10 text-center ${className}`}>
      <p className="text-[14px] text-plum-soft">{t('error.load')}</p>
      <Button variant="outline" size="sm" onClick={() => onRetry?.()}>
        {t('error.retry')}
      </Button>
    </div>
  )
}
