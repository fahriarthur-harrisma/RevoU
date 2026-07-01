# Requirements Document

## Introduction

This document defines the requirements for the TC-3 Browser Compatibility feature, specifically covering the **dual deployment model**. The application must be distributable and functional in two distinct deployment contexts: as a standalone web app (served from a static host or the local filesystem) and as a browser extension (installed via the browser's extension system). Requirements for baseline cross-browser compatibility are defined in TC-1 (technology-stack); this document covers only the extension packaging, context detection, behaviour adaptation, and extension-specific APIs that are unique to the dual deployment model.

## Glossary

- **Application**: The client-side web application defined in TC-1.
- **Deployment_Context**: The runtime environment in which the Application is running — either `"web"` (standalone web app) or `"extension"` (browser extension).
- **Web_Deployment**: The Application served as static files from a static host or opened directly via the `file://` protocol.
- **Extension_Deployment**: The Application packaged and installed as a browser extension, running inside the browser extension system.
- **Context_Detector**: The JavaScript module responsible for detecting the current Deployment_Context at runtime.
- **Manifest**: The `manifest.json` file required by the browser extension APIs (Manifest V3) that declares the extension's metadata, permissions, and entry points.
- **Popup**: The HTML page rendered inside the extension's browser action popup when the user clicks the extension icon in the browser toolbar.
- **Options_Page**: An HTML page rendered inside the extension system that provides user-configurable settings.
- **Content_Script**: A JavaScript file declared in the Manifest that the browser injects into web pages matching declared URL patterns.
- **Background_Service_Worker**: The Manifest V3 service worker that runs in the extension's background context and handles extension lifecycle events.
- **Extension_Storage**: The `chrome.storage.local` (and `browser.storage.local` for Firefox) API provided by the browser extension system for persisting data within the extension context.
- **Web_Storage**: The `localStorage` API used in Web_Deployment as defined in TC-2.
- **Storage_Adapter**: A JavaScript module that provides a unified storage interface and delegates to either Extension_Storage or Web_Storage depending on the Deployment_Context.
- **Browser_Action**: The extension icon and associated popup registered in the Manifest under `action`.
- **Host_Permission**: A Manifest permission granting the extension access to web page content on declared URL patterns.
- **MV3**: Manifest Version 3 — the current extension manifest format supported by Chrome, Edge, Firefox (≥ 109), and Safari (≥ 15.4).
- **WebExtensions_API**: The cross-browser extension API surface shared by Chrome, Firefox, Edge, and Safari under the `chrome.*` / `browser.*` namespace.
- **Polyfill_Namespace**: The `browser` namespace polyfill (e.g., `webextension-polyfill`) that normalises the promise-based `browser.*` API across Chrome (`chrome.*`) and Firefox (`browser.*`).

---

## Requirements

### Requirement 1: Deployment Context Detection

**User Story:** As a developer, I want the application to detect at runtime whether it is running as a web app or a browser extension, so that context-specific behaviour can be activated without manual configuration.

#### Acceptance Criteria

1. THE Context_Detector SHALL expose an `getContext()` function that returns the string `"extension"` when the Application is running inside the browser extension system, and `"web"` otherwise.
2. WHEN `getContext()` is called and the `chrome.runtime` (or `browser.runtime`) object is defined and accessible without throwing, THE Context_Detector SHALL return `"extension"`.
3. WHEN `getContext()` is called and `chrome.runtime` (or `browser.runtime`) is undefined or throws a `ReferenceError`, THE Context_Detector SHALL return `"web"`.
4. THE Context_Detector SHALL NOT rely on URL pattern matching, `document.URL`, or `window.location` as the sole mechanism for context detection.
5. THE Application SHALL call `getContext()` once during initialization and cache the result; subsequent calls within the same page lifecycle SHALL use the cached value.

---

### Requirement 2: Extension Manifest (Manifest V3)

**User Story:** As a developer, I want a valid MV3 manifest file, so that the application can be installed and recognised as a browser extension by Chrome, Firefox, Edge, and Safari.

#### Acceptance Criteria

1. THE Manifest SHALL declare `"manifest_version": 3` as the top-level manifest version field.
2. THE Manifest SHALL declare the `name`, `version` (in `MAJOR.MINOR.PATCH` semver format), `description`, and `icons` fields.
3. THE Manifest SHALL declare a `"background"` field referencing the Background_Service_Worker script file using the `"service_worker"` key.
4. THE Manifest SHALL declare an `"action"` field referencing the Popup HTML file and a default icon.
5. THE Manifest SHALL declare only the minimum set of permissions required for the extension's operation; THE Manifest SHALL NOT request `"tabs"`, `"history"`, `"bookmarks"`, `"topSites"`, `"browsingData"`, or any other permission that is not directly required by a documented extension feature.
6. WHEN the extension is loaded as an unpacked extension in Chrome or Edge, the browser SHALL accept the Manifest without reporting any manifest validation errors.
7. WHEN the extension is loaded as a temporary add-on in Firefox, the browser SHALL accept the Manifest without reporting any manifest validation errors.

---

### Requirement 3: Extension Popup Entry Point

**User Story:** As a user, I want to open the application by clicking the extension icon in my browser toolbar, so that I can access the app without navigating to a separate URL.

#### Acceptance Criteria

1. THE Popup SHALL be an HTML file that renders the full Application UI within the extension popup window.
2. WHEN the user clicks the Browser_Action icon in the toolbar, THE Extension_Deployment SHALL open the Popup HTML file in the browser's extension popup container.
3. THE Popup SHALL be self-contained — all required CSS and JavaScript files SHALL be referenced by relative paths within the extension package; no file SHALL be loaded from an external CDN or remote URL.
4. WHEN the Popup is opened, THE Application SHALL complete its initialization (context detection, storage availability check, and initial render) within 2 seconds under normal browser conditions.
5. IF the Popup is closed and reopened by the user, THE Application SHALL restore the last persisted state from Extension_Storage on each reopening.

---

### Requirement 4: Extension Storage Adapter

**User Story:** As a developer, I want a unified storage interface that works in both deployment contexts, so that all application modules can persist data without knowing the deployment context.

#### Acceptance Criteria

1. THE Storage_Adapter SHALL expose the same `save(key, value)`, `load(key)`, `remove(key)`, and `clearAll()` interface as the Storage_Module defined in TC-2.
2. WHEN `getContext()` returns `"web"`, THE Storage_Adapter SHALL delegate all storage operations to the TC-2 Storage_Module using `localStorage`.
3. WHEN `getContext()` returns `"extension"`, THE Storage_Adapter SHALL delegate all storage operations to Extension_Storage (`chrome.storage.local` or `browser.storage.local`).
4. WHEN `getContext()` returns `"extension"` and a storage operation is performed, THE Storage_Adapter SHALL use the Polyfill_Namespace (`browser.*`) to ensure promise-based API compatibility across Chrome and Firefox.
5. IF an Extension_Storage operation fails (the returned Promise rejects), THEN THE Storage_Adapter SHALL return a rejected Promise containing a typed `StorageError` whose `message` property is a non-empty string indicating the extension storage failure.
6. THE Storage_Adapter SHALL apply the same key namespacing prefix defined in TC-2 regardless of Deployment_Context, so that data keys are consistent between deployment modes.
7. WHEN `load(key)` is called after `save(key, value)` in the same Deployment_Context, THE Storage_Adapter SHALL return a value that is deep-equal to `value`, including nested objects and arrays (round-trip property).
8. IF `getContext()` returns an unrecognised value (neither `"web"` nor `"extension"`), THEN THE Storage_Adapter SHALL throw a typed `StorageError` indicating an unknown deployment context.

---

### Requirement 5: Content Security Policy Compliance

**User Story:** As a developer, I want the application to comply with the browser extension Content Security Policy, so that the extension is not rejected by browser stores and is not vulnerable to script injection.

#### Acceptance Criteria

1. THE Extension_Deployment SHALL NOT use inline `<script>` blocks or inline event handler attributes (e.g., `onclick="..."`) in any HTML file included in the extension package.
2. THE Extension_Deployment SHALL NOT call `eval()`, `new Function()`, or any other dynamic code execution API in any JavaScript file included in the extension package.
3. THE Manifest SHALL declare an explicit `"content_security_policy"` field for the extension pages; the declared policy SHALL NOT include `'unsafe-inline'` or `'unsafe-eval'` in the `script-src` directive.
4. WHEN the extension is loaded in Chrome or Edge with extensions developer mode enabled, the browser console SHALL report zero Content Security Policy violations during the following user flows: open popup, save a value, load a value, and remove a value.
5. WHEN the extension is loaded in Firefox with developer tools open, the browser console SHALL report zero Content Security Policy violations during the following user flows: open popup, save a value, load a value, and remove a value.

---

### Requirement 6: Cross-Browser Extension Compatibility

**User Story:** As a developer, I want the extension to install and operate correctly in Chrome, Firefox, Edge, and Safari, so that users are not excluded by their choice of browser.

#### Acceptance Criteria

1. THE Extension_Deployment SHALL be installable and operational in the latest major release of Chrome, Firefox, Edge, and Safari at the time of each test cycle, where operational means: the extension installs without errors, the Popup opens, and all Storage_Adapter operations (save, load, remove, clearAll) complete without error.
2. IF a WebExtensions_API feature required by the Extension_Deployment is unavailable in a target browser, THEN THE Extension_Deployment SHALL either provide an alternative implementation using available APIs or display a visible notice to the user indicating the feature is unavailable; THE Extension_Deployment SHALL NOT produce an unhandled error when the unavailable feature is accessed.
3. THE Extension_Deployment SHALL access all WebExtensions_APIs through the Polyfill_Namespace (`browser.*`) so that promise-based API calls work consistently across Chrome and Firefox without browser-specific branching.
4. WHEN the Extension_Deployment is installed in Firefox, the Manifest SHALL include a `"browser_specific_settings"` block declaring a valid Firefox Add-on ID under the `"gecko"` key.
5. WHEN the Extension_Deployment is installed in Safari, the extension SHALL pass the Xcode Safari Web Extension converter validation with no error-level diagnostic messages reported in the converter output.

---

### Requirement 7: Behaviour Adaptation Between Deployment Contexts

**User Story:** As a developer, I want the application to adapt its behaviour to the active deployment context, so that context-specific affordances (e.g., toolbar icon, options page) are available in extension mode without disrupting the standalone web experience.

#### Acceptance Criteria

1. WHEN `getContext()` returns `"web"`, THE Application SHALL render its full page layout including the `<header>`, `<nav>`, and `<footer>` elements as defined in TC-1.
2. WHEN `getContext()` returns `"extension"`, THE Application SHALL render a layout optimised for the Popup viewport (minimum 300px wide, maximum 600px wide, minimum 200px tall, maximum 600px tall); WHEN content exceeds the maximum height, THE Popup SHALL enable overflow scrolling; THE Application MAY hide persistent navigation or footer elements that are redundant in the popup context.
3. WHEN `getContext()` returns `"extension"`, THE Application SHALL NOT attempt to access `localStorage` directly; all storage operations SHALL be routed through the Storage_Adapter.
4. WHEN `getContext()` returns `"web"`, THE Application SHALL NOT reference or call any `chrome.*` or `browser.*` WebExtensions_API; all extension-specific code paths SHALL be guarded by a check of `getContext()`.
5. THE Application SHALL produce the same persisted data, retrieved data, and displayed state for all user-initiated actions (create, read, update, delete) regardless of Deployment_Context, given equivalent input and stored state.
6. IF `getContext()` returns an unrecognised value, THEN THE Application SHALL treat the Deployment_Context as `"web"` and log a warning message to the browser console.

---

### Requirement 8: Extension Package Integrity

**User Story:** As a developer, I want the extension package to be complete and self-contained, so that it functions correctly after installation without network access.

#### Acceptance Criteria

1. THE Extension_Deployment package SHALL include all HTML, CSS, JavaScript, icon, and asset files required for create, read, update, and delete operations within the package; no file SHALL be fetched from a remote URL at runtime.
2. THE Manifest SHALL declare all icons at sizes 16×16, 48×48, and 128×128 pixels; each declared icon file SHALL exist within the extension package; and each icon file's actual pixel dimensions SHALL match the size declared for it in the Manifest.
3. WHEN the browser installs the extension and the device has no active network connection, THE Application SHALL render its full UI and perform all storage operations without network errors.
4. IF the Application requires any third-party JavaScript file (e.g., the Polyfill_Namespace library), THEN THE Extension_Deployment SHALL bundle that file within the extension package rather than loading it from a CDN.

---

### Requirement 9: Options Page (Extension Context Only)

**User Story:** As a user, I want to access extension-specific settings from the browser's extension management page, so that I can configure the extension without opening the popup.

#### Acceptance Criteria

1. WHERE the Application is deployed as an Extension_Deployment, THE Manifest SHALL declare an `"options_page"` or `"options_ui"` field referencing an Options_Page HTML file.
2. WHEN the user opens the Options_Page from the browser's extension management interface, THE Application SHALL render a settings form in which all form controls are keyboard-operable and each input element has an associated `<label>` element.
3. WHEN the user saves settings on the Options_Page, THE Storage_Adapter SHALL persist the settings using Extension_Storage, and THE Popup SHALL reflect the updated settings on its next open.
4. WHEN `getContext()` returns `"web"`, THE Application SHALL NOT render or reference the Options_Page entry point; any settings UI SHALL be embedded within the main application page.
5. IF saving settings on the Options_Page fails (the Storage_Adapter throws a StorageError), THEN THE Application SHALL display a visible error message on the Options_Page and SHALL NOT silently discard the failure.

---

### Requirement 10: Background Service Worker Lifecycle

**User Story:** As a developer, I want the Background_Service_Worker to handle extension lifecycle events correctly, so that the extension behaves predictably across browser restarts and updates.

#### Acceptance Criteria

1. THE Background_Service_Worker SHALL listen for the `chrome.runtime.onInstalled` event and, WHEN the event fires with `reason === "install"`, SHALL initialize any required default Extension_Storage values.
2. WHEN the browser terminates and restarts the Background_Service_Worker (as per MV3 service worker lifecycle), every key-value pair written to Extension_Storage before termination SHALL be retrievable after restart.
3. THE Background_Service_Worker SHALL NOT declare module-level variables that hold application state; all persistent state SHALL be stored in Extension_Storage.
4. IF the Background_Service_Worker receives a message via `chrome.runtime.onMessage` that it does not recognise, THEN THE Background_Service_Worker SHALL ignore the message and SHALL NOT throw an unhandled exception.
5. IF reading from Extension_Storage during startup fails (the promise rejects), THEN THE Background_Service_Worker SHALL catch the error, log it to the browser console, and proceed with empty default state rather than throwing an unhandled exception.
