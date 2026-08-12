# @openmfp/webcomponents

Framework-agnostic web components bundle — use in any HTML page, vanilla JS project, or with any framework without any build step.

![Build Status](https://github.com/openmfp/webcomponents/actions/workflows/pipeline.yaml/badge.svg)

## ✨ Features

- **Framework-agnostic** - Works with any framework or plain HTML
- **No build step required** - Copy the file to your web root and load it with a `<script>` tag
- **Declarative UI** - Table, form, and dashboard driven by JSON schemas
- **Two bundles** - Full bundle or lightweight dashboard-only bundle
- **Custom Elements** - Standard Web Components API, no proprietary runtime

## 🚀 Getting Started

### Installation

```bash
npm install @openmfp/webcomponents
```

### Usage

This package ships pre-built, self-contained bundles — no build step needed. Copy the desired bundle file to your web root and load it with a `<script>` tag:

```html
<!-- All components -->
<script type="module" src="/assets/mfp-webcomponents.js"></script>

<!-- Dashboard only (lighter) -->
<script type="module" src="/assets/mfp-wc-dashboard.js"></script>
```

The script registers the custom elements globally. After it loads, use the tags anywhere in your HTML:

```html
<mfp-wc-declarative-table id="my-table"></mfp-wc-declarative-table>

<script type="module">
  document.getElementById('my-table').config = {/* JSON schema config */};
</script>
```

> If you are using Angular, use [`@openmfp/ngx`](https://www.npmjs.com/package/@openmfp/ngx) instead.

## Components

### `mfp-webcomponents.js` — full bundle

| Custom element                    | Description                                            | Documentation                                                                                                       |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `<mfp-wc-declarative-table>`      | Data table driven by a JSON schema                     | [docs/declarative-table.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-table.md)           |
| `<mfp-wc-declarative-form>`       | Form driven by a JSON schema                           | [docs/declarative-form.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-form.md)             |
| `<mfp-wc-declarative-table-card>` | Table with card wrapper and create/edit/delete dialogs | [docs/declarative-table-card.md](https://github.com/openmfp/webcomponents/blob/main/docs/declarative-table-card.md) |
| `<mfp-wc-visited-service-card>`   | Recently visited services card                         | —                                                                                                                   |

### `mfp-wc-dashboard.js` — dashboard-only bundle

| Custom element       | Description                    | Documentation                                                                             |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `<mfp-wc-dashboard>` | Drag-and-drop dashboard layout | [docs/dashboard.md](https://github.com/openmfp/webcomponents/blob/main/docs/dashboard.md) |

### Declarative Form API

`mfp-wc-declarative-form` exposes two extra methods:

```js
const form = document.querySelector('mfp-wc-declarative-form');
form.submit(); // triggers form submission
form.clear(); // resets all fields
```

### Declarative Table API

`mfp-wc-declarative-table-card` exposes dialog controls:

```js
const card = document.querySelector('mfp-wc-declarative-table-card');
card.closeCreateDialog();
card.closeEditDialog();
card.closeDeleteDialog();
```

## NeoNephos Foundation

This project is part of the [NeoNephos Foundation](https://neonephos.org), a Linux Foundation Europe initiative.

<p align="center"><img alt="Bundesministerium für Wirtschaft und Energie (BMWE)-EU funding logo" src="https://apeirora.eu/assets/img/BMWK-EU.png" width="400"/></p>
