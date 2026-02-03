import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems, useCreateItem } from '../hooks/useItems';
import { useAttempts } from '../hooks/useAttempts';
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

export default function ItemsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: attempts, isLoading: attemptsLoading } = useAttempts();
  const createItem = useCreateItem();

  const handleCreate = (data: CreateItemRequest) => {
    createItem.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  if (itemsLoading || attemptsLoading) return <Loading />;

  const recentAttempts = attempts?.slice(0, 5) || [];

  return (
    <div className="pb-4">
      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-bg-light/80 backdrop-blur-md p-4 pb-2 justify-between">
        <div className="flex size-12 shrink-0 items-center">
          <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center">
            <Icon name="person" className="text-primary" />
          </div>
        </div>
        <div className="flex-1 px-2">
          <p className="text-xs text-dusty-mauve font-medium uppercase tracking-wider">Welcome back</p>
          <h2 className="text-[#171112] text-lg font-bold leading-tight">Happy Baking!</h2>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Icon name="search" className="text-[#171112]" />
          </button>
        </div>
      </div>

      {/* Recent Bakes Section */}
      {recentAttempts.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-[#171112] text-[22px] font-bold leading-tight tracking-[-0.015em]">Recent Bakes</h2>
            <Link to="/attempts" className="text-primary text-sm font-bold">View all</Link>
          </div>
          <div className="flex overflow-x-auto no-scrollbar">
            <div className="flex items-stretch px-4 gap-4">
              {recentAttempts.map((attempt) => (
                <Link
                  key={attempt.attemptId}
                  to={`/attempts/${attempt.attemptId}`}
                  className="flex h-full flex-1 flex-col gap-3 rounded-xl min-w-64 bg-white p-3 shadow-sm border border-black/5"
                >
                  <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg relative bg-pastel-pink/30 flex items-center justify-center">
                    <Icon name="menu_book" size="xl" className="text-dusty-mauve" />
                    {attempt.createdAt && new Date(attempt.createdAt).toDateString() === new Date().toDateString() && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-primary uppercase tracking-tight">
                        Today
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#171112] text-base font-bold leading-normal line-clamp-1">{attempt.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-dusty-mauve text-xs font-medium bg-[#f4f0f1] px-2 py-0.5 rounded-full">
                        {attempt.itemUsages?.length || 0} items
                      </span>
                      <span className="text-dusty-mauve text-xs font-normal">
                        {attempt.date ? new Date(attempt.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Component Library Section */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-[#171112] text-[22px] font-bold leading-tight tracking-[-0.015em]">Component Library</h2>
          <button onClick={() => setIsModalOpen(true)} className="text-primary text-sm font-bold">Add New</button>
        </div>

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
