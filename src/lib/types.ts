// Definizione delle interfacce condivise nel progetto

export interface TechStack {
  core: string[];
  mapping: string[];
  visualization: string[];
  frameworks: string[];
  styling: string[];
  dataProcessing: string[];
  deployment: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  techStack?: TechStack; // Reso opzionale
  technologies: string[];
  tags: string[];
  year: number;
  link: string;
  githubUrl?: string;
  features: string[];
  isTemplate: boolean;
  lastUpdate: string;
  status: string;
  priority: number;
}