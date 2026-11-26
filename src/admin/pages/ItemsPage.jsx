import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { adminKeys, deleteItem, getSection, listItems, nextSortOrder } from '../lib/adminApi.js'
import { invalidateContent } from '../lib/invalidate.js'
import { friendlyError } from '../lib/errors.js'
import useListActions from '../useListActions.js'
import RowControls from '../components/RowControls.jsx'
import ItemForm from '../components/ItemForm.jsx'
import { ConfirmDialog } from '../components/Modal.jsx'
import { Btn, Card, EmptyState, IconBtn, ListSkeleton, PageHeader, Thumb } from '../components/ui.jsx'
import LoadError from '../../components/ui/LoadError.jsx'
import { COPY, plural } from '../copy.js'

/** Items (setups or dishes) inside one section. */
export default function ItemsPage({ kind }) {
  const copy = COPY[kind]
  const isMenu = kind === 'menu'
  const { sectionId } = useParams()
  const qc = useQueryClient()
  const key = adminKeys.items(sectionId)

  const sectionQuery = useQuery({ queryKey: adminKeys.section(sectionId), queryFn: () => getSection(sectionId) })
  const itemsQuery = useQuery({ queryKey: key, queryFn: () => listItems(sectionId) })
  const { patch, move, moving } = useListActions({ table: 'items', queryKey: key, invalidate: invalidateContent })

  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const section = sectionQuery.data
  const items = itemsQuery.data ?? []

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await deleteItem(deleting)
      toast.success(`“${deleting.title}” deleted`)
      setDeleting(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setDeleteBusy(false)
      invalidateContent(qc)
    }
  }

  const back = (
    <Link to={copy.path} className="mb-2 inline-flex items-center gap-1.5 text-[14px] text-plum-soft hover:text-gold">
      <ArrowLeft className="size-4" /> All {copy.title.toLowerCase()} sections
    </Link>
  )

  if (sectionQuery.isError || itemsQuery.isError) {
    return (
      <>
        {back}
        <LoadError onRetry={() => (sectionQuery.refetch(), itemsQuery.refetch())} />
      </>
    )
  }

  if (!sectionQuery.isLoading && !section) {
    return (
      <>
        {back}
        <EmptyState title="Section not found" text="It may have been deleted." />
      </>
    )
  }

  const addButton = (
    <Btn onClick={() => setEditing('new')} disabled={!section}>
      <Plus className="size-5" /> {copy.addItem}
    </Btn>
  )

  return (
    <>
      <PageHeader
        back={back}
        title={section?.name ?? '…'}
        subtitle={itemsQuery.isLoading ? ' ' : plural(items.length, copy.item, copy.items)}
        action={items.length > 0 && addButton}
      />

      {itemsQuery.isLoading || sectionQuery.isLoading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState title={`No ${copy.items} yet`} text={`Add your first ${copy.item} with photos and details.`} action={addButton} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <Card key={item.id} className={`flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 ${item.is_visible ? '' : 'bg-white/60'}`}>
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
              >
                <Thumb src={item.images?.[0]} className={`size-16 sm:size-[72px] ${item.is_visible ? '' : 'opacity-50'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-[19px] text-plum group-hover:text-gold">{item.title}</p>
                  <p className="truncate text-[13px] text-plum-soft">
                    {item.price || 'No price'} · {plural(item.images?.length ?? 0, 'photo', 'photos')}
                    {!item.is_visible && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-[11px] font-medium">Hidden</span>}
                  </p>
                </div>
              </button>
              <RowControls
                index={i}
                total={items.length}
                moving={moving}
                onMove={(dir) => move(items, i, dir)}
                visible={item.is_visible}
                onToggleVisible={(v) => patch(item, { is_visible: v }, v ? `“${item.title}” is now visible` : `“${item.title}” is now hidden`)}
                onEdit={() => setEditing(item)}
                onDelete={() => setDeleting(item)}
              >
                {isMenu && (
                  <IconBtn
                    label={item.is_featured ? 'Remove from featured' : 'Feature on home page'}
                    aria-pressed={item.is_featured}
                    onClick={() =>
                      patch(
                        item,
                        { is_featured: !item.is_featured },
                        item.is_featured ? `“${item.title}” removed from featured` : `“${item.title}” is now featured`,
                      )
                    }
                  >
                    <Star className={`size-5 ${item.is_featured ? 'fill-gold text-gold' : ''}`} />
                  </IconBtn>
                )}
              </RowControls>
            </Card>
          ))}
        </div>
      )}

      {editing && section && (
        <ItemForm
          kind={kind}
          section={section}
          item={editing === 'new' ? null : editing}
          sortOrder={nextSortOrder(items)}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.title}”?`}
        message={`This deletes the ${copy.item} and its photos. This can't be undone.`}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => !deleteBusy && setDeleting(null)}
      />
    </>
  )
}
