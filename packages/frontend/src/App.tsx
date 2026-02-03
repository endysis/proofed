import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Icon from './components/common/Icon';
import HomePage from './pages/HomePage';
import PantryPage from './pages/PantryPage';
import ItemDetailPage from './pages/ItemDetailPage';
import AttemptsPage from './pages/AttemptsPage';
import NewAttemptPage from './pages/NewAttemptPage';
import AttemptDetailPage from './pages/AttemptDetailPage';
import ProofedItemsPage from './pages/ProofedItemsPage';
import ProofedItemDetailPage from './pages/ProofedItemDetailPage';

function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/items') {
      return location.pathname.startsWith('/items');
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/items', label: 'Pantry', icon: 'inventory_2' },
    { path: '/attempts', label: 'Bakes', icon: 'menu_book' },
    { path: '/proofed', label: 'Proofed', icon: 'verified' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-black/5 z-50">
      <div className="flex justify-around pb-6 pt-2 px-6">
        {navItems.map(({ path, label, icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 min-w-[64px] ${
                active ? 'text-primary' : 'text-dusty-mauve'
              }`}
            >
              <Icon name={icon} filled={active} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg-light pb-24">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/items" element={<PantryPage />} />
        <Route path="/items/:itemId" element={<ItemDetailPage />} />
        <Route path="/attempts" element={<AttemptsPage />} />
        <Route path="/attempts/new" element={<NewAttemptPage />} />
        <Route path="/attempts/:attemptId" element={<AttemptDetailPage />} />
        <Route path="/proofed" element={<ProofedItemsPage />} />
        <Route path="/proofed/:proofedItemId" element={<ProofedItemDetailPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
