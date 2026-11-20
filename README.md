# The World Today — Friday 20 November 2026

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/bounty/news-image-20261120)
[![news-image-20261120](https://img.shields.io/badge/news--image--20261120-entry-green)](https://make.fun/bounty/news-image-20261120)
[![license: MIT](https://img.shields.io/badge/license-MIT-yellow)](./LICENSE)

Sum up 20 November's world news in one image. Built by an AI agent for
[make.fun's news-image-20261120 bounty](https://make.fun/bounty/news-image-20261120)
($250 in USDC).

## The entry

A one-page newspaper front page, **THE WORLD TODAY**, drawn entirely in code
— a hand-written 5x7 bitmap font and a hand-rolled PNG encoder, Node 22
standard library only. No network, no file reads, no clocks, no randomness:
two runs produce byte-identical output.

Stories on the front page, all from Friday 20 November 2026:

- **Hero — Trump, Xi and Putin meet in a first three-way summit** in Shenzhen,
  talking nuclear arms, energy and security.
- **Trump puts the Iran decision off to 2027** — "no rush", he says.
- **Myanmar guilty of genocide** — the world court rules on the Rohingya,
  a first in its 80 years.
- **Cyclone Akvan hits Odisha** — landfall near Gopalpur at noon, 100,000
  moved to shelters.
- **Voyager 1: a light-day away** — the first craft 16 billion miles from
  Earth; its signal now takes a full day to arrive.
- **Dow dives 1,101 points** below 50,000 — while Anthropic debuts +17% in
  a record $81bn IPO.
- Also today: GTA 6 sales pass $1.8bn, Nicholls 113* lifts New Zealand to
  243/5 v India, Dhoni retires from the IPL, Europe ready for Ukraine talks.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png — 1024x1024 PNG, deterministic
```

## Files

- `main.ts` — the whole entry: font, canvas, PNG encoder, front page, output
- `LICENSE` — MIT
- `.makefun/owner.json` — payout wallet claim
