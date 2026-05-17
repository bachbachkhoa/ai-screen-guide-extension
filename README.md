# AI Screen Guide — Chrome Extension

> Scan the screen → AI reads it → highlights the button to click

## Install (Load unpacked)

1. Unzip this folder
2. Open Chrome → go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select this folder
5. The extension appears in the toolbar

## Usage

1. Click the extension icon in the toolbar
2. Select an **AI Provider**: OpenAI / Claude / Qwen
3. Paste your **API key** (stored locally, never sent anywhere except the chosen provider)
4. Type your question, e.g. *"I want to create a new VM on GCP. What should I click?"*
5. Click **Scan & Analyze**
6. The extension captures a screenshot → sends it to the AI → **draws red boxes** around the elements to click

## Provider support

| Provider | Input | Default model | Notes |
|---|---|---|---|
| **OpenAI** | Screenshot | gpt-4o | |
| **Claude** | Screenshot | claude-sonnet-4-6 | |
| **Qwen** | Screenshot | qwen-vl-max | |

## Multi-step tasks

When the task spans multiple pages, the AI returns a step-by-step text plan you can read in the result box, and highlights the elements to click **on the current page**. Navigate to the next page and click **Scan & Analyze** again to get highlights for that page.

## Region selection

Click **Add screen region** to drag-select specific areas of the page. Up to 5 regions can be selected — they are stitched into one image and sent to the AI instead of a full-page screenshot. Useful for focusing the AI on a specific part of a complex UI.

## Troubleshooting

- **Can't capture screenshot**: reload the tab before scanning
- **AI can't find the element**: try a more descriptive prompt, or switch to a different provider

## Extending

- `popup.js`: add a new provider to the `PROVIDERS` object
- `content.js`: `injectHighlightsForStep` — customize highlight color and animation

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](LICENSE)
