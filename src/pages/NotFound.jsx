import Container from '../components/ui/Container.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'
import Button from '../components/ui/Button.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

export default function NotFound() {
  const { t } = useLang()
  return (
    <Container className="flex flex-col items-center gap-8 py-32">
      <SectionHeading eyebrow="404" title={t('notFound.title')} accent={t('notFound.accent')} subtitle={t('notFound.text')} />
      <Button to="/" variant="outline">
        {t('notFound.back')}
      </Button>
    </Container>
  )
}
