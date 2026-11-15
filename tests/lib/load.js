const fs = require('fs');
const path = require('path');

const FILES = ['data.js', 'core.js', 'systems.js', 'events.js', 'actions.js', 'turn.js', 'api.js'];
const EXPORTS = [
  'PATHS', 'SCENARIOS', 'REGIONS', 'PLATFORMS', 'TAM', 'SEGMENTS', 'HISTORY_END', 'END_YEAR', 'START_YEAR',
  'money', 'active', 'activeRivals', 'rankOf', 'frontierOf', 'companyById', 'flagCapOf', 'totalRacksOf', 'ownedMW',
  'capacityMW', 'energyRate', 'platOf', 'perfTotal', 'effCompute', 'anchorAt', 'valuationOf', 'allocLeft',
  'exportBlocked', 'antitrustBlocks', 'weightOf', 'marketShares', 'portfolioValue', 'verdictFor', 'endYear',
];

function load() {
  const root = path.join(__dirname, '..', '..');
  const real = fs.readFileSync(path.join(root, 'data', 'real.js'), 'utf8');
  const src = [real, ...FILES.map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8'))].join('\n');
  return new Function(`${src}\nreturn { ...Engine, ${EXPORTS.join(', ')} };`)();
}

module.exports = { load };
