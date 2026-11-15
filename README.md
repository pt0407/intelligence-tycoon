# Intelligence Tycoon

Found an AI company in 2016 and try to end up the most valuable AI company by 2035. Each turn is a year. Real companies (OpenAI, Anthropic, NVIDIA, xAI, Mistral, SSI, Thinking Machines) run on public valuation and revenue numbers until 2026. After that, they play by the same rules you do.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Real data

Every public figure the game uses lives in `data/real.json`: valuations, revenue, funding rounds, chip specs, power prices, capex and the market size. Each record names a source from the `sources` list and a status (`reported`, `estimate` or `game-estimate`). Starting states for companies are labelled `game-estimate`.

```
npm run build:data   # validates real.json and writes data/real.js for the browser
```

The build fails if a source is missing or a status is wrong. The tests check that `data/real.js` is up to date and that no public figure is typed into `js/`. The game never fetches data live.

## Tests and auto-player

```
npm test                 # 48 engine tests (node:test, no dependencies)
npm run autoplay         # bot plays every pathway and scenario, prints a summary table
npm run autoplay:all     # 8 seeds per pathway and scenario
node tests/autoplay.js --paths=lab,garage --scenarios=exportBan --seeds=10 --json=out.json
node tests/sim.js        # the older per-year sim printout
```

The autoplay runs games across worker threads. It reports bankruptcies, median rank, median valuation, objectives per run, and any non-finite values.

## What's in it

- Real hardware: P100 through Blackwell GB200 and Vera Rubin, AMD MI455X, TPU v7 (cloud only). Racks have real-ish prices and power draw, so buying racks means finding megawatts.
- Campuses in three regions with grid queues, energy prices, clean power contracts, and small modular reactors.
- Custom chip design, chip allocation, export controls, and shortages.
- Talent, morale, poaching, and fictional star researchers.
- Funding rounds, GPU-backed debt, IPO, sovereign money, and 5% stakes in rivals.
- Policy: binding rules, licensing, copyright, antitrust.
- A Market tab with the real anchors used for each company, and `docs/research.md` with sources and estimate flags.

## Notes

- Six pathways. Each has its own starting team, bonuses, drawbacks, and objectives.
- The Guide button explains the tabs in one short list. A "Start here" card on the Overview walks new players through four steps and can be hidden.
- Smoke-tested in headless Chromium: all tabs, actions, year-ends, and the final screen run with no console errors.
- Balance is a first pass. After 2026 OpenAI tends to run away with the market in the sim, and the naive bot finishes around fifth.
- Google DeepMind, Meta AI, and Microsoft AI are simulated, since their AI units have no separate valuation.
- Nothing saves between sessions yet.
- Fictional stars and fictional startups. Real companies are shown with public figures, and estimates are marked.

Built with plain HTML, CSS, and JavaScript. The code was written with AI help, and I'm tuning the balance by hand.

## Balance notes

- Early game: fine-tuning gives at least capability 28, so every pathway ships a product in year one. Before this, the Academic Lab and Robotics runs never shipped.
- Late game: the post-2026 growth bound for real companies (12 percent a year, in `data/real.json`) was tested at 1.05, 1.12 and 1.25. Changing it moved the player's median rank by only a few points, within noise on six seeds, so it stays at 1.12.
- Office, review, strategy and candidate numbers are game estimates, not data. They have not been playtested by a person.

## Browser auto-player

`npm run test:browser` plays every pathway through the real page with clicks. It visits each tab, takes the first available action up to six times a year, ends the year, and reports horizontal scroll, page errors and whether the game reaches the end screen. It needs `pip install playwright` and `playwright install chromium`. It takes about a minute per pathway. It clicks the first enabled button rather than playing well, so a bankruptcy in its run is not evidence of a balance problem on its own.
