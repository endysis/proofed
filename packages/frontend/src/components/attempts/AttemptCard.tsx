import { Link } from 'react-router-dom';
import Card from '../common/Card';
import type { Attempt } from '@proofed/shared';

interface AttemptCardProps {
  attempt: Attempt;
}

export default function AttemptCard({ attempt }: AttemptCardProps) {
  return (
    <Link to={`/attempts/${attempt.attemptId}`}>
      <Card interactive className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{attempt.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{attempt.date}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {attempt.ovenTemp && (
                <span>{attempt.ovenTemp}°{attempt.ovenTempUnit || 'F'}</span>
              )}
              {attempt.ovenTemp && attempt.bakeTime && <span>·</span>}
              {attempt.bakeTime && <span>{attempt.bakeTime} min</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400 ml-3">
            {attempt.photoKeys && attempt.photoKeys.length > 0 && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        {attempt.notes && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{attempt.notes}</p>
        )}
        <div className="mt-2 text-xs text-gray-400">
          {attempt.itemUsages.length} item{attempt.itemUsages.length !== 1 ? 's' : ''}
        </div>
      </Card>
    </Link>
  );
}
