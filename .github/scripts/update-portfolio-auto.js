import { Octokit } from '@octokit/rest';
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

// Funzione per determinare la categoria del progetto basata su topics e linguaggi
async function determineCategory(repo, topics) {
  const categoryKeywords = {
    map: ['map', 'maps', 'maplibre', 'leaflet', 'gis', 'geospatial', 'mapbox', 'webgis', 'geodata'],
    visualization: ['visualization', 'chart', 'graph', 'plot', 'dashboard', '3d', 'three', 'visual', 'd3', 'dataviz'],
    analysis: ['analysis', 'data', 'statistics', 'analytics', 'pandas', 'numpy', 'geopandas', 'processing'],
    tool: ['tool', 'utility', 'helper', 'plugin', 'template', 'library', 'cli', 'command-line']
  };

  // Ottieni i linguaggi usati nel repository
  let languages = [];
  try {
    const { data: languagesData } = await octokit.repos.listLanguages({
      owner: USERNAME,
      repo: repo.name
    });
    languages = Object.keys(languagesData);
    console.log(`Languages found: ${languages.join(', ')}`);
  } catch (error) {
    console.warn(`Could not fetch languages for ${repo.name}: ${error.message}`);
  }
  
  // Mappa i linguaggi alle possibili categorie
  const mappingLanguages = ['javascript', 'typescript', 'html', 'css'];
  const dataLanguages = ['python', 'r', 'julia'];
  const vizLanguages = ['javascript', 'typescript', 'd3', 'three.js'];
  
  // Controlla nei topics del repository
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (topics.some(topic => keywords.includes(topic.toLowerCase()))) {
      return category;
    }
  }
  
  // Verifica dalla descrizione
  const descLower = (repo.description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => descLower.includes(keyword))) {
      return category;
    }
  }
  
  // Tenta di dedurre dai linguaggi
  if (languages.some(lang => mappingLanguages.includes(lang.toLowerCase())) && 
      (topics.includes('map') || topics.includes('gis') || descLower.includes('map'))) {
    return 'map';
  }
  
  if (languages.some(lang => dataLanguages.includes(lang.toLowerCase()))) {
    return 'analysis';
  }
  
  if (languages.some(lang => vizLanguages.includes(lang.toLowerCase()))) {
    return 'visualization';
  }
  
  // Default
  return 'other';
}

// Funzione per ottenere il contenuto di un README
async function getReadmeContent(owner, repo) {
  try {
    const { data } = await octokit.repos.getReadme({
      owner,
      repo,
      mediaType: { format: 'raw' }
    });
    return data;
  } catch (error) {
    console.warn(`README not found for ${repo}: ${error.message}`);
    return 'Informazioni non disponibili';
  }
}

// Funzione per estrarre le caratteristiche dal README
function extractFeaturesFromReadme(readmeContent) {
  const features = [];
  
  // Cerca sezioni come "Features", "Caratteristiche", "Funzionalità"
  const featureSectionRegex = /#+\s*(Features|Caratteristiche|Funzionalità|What it does)/i;
  const featureMatch = readmeContent.match(featureSectionRegex);
  
  if (featureMatch) {
    const featureSectionStart = featureMatch.index;
    const nextSectionRegex = /#+\s*[A-Za-z]/g;
    nextSectionRegex.lastIndex = featureSectionStart + featureMatch[0].length;
    
    const nextSectionMatch = nextSectionRegex.exec(readmeContent);
    const featureSectionEnd = nextSectionMatch ? nextSectionMatch.index : readmeContent.length;
    
    const featureSection = readmeContent.substring(featureSectionStart, featureSectionEnd);
    
    // Estrai elementi di lista
    const listItemRegex = /[-*]\s*([^\n]+)/g;
    let listItemMatch;
    
    while ((listItemMatch = listItemRegex.exec(featureSection)) !== null) {
      features.push(listItemMatch[1].trim());
    }
  }
  
  // Se non trova nulla, restituisci un elemento predefinito
  if (features.length === 0) {
    features.push('Caratteristiche non specificate');
  }
  
  return features.slice(0, 5); // Limita a 5 caratteristiche
}

// Funzione per organizzare i linguaggi in un techStack strutturato
function organizeTechStack(languages, topics) {
  const techStack = {
    core: [],
    mapping: [],
    visualization: [],
    frameworks: [],
    styling: [],
    dataProcessing: [],
    deployment: []
  };
  
  // Mappatura di linguaggi e tecnologie alle categorie del tech stack
  const mappings = {
    core: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust'],
    mapping: ['maplibre', 'leaflet', 'mapbox', 'openlayers', 'arcgis', 'qgis', 'gis'],
    visualization: ['d3', 'three.js', 'plotly', 'chart.js', 'highcharts', 'tableau', 'powerbi'],
    frameworks: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'django', 'flask', 'express'],
    styling: ['css', 'scss', 'sass', 'less', 'tailwind', 'bootstrap', 'styled-components'],
    dataProcessing: ['pandas', 'numpy', 'scipy', 'geopandas', 'r', 'julia', 'matlab', 'sql'],
    deployment: ['github-pages', 'netlify', 'vercel', 'aws', 'azure', 'gcp', 'heroku', 'docker']
  };
  
  // Aggiungi linguaggi alle categorie appropriate
  for (const lang of languages) {
    const langLower = lang.toLowerCase();
    
    for (const [category, techs] of Object.entries(mappings)) {
      if (techs.includes(langLower)) {
        techStack[category].push(lang);
        break;
      }
    }
  }
  
  // Aggiungi topics alle categorie appropriate
  for (const topic of topics) {
    const topicLower = topic.toLowerCase();
    
    for (const [category, techs] of Object.entries(mappings)) {
      if (techs.includes(topicLower) && !techStack[category].includes(topic)) {
        techStack[category].push(topic);
      }
    }
  }
  
  // Assicuriamoci che GitHub Pages sia nei deployment se è un sito su GitHub Pages
  if (!techStack.deployment.includes('GitHub Pages')) {
    techStack.deployment.push('GitHub Pages');
  }
  
  return techStack;
}

// Funzione per ottenere tutti i linguaggi dagli stack
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

// Funzione per ottenere screenshot dalla repo se esistono
async function getThumbnailImage(repo) {
  const possiblePaths = [
    'screenshot.png',
    'screenshot.jpg',
    'thumbnail.png',
    'thumbnail.jpg',
    'preview.png',
    'preview.jpg',
    'images/screenshot.png',
    'images/screenshot.jpg',
    'assets/images/screenshot.png',
    'docs/images/screenshot.png'
  ];
  
  for (const imagePath of possiblePaths) {
    try {
      const { data: imageData } = await octokit.repos.getContent({
        owner: USERNAME,
        repo: repo.name,
        path: imagePath
      });
      
      if (imageData && imageData.download_url) {
        // Crea la cartella se non esiste
        const mediaFolder = path.join('public', 'portfolio-media', repo.name);
        if (!fs.existsSync(mediaFolder)) {
          fs.mkdirSync(mediaFolder, { recursive: true });
        }
        
        // Scarica l'immagine
        const fileName = path.basename(imagePath);
        const localPath = path.join(mediaFolder, fileName);
        await downloadFile(imageData.download_url, localPath);
        
        return `/portfolio-media/${repo.name}/${fileName}`;
      }
    } catch (error) {
      // Continua a controllare il prossimo percorso
    }
  }
  
  return '/images/portfolio/placeholder.svg'; // Immagine di fallback
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
        
        // Ottieni i topics del repository
        console.log('Fetching repository topics...');
        const { data: topicsData } = await octokit.repos.getAllTopics({
          owner: USERNAME,
          repo: repo.name,
        });
        const topics = topicsData.names || [];
        console.log(`Topics found: ${topics.join(', ') || 'none'}`);
        
        // Ottieni i linguaggi usati nel repository
        const { data: languagesData } = await octokit.repos.listLanguages({
          owner: USERNAME,
          repo: repo.name
        });
        const languages = Object.keys(languagesData);
        console.log(`Languages found: ${languages.join(', ')}`);
        
        // Ottieni README per estrarre features
        const readmeContent = await getReadmeContent(USERNAME, repo.name);
        const features = extractFeaturesFromReadme(readmeContent);
        console.log(`Features extracted: ${features.join(', ')}`);
        
        // Determina la categoria del progetto
        const category = await determineCategory(repo, topics);
        console.log(`Determined category: ${category}`);
        
        // Cerca screenshot del progetto
        const imageUrl = await getThumbnailImage(repo);
        console.log(`Image URL: ${imageUrl}`);
        
        // Organizza i linguaggi in tech stack
        const techStack = organizeTechStack(languages, topics);
        console.log('Tech stack organized');
        
        // Composizione dei dati del progetto
        const projectData = {
          id: repo.name,
          title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formatta il nome
          description: repo.description || `Un progetto di ${USERNAME}`,
          imageUrl: imageUrl,
          category: category,
          techStack: techStack,
          technologies: flattenTechStack(techStack),
          tags: [...new Set(topics)],
          year: new Date(repo.created_at).getFullYear(),
          links: {
            github: repo.html_url,
            live: `https://${USERNAME}.github.io/${repo.name}/`
          },
          features: features,
          isTemplate: repo.name.toLowerCase().includes('template') || repo.is_template,
          lastUpdate: repo.updated_at,
          status: repo.archived ? 'archived' : 'active',
          priority: priority++
        };

        console.log('Project data compiled successfully');
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