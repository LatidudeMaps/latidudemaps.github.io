const { Octokit } = require('@octokit/rest');
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurazione
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Carica la configurazione dei repository
const config = JSON.parse(fs.readFileSync('portfolio-sources.json', 'utf8'));
const { repositories, settings } = config;

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
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  return data;
}

// Funzione principale per l'aggiornamento del portfolio
async function updatePortfolio() {
  const portfolioData = [];

  for (const repo of repositories) {
    try {
      // Ottieni le informazioni del repository
      const { data: repoData } = await octokit.repos.get({
        owner: settings.username,
        repo: repo.name,
      });

      // Ottieni il contenuto del project-info.md
      const { data: projectInfoResponse } = await octokit.repos.getContent({
        owner: settings.username,
        repo: repo.name,
        path: 'project-info.md',
      });

      const content = Buffer.from(projectInfoResponse.content, 'base64').toString();
      const projectInfo = validateProjectInfo(content);

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
              // Se l'URL è relativo, lo trasformiamo in URL assoluto del repository
              const mediaUrl = media.url.startsWith('http') 
                ? media.url 
                : `https://raw.githubusercontent.com/${settings.username}/${repo.name}/main/${media.url}`;
              
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
        category: repo.category,
        priority: repo.priority,
        githubUrl: repoData.html_url,
        lastUpdate: repoData.updated_at,
        stars: repoData.stargazers_count,
        tags: [...new Set([...projectInfo.tags, ...repo.tags])], // Unione dei tag
      };

      portfolioData.push(projectData);
    } catch (error) {
      console.error(`Error processing ${repo.name}:`, error.message);
    }
  }

  // Ordina i progetti per priorità
  portfolioData.sort((a, b) => a.priority - b.priority);

  // Salva i dati aggiornati
  fs.writeFileSync(
    'src/config/portfolio-data.json',
    JSON.stringify(portfolioData, null, 2)
  );

  console.log('Portfolio data updated successfully!');
}

// Esegui l'aggiornamento
updatePortfolio().catch(console.error);
