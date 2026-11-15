# Intelligence Tycoon

Found an AI company in 2016 and try to end up the most valuable one by 2035. Each turn is a year. You manage compute, chips, data centers, researchers, models, products, funding rounds, the IPO, and the regulators, while rivals do the same.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

To run the balance sim in Node (plays each pathway with a simple bot):

```
node tests/sim.js
```

## Notes

- Six pathways (academic lab, garage startup, big tech skunkworks, open-source collective, chip maker, robotics). Each has its own starting team, bonuses, drawbacks, and objectives.
- The "How it works" button in the game explains the mechanics.
- Smoke-tested in headless Chromium: all tabs, actions, year-ends, and the final screen run with no console errors.
- Balance is a first pass. The sim bot is naive, so treat the numbers as a starting point.
- Nothing saves between sessions yet.
- Company and rival names are fictional.

Built with plain HTML, CSS, and JavaScript. The code was written with AI help, and I'm tuning it by hand.
