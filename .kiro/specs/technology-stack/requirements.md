# Requirements Document

## Introduction

This document defines the technology stack constraints and standards for the TC-1 project. The project uses a client-side only architecture — HTML for structure, CSS for styling, and Vanilla JavaScript for interactivity. No backend server, build tools, or JavaScript frameworks are required. All code must run directly in a modern web browser without a compilation step.

## Glossary

- **Application**: The client-side web application governed by this technology stack.
- **Browser**: A modern web browser (Chrome, Firefox, Safari, Edge) that natively supports HTML5, CSS3, and ES6+ JavaScript.
- **Vanilla_JavaScript**: Plain JavaScript with no third-party frameworks or libraries (no React, Vue, Angular, jQuery, etc.).
- **DOM**: The Document Object Model — the browser's in-memory representation of the HTML document.
- **Module**: A JavaScript file loaded as an ES6 module using `<script type="module">`.
- **Build_Tool**: A program that transforms source files before delivery (e.g., Webpack, Vite, Parcel). Explicitly excluded from this stack.
- **Framework**: A JavaScript UI framework or library such as React, Vue, Angular, Svelte, or jQuery. Explicitly excluded from this stack.
- **MDN_Baseline_Widely_Available**: A web platform feature classified as "Baseline: Widely available" by the MDN Web Docs Baseline project, meaning it has been supported across all major browser engines for at least 30 months.
- **BCP_47**: IETF Best Current Practice 47, the standard for language tags (e.g., `en`, `en-US`, `id`, `id-ID`).

---

## Requirements

### Requirement 1: HTML Structure

**User Story:** As a developer, I want all page structure defined in HTML files, so that the content is semantic, accessible, and independent of JavaScript.

#### Acceptance Criteria

1. THE Application SHALL use HTML5 as the markup language for all page structure and content.
2. THE Application SHALL use semantic HTML5 elements (e.g., `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>`) to describe document structure, and no `<div>` or `<span>` element SHALL be used in place of a semantic equivalent for landmark regions (`banner`, `main`, `navigation`, `contentinfo`, `complementary`, `region`).
3. THE Application SHALL include a valid `<!DOCTYPE html>` declaration at the top of every HTML file.
4. WHEN a page is loaded with JavaScript disabled, THE Application SHALL still render the page headings, navigation links, and primary body text using HTML alone without JavaScript execution.
5. THE Application SHALL declare a `lang` attribute on every `<html>` element whose value is a valid BCP 47 language tag (e.g., `en`, `en-US`, `id`, `id-ID`).

---

### Requirement 2: CSS Styling

**User Story:** As a developer, I want all visual presentation defined in CSS files, so that styles are maintainable and cleanly separated from structure and behaviour.

#### Acceptance Criteria

1. THE Application SHALL use CSS3 for all visual styling and layout.
2. THE Application SHALL link stylesheets using `<link rel="stylesheet">` elements in the HTML `<head>`.
3. THE Application SHALL NOT use inline `style` attributes on HTML elements for any of the following presentational style properties: colour, spacing, typography, borders, layout, or visibility.
4. WHEN the viewport width is 320px, 768px, or 1024px, THE Application SHALL apply the appropriate responsive layout using CSS media queries.
5. JavaScript in the Application SHALL NOT set inline style properties on DOM elements; JavaScript MAY add or remove CSS classes on DOM elements to trigger style changes defined in CSS.

---

### Requirement 3: Vanilla JavaScript Behaviour

**User Story:** As a developer, I want all interactivity implemented in Vanilla JavaScript, so that the codebase remains framework-free and directly portable to any browser.

#### Acceptance Criteria

1. THE Application SHALL use only Vanilla JavaScript (ES6+) for all client-side behaviour and DOM manipulation.
2. THE Application SHALL NOT import or reference any JavaScript framework or UI library (including but not limited to React, Vue, Angular, Svelte, Preact, and jQuery).
3. THE Application SHALL NOT serve any build-tool-processed or bundled JavaScript files to the browser; all JavaScript files delivered to the browser SHALL be the original authored source files.
4. WHEN the Application's JavaScript logic is split across multiple files, THE Application SHALL use native ES6 `import`/`export` syntax with `<script type="module">` to link those files.
5. WHEN a DOM element must be manipulated, THE Application SHALL use native browser DOM APIs (e.g., `document.querySelector`, `addEventListener`, `classList`).

---

### Requirement 4: No Backend Server

**User Story:** As a developer, I want the application to run entirely in the browser without a server, so that it can be deployed as static files with zero server-side dependencies.

#### Acceptance Criteria

1. THE Application SHALL consist solely of static files (HTML, CSS, JavaScript, images, fonts) that can be served from any static file host or opened directly in a browser.
2. THE Application SHALL NOT require a backend server, server-side rendering engine, or server-side scripting language (e.g., Node.js, PHP, Python, Ruby) for any part of its operation.
3. WHEN the Application needs to store user data persistently, THE Application SHALL use browser-native storage mechanisms (e.g., `localStorage`, `sessionStorage`, `IndexedDB`); IF the storage mechanism is unavailable or a quota-exceeded error is raised, THEN THE Application SHALL catch the error and notify the user that data could not be saved.
4. IF the Application communicates with an external API and the API call fails (e.g., network error, non-2xx HTTP response, or timeout), THEN THE Application SHALL handle the failure gracefully and display a visible error message to the user.
5. WHEN the Application's files are served from a local filesystem path (via `file://` protocol or a simple static HTTP server), THE Application SHALL have all UI rendered, all client-side interactions operable, and all stored data accessible without requiring a remote server.

---

### Requirement 5: Browser Compatibility

**User Story:** As a developer, I want the application to run correctly in all modern browsers, so that users are not excluded by their choice of browser.

#### Acceptance Criteria

1. THE Application SHALL support the latest major release of Chrome, Firefox, Safari, and Edge at the time of each test cycle.
2. THE Application SHALL use only JavaScript APIs that are classified as MDN Baseline Widely Available across all four target browsers without a polyfill.
3. THE Application SHALL use only CSS features that are classified as MDN Baseline Widely Available across all four target browsers.
4. IF a browser API required by a feature is unavailable in a target browser, THEN THE Application SHALL hide or disable the affected feature and display a visible in-app notice informing the user that the feature is not supported in their browser.

---

### Requirement 6: Code Organisation

**User Story:** As a developer, I want a consistent file and folder structure, so that the codebase is easy to navigate and maintain.

#### Acceptance Criteria

1. THE Application SHALL organise HTML files at the project root or within named subdirectories that reflect their page or feature context.
2. THE Application SHALL store all CSS files in a dedicated `css/` or `styles/` directory.
3. THE Application SHALL store all JavaScript files in a dedicated `js/` or `scripts/` directory.
4. THE Application SHALL store static assets (images, fonts, icons) in dedicated asset directories (e.g., `assets/`, `images/`, `fonts/`).
5. WHEN a JavaScript file grows beyond a single logical concern, THE Application SHALL split it into separate files, each responsible for one concern, and link them using ES6 modules.
