import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { adminKeys, deleteSection, listSections, nextSortOrder } from '../lib/adminApi.js'
import { invalidateContent } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import useListActions from '../useListActions.js'
import RowControls from '../components/RowControls.jsx'
import SectionForm from '../components/SectionForm.jsx'
import { ConfirmDialog } from '../components/Modal.jsx'
import { Btn, Card, EmptyState, ListSkeleton, PageHeader, Thumb, UrBadge } from '../components/ui.jsx'
import LoadError from '../../components/ui/LoadError.jsx'
import { COPY, plural } from '../copy.js'

const coverOf = (s) => s.cover_url || s.items?.[0]?.images?.[0] || null

/** Events and Menu pages: the list of sections of one kind. */
export default function SectionsPage({ kind }) {
  const copy = COPY[kind]
  const qc = useQueryClient()
  const key = adminKeys.sections(kind)
  const { data: sections = [], isLoading, isError, refetch } = useQuery({ queryKey: key, queryFn: () => listSections(kind) })
  const { patch, move, moving } = useListActions({ table: 'sections', queryKey: key, invalidate: invalidateContent })

  const [editing, setEditing] = useState(null) // null | 'new' | section
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deleteSection(deleting)
      toast.success(`“${deleting.name}” deleted`)
      setDeleting(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setDeleteBusy(false)
      invalidateContent(qc)
    }
  }

  const addButton = (
    <Btn onClick={() => setEditing('new')}>
      <Plus className="size-5" /> Add section
    </Btn>
  )

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} action={sections.length > 0 && addButton} />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : sections.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          text={`Add your first ${kind === 'event' ? 'event category, like Walima' : 'menu category, like Main course'}.`}
          action={addButton}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((s, i) => (
            <Card key={s.id} className={`flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 ${s.is_visible ? '' : 'bg-white/60'}`}>
              <Link to={`${copy.path}/${s.id}`} className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <Thumb src={coverOf(s)} className={`size-16 sm:size-[72px] ${s.is_visible ? '' : 'opacity-50'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-[20px] text-plum group-hover:text-gold">{s.name}</p>
                  <p className="text-[13px] text-plum-soft">
                    {plural(s.items?.length ?? 0, copy.item, copy.items)}
                    {!s.is_visible && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[11px] font-medium">Hidden</span>}
                    <UrBadge filled={Boolean(s.name_ur?.trim())} />
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-plum-soft" />
              </Link>
              <RowControls
                index={i}
                total={sections.length}
                moving={moving}
                onMove={(dir) => move(sections, i, dir)}
                visible={s.is_visible}
                onToggleVisible={(v) => patch(s, { is_visible: v }, v ? `“${s.name}” is now visible` : `“${s.name}” is now hidden`)}
                onEdit={() => setEditing(s)}
                onDelete={() => setDeleting(s)}
              />
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SectionForm
          kind={kind}
          section={editing === 'new' ? null : editing}
          sortOrder={nextSortOrder(sections)}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.name}”?`}
        message={`This deletes the section and its ${plural(deleting?.items?.length ?? 0, copy.item, copy.items)}, including all photos. This can't be undone.`}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => !deleteBusy && setDeleting(null)}
      />
    </>
  )
}
