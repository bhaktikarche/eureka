// utils/autoTagger.js
function generateTagsFromFilename(filename) {
  const tags = [];
  const currentYear = new Date().getFullYear();
  const lowerFilename = filename.toLowerCase();

  // -------- Year Detection --------
  const yearMatch = lowerFilename.match(/(20\d{2})/);
  tags.push(`year-${yearMatch ? yearMatch[1] : currentYear}`);

  // -------- Program Area Keywords --------
  const programKeywords = [
    "education", "curriculum", "school", "students", "teachers",
    "literacy", "training", "skills", "e-learning", "vocational",
    "higher-education", "health", "healthcare", "public-health",
    "malaria", "hiv", "vaccine", "nutrition", "maternal", "child",
    "disease", "mental-health", "clinic", "hospital", "medicine",
    "pandemic", "research", "study", "clinical", "trial", "experiment",
    "innovation", "technology", "ai", "data", "science", "development",
    "startup", "entrepreneurship", "policy", "legislation", "regulation",
    "governance", "law", "compliance", "strategy", "advocacy", "program",
    "grant", "funding", "investment", "budget", "finance", "philanthropy",
    "awards", "scholarships", "environment", "climate", "energy",
    "sustainability", "conservation", "water", "agriculture", "forestry",
    "renewable", "green", "community", "social", "youth", "women",
    "empowerment", "inclusion", "equality", "volunteer", "ngo", "nonprofit",
  ];

  programKeywords.forEach((keyword) => {
    if (lowerFilename.includes(keyword)) {
      tags.push(keyword);
    }
  });

  // -------- Donor / Organization Keywords --------
  const donorKeywords = [
    "gates", "foundation", "who", "worldbank", "unicef", "undp",
    "usaid", "dfid", "nih", "wellcome", "rockefeller", "ford",
  ];

  donorKeywords.forEach((donor) => {
    if (lowerFilename.includes(donor)) {
      tags.push(`donor-${donor}`);
    }
  });

  // Remove duplicates just in case
  return [...new Set(tags)];
}

module.exports = { generateTagsFromFilename };