'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, type Project } from '@/config/portfolio';
import ProjectCard from '@/components/portfolio/ProjectCard';
import CategoryFilter from '@/components/portfolio/CategoryFilter';
import { MapPin, ChartBar, Globe } from 'lucide-react';

const categoryIcons = {
  map: Globe,
  visualization: ChartBar,
  analysis: MapPin,
};

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Funzione per caricare i progetti dinamici
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Carica i progetti dinamici dal file JSON
        const response = await fetch('/data/portfolio-data.json');
        if (response.ok) {
          const dynamicProjects = await response.json();
          setProjects(dynamicProjects);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei progetti:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // Ricarica i progetti ogni 10 secondi durante lo sviluppo
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(loadProjects, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(project => project.category === selectedCategory);

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
          className="inline-block mb-4 px-6 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
        >
          Il Nostro Lavoro
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Portfolio Progetti
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Esplora la nostra collezione di progetti di cartografia digitale, 
          visualizzazioni dati e analisi geografiche
        </p>
      </motion.div>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="relative min-h-[400px]">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4 relative">
            {filteredProjects.map((project) => (
              <div key={project.id} className="h-full">
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400"
          >
            Nessun progetto trovato per questa categoria
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Hai un progetto in mente? {' '}
          <a
            href="/contatti"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Contattaci
          </a>
          {' '} per discuterne insieme.
        </p>
      </motion.div>
    </main>
  );
}