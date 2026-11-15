# Intelligence Tycoon

Found an AI company in 2016 and try to end up the most valuable AI company by 2035. Each turn is a year. Real companies (OpenAI, Anthropic, NVIDIA, xAI, Mistral, SSI, Thinking Machines) run on public valuation and revenue numbers until 2026. After that, they play by the same rules you do.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

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
- The "How it works" button in the game explains the mechanics.
- Smoke-tested in headless Chromium: all tabs, actions, year-ends, and the final screen run with no console errors.
- Balance is a first pass. After 2026 OpenAI tends to run away with the market in the sim, and the naive bot finishes around fifth.
- Google DeepMind, Meta AI, and Microsoft AI are simulated, since their AI units have no separate valuation.
- Nothing saves between sessions yet.
- Fictional stars and fictional startups. Real companies are shown with public figures, and estimates are marked.

Built with plain HTML, CSS, and JavaScript. The code was written with AI help, and I'm tuning the balance by hand.
