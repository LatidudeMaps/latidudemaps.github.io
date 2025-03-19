import { Project } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { ExternalLink, Tag } from 'lucide-react';
import TechBadge from './TechBadge';

interface ProjectDetailProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetail = ({ project, isOpen, onClose }: ProjectDetailProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="relative h-80 w-full overflow-hidden rounded-lg">
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              {project.description}
            </p>

            {/* Technologies */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Tecnologie Utilizzate</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <TechBadge
                      key={tech}
                      tech={tech}
                      category={getTechCategory(tech, project)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {project.features && project.features.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Caratteristiche Principali</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {project.features.map((feature, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                    >
                      <Tag size={14} />
                      <span className="text-sm">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-4 pt-4">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Vedi su GitHub
                  <ExternalLink size={16} />
                </a>
              )}
              
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Visita il Progetto
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Funzione per determinare la categoria di una tecnologia (uguale a quella usata in ProjectCard)
function getTechCategory(tech: string, project: Project): string {
  const techLower = tech.toLowerCase();
  
  const categoryMappings: Record<string, string[]> = {
    core: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust'],
    mapping: ['maplibre', 'leaflet', 'mapbox', 'openlayers', 'arcgis', 'qgis', 'gis'],
    visualization: ['d3', 'three.js', 'plotly', 'chart.js', 'highcharts', 'tableau', 'powerbi'],
    frameworks: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'django', 'flask', 'express'],
    styling: ['css', 'scss', 'sass', 'less', 'tailwind', 'bootstrap', 'styled-components'],
    dataProcessing: ['pandas', 'numpy', 'scipy', 'geopandas', 'r', 'julia', 'matlab', 'sql'],
    deployment: ['github-pages', 'netlify', 'vercel', 'aws', 'azure', 'gcp', 'heroku', 'docker']
  };
  
  // Verifica in quale categoria rientra la tecnologia
  for (const [category, techs] of Object.entries(categoryMappings)) {
    if (techs.some(t => techLower.includes(t))) {
      return category;
    }
  }
  
  // Se è nei tag del progetto, potrebbe essere una tecnologia specifica
  if (project.tags.some(tag => tag.toLowerCase() === techLower)) {
    return 'tags';
  }
  
  return 'other';
}

export default ProjectDetail;