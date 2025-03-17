const { Octokit } = require('@octokit/rest');
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurazione
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const ORGANIZATION = 'LatidudeMaps';

// Template per project-info.md di default
const DEFAULT_PROJECT_INFO = (repoName, description = '') => `---
title: ${repoName}
description: ${description || 'A cool project by LatidudeMaps'}
startDate: ${new Date().toISOString().split('T')[0]}
status: active
longDescription: |
  This project is part of the LatidudeMaps portfolio.
  More information coming soon!
technologies:
  - Web
tags:
  - Work in Progress
media: []
---

# ${repoName}
Project documentation coming soon.
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

// Funzione per validare il project-info.md
function validateProjectInfo(content) {
  const { data } = matter(content);
  const requiredFields = [
    'title',
    'description',
    'startDate',
    'status',
    'longDescription',
    'technologies',
    'tags'
  ];

  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Warning: Missing fields will be filled with default values: ${missingFields.join(', ')}`);
    // Riempi i campi mancanti con valori di default
    missingFields.forEach(field => {
      switch(field) {
        case 'title':
          data.title = data.title || 'Untitled Project';
          break;
        case 'description':
          data.description = data.description || 'A cool project by LatidudeMaps';
          break;
        case 'startDate':
          data.startDate = data.startDate || new Date().toISOString().split('T')[0];
          break;
        case 'status':
          data.status = data.status || 'active';
          break;
        case 'longDescription':
          data.longDescription = data.longDescription || 'Project documentation coming soon.';
          break;
        case 'technologies':
          data.technologies = data.technologies || ['Web'];
          break;
        case 'tags':
          data.tags = data.tags || ['Work in Progress'];
          break;
      }
    });
  }

  return data;
}

// Funzione per determinare la categoria del progetto
function determineCategory(repoTopics, description) {
  const categoryKeywords = {
    map: ['map', 'maplibre', 'leaflet', 'gis', 'geospatial'],
    visualization: ['visualization', 'chart', 'graph', 'plot', 'dashboard'],
    analysis: ['analysis', 'data', 'statistics', 'analytics'],
    tool: ['tool', 'utility', 'helper', 'plugin']
  };

  // Controlla prima nei topics del repository
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
    // Ottieni tutti i repository pubblici dell'organizzazione
    const { data: repos } = await octokit.repos.listForOrg({
      org: ORGANIZATION,
      type: 'public',
      sort: 'updated',
      per_page: 100
    });

    const portfolioData = [];
    let priority = 1;

    for (const repo of repos) {
      try {
        // Ignora il repository del sito principale
        if (repo.name === `${ORGANIZATION}.github.io`) {
          continue;
        }

        let projectInfo;
        let content;

        try {
          // Prova a ottenere il project-info.md
          const { data: projectInfoResponse } = await octokit.repos.getContent({
            owner: ORGANIZATION,
            repo: repo.name,
            path: 'project-info.md',
          });
          content = Buffer.from(projectInfoResponse.content, 'base64').toString();
        } catch (error) {
          // Se non esiste, crea un project-info.md di default
          console.log(`No project-info.md found for ${repo.name}, using default template`);
          content = DEFAULT_PROJECT_INFO(repo.name, repo.description);
        }

        projectInfo = validateProjectInfo(content);

        // Ottieni i topics del repository
        const { data: topicsData } = await octokit.repos.getAllTopics({
          owner: ORGANIZATION,
          repo: repo.name,
        });

        // Determina la categoria del progetto
        const category = determineCategory(topicsData.names, repo.description || '');

        // Gestione delle immagini
        const mediaFolder = path.join('public', 'portfolio-media', repo.name);
        if (!fs.existsSync(mediaFolder)) {
          fs.mkdirSync(mediaFolder, { recursive: true });
        }

        // Download e gestione dei media
        if (projectInfo.media) {
          for (const media of projectInfo.media) {
            if (media.type === 'image') {
              const fileName = path.basename(media.url);
              const localPath = path.join(mediaFolder, fileName);
              
              if (!fs.existsSync(localPath)) {
                const mediaUrl = media.url.startsWith('http') 
                  ? media.url 
                  : `https://raw.githubusercontent.com/${ORGANIZATION}/${repo.name}/main/${media.url}`;
                
                await downloadFile(mediaUrl, localPath);
                media.url = `/portfolio-media/${repo.name}/${fileName}`;
              }
            }
          }
        }

        // Composizione dei dati del progetto
        const projectData = {
          ...projectInfo,
          repoName: repo.name,
          category,
          priority: priority++,
          githubUrl: repo.html_url,
          pagesUrl: `https://${ORGANIZATION}.github.io/${repo.name}/`,
          lastUpdate: repo.updated_at,
          stars: repo.stargazers_count,
          tags: [...new Set([...projectInfo.tags, ...topicsData.names])], // Unione dei tag con i topics
        };

        portfolioData.push(projectData);
      } catch (error) {
        console.error(`Error processing ${repo.name}:`, error.message);
      }
    }

    // Ordina i progetti per data di ultimo aggiornamento
    portfolioData.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

    // Salva i dati aggiornati
    fs.writeFileSync(
      'src/config/portfolio-data.json',
      JSON.stringify(portfolioData, null, 2)
    );

    console.log('Portfolio data updated successfully!');
  } catch (error) {
    console.error('Error updating portfolio:', error);
    throw error;
  }
}

// Esegui l'aggiornamento
updatePortfolio().catch(console.error);