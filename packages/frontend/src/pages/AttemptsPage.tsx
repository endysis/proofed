import { Link } from 'react-router-dom';
import { useAttempts } from '../hooks/useAttempts';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';

export default function AttemptsPage() {
  const { data: attempts, isLoading, error } = useAttempts();

  if (isLoading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">Error loading attempts</div>;

  const sortedAttempts = [...(attempts || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-bg-light/80 backdrop-blur-md p-4 pb-2 justify-between">
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-[#171112]">Bake Log</h1>
          <p className="text-sm text-dusty-mauve">Your baking experiments</p>
        </div>
        <Link
          to="/attempts/new"
          className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm"
        >
          <Icon name="add" />
        </Link>
      </div>

      <div className="px-4 mt-4">
        {sortedAttempts.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center">
            <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 size-16 mx-auto mb-4">
              <Icon name="menu_book" size="xl" />
            </div>
            <p className="text-[#171112] font-bold mb-1">No bakes yet</p>
            <p className="text-dusty-mauve text-sm mb-4">Start logging your experiments</p>
            <Link to="/attempts/new" className="text-primary font-bold text-sm">
              Log Your First Bake
            </Link>
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Timeline line */}
            <div className="absolute left-2 top-4 bottom-4 w-0.5 bg-pastel-pink/50"></div>

            {sortedAttempts.map((attempt, index) => (
              <Link
                key={attempt.attemptId}
                to={`/attempts/${attempt.attemptId}`}
                className="relative pl-8 block"
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 size-4 rounded-full border-2 border-white z-10 ${
                  index === 0 ? 'bg-primary' : 'bg-dusty-mauve'
                }`}></div>

                <div className={`bg-white p-4 rounded-xl border border-black/5 shadow-sm active:scale-[0.98] transition-transform ${
                  index !== 0 ? 'opacity-80' : ''
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-dusty-mauve uppercase">
                      {new Date(attempt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {attempt.itemUsages && attempt.itemUsages.length > 0 && (
                      <span className="text-xs font-medium text-dusty-mauve bg-[#f4f0f1] px-2 py-0.5 rounded-full">
                        {attempt.itemUsages.length} items
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-[#171112] mb-1">{attempt.name}</p>
                  {attempt.notes && (
                    <p className="text-sm text-dusty-mauve line-clamp-2">{attempt.notes}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link to="/attempts/new" className="fab" aria-label="New attempt">
        <Icon name="add" size="lg" />
      </Link>
    </div>
  );
}
