import { cn } from '@/lib/utils';

interface TechBadgeProps {
  tech: string;
  category?: string;
  className?: string;
}

const categoryColors = {
  core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mapping: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  visualization: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  frameworks: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  styling: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  dataProcessing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  deployment: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function TechBadge({ tech, category = 'other', className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        className
      )}
    >
      {tech}
    </span>
  );
}