import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configurazione per ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config();

// Usa il GITHUB_TOKEN dall'ambiente o da .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Please set GITHUB_TOKEN environment variable or add it to .env file');
  process.exit(1);
}

// Importa la funzione di aggiornamento
import('./update-portfolio-auto.js')
  .then(module => {
    console.log('Portfolio update module loaded successfully');
  })
  .catch(error => {
    console.error('Error loading portfolio update module:', error);
  });
