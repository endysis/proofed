import Card from '../common/Card';
import type { Recipe } from '@proofed/shared';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h4 className="font-medium text-gray-900">{recipe.name}</h4>
      <p className="text-sm text-gray-500 mt-1">
        {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
      </p>
      {recipe.prepNotes && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.prepNotes}</p>
      )}
    </Card>
  );
}
