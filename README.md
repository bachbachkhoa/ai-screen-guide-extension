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
2. Select an **AI Provider**: OpenAI / DeepSeek / Claude / Qwen
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
| **DeepSeek** | DOM text | deepseek-chat | Reads DOM instead of screenshot |

## Multi-step flow

When the AI detects a multi-page task, it returns a step plan. The extension:

- Highlights the relevant element on the current page
- Automatically detects page navigation and highlights the next step
- Shows a step badge ("AI Guide — Step 2 / 4") on the page
- Re-scan button appears if no element was found on the current step

## Troubleshooting

- **Can't capture screenshot**: reload the tab before scanning
- **AI can't find the element**: try a more descriptive prompt, or switch to a different provider
- **Step not advancing**: try rephrasing with more context, e.g. include the site name or feature name

## Extending

- `popup.js`: add a new provider to the `PROVIDERS` object
- `content.js`: `injectHighlightsForStep` — customize highlight color and animation
- `background.js`: navigation detection and step advancement logic
