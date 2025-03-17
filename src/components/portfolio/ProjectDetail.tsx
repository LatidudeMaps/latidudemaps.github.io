import { Project } from '@/config/portfolio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, Tag } from 'lucide-react';

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

            {project.features && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Caratteristiche Principali</h3>
                <ul className="list-disc list-inside space-y-1">
                  {project.features.map((feature, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.technologies && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Tecnologie Utilizzate</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visita il Progetto
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetail;