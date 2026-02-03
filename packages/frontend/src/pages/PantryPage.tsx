import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems, useCreateItem } from '../hooks/useItems';
import ItemForm from '../components/items/ItemForm';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';
import type { CreateItemRequest, Item } from '@proofed/shared';

const typeIcons: Record<string, string> = {
  batter: 'cake',
  frosting: 'water_drop',
  filling: 'icecream',
  dough: 'cookie',
  glaze: 'format_paint',
  other: 'category',
};

export default function PantryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: items, isLoading } = useItems();
  const createItem = useCreateItem();

  const handleCreate = (data: CreateItemRequest) => {
    createItem.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  if (isLoading) return <Loading />;

  return (
    <div className="pb-4">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-bg-light/80 backdrop-blur-md p-4 pb-2 justify-between">
        <div className="flex-1">
          <h1 className="text-[#171112] text-xl font-bold leading-tight">Pantry</h1>
          <p className="text-dusty-mauve text-xs font-medium">Your recipe building blocks</p>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Icon name="search" className="text-[#171112]" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="mt-4 px-4">
        {items?.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center">
            <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 size-16 mx-auto mb-4">
              <Icon name="add_circle" size="xl" />
            </div>
            <p className="text-[#171112] font-bold mb-1">No items yet</p>
            <p className="text-dusty-mauve text-sm mb-4">Create your first building block</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-bold text-sm"
            >
              Create Item
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items?.map((item: Item) => (
              <Link
                key={item.itemId}
                to={`/items/${item.itemId}`}
                className="flex items-center gap-4 bg-white px-4 min-h-[72px] py-2 justify-between rounded-xl shadow-sm border border-black/5 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                    <Icon name={typeIcons[item.type] || 'category'} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[#171112] text-base font-bold leading-normal line-clamp-1">{item.name}</p>
                    <p className="text-dusty-mauve text-xs font-normal leading-normal line-clamp-2 capitalize">
                      {item.type}{item.notes ? ` • ${item.notes}` : ''}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Icon name="chevron_right" className="text-dusty-mauve" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fab"
        aria-label="Add item"
      >
        <Icon name="add" size="lg" />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Item"
      >
        <ItemForm
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createItem.isPending}
        />
      </Modal>
    </div>
  );
}
