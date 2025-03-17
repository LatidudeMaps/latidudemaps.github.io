export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'map' | 'visualization' | 'analysis';
  tags: string[];
  year: number;
  link?: string;
  features?: string[];
  technologies?: string[];
}

export const categories = [
  { id: 'all', name: 'Tutti i Progetti' },
  { id: 'map', name: 'Mappe Interattive' },
  { id: 'visualization', name: 'Visualizzazioni 3D' },
  { id: 'analysis', name: 'Analisi Geografiche' }
];