const NAME_LEFT = ['Vector', 'Lumen', 'Atlas', 'Bramble', 'Corvid', 'Tidal', 'Hollow', 'Nova', 'Quill', 'Sable', 'Fathom', 'Ember', 'Cobalt', 'Halcyon', 'Kestrel', 'Mosaic', 'Orbit', 'Pylon', 'Riven', 'Solace'];
const NAME_RIGHT = ['AI', 'Labs', 'Systems', 'Works', 'Dynamics', 'Robotics', 'Intelligence', 'Studio', 'Logic', 'Forge', 'Compute', 'Minds'];
const FOUNDER_FIRST = ['Ines', 'Kenji', 'Amara', 'Lukas', 'Priya', 'Tomas', 'Hana', 'Ravi', 'Mara', 'Yusuf', 'Elena', 'Declan', 'Sora', 'Nadia', 'Oren', 'Freya'];
const FOUNDER_LAST = ['Varga', 'Morrow', 'Osei', 'Brandt', 'Sundaram', 'Ruiz', 'Lindqvist', 'Mehta', 'Okafor', 'Lind', 'Tanaka', 'Quinn', 'Haddad', 'Moreau', 'Reyes', 'Kovac'];
const CITIES = ['Austin', 'Toronto', 'Berlin', 'Lagos', 'Singapore', 'Bengaluru', 'Tel Aviv', 'Stockholm', 'Seoul', 'Lisbon', 'Denver', 'Warsaw'];
const FOCUS = ['warehouse robotics', 'coding assistants', 'medical imaging models', 'voice agents for call centres', 'open-weights reasoning models', 'chip design tools', 'legal research', 'climate forecasting', 'tutoring for schools', 'search over scientific papers'];
const ORIGIN = ['left a large lab after a disagreement about priorities', 'met in a university robotics club', 'started in a garage with two rented GPUs', 'spun out of a hospital research group', 'built a side project that went viral on a developer forum', 'sold a previous startup and funded this one alone'];

function makeName(s) { return `${pick(s, NAME_LEFT)} ${pick(s, NAME_RIGHT)}`; }
function makeFounder(s) { return `${pick(s, FOUNDER_FIRST)} ${pick(s, FOUNDER_LAST)}`; }

function makeIdentity(s, name, year) {
  const founder = makeFounder(s), city = pick(s, CITIES), focus = pick(s, FOCUS), origin = pick(s, ORIGIN);
  return { name, founder, city, focus, backstory: `${name} was founded in ${year} in ${city} by ${founder}, who ${origin}. It builds ${focus}.` };
}

function rollIdentity(seed) {
  const g = { rs: seed };
  return makeIdentity(g, makeName(g), START_YEAR);
}
