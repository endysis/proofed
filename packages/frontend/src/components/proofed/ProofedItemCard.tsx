import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import type { ProofedItem } from '@proofed/shared';

interface ProofedItemCardProps {
  proofedItem: ProofedItem;
}

export default function ProofedItemCard({ proofedItem }: ProofedItemCardProps) {
  return (
    <Link to={`/proofed/${proofedItem.proofedItemId}`}>
      <Card interactive className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">{proofedItem.name}</h3>
              <Badge variant="success">Proofed</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {proofedItem.itemConfigs.length} item{proofedItem.itemConfigs.length !== 1 ? 's' : ''}
            </p>
            {proofedItem.notes && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{proofedItem.notes}</p>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
