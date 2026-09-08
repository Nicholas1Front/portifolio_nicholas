# Portfolio Nicholas

Personal portfolio website for **Nicholas de Oliveira Eugênio**, built to present featured projects, technical stack, professional journey, and contact links.

> Status: In development

## Goals

- Create a fast, responsive, and accessible portfolio website.
- Showcase repositories pinned on GitHub as featured projects.
- Load remaining public repositories automatically.
- Publish the website through GitHub Pages.
- Keep the project lightweight, using HTML, CSS, and JavaScript.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- GitHub REST API
- GitHub GraphQL API
- GitHub Actions
- GitHub Pages

## Features

- Mobile-first responsive layout.
- Dark professional visual identity.
- Featured projects synchronized with GitHub pinned repositories.
- Automatic public repository listing.
- Project loading and error fallback states.
- SEO metadata, Open Graph tags, sitemap, and robots.txt.
- Keyboard navigation and accessibility support.
- Reduced-motion support.
- Social links for GitHub, LinkedIn, and Instagram.

## Project Structure

```text
portifolio_nicholas/
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── data/
│   │   └── pinned-projects.json
│   ├── scripts/
│   │   ├── github-projects.js
│   │   └── main.js
│   ├── styles/
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── responsive.css
│   │   └── variables.css
│   └── index.html
├── .github/
│   └── workflows/
│       └── sync-pinned-projects.yml
├── robots.txt
├── sitemap.xml
└── README.md
```
