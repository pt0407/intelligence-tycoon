# Research notes

Numbers used in the game, where they came from, and what is an estimate. Checked 14 Nov 2026. Money is in $M unless noted. "est." means a game estimate, not a published figure.

## Hardware

Per-GPU BF16 dense TFLOPS, per-rack compute cost and rack power. A "rack" is a 72-GPU equivalent.

| Platform | Year | BF16 TF/GPU | Rack cost ($M) | Rack kW | Source |
| --- | --- | --- | --- | --- | --- |
| P100 (Pascal) | 2016 | 21 | 0.9 est | 25 est | NVIDIA P100 datasheet (FP16, no tensor cores) |
| V100 (Volta) | 2017 | 125 | 1.0 est | 30 est | NVIDIA V100 tensor FP16 |
| A100 (Ampere) | 2020 | 312 | 1.6 est | 40 est | NVIDIA A100 BF16 dense |
| H100 SXM (Hopper) | 2022 | 989 | 2.6 est | 70 est | NVIDIA H100 datasheet (700 W TDP) |
| H200 (Hopper refresh) | 2024 | 989 | 2.8 est | 70 est | NVIDIA HGX H200: 141 GB HBM3e, 4.8 TB/s |
| GB200 NVL72 (Blackwell) | 2025 | 2250 | 3.4 | 120 | Bernstein: $3.4M compute per rack; ipvaluelabs: 120 kW per rack |
| TPU v7 Ironwood | 2025 | 2307 | 2.6 est | 100 est | Google Cloud TPU7x docs: 2,307 TFLOPS BF16 per chip, 192 GiB HBM3e |
| Vera Rubin NVL72 | 2026 | 4000 | 4.2 est | 190 est | NVIDIA Rubin datasheet (288 GB HBM4, 19.2 TB/s shipping spec); AMD MI455X vs Rubin comparison chart |
| AMD MI455X (Helios) | 2026 | 5000 | 3.8 est | 180 est | AMD: 5 PF BF16 dense, 432 GB HBM4, 23.3 TB/s, Helios rack 72 GPUs |
| Rubin Ultra | 2027 | 8000 | 5.5 est | 230 est | Roadmap only, scaled est |
| Feynman | 2028 | 16000 | 7.5 est | 300 est | Roadmap only, scaled est |
| Gen 9 | 2030 | 30000 | 9 est | 380 est | Extrapolated |
| Gen 10 | 2032 | 60000 | 11 est | 450 est | Extrapolated |

Notes:
- Rubin's shipping specs were cut from the preliminary 22 TB/s to 19.2 TB/s HBM4 bandwidth (ServeTheHome, Nov 2026). The game uses the shipping figure.
- TPU v7 is sold through Google Cloud. Other companies can rent it but not buy it, so it's marked cloud-only in the game.

## Data centers and power

- AI-optimized facility cost: $20M+ per MW in 2025, about $22M+ in 2026 (Turner and Townsend, via aitooldiscovery). Standard hyperscale: $10.7M per MW in 2025 (same source).
- BofA: $39M per MW traditional, $52M per MW AI-optimized (all-in, incl. some IT). Not used directly; it's the high end.
- Bernstein: about $35B per GW for AI capacity. Nvidia says $50 to 60B per GW. The game uses the facility-only per-MW costs above, so compute is bought separately.
- Facility cost in the game: $12M per MW before 2022, $16M per MW 2022 to 2023, $20M per MW from 2024.
- Power prices by region are game estimates (US Southeast about $80/MWh, Texas about $55/MWh, Nordic about $45/MWh). Energy is 8,760 hours times 1.25 PUE.
- Stargate sites (datacenterfootprint, Stargate.how, Oracle Q1 FY27 call): Abilene 618 MW delivered (6 of 8 buildings, 75 percent of campus) by Sept 2026. Shackelford County 2 GW target by 2028. Milam County 1.2 GW target by 2028. Project Jupiter (New Mexico) 2.45 GW, with force majeure dispute. Port Washington and Michigan 2028 targets.
- Grid queues of 2 to 4 years are a game estimate, consistent with interconnection delays in the news.

## Rental prices

- H100 rental: $3.29 per GPU-hour (Ornn OCPI-H100, 13 Nov 2026). Silicon Data index $3.06 (10 Nov 2026). Hyperscaler on-demand list about $9.90 median (GPU Economy, Nov 2026).
- Game uses 0.75 times the rack price per year for cloud rental plus a shortage premium. A rack at $2.6M rents for about $2M a year.

## Supply chain

- TSMC CoWoS: about 130,000 wafers per month at end of 2026 (analyst estimate, not confirmed guidance). Roughly doubling by 2028 (same source).
- Memory and ABF substrates named as bottlenecks (TSMC VP, OCP APAC, Aug 2026).
- Memory shortage expected through 2027, possibly 2028 (CSIS).
- Game models this as a yearly chip allocation that shrinks when the shortage index rises.

## Companies

Valuations are post-money unless noted. Revenue is annualized run-rate unless noted.

| Company | Founded | Valuation anchors ($B) | Revenue anchors ($M) | Source |
| --- | --- | --- | --- | --- |
| OpenAI | 2015 | 2023: 29 (reported); 2024: 157; 2025: 300 (Mar), 500 (Oct secondary); 2026: 852 (Mar), 1,250 (Nov first close of $11B, target up to $20B) | 2022: 200; 2023: 2,000; 2024: 6,000; 2025: 13,100 actual; 2026: 50,000 (Sept run-rate, FT) | OpenAI release Mar 2026; Bloomberg/CNBC Nov 2026; CFO blog Jan 2026; FT Oct 2026; CNBC Feb 2026 |
| OpenAI 2016 to 2022 | | 2016: 1.5 est; 2019: 25 est; 2021: 20 est | | No public figures; estimates |
| Anthropic | 2021 | 2021: 4 (reported); 2023: 18.4; 2024: 40 est; 2025: 183 (Sept); 2026: 380 (Feb), 965 (May Series H) | 2025: 10,000 actual; 2026: 47,000 (run-rate, May) | Anthropic Series H release, May 2026; Reuters, TechCrunch, CNBC May 2026 |
| xAI | 2023 | 2023: 18 est; 2024: 24; 2025: 113 (combined with X); 2026: 250 (SpaceX merger, Feb) | | CNBC, Reuters, Forbes Jan-Feb 2026 |
| NVIDIA (public) | 1993 | Market cap ($B): 2016: 57.5; 2017: 117.3; 2018: 81.4; 2019: 144.0; 2020: 323.2; 2021: 735.3; 2022: 364.2; 2023: 1,220; 2024: 3,288; 2025: 4,638; Nov 2026: 3,932 | | companiesmarketcap, stockanalysis, GuruFocus Nov 2026 |
| Mistral AI | 2023 | 2023: 2 (reported); 2024: 6.2 (€5.8B); 2025: 14 (€11.7B); 2026: 24.4 (€21B+, Samsung-led, Sept) | 2026: 1,000 target (ARR expected above $1B per CEO) | Mistral release Sept 2026; CNBC, TechCrunch |
| Safe Superintelligence (SSI) | 2024 | 2024: 5 (reported); 2025: 32; 2026: 32 | | Business Insider, Dealroom Nov 2026 |
| Thinking Machines Lab | 2025 | 2025: 12 (after $2B seed); 2026: 40 (target, pre-money) | 2026: 200 (run-rate, reported) | Business Insider, TechCrunch, Dealroom Nov 2026 |
| Google DeepMind | 2010 (acquired 2014) | Inside Alphabet, no separate valuation. Game simulates it. | | |
| Meta AI (FAIR, superintelligence labs) | 2013 | Inside Meta. Game simulates it. | | |
| Microsoft AI | 1975 (AI unit notional) | Inside Microsoft. Game simulates it. | | |

Hyperscaler capex (Q3 2026 guidance): Amazon about $220B, Alphabet $195 to 205B, Microsoft about $170B, Meta $135 to 145B. Combined about $730B for 2026 (valueaddvc, Nov 2026).

## Events

Dated real events the game uses, all sourced from the research above or widely reported:
- 2016: AlphaGo beats Lee Sedol (March).
- 2017: "Attention Is All You Need" transformer paper.
- 2019: OpenAI becomes capped-profit, Microsoft invests $1B.
- 2020: GPT-3 released.
- 2022: H100 launches, ChatGPT launches (November), central banks hike rates.
- 2023: GPU shortage, GPT-4 and Claude launch, xAI founded.
- 2024: Nobel prizes for AI research, export controls tighten on the newest chips.
- 2025: DeepSeek-R1 market shock (January), Stargate announced, copyright suits pile up, EU AI Act obligations start.
- 2026: Vera Rubin ships to cloud providers, SpaceX acquires xAI (Feb), OpenAI $122B round (Mar), Anthropic $65B Series H (May), AI stock selloff and capex worries (Oct to Nov).

## Not used

- Named individual researchers. Stars in the game are fictional, to avoid implying real people's moves.
- Revenue for NVIDIA. Its valuation is anchored, but its revenue comes from the simulation.

## Added 14 Nov 2026

| Company | Founded | Valuation anchors ($B) | Revenue anchors ($M) | Source / caveat |
| --- | --- | --- | --- | --- |
| DeepSeek | 2023 | 2026: 89 (about 500B yuan pre-money, ~$15B raise, Oct 2026) | | TechCrunch, CNBC, Reuters Oct 2026. Earlier round $50B (June). Private; no audited accounts. |
| Moonshot AI (Kimi) | 2023 | 2025: 4.3; 2026: 35 (Bloomberg, July) | | 36Kr, Bloomberg. HK IPO filing reported Sept 2026. Unaudited. |
| Zhipu AI (Z.ai) | 2019 | 2026: 7.3 (HK listing, Jan 2026; price moves imply higher) | | ICMI, 36Kr. Listed. Run-rate claims are not audited. |
| Cursor (Anysphere) | 2022 | 2025: 29.3 (Nov); 2026: 50 (July), 60 (SpaceX deal, Feb 2026 option) | 2026: 2,000 (annualized, Feb) | TechCrunch, Dealroom, Bloomberg. The game uses 60 for the acquisition-value anchor. |
| Perplexity | 2022 | 2024: 9; 2025: 20 (Sept, $20.39B); 2026: 30 (reported talks, not closed) | 2025: 200; 2026: 750 (annualized, Aug) | StockAnalysis, Reuters/The Information. The $30B figure is reported and not closed. |
| Cohere | 2019 | 2026: 36 (CAD 35.7B, Series E initial close, Oct 2026) | | CBC, Globe and Mail, Cohere release. Round not fully closed. |
| CoreWeave (public) | 2017 | 2026: 29 (market cap, Nov 2026) | 2025: 5,131 actual; 2026: 13,150 guidance midpoint | CoreWeave Q3 2026 release. Backlog $132.5B. Leased racks modeled as 5,000 for the game. |

Chinese capex and supply:
- Alibaba capex, quarter to June 2026: $9.98B, up 75 percent year on year (company filing, via safeguard.sh).
- China AI infrastructure capex 2026: about 932B yuan ($139B), roughly 15 to 20 percent of US (Rhodium Group, Sept 2026).
- Big four US hyperscaler capex 2026: about $730B (valueaddvc, Nov 2026, company guidance as of Oct 29).

Caveats:
- Private Chinese labs publish no accounts. DeepSeek's reported 82.9 percent API gross margin came via The Information and is unconfirmed.
- Valuations for Perplexity and Cohere are reported or in progress, not closed.
- The game drops the Cohere anchor below 2026 so it doesn't appear in history before it existed as a $36B company.

## Memory and power (added 14 Nov 2026)

Memory:
- Counterpoint: global DRAM revenue rose 369 percent year on year in Q3 2026 to nearly $200B, mostly from price, not volume.
- Counterpoint: DRAM prices went from 20 to 30 cents per gigabit to about $2 per gigabit. HBM4 heading toward $4 per gigabit.
- Contract price of a 16Gb DDR5 chip: $8.70 (Oct 2025) to $48 (Sept 2026), per Fortune.
- TrendForce: 2Q26 DRAM industry revenue about $154.7B, up 59.5 percent quarter on quarter. Samsung 39.4 percent share, SK hynix 24.9 percent.
- Samsung wants up to 70 percent of capacity in multi-year contracts (Semafor, Nikkei).
- Game uses a memory tightness index that rises with hype, and it raises rack prices by up to 50 percent. This is a game mechanic, not a published index.

Power, delivered cost in $/MWh (PGIQ 2026 ratings, EIA industrial prices):
- Sweden North (Lulea): $35 to 65. The game uses 50.
- ERCOT West (Texas): $42 to 80. ERCOT Central: $55 to 95. The game's Texas figure is 75 for the central band.
- PJM / Northern Virginia: report gives no band in the table. The game's US Southeast figure of 90 is an estimate.
- Saudi Arabia: $50 to 58. The game uses 54.
- Ireland: $130 to 180. Japan East: $135 to 190. Netherlands: $108 to 150. Great Britain: $118 to 168.
- EIA US industrial average, Jan to Jun 2026: 8.89 cents per kWh. Industrial averages are a benchmark, not a data center tariff.
- IEA: US wholesale prices forecast down about 10 percent y/y in H2 2026. EU up about 25 percent, Nordic H1 2026 up more than 130 percent.

Scenario switches (game mechanics, not forecasts):
- Export ban, AI slowdown, power crunch, fast roadmap. Each one is an illustrative what-if, not a prediction.

## Images (added 14 Nov 2026)

| File | Subject | License | Author |
| --- | --- | --- | --- |
| assets/anthropic.svg | Anthropic logo | Public domain (Wikimedia Commons) | Anthropic |
| assets/deepseek.svg | DeepSeek logo | MIT (Wikimedia Commons) | DeepSeek |
| assets/mistral.svg | Mistral AI logo | Public domain (Wikimedia Commons) | Mistral AI vector: Pantarch |
| assets/nvidia.svg | NVIDIA logo | Apache-2.0 (Wikimedia Commons metadata) | NVIDIA |
| assets/tpu_v4.png | Google TPU v4 | CC BY 4.0 | Jouppi, Kurian, Li, Ma, Nagarajan et al. |
| assets/tpu_v3.jpg | Google TPU v3 | CC BY-SA 4.0 | Zinskauf |

Logos are trademarks of their owners, shown only to identify the companies.
