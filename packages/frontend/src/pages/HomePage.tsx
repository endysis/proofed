import { Link } from 'react-router-dom';
import { useAttempts } from '../hooks/useAttempts';
import Loading from '../components/common/Loading';
import Icon from '../components/common/Icon';

export default function HomePage() {
  const { data: attempts, isLoading } = useAttempts();

  if (isLoading) return <Loading />;

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
      {recentAttempts.length > 0 ? (
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
      ) : (
        <div className="mt-8 px-4">
          <div className="bg-white rounded-xl border border-black/5 shadow-sm p-8 text-center">
            <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 size-16 mx-auto mb-4">
              <Icon name="menu_book" size="xl" />
            </div>
            <p className="text-[#171112] font-bold mb-1">No bakes yet</p>
            <p className="text-dusty-mauve text-sm mb-4">Start your first baking session</p>
            <Link
              to="/attempts/new"
              className="text-primary font-bold text-sm"
            >
              Start Baking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
