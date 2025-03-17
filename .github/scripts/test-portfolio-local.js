const { Octokit } = require('@octokit/rest');
const fs = require('fs');
require('dotenv').config();

// Usa il GITHUB_TOKEN dall'ambiente o da .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Please set GITHUB_TOKEN environment variable or add it to .env file');
  process.exit(1);
}

// Importa la funzione di aggiornamento
require('./update-portfolio-auto.js');