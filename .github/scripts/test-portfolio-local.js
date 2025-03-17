require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurazione
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Directory per i template generati
const TEMPLATES_DIR = path.join('templates', 'generated');

// Assicurati che la directory dei template esista
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Carica la configurazione
let config = { settings: { username: '' } };
try {
  config = JSON.parse(fs.readFileSync('portfolio-sources.json', 'utf8'));
} catch (error) {
  console.log('portfolio-sources.json non trovato, verrà creato automaticamente');
}

// Funzione per ottenere tutti i repository con GitHub Pages
async function findGitHubPagesRepos() {
  console.log('Cercando repository con GitHub Pages...');
  
  const repos = [];
  try {
    // Ottieni tutti i repository pubblici dell'utente
    const { data: userRepos } = await octokit.repos.listForAuthenticatedUser({
      visibility: 'public',
      sort: 'updated',
      per_page: 100
    });

    for (const repo of userRepos) {
      // Salta il repository principale delle GitHub Pages
      if (repo.name.endsWith('.github.io')) {
        console.log(`Repository principale GitHub Pages saltato: ${repo.name}`);
        continue;
      }

      try {
        // Controlla se il repository ha GitHub Pages
        const { data: pages } = await octokit.repos.getPages({
          owner: repo.owner.login,
          repo: repo.name
        });

        if (pages && pages.html_url) {
          console.log(`Repository con GitHub Pages trovato: ${repo.name}`);
          
          // Determina la categoria in base alle caratteristiche del repository
          let category = 'other';
          let tags = [];
          
          // Ottieni i linguaggi usati nel repository
          const { data: languages } = await octokit.repos.listLanguages({
            owner: repo.owner.login,
            repo: repo.name
          });

          // Converti i linguaggi in tags
          tags = Object.keys(languages);

          // Determina la categoria in base ai linguaggi e al nome
          if (tags.includes('JavaScript') || tags.includes('TypeScript')) {
            if (repo.name.toLowerCase().includes('map')) {
              category = 'map';
            } else {
              category = 'visualization';
            }
          } else if (tags.includes('Python')) {
            category = 'analysis';
          }

          // Aggiungi il repository alla lista
          repos.push({
            name: repo.name,
            category: category,
            tags: tags,
            priority: repos.length + 1,
            pagesUrl: pages.html_url,
            description: repo.description || ''
          });
        }
      } catch (error) {
        // Ignora i repository senza GitHub Pages
        continue;
      }
    }

    // Aggiorna il file di configurazione
    config.repositories = repos;
    config.settings.username = userRepos[0].owner.login;
    config.settings.screenshotDelay = 2000;
    config.settings.requiredFiles = ["project-info.md"];

    // Salva la nuova configurazione
    fs.writeFileSync(
      'portfolio-sources.json',
      JSON.stringify(config, null, 2)
    );

    console.log(`Trovati ${repos.length} repository con GitHub Pages`);
    return repos;

  } catch (error) {
    console.error('Errore nel recupero dei repository:', error.message);
    return [];
  }
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
    console.warn(`Campi mancanti: ${missingFields.join(', ')}`);
    return null;
  }

  return data;
}

