/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Necessario per GitHub Pages
  images: {
    unoptimized: true,  // Richiesto per build statica
  },
  basePath: '',  // Sarà configurato in base al tuo dominio
}

module.exports = nextConfig