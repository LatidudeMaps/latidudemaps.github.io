import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Configurazione per __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const USERNAME = 'LatidudeMaps';
const OUTPUT_PATH = 'public/data/portfolio-data.json';

// Template per project-info.md di default
const DEFAULT_PROJECT_INFO = (repoName, description = '') => `---
title: ${repoName}
description: ${description || 'Un progetto di LatidudeMaps'}
startDate: ${new Date().toISOString().split('T')[0]}
status: active
category: other

techStack:
  core:
    - JavaScript
  mapping:
    - MapLibre GL JS
  styling:
    - CSS
  deployment:
    - GitHub Pages

tags:
  - webgis
  - template

features:
  - Feature principale da definire
  - Altre feature da aggiungere

links:
  live: https://${USERNAME}.github.io/${repoName}/

media:
  - type: image
    url: images/placeholder.png
    description: Screenshot del progetto

longDescription: |
  ${description || 'Documentazione del progetto in arrivo.'}
  
  Altre informazioni verranno aggiunte presto.
---

# ${repoName}
Documentazione completa in arrivo.
`;

// Funzione per scaricare un file
async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Funzione per appiattire l'oggetto techStack in un array
function flattenTechStack(techStack) {
  if (!techStack) return [];
  
  return Object.values(techStack)
    .reduce((acc, technologies) => {
      if (Array.isArray(technologies)) {
        return [...acc, ...technologies];
      }
      return acc;
    }, [])
    .filter(Boolean);
}

// Funzione per validare e sistemare il project-info.md
function validateProjectInfo(content) {
  const { data } = matter(content);
  const requiredFields = [
    'title',
    'description',
    'startDate',
    'status',
    'category',
    'techStack',
    'tags',
    'features',
    'links',
    'media',
    'longDescription'
  ];

  const validatedData = { ...data };

  // Valida e correggi i campi mancanti
  requiredFields.forEach(field => {
    if (!validatedData[field]) {
      console.warn(`Warning: Missing field '${field}', using default value`);
      switch(field) {
        case 'title':
          validatedData.title = 'Untitled Project';
          break;
        case 'description':
          validatedData.description = 'Un progetto di LatidudeMaps';
          break;
        case 'startDate':
          validatedData.startDate = new Date().toISOString().split('T')[0];
          break;
        case 'status':
          validatedData.status = 'active';
          break;
        case 'category':
          validatedData.category = 'other';
          break;
        case 'techStack':
          validatedData.techStack = {
            core: ['JavaScript'],
            deployment: ['GitHub Pages']
          };
          break;
        case 'tags':
          validatedData.tags = ['Work in Progress'];
          break;
        case 'features':
          validatedData.features = ['Feature da definire'];
          break;
        case 'links':
          validatedData.links = {};
          break;
        case 'media':
          validatedData.media = [];
          break;
        case 'longDescription':
          validatedData.longDescription = 'Documentazione del progetto in arrivo.';
          break;
      }
    }
  });

  // Valida la struttura del techStack
  const validTechCategories = [
    'core',
    'mapping',
    'visualization',
    'frameworks',
    'styling',
    'dataProcessing',
    'deployment'
  ];

  if (typeof validatedData.techStack !== 'object') {
    validatedData.techStack = {};
  }

  validTechCategories.forEach(category => {
    if (!validatedData.techStack[category]) {
      validatedData.techStack[category] = [];
    } else if (!Array.isArray(validatedData.techStack[category])) {
      validatedData.techStack[category] = [validatedData.techStack[category]].filter(Boolean);
    }
  });

  // Assicurati che i campi array siano effettivamente array
  ['tags', 'features', 'media'].forEach(field => {
    if (!Array.isArray(validatedData[field])) {
      validatedData[field] = [validatedData[field]].filter(Boolean);
    }
  });

  // Valida la struttura dei links
  if (typeof validatedData.links !== 'object') {
    validatedData.links = {};
  }

  return validatedData;
}

// Funzione per determinare la categoria del progetto
function determineCategory(repoTopics, description, techStack) {
  const categoryKeywords = {
    map: ['map', 'maps', 'maplibre', 'leaflet', 'gis', 'geospatial', 'mapbox', 'webgis'],
    visualization: ['visualization', 'chart', 'graph', 'plot', 'dashboard', '3d', 'three', 'visual', 'd3'],
    analysis: ['analysis', 'data', 'statistics', 'analytics', 'pandas', 'numpy', 'geopandas'],
    tool: ['tool', 'utility', 'helper', 'plugin', 'template', 'library']
  };

  // Controlla prima nel techStack
  if (techStack.mapping && techStack.mapping.length > 0) {
    return 'map';
  }
  if (techStack.visualization && techStack.visualization.length > 0) {
    return 'visualization';
  }
  if (techStack.dataProcessing && techStack.dataProcessing.length > 0) {
    return 'analysis';
  }

  // Controlla nei topics del repository
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (repoTopics.some(topic => keywords.includes(topic.toLowerCase()))) {
      return category;
    }
  }

  // Se non trova nei topics, cerca nella descrizione
  const descLower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => descLower.includes(keyword))) {
      return category;
    }
  }

  return 'other'; // Categoria di default
}

