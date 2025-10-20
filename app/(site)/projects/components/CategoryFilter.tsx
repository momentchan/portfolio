import { Category, CATEGORIES } from './projectHelpers';

interface CategoryFilterProps {
    selectedCategory: Category;
    onCategoryChange: (category: Category) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
    return (
        <nav className="flex gap-4 sm:gap-6 lg:gap-8 flex-shrink-0 flex-wrap lg:flex-nowrap">
            {CATEGORIES.map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => onCategoryChange(value)}
                    className={`py-2 text-xs sm:text-sm cursor-pointer transition-colors ${selectedCategory === value
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                        }`}
                >
                    {label}
                </button>
            ))}
        </nav>
    );
}
