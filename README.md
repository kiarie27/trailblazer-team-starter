# Trailblazer team starter

This is your team's starting repository for Trailblazer: AI Product Studio. Your team builds one product here over ten days.

## What is here

| Folder or file | What it is | When you use it |
|---|---|---|
| `index.html`, `style.css`, `app.js` | Your product's interface. It starts as a skeleton that shows three sample items. | From Day 3 |
| `src/service.js` | Your service module (runs in the browser for now). It fetches and checks data for the interface. | Days 3 and 4 |
| `src/prepared-answers.js` | Finds a checked answer to a user's question. Only for products with an AI feature. | Day 5 |
| `data/` | Sample data made up for this course, a saved forecast, and the data for every challenge in `data/challenges/`. `data/README.md` says where each file came from. | From Day 3 |
| `practice/` | The Town forecast practice card and the locked box. | Days 3 and 4 |
| `test/` | Automatic tests. They run every time you open a pull request. | From Day 3 |
| `docs/` | Templates: README and case study, data map, architecture sketch and risk register. | From Day 1 |
| `scripts/` | The privacy check your team runs before the repository goes public. | Days 7 and 8 |
| `.devcontainer/`, `.github/` | Settings for your codespace and for the checks. Please do not change them. | Never |

Your challenge's data is already in `data/challenges/`, so your team copies nothing.

## Open it in a codespace

1. Open your team's repository on GitHub.
2. Press the green **Code** button, choose the **Codespaces** tab and press **Create codespace on main**.
3. Wait a minute or two while it sets up.

When it is ready, a preview of your product opens in a panel. If you close it, open the **Ports** tab and press the globe icon next to port 3000.

To reach the practice card, use the "Town forecast card" link at the bottom of the preview.

The preview starts with the command `npm start`. If it stops working, type `npm start` in the terminal to start it again.

The guide with pictures is in Canvas: "Set up your codespace and team repository".

## Run the tests

In the terminal at the bottom of the screen, type:

```
npm test
```

Every test should pass. One line is marked `# TODO`. That is the test you write on Day 4.

## Check the history before going public

On Days 7 and 8 your team checks everything the repository has ever held. In the terminal, type:

```
npm run privacy-check
```

It reads every branch, every pull request and every commit. It lists every author, every commit message, and every added line that could hold a secret or personal details, even a line that was deleted later. To search for your own surname and school as well, add them after the command:

```
npm run privacy-check Surname "School name"
```

It only reports. Your team reads the report and decides, with your TM.

## Rules for this repository

- No real names, phone numbers, school names or photos of anyone.
- No API keys, passwords or tokens, ever. Anything you commit stays in the history, even after you delete it.
- Nothing that collects data from visitors: no forms that send data out, no analytics, no embeds.
- Label made-up data "made up for this course", as the sample files do.
- If your product has an AI feature, it shows answers your team wrote in Claude and checked. Say so on screen: "Answers written by an AI model (Claude) and checked by our team".

On Day 9 you replace this README with your own. Start from `docs/README.md`.

Weather data on the practice card by [Open-Meteo.com](https://open-meteo.com/).