// Funzione principale per l'aggiornamento del portfolio
async function updatePortfolio() {
  try {
    console.log('Starting portfolio update...');
    console.log(`Fetching repositories for user: ${USERNAME}`);

    // Ottieni tutti i repository pubblici dell'utente
    const { data: repos } = await octokit.repos.listForUser({
      username: USERNAME,
      type: 'owner',
      sort: 'updated',
      per_page: 100
    });

    console.log(`Found ${repos.length} public repositories`);
    repos.forEach(repo => console.log(`- ${repo.name}`));

    const portfolioData = [];
    let priority = 1;

    for (const repo of repos) {
      try {
        console.log(`\nProcessing repository: ${repo.name}`);
        
        // Ignora il repository del sito principale
        if (repo.name === `${USERNAME}.github.io`) {
          console.log('Skipping main website repository');
          continue;
        }

        let projectInfo;
        let content;

        try {
          // Prova a ottenere il project-info.md
          console.log('Attempting to fetch project-info.md...');
          const { data: projectInfoResponse } = await octokit.repos.getContent({
            owner: USERNAME,
            repo: repo.name,
            path: 'project-info.md',
          });
          content = Buffer.from(projectInfoResponse.content, 'base64').toString();
          console.log('Found project-info.md');
        } catch (error) {
          // Se non esiste, crea un project-info.md di default
          console.log('No project-info.md found, using default template');
          content = DEFAULT_PROJECT_INFO(repo.name, repo.description);
        }

        projectInfo = validateProjectInfo(content);
        console.log('Project info validated successfully');

        // Ottieni i topics del repository
        console.log('Fetching repository topics...');
        const { data: topicsData } = await octokit.repos.getAllTopics({
          owner: USERNAME,
          repo: repo.name,
        });
        console.log(`Topics found: ${topicsData.names.join(', ') || 'none'}`);

        // Determina la categoria del progetto (usando anche il techStack)
        const category = determineCategory(topicsData.names, repo.description || '', projectInfo.techStack);
        console.log(`Determined category: ${category}`);

        // Gestione delle immagini
        const mediaFolder = path.join('public', 'portfolio-media', repo.name);
        if (!fs.existsSync(mediaFolder)) {
          fs.mkdirSync(mediaFolder, { recursive: true });
        }

        // Download e gestione dei media
        if (projectInfo.media && projectInfo.media.length > 0) {
          console.log('Processing media files...');
          for (const media of projectInfo.media) {
            if (media.type === 'image') {
              const fileName = path.basename(media.url);
              const localPath = path.join(mediaFolder, fileName);
              
              if (!fs.existsSync(localPath)) {
                const mediaUrl = media.url.startsWith('http') 
                  ? media.url 
                  : `https://raw.githubusercontent.com/${USERNAME}/${repo.name}/main/${media.url}`;
                
                await downloadFile(mediaUrl, localPath);
                media.url = `/portfolio-media/${repo.name}/${fileName}`;
                console.log(`Downloaded media: ${fileName}`);
              }
            }
          }
        }

        // Composizione dei dati del progetto
        const projectData = {
          id: repo.name,
          title: projectInfo.title,
          description: projectInfo.description,
          imageUrl: projectInfo.media && projectInfo.media[0] 
            ? projectInfo.media[0].url 
            : '/images/portfolio/placeholder.svg',
          category: category,
          techStack: projectInfo.techStack,
          technologies: flattenTechStack(projectInfo.techStack),
          tags: [...new Set([...projectInfo.tags, ...topicsData.names])],
          year: new Date(projectInfo.startDate).getFullYear(),
          links: {
            ...projectInfo.links,
            github: repo.html_url,
            live: projectInfo.links.live || `https://${USERNAME}.github.io/${repo.name}/`
          },
          features: projectInfo.features,
          isTemplate: repo.name.toLowerCase().includes('template'),
          lastUpdate: repo.updated_at,
          status: projectInfo.status,
          priority: priority++
        };

        console.log('Project data compiled:', projectData);
        portfolioData.push(projectData);
        console.log('Project added to portfolio data');
      } catch (error) {
        console.error(`Error processing ${repo.name}:`, error.message);
        console.error(error.stack);
      }
    }

    // Ordina i progetti per data di ultimo aggiornamento
    portfolioData.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

    console.log('\nWriting portfolio data...');
    console.log(`Total projects: ${portfolioData.length}`);

    // Assicurati che la directory esista
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Salva i dati aggiornati
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(portfolioData, null, 2));

    console.log('Portfolio data updated successfully!');
  } catch (error) {
    console.error('Error updating portfolio:', error);
    console.error(error.stack);
    throw error;
  }
}

// Esegui l'aggiornamento
updatePortfolio().catch(console.error);