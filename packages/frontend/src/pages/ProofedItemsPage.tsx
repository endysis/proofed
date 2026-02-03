import { Link } from 'react-router-dom';
import { useProofedItems } from '../hooks/useProofedItems';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';

export default function ProofedItemsPage() {
  const { data: proofedItems, isLoading, error } = useProofedItems();

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">Error loading proofed items</div>;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-bg-light/80 backdrop-blur-md p-4 pb-2 justify-between">
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-[#171112]">Proofed</h1>
          <p className="text-sm text-dusty-mauve">Your proven recipes, ready to bake</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Icon name="verified" className="text-primary" />
        </div>
      </div>

      <div className="px-4 mt-4">
        {proofedItems?.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center">
            <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 size-16 mx-auto mb-4">
              <Icon name="verified" size="xl" />
            </div>
            <p className="text-[#171112] font-bold mb-1">No proofed items yet</p>
            <p className="text-dusty-mauve text-sm mb-4">Capture a successful attempt to add it here</p>
            <Link to="/attempts" className="text-primary font-bold text-sm">
              View Attempts
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proofedItems?.map((item) => (
              <Link
                key={item.proofedItemId}
                to={`/proofed/${item.proofedItemId}`}
                className="block bg-white rounded-xl border border-black/5 shadow-sm p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start gap-4">
                  <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                    <Icon name="verified" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#171112] text-base font-bold leading-normal line-clamp-1">{item.name}</p>
                    </div>
                    {item.notes && (
                      <p className="text-dusty-mauve text-sm line-clamp-2 mt-1">{item.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-dusty-mauve text-xs font-medium bg-[#f4f0f1] px-2 py-0.5 rounded-full">
                        {item.itemConfigs?.length || 0} items
                      </span>
                      <span className="text-dusty-mauve text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-dusty-mauve shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