// Funzione principale per l'aggiornamento del portfolio
async function testPortfolio() {
  console.log('Iniziando il test del portfolio...\n');
  
  // Trova tutti i repository con GitHub Pages
  const repositories = await findGitHubPagesRepos();
  const portfolioData = [];

  for (const repo of repositories) {
    console.log(`\nProcessando il repository: ${repo.name}`);
    try {
      // Ottieni le informazioni del repository
      const { data: repoData } = await octokit.repos.get({
        owner: config.settings.username,
        repo: repo.name,
      });

      console.log(`Repository trovato: ${repoData.html_url}`);
      console.log(`GitHub Pages URL: ${repo.pagesUrl}`);

      let projectInfo = null;
      let isTemplate = false;

      // Prova prima a ottenere il project-info.md dal repository
      try {
        const { data: projectInfoResponse } = await octokit.repos.getContent({
          owner: config.settings.username,
          repo: repo.name,
          path: 'project-info.md',
        });

        const content = Buffer.from(projectInfoResponse.content, 'base64').toString();
        console.log(`File project-info.md trovato in ${repo.name}`);
        projectInfo = validateProjectInfo(content);
        
        if (!projectInfo) {
          console.log(`Validazione fallita per ${repo.name}, proverò a usare il template`);
        }
      } catch (error) {
        if (error.status === 404) {
          console.log(`project-info.md non trovato in ${repo.name}, cerco il template`);
        } else {
          console.error(`Errore nel processare project-info.md: ${error.message}`);
        }
      }

      // Se non abbiamo un project-info valido, proviamo a usare il template
      if (!projectInfo) {
        const templatePath = path.join(TEMPLATES_DIR, `${repo.name}-project-info.md`);
        
        if (fs.existsSync(templatePath)) {
          console.log(`Usando il template da: ${templatePath}`);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          projectInfo = validateProjectInfo(templateContent);
          isTemplate = true;
        }
      }

      // Se non abbiamo né project-info né template valido, generiamo un nuovo template
      if (!projectInfo) {
        console.log(`Generando nuovo template per ${repo.name}`);
        const templatePath = path.join(TEMPLATES_DIR, `${repo.name}-project-info.md`);
        const template = `---
title: "${repo.name}"
description: "${repo.description || 'Descrizione da aggiungere'}"
startDate: "2024-01-01"
endDate: "ongoing"
status: "ongoing"

longDescription: |
  ${repo.description || 'Aggiungi qui una descrizione dettagliata del progetto.'}
  
  - Feature principale 1
  - Feature principale 2
  - Feature principale 3

technologies:
${repo.tags.map(tag => `  - name: "${tag}"
    icon: "code"
    url: "https://example.com"`).join('\n')}

links:
  - type: "demo"
    url: "${repo.pagesUrl}"
    label: "Live Demo"
  
  - type: "github"
    url: "${repoData.html_url}"
    label: "Source Code"

media:
  - type: "image"
    url: "/images/portfolio/placeholder.svg"
    alt: "Screenshot principale"
    caption: "Vista principale del progetto"

tags:
${repo.tags.map(tag => `  - "${tag}"`).join('\n')}
---

Contenuto opzionale in markdown che può essere usato per documentazione aggiuntiva.`;
        
        fs.writeFileSync(templatePath, template);
        console.log(`Nuovo template generato: ${templatePath}`);
        projectInfo = validateProjectInfo(template);
        isTemplate = true;
      }

      if (projectInfo) {
        // Composizione dei dati del progetto
        const projectData = {
          ...projectInfo,
          repoName: repo.name,
          category: repo.category,
          priority: repo.priority,
          githubUrl: repoData.html_url,
          pagesUrl: repo.pagesUrl,
          lastUpdate: repoData.updated_at,
          stars: repoData.stargazers_count,
          tags: [...new Set([...projectInfo.tags, ...repo.tags])],
          isTemplate: isTemplate
        };

        portfolioData.push(projectData);
        console.log(`Dati del progetto elaborati con successo${isTemplate ? ' (da template)' : ''}`);
      }

    } catch (error) {
      console.error(`Errore nel processare ${repo.name}: ${error.message}\n`);
    }
  }

  // Converti i dati nel formato richiesto dal componente Portfolio
  const formattedData = portfolioData.map(project => ({
    id: project.repoName.toLowerCase(),
    title: project.title,
    description: project.description,
    imageUrl: project.media?.[0]?.url || '/images/portfolio/placeholder.svg',
    category: project.category,
    tags: project.tags,
    year: new Date(project.startDate).getFullYear(),
    link: project.pagesUrl,
    features: project.longDescription
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2)),
    technologies: project.technologies.map(tech => tech.name),
    isTemplate: project.isTemplate
  }));

  // Salva i dati in formato JSON
  const testOutputPath = 'test/portfolio-data-test.json';
  const jsonOutputPath = 'public/data/portfolio-data.json';
  fs.writeFileSync(testOutputPath, JSON.stringify(portfolioData, null, 2));
  fs.writeFileSync(jsonOutputPath, JSON.stringify(formattedData, null, 2));

  console.log('\nTest completato!');
  console.log(`Repository con GitHub Pages trovati: ${repositories.length}`);
  console.log(`Progetti totali nel portfolio: ${portfolioData.length}`);
  console.log(`- di cui da template: ${portfolioData.filter(p => p.isTemplate).length}`);
  console.log(`File di output: ${testOutputPath}`);
  console.log(`              ${jsonOutputPath}`);
  console.log('\nI template dei progetti sono disponibili in:');
  console.log(TEMPLATES_DIR);
}

// Esegui il test
testPortfolio().catch(console.error);