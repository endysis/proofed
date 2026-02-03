import Card from '../common/Card';
import type { Variant } from '@proofed/shared';

interface VariantCardProps {
  variant: Variant;
  onClick: () => void;
}

export default function VariantCard({ variant, onClick }: VariantCardProps) {
  return (
    <Card
      interactive
      className="p-3"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 text-sm">{variant.name}</h5>
          {variant.notes && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{variant.notes}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {variant.ingredientOverrides.length} override{variant.ingredientOverrides.length !== 1 ? 's' : ''}
          </p>
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  );
}
