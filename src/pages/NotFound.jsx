import Container from '../components/ui/Container.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-8 py-32">
      <SectionHeading
        eyebrow="404"
        title="This page got lost"
        accent="lost"
        subtitle="The page you are looking for doesn't exist or has moved."
      />
      <Button to="/" variant="outline">
        Back to home
      </Button>
    </Container>
  )
}
