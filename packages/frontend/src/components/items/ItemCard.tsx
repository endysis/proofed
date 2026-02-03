import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import type { Item } from '@proofed/shared';

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.itemId}`}>
      <Card interactive className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            {item.notes && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.notes}</p>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <Badge variant="primary">{item.type}</Badge>
          </div>
        </div>
        <div className="flex items-center mt-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
