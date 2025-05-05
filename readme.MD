# Shared Header Implementation Guide

This guide explains how to add the centrally managed, dynamic site header to static HTML pages or legacy applications within the Envoys Realm ecosystem.

## Overview

The shared header provides consistent branding, navigation, user status (login/logout), and actions across different sites. It works by:

1.  Fetching configuration data from a central API endpoint (`/api/header-data`) hosted by the `cloudflare-worker-bff`.
2.  Using a shared JavaScript file (`render-header.js`) to build the header's HTML structure based on the received data.
3.  Using a shared CSS file (`shared-header.css`) to style the generated header elements.

## Prerequisites

1.  **Central API:** The `cloudflare-worker-bff` Worker must be deployed and the `/api/header-data` endpoint must be accessible via its public URL.
2.  **Shared Assets Hosting:** The `render-header.js` script and the `shared-header.css` stylesheet must be hosted in a central, publicly accessible location (e.g., Cloudflare R2, GitHub Pages, main hub's assets folder). You need the absolute URLs for these two files.
3.  **Target Page:** The HTML page where you want to add the header.

## Implementation Steps

Follow these steps for each static HTML page or legacy application template where you want the shared header:

1.  **Add HTML Placeholder:**
    Insert an empty `<div>` element where you want the header to appear, typically near the top of the `<body>`. Give it the specific ID `shared-header-placeholder`.

    ```html
    <body>
        <div id="shared-header-placeholder">
            <div style="padding: 1rem; text-align: center; background-color:#1a1120; color:#e0e0e0;">Loading Header...</div>
        </div>

        <main>
            <h1>Page Title</h1>
            </main>

        </body>
    ```

2.  **Link Shared CSS:**
    In the `<head>` section of your HTML file, add a `<link>` tag pointing to the centrally hosted `shared-header.css` file. Replace the placeholder URL with the actual URL.

    ```html
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Page Title</title>

        <link rel="stylesheet" href="[https://your-central-host.com/path/to/shared-header.css](https://your-central-host.com/path/to/shared-header.css)">

        <link rel="stylesheet" href="css/your-page-styles.css">
    </head>
    ```

3.  **Include Shared JavaScript:**
    At the **end** of your `<body>` section (after the main content and the placeholder div), add a `<script>` tag pointing to the centrally hosted `render-header.js` file. Use the `defer` attribute to ensure it runs after the HTML is parsed. Replace the placeholder URL with the actual URL.

    ```html
    <body>
        <div id="shared-header-placeholder">...</div>
        <main>...</main>

        <script src="[https://your-central-host.com/path/to/render-header.js](https://your-central-host.com/path/to/render-header.js)" defer></script>

        <script src="js/your-page-script.js" defer></script>
    </body>
    ```

## How it Works

- When the page loads, the browser fetches the `shared-header.css` file, making the header styles available.
- After the HTML is parsed, the deferred `render-header.js` script executes.
- The script finds the `#shared-header-placeholder` div.
- It makes an asynchronous `fetch` request to the `HEADER_API_URL` defined within the script (ensure this points to your deployed BFF Worker's `/api/header-data` endpoint).
- The BFF API validates the user's session (via cookies) and returns the header configuration (branding, navigation, user status, actions, theme hint) as JSON.
- The script receives the JSON data.
- It dynamically builds the HTML elements for the header using the received data and predefined CSS class names.
- It injects the generated HTML into the `#shared-header-placeholder` div, replacing the loading message.
- It sets up event listeners for theme toggling and dropdown menus.
- It applies the initial theme ('light' or 'dark') to the `<html>` element based on `localStorage`, the API hint, or system preference.

## Important Considerations

- **CORS:** The Cloudflare Worker BFF (`/api/header-data` endpoint) **must** be configured with appropriate CORS headers (`Access-Control-Allow-Origin`) to allow requests from the domains where your static sites are hosted. In the current API code, it's set to `*` for local testing, but this needs to be restricted to your actual domains in production.
- **API URL:** Ensure the `HEADER_API_URL` constant inside the `render-header.js` script points to the correct URL of your deployed BFF Worker.
- **Asset URLs:** Ensure the `WORKER_BASE_URL` constant inside `render-header.js` is set correctly for the random button link. Also ensure the `logoUrl` provided by the API and any icon URLs are accessible from the user's browser.
- **CSS Conflicts:** Be mindful of potential conflicts between `shared-header.css` and your page-specific CSS. Use specific selectors or adjust styles as needed.
- **JavaScript Conflicts:** Ensure the shared script doesn't conflict with other JavaScript running on the page (e.g., variable names). The current script uses basic functions and avoids polluting the global scope excessively.
