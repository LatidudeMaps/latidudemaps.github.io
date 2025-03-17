import { Project } from '@/config/portfolio';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const imageUrl = project.imageUrl || '/images/portfolio/placeholder.svg';

  return (
    <div style={{ opacity: 1 }} className="h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300 z-10 relative">
      {/* Immagine fissa in altezza */}
      <div className="h-56 w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={project.title}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/portfolio/placeholder.svg';
          }}
        />
      </div>
      
      {/* Contenuto con altezza flessibile */}
      <div className="flex flex-col flex-grow p-6 bg-white dark:bg-gray-800">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {project.title}
        </h3>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow line-clamp-3">
          {project.description}
        </p>
        
        <div className="space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-white rounded-full text-sm font-medium shadow-sm hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Pulsanti/Actions */}
          <div className="flex items-center justify-between pt-2">
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-brand-blue hover:bg-blue-600 text-white text-center font-bold py-3 px-6 rounded-lg transition-all hover:scale-[1.02] shadow-md hover:shadow-lg border border-transparent hover:border-blue-400 dark:hover:border-blue-500"
              >
                Visita il Progetto
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}