# Vishaks website

A cinematic, 3D-led website prototype for **Vishaks**, a Chennai developer of residential plots, residential towers, commercial buildings and Grade A offices.

It is built with Next.js (App Router), React, TypeScript (strict), Three.js, React Three Fiber, Drei, GSAP with ScrollTrigger, and Tailwind CSS.

> **Important: what is real and what is not.**
> The four developments on the site (Kadal Residences, Marutham, Ambalam Offices and Sandhai) are **design concepts made for this prototype**. They are not real projects. Every image is a computer-generated render of a procedural 3D model, and every figure (storeys, floor areas, plot counts) is illustrative. The site says so wherever they appear. Replace them with approved project information before publishing. See [Content to replace](#content-to-replace).

---

## Contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Project structure](#project-structure)
4. [How the site is built](#how-the-site-is-built)
5. [The 3D scenes](#the-3d-scenes)
6. [Connecting the enquiry form](#connecting-the-enquiry-form)
7. [Deploying to Vercel](#deploying-to-vercel)
8. [Content to replace](#content-to-replace)
9. [Replacing the procedural models](#replacing-the-procedural-models)
10. [Regenerating the concept images](#regenerating-the-concept-images)
11. [Assets and licences](#assets-and-licences)
12. [Checks performed](#checks-performed)
13. [Known limitations](#known-limitations)

---

## Quick start

You need **Node.js 20.9 or newer** (Node 22 LTS recommended) and npm 10 or newer. Check with `node -v` and `npm -v`; install Node from <https://nodejs.org> if needed.

1. Extract the ZIP.
   - macOS: double-click `vishaks-site.zip`.
   - Windows: right-click the file, choose **Extract All…**, then **Extract**.
   - Linux or the terminal on any system: `unzip vishaks-site.zip`
2. Open a terminal in the extracted folder:
   ```bash
   cd vishaks-site
   ```
3. Install the exact dependency versions from the lockfile:
   ```bash
   npm ci
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open **<http://localhost:3000>** in your browser.

To run the optimised production build locally instead:

```bash
npm run build
npm run start
```

Then open <http://localhost:3000> again.

No environment variables are needed to run the site. `.env.example` lists the two optional ones.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload on port 3000 |
| `npm run build` | Production build (type-checks and prerenders every page) |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint (flat config, Next.js core web vitals and TypeScript rules) |
| `npm run typecheck` | Generates Next.js route types, then runs `tsc --noEmit` in strict mode |

## Project structure

```
app/
  layout.tsx                 Root HTML, fonts, metadata, skip link
  globals.css                Design tokens (Tailwind v4 @theme) and base styles
  fonts/                     Bundled WOFF2 fonts and their OFL licences
  (site)/                    Route group: every public page shares the header and footer
    layout.tsx
    page.tsx                 Home page
    projects/[slug]/page.tsx Project detail pages (statically generated)
    notices/page.tsx         Concept disclaimer, privacy placeholder, open-source credits
    not-found.tsx
  studio/[shot]/page.tsx     Development-only renderer for the concept images (404 in production)
  icon.svg, opengraph-image.jpg, sitemap.ts, robots.ts
components/
  layout/                    SiteHeader (sticky, mobile menu), SiteFooter
  sections/                  Hero, Introduction, Portfolio, ArchitecturalStory, Credibility, Enquiry, Gallery, TowerExplorer …
  ui/                        Logo, buttons and links, ConceptNote, MotionScope, ErrorBoundary
  three/                     HeroCanvas, TowerExplorerCanvas, Atmosphere (sky, sun, fog, reflections), scenes/
data/
  site.ts                    Company facts, navigation, contact placeholders
  projects.ts                The four concept developments (sample content)
lib/
  three/                     Procedural architecture: builders/, textures, materials kit, atmospheres, camera shots
  gsap.ts                    GSAP plugin registration
  capability.ts              Decides whether a device runs live 3D or the still image
  enquiry.ts                 Form validation and the optional submission endpoint
public/
  images/concepts/           The ten rendered concept images
  models/, textures/         Empty, with notes (all geometry and textures are procedural)
scripts/
  capture-stills.py          Re-renders the concept images from the studio route
```

The public pages live in a route group, `app/(site)`. The brackets do not appear in URLs. This lets the development-only studio route render without the site header and footer.

## How the site is built

**Design system.** All colours, type sizes and easing curves are tokens in `app/globals.css`:

- Colours are warm charcoal and ivory, with paper and stone neutrals and one bronze accent.
- Type is Bodoni Moda for display sizes only, Figtree for text and IBM Plex Mono for small metadata labels.
- The layout is a 12-column grid with deliberate offsets.

**Rendering.** Every section is a React Server Component, so the content arrives as HTML and is readable without JavaScript. Only interactive pieces are client components: the header, the hero stage, the development index, the gallery, the tower explorer and the enquiry form.

**Motion.** `components/ui/MotionScope.tsx` is the single place scroll animation is set up. Sections opt in with data attributes (`data-reveal="lines"`, `"fade"`, `"clip"`, `"stagger"`, and `data-parallax`).

- `useGSAP` reverts every tween and ScrollTrigger on unmount, so React Strict Mode cannot create duplicates.
- Everything is skipped under `prefers-reduced-motion`.
- No section is pinned and scrolling is never hijacked.
- Content is fully visible if animation fails to start.

**Accessibility.**

- Semantic landmarks and a skip link.
- Visible focus states.
- The mobile menu traps focus, closes on Escape and returns focus when it closes.
- The gallery viewer is a native `<dialog>`.
- The tower explorer has a full keyboard and screen-reader alternative: a floor list with up and down buttons.
- The form has labelled fields, inline errors, an error summary that receives focus, and `aria-invalid` and `aria-describedby` on each field.
- Every image has alt text.

## The 3D scenes

**What they are.** The architecture is procedural: buildings are assembled in code from boxes, planes, tubes and instanced meshes (`lib/three/builders/`). Materials use textures drawn at runtime on a canvas, and the reflections come from a lightformer environment, so no HDR file is downloaded. These are careful massing and material studies, **not photorealistic, professionally authored architectural models**, and the site labels them as concept visualisations. See [Replacing the procedural models](#replacing-the-procedural-models) to swap in real CGI.

**The hero.**

- The first paint is a pre-rendered still of the same scene (`public/images/concepts/kadal-hero.jpg`). The visitor sees architecture immediately and the page never waits for WebGL.
- Three.js and the scene load after the page is idle (`next/dynamic`, `ssr: false`). The live canvas fades in over the still from the identical camera position.
- The canvas renders **on demand**. It draws frames only while the camera is moving (a short intro dolly, scrolling, or the restrained pointer parallax) and stops completely once still.
- Scrolling lifts the camera up the tower toward the crown. The building never spins for show.
- `PerformanceMonitor` drops the pixel ratio on slow devices.
- The live scene is skipped in favour of the still in these cases:
  - WebGL is unavailable
  - the visitor prefers reduced motion
  - data saver is on
  - the device reports under 4 GB of memory
  - a small screen has four or fewer CPU cores
- A WebGL context loss or a render error also falls back to the still. An error boundary keeps it from breaking the page.

**The tower explorer** (Kadal Residences page) loads only when scrolled near. You can orbit within limits, with no auto-rotation, and pick a floor. Its sample floor data is labelled as such.

## Connecting the enquiry form

Without configuration, the form runs in **preview mode**: it validates everything, then says plainly that nothing was sent. It never pretends to send.

To make it send:

1. Create an endpoint that accepts a JSON `POST`. Options:
   - a [Formspree](https://formspree.io) form
   - your CRM's webhook
   - a Next.js Route Handler such as `app/api/enquiry/route.ts` that forwards to email or a CRM
2. Copy `.env.example` to `.env.local` and set:
   ```
   NEXT_PUBLIC_ENQUIRY_ENDPOINT=https://formspree.io/f/your-form-id
   ```
3. Restart `npm run dev`, or redeploy.

The form posts these fields: `type`, `name`, `email`, `phone`, `organisation`, `message`, `consent`, `source` and `sentAt`.

- Any 2xx response shows the success state.
- Anything else shows an error and keeps the visitor's text in the form.
- If you write your own route, validate the fields on the server as well and add spam protection (a honeypot field or a CAPTCHA).

## Deploying to Vercel

**Option A, from Git (recommended)**

1. Put the project in a GitHub, GitLab or Bitbucket repository. The included `.gitignore` already excludes `node_modules`, `.next` and env files.
2. In Vercel, choose **Add New… → Project** and import the repository.
3. Use the build settings Vercel detects. Override nothing:
   - Framework preset: **Next.js**
   - Install command: `npm ci` (auto-detected from `package-lock.json`)
   - Build command: `npm run build`
   - Output: handled by Vercel
   - Node.js version: 20.x or 22.x (Project Settings → General)
4. Optionally, under **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`: your live address, e.g. `https://www.vishaks.com`, used for canonical and social links
   - `NEXT_PUBLIC_ENQUIRY_ENDPOINT`: to switch the form on
5. Deploy. Every push to the main branch redeploys.

**Option B, from your computer**

```bash
npm i -g vercel
vercel        # first run links the project and creates a preview deployment
vercel --prod # production deployment
```

Image optimisation (AVIF and WebP) runs on Vercel automatically.

## Content to replace

Everything below is a placeholder or a concept, and it is all labelled on the site:

| What | Where |
| --- | --- |
| Company email, phone, office address, registered name | `data/site.ts` (`contact`, `legalName`) |
| Social profiles (hidden until added) | `data/site.ts` (`socials`) |
| Leadership, track record, delivered projects, partners | `components/sections/Credibility.tsx` (currently listed as "To be confirmed") |
| The four concept developments, their text, figures and images | `data/projects.ts`, `public/images/concepts/` |
| Hero caption and copy | `components/sections/Hero.tsx`, `components/sections/HeroStage.tsx` |
| Sample floor data in the tower explorer | `components/sections/TowerExplorer.tsx` |
| Privacy notice | `app/(site)/notices/page.tsx` (placeholder paragraph) |
| Target corridors and the schematic map | `data/site.ts`, `components/sections/Introduction.tsx` |
| Logo mark | `components/ui/Logo.tsx`, `app/icon.svg` (original artwork for this prototype; replace with the final identity) |

Before launch, also confirm the "where we stand" statement in `data/site.ts`, and that no project is shown before it has TNRERA registration.

## Replacing the procedural models

To use a professionally modelled building in the hero:

1. Export a `.glb` with Draco compression and save it as `public/models/kadal.glb`.
2. Create `components/three/scenes/KadalModel.tsx`:
   ```tsx
   "use client";
   import { useGLTF } from "@react-three/drei";
   export function KadalModel() {
     // Drei loads the Draco decoder from a CDN by default; pass a local path
     // (e.g. "/draco/") if you copy the decoder into public/draco.
     const { scene } = useGLTF("/models/kadal.glb", true);
     return <primitive object={scene} />;
   }
   useGLTF.preload("/models/kadal.glb");
   ```
3. In `components/three/HeroCanvas.tsx`, wrap it in `<Suspense fallback={null}>` and render it in place of, or alongside, `<KadalScene />`. The still image stays visible until the first frame renders, so a large model never blocks the page.
4. Re-render the hero still so the poster matches the new model (next section).

For photographic architecture images, replace the files in `public/images/concepts/` and update the captions and alt text in `data/projects.ts`. Static imports give width, height and blur placeholders automatically, so layouts will not shift.

## Regenerating the concept images

The images were rendered from the same procedural scenes by the development-only route `/studio/<shot>`. Camera set-ups live in `lib/three/shots.ts`.

```bash
npm run dev                                   # keep it running
pip install playwright && python -m playwright install chromium
python scripts/capture-stills.py              # all shots
python scripts/capture-stills.py kadal-hero   # one shot
```

The route returns 404 in production builds.

## Assets and licences

| Asset | Source | Licence |
| --- | --- | --- |
| Bodoni Moda, Figtree, IBM Plex Mono (WOFF2, Latin subset) | Copied from the `@fontsource` npm packages; originals by the Bodoni Moda Project Authors, the Figtree Project Authors and IBM | SIL Open Font License 1.1; full texts in `app/fonts/LICENSES/` |
| All 3D geometry, textures and concept images | Generated by this project's code | Owned by the project; no third-party content |
| Logo mark and favicon | Original artwork for this prototype | Owned by the project |
| Icons | `lucide-react` | ISC |
| Libraries | Next.js, React (MIT), Three.js (MIT), React Three Fiber and Drei (MIT), GSAP incl. ScrollTrigger and SplitText (GSAP standard licence, free for commercial use), Tailwind CSS (MIT) | As listed |

No photographs, stock images, HDR files or third-party models are included.

## Checks performed

These were actually run on this project before packaging, in a Linux container with Node 22:

- `npm ci` with the bundled lockfile
- `npm run lint`: no errors or warnings
- `npm run typecheck`: no errors
- `npm run build`: production build succeeded, with all pages statically generated
- `npm run start`, then a headless Chromium check (software WebGL, SwiftShader) at 1440×900 and 390×844 of these pages: home, Kadal Residences, Ambalam Offices, notices and a 404:
  - no horizontal overflow on any of them
  - no broken images, and every image has alt text
  - no console errors; the only warning is a `THREE.Clock` deprecation notice from inside React Three Fiber
  - at 1440×900, the live WebGL hero starts, replaces the still, and the camera rises as you scroll
  - at 390×844, the test machine fell back to the still under the low-power rule (small screen, four or fewer CPU cores), which is the intended behaviour
  - with reduced motion, every page shows the still and skips animation
  - the tower explorer loads, and clicking the model selects a floor
  - the enquiry form:
    - `?type=investor` preselects the topic
    - submitting it empty lists four errors
    - a valid submission shows the "nothing was sent" preview message

Not performed: Lighthouse or other performance scoring, testing on physical phones or GPUs, screen-reader testing, cross-browser testing beyond Chromium, and a real Vercel deployment.

## Known limitations

- **The procedural architecture is a concept-quality massing model.** It is not CGI from an architectural visualisation studio. For a competitive tender, the strongest upgrade is professionally modelled buildings and photography (see above).
- **npm's ESLint 9 deprecation notice.** npm reports ESLint 9 as deprecated because ESLint 10 exists. ESLint 9 is kept deliberately: `eslint-plugin-react`, which `eslint-config-next` depends on, does not yet declare support for ESLint 10.
- **Telemetry.** Next.js collects anonymous telemetry by default. Disable it with `npx next telemetry disable`.
- **Draco decoder.** If you add Draco-compressed models, Drei fetches the Draco decoder from a public CDN unless you host it locally.
