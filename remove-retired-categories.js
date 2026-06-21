const fs = require("fs");

const retired = new Set(["Ключевые предметы", "Книги и справочники"]);

let data = fs.readFileSync("tracker-data.js", "utf8");
data = data
  .split(/\r?\n/)
  .filter(line => {
    const matchedCategory = [...retired].find(category => line.includes(`"${category}",`));
    if (matchedCategory) {
      if (line.trim().startsWith('["')) return false;
      if (line.trim() === `"${matchedCategory}",`) return false;
    }
    return true;
  })
  .join("\n");
fs.writeFileSync("tracker-data.js", data, "utf8");

let html = fs.readFileSync("index.html", "utf8");

function removeSection(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) return;
  const end = html.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Missing end marker for ${startMarker}`);
  html = html.slice(0, start) + html.slice(end);
}

removeSection('    const dlcMadCraftsmanRows = [', '    const dlcWeaponRows = [');
removeSection('      ...createCatalogItems("Ключевые предметы", [', '      ...createCatalogItems("Материалы", [');
removeSection('      ...createCatalogItems("Книги и справочники", [', '    );');

html = html
  .split(/\r?\n/)
  .filter(line => {
    if (line.includes('createFandomSourcedItems("Книги и справочники"')) return false;
    if (line.includes('["Книги", "Книги и справочники"]')) return false;
    if (line.includes('["Справочники", "Книги и справочники"]')) return false;
    if (line.includes('["Ключевые", "Ключевые предметы"]')) return false;
    return true;
  })
  .join("\n");

html = html.replace(/\n\s*\["Книги и справочники\|[^]*?\n\s*\}\],/g, "");

fs.writeFileSync("index.html", html, "utf8");
