import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Globe, Map, BarChart2, FileSearch, Wrench } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'Tutti', Icon: Globe },
  { id: 'map', label: 'Mappe', Icon: Map },
  { id: 'visualization', label: 'Visualizzazioni', Icon: BarChart2 },
  { id: 'analysis', label: 'Analisi', Icon: FileSearch },
  { id: 'tool', label: 'Tools', Icon: Wrench },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-8">
      {categories.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onCategoryChange(id)}
          className={cn(
            'relative px-4 py-2 rounded-full transition-colors',
            'flex items-center gap-2',
            selectedCategory === id 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary/10 hover:bg-secondary/20 text-foreground'
          )}
        >
          <Icon size={18} />
          {label}
          {selectedCategory === id && (
            <motion.div
              layoutId="activeCategory"
              className="absolute inset-0 rounded-full bg-primary -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}