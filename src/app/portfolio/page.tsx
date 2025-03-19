'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from '@/components/portfolio/ProjectCard';
import { Loader2 } from 'lucide-react';
import { Project } from '@/lib/types';

export default function Portfolio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Carica direttamente dall'URL raw di GitHub
        const githubRawUrl = 'https://raw.githubusercontent.com/LatidudeMaps/latidudemaps.github.io/main/public/data/portfolio-data.json';
        const localUrl = '/data/portfolio-data.json';
        
        // Prima prova GitHub Raw, poi fallback al percorso locale
        let response = await fetch(githubRawUrl);
        
        // Se fallisce, prova il percorso locale
        if (!response.ok) {
          console.log('Caricamento da GitHub fallito, tentativo con percorso locale');
          response = await fetch(localUrl);
        }
        
        if (response.ok) {
          const dynamicProjects = await response.json();
          console.log('Progetti caricati:', dynamicProjects.length);
          setProjects(dynamicProjects);
        } else {
          console.error('Impossibile caricare i dati del portfolio:', response.status);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei progetti:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(loadProjects, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <main className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block mb-4 px-6 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
        >
          Il Nostro Lavoro
        </motion.div>

        <h1 className="text-4xl font-bold mb-4">
          Portfolio Progetti
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Esplora tutti i miei progetti!
        </p>
      </motion.div>

      {/* Griglia Progetti */}
      <div className="relative min-h-[400px]">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-muted-foreground">
          Hai un progetto in mente? {' '}
          <a
            href="/contatti"
            className="text-primary hover:underline"
          >
            Contattaci
          </a>
          {' '} per discuterne insieme.
        </p>
      </motion.div>
    </main>
  );
}