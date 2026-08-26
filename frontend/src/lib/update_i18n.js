const fs = require('fs');

const file = '/Users/beratmusayucel/Desktop/size-passport/frontend/src/lib/i18n.js';
let content = fs.readFileSync(file, 'utf8');

const translations = {
  en: 'Login',
  tr: 'Giriş Yap',
  de: 'Anmelden',
  fr: 'Connexion',
  it: 'Accedi',
  es: 'Iniciar Sesión',
  nl: 'Inloggen',
  pt: 'Entrar',
  sv: 'Logga in',
  da: 'Log ind',
  ja: 'ログイン',
  ko: '로그인'
};

const keys = Object.keys(translations);

keys.forEach(lang => {
  const regex = new RegExp(`(${lang}: \\{[^}]+continueGoogle: "[^"]+",)`, 's');
  // if not found exactly like that, let's just find continueGoogle for that language.
  // Actually, searching for continueGoogle: "..." is easier.
});

// A safer regex replacement:
content = content.replace(/continueGoogle:\s*"([^"]+)",/g, (match, p1) => {
  // We need to figure out which language it is based on the match text? No, better just replace by tracking language blocks.
  return match;
});

// Let's do it line by line
const lines = content.split('\n');
let currentLang = null;
const newLines = [];

for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const langMatch = line.match(/^  ([a-z]{2}): \{/);
  if (langMatch) {
    currentLang = langMatch[1];
  }
  
  newLines.push(line);
  if (line.includes('continueGoogle:')) {
    if (currentLang && translations[currentLang]) {
      newLines.push(`    login: "${translations[currentLang]}",`);
    }
  }
}

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log("Updated i18n.js");
