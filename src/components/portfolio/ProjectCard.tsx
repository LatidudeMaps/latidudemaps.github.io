import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Github, ExternalLink, Tags } from 'lucide-react';
import { motion } from 'framer-motion';
import TechBadge from './TechBadge';
import { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow dark:hover:shadow-blue-900/20">
        {/* Project Image */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
          {project.status !== 'completed' && (
            <div className="absolute top-2 right-2">
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
          )}
        </div>

        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{project.title}</CardTitle>
            <span className="text-sm text-muted-foreground">{project.year}</span>
          </div>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow">
          {/* Technologies */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.technologies.map((tech) => (
              <TechBadge
                key={tech}
                tech={tech}
                category={getTechCategory(tech, project)}
              />
            ))}
          </div>

          {/* Features */}
          {project.features && project.features.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Caratteristiche principali:</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {project.features.slice(0, 3).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          {/* Project Links */}
          <div className="flex gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github size={20} />
              </a>
            )}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink size={20} />
              </a>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1">
            <Tags size={16} className="text-muted-foreground" />
            <div className="flex gap-1">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Funzione per determinare la categoria di una tecnologia
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