# Vishaks website

A cinematic, 3D-led website prototype for **Vishaks**, a Chennai developer of residential plots, residential towers, commercial buildings and Grade A offices.

It is built with Next.js (App Router), React, TypeScript (strict), Three.js, React Three Fiber, Drei, React Postprocessing, GSAP with ScrollTrigger, Lenis and Tailwind CSS.

> **Important: what is real and what is not.**
> The four developments on the site (Office Spaces, Residential Spaces, Coworking Spaces and Retail Spaces, matching the four categories on the corridor map) are **design concepts made for this prototype**. They are not real projects. Every image is a computer-generated render of a procedural 3D model, and every figure (storeys, floor areas, frontages) is illustrative. The site says so wherever they appear. Replace them with approved project information before publishing. See [Content to replace](#content-to-replace).

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

**Loading screen (`components/ui/SiteLoader.tsx`, `lib/loading.ts`).** On the first page a visitor lands on, a full-screen loader shows a percentage counter and a progress bar. Both track real events, never a timer:

| Task | Weight | Complete when |
|---|---|---|
| Typefaces | 1 | `document.fonts.ready` resolves |
| Page | 1 | the window `load` event fires |
| Imagery | 2 | every image in the first screen has loaded (reported image by image) |
| 3D engine | 2 | the hero's Three.js code chunk has downloaded (home page, 3D devices only) |
| City lighting | 2 | the hero's HDRI has loaded and been processed |
| Building the district | 3 | the hero has built its scene and rendered its first frames |

- The counter eases toward the real figure but never runs ahead of it. The status line names the task still pending.
- The loader is part of the server-rendered HTML, so there is no blank first paint. Scrolling is locked while it is up.
- When everything reports ready, it holds at 100% for a moment, then lifts away as the hero headline animates in.
- If a resource never answers (a dropped connection or a stalled GPU), the site is revealed after 20 seconds rather than being held forever. Without JavaScript, the loader is hidden.
- Scenes further down the page (the vision tower, the corridor map, the district sequence and the project models) are not loaded upfront. They load as you approach them, with their still image showing until they are ready, so the first wait stays short.
- Measured here in a software renderer, the loader cleared in about 4 seconds on phone width and on project pages. With live 3D on the home page it took about 60 seconds, because the software GPU compiles shaders very slowly. Real hardware should be far faster, but this is unmeasured.

**The hero: a living corporate district.** The hero is Vishaks Central by day, a concept business district (`components/three/scenes/CbdScene.tsx`):

- Six glass towers around a granite plaza, a background skyline of twelve more glass towers, and a far city. There is no planting: the plaza has paving bands, benches, bollards, a reflecting pool and zebra crossings.
- About 120 vehicles (cars and buses) drive the ring roads both ways, with head and tail lights that brighten at dusk and night.
- About 340 people walk the pavements and promenades. They are deliberately stylised figures: at hero distance they read as people, and a code-built "realistic" human would look uncanny.
- The first paint is a pre-rendered still from the same camera (`public/images/concepts/cbd-hero.jpg`, shot `cbd-hero`). The live scene loads after the page is idle and fades in over it.
- Six features (Vishaks Central, Harbour House, The Exchange, Meridian, Pavilion and the plaza) are markers in the scene and buttons in the control rail. Choosing one flies the camera to it and opens a card. The arrow keys step through them, and Escape or scrolling returns to the overview. They are defined in `lib/three/heroFeatures.ts`.
- **Day, dusk and night.** A toggle switches the lighting. Day is the default.
- **On phones** the towers are lifted into the top of the frame, and the headline sits on a deep charcoal fade below them. The kicker becomes a frosted pill, and the heading, text and buttons are sized for small screens.
- **Drag to look around** with a mouse, and pointer parallax. Scrolling lifts the camera into an aerial view.
- The scene animates continuously while the hero is on screen, and stops completely once it scrolls away.
- The same fallbacks as before apply: no WebGL, reduced motion, data saver, low memory, or a small screen with four or fewer cores all get the still, and a render error falls back to the still.

**Project models.** Office Spaces, Coworking Spaces and Retail Spaces each have a "Walk around" section with the orbitable concept model (`components/sections/ModelViewer.tsx`): a slow turntable that stops when you take control, zoom, a reset button, and day, golden-hour, dusk and night lighting. Camera set-ups are in `lib/three/modelViews.ts`. It loads only when scrolled near, and without 3D it shows the project cover image.

**The tower explorer** (Residential Spaces page) loads only when scrolled near. You can orbit within limits, with no auto-rotation, and pick a floor. Its sample floor data is labelled as such.

## The skyline sequence and other scroll experiences

**Pinned skyline (home page, after the introduction).** "Vishaks Central" is a concept business district of six glass towers around a landscaped plaza (`lib/three/builders/district.ts`):

- The section pins for about four screen heights while scrolling moves the camera along a spline through four chapters: golden hour, dusk, the crown and night (`components/three/SkylineCanvas.tsx`).
- As you scroll, the sky, sun angle, fog, reflections and window glow blend continuously from golden hour to night.
- The towers rise out of the ground in sequence as the section arrives.
- Traffic light trails move along the ring roads, and aviation beacons blink.
- **Hovering** a tower lights it and shows its name. **Clicking** a tower, or its button, flies the camera to it and opens a card. Escape, the close button or the next chapter returns you to the path.
- On weaker devices the scene drops ambient occlusion and renders at a lower resolution. Without WebGL, or with reduced motion, the section becomes an editorial sequence of the four rendered stills.

**"Our vision": a tower that builds itself (`components/sections/VisionModel.tsx`, `components/three/VisionCanvas.tsx`).** The model stays in view (sticky on desktop) while the three principles scroll beside it, and each principle lights up as the model reaches its stage:

1. **Land first.** The plot is surveyed: a glowing dashed boundary and survey pegs appear on an empty site.
2. **Climate before style.** A sun path arcs over the site, then the tower rises floor by floor inside a bronze line drawing of its full massing. A glowing slab marks the floor being built, a tower crane climbs and slews beside it, and a counter shows the level reached.
3. **Built in the open.** The crane is taken down, trees and palms grow in, and the lantern crown lights.

Dragging turns the model. It is lit with a clean `daylight` preset (`lib/three/atmosphere.ts`). The tower is a generic concept study, not a launched project, and the caption says so. Without live 3D, the section shows the Residential Spaces facade still as before.

**"Where we build": four kinds of space on four corridors (`components/sections/CorridorModel.tsx`, `components/three/CorridorCanvas.tsx`).** A dark, night-lit 3D map of the city built from the corridor schematic's coordinates (`lib/three/corridors.ts`). Each corridor's target zone carries an architectural model of the kind of space it is earmarked for (`lib/three/builders/mapModels.ts`):

| Zone | Kind of space | Model |
|---|---|---|
| OMR | Office Spaces | a business park of three glass towers: a chamfered tower with lantern and spire, a faceted oval and a slab |
| GST Road | Residential Spaces | three residential towers with staggered balconies, fins and sky gardens |
| Outer Ring Road | Retail Spaces | a shopping centre with a glass atrium and lantern, bronze entrance canopies and lit shopfronts |
| Sriperumbudur | Coworking Spaces | a terraced low-rise workspace campus with bronze sunshades, a glass meeting pavilion and lit roof terraces |

**These assignments are a first proposal to confirm with the company.** Change a category's `corridor` in `CATEGORIES` to move it. Coworking is not yet one of the company's stated verticals.

- As the map scrolls in, the camera tilts from plan to model, the city rises, the corridors draw outward with light pulses and traffic, and each zone lights up as its model rises out of the ground.
- Every zone is discoverable by hovering, clicking or tapping its model, its floating label, or its row in the list. The selected zone lifts and brightens, and the others dim. The camera flies in and orbits the model slowly, while a card shows the kind of space, the corridor, what would be built, a concept visualisation, and previous and next buttons. Escape or the close button returns to the overview.
- Labels sit above each model, use the site's display and mono type, and are sized down on phones. The label of the selected zone hides, since the card names it.
- Captions keep the honesty notes: "Illustrative model, not to scale. Zones are areas of interest, not acquired land."
- **Without live 3D** (low-power phones, reduced motion, no WebGL, or a lost WebGL context), the section shows the interactive schematic instead. Its four zones are tappable and keyboard-operable, and they open the same detail card. The schematic is also the accessible description of the map.

**Development process (company section).** On wide screens, "How a project moves" pins and scrolling runs a bronze line through five stages: select, secure, approve, build, and sell or lease. Each stage draws its own line illustration, and the stage names can be clicked. On phones it is a vertical sequence whose drawings draw in as they arrive (`components/sections/ProcessJourney.tsx`).

**Shared polish.** The header has a frosted glass bar with a scroll-progress hairline. The footer opens with a closing statement and calls to action. The notices page and 404 page carry concept imagery.

**Horizontal project reel.** In "Signature developments", the section pins on wide screens and vertical scrolling slides the four concept cards sideways (`components/sections/ProjectReel.tsx`). Each card tilts toward the cursor, with its image moving on a deeper layer and a soft glare following the pointer (`components/ui/TiltCard.tsx`). On phones it becomes a native swipe row.

**Elsewhere:**

- Lenis provides inertial smooth scrolling for mouse wheels and trackpads, kept in sync with ScrollTrigger. Touch scrolling stays native (`components/ui/SmoothScroll.tsx`).
- A cursor ring grows over links and shows "View" over project cards and "Explore" over 3D scenes. The system cursor stays visible (`components/ui/Cursor.tsx`).
- The dark sections open from an inset rounded panel to full bleed as they arrive (`data-reveal="curtain"`).
- Headings rise line by line, images open from a band, and photographs drift in parallax (`components/ui/MotionScope.tsx`).

**Rendering pipeline.**

- Every live scene and every concept image passes through the same finish (`components/three/Finish.tsx`): a sanitising pass that removes any NaN or infinite pixel and clamps extreme highlights, then N8AO ambient occlusion, bloom on lit windows, ACES filmic tone mapping, SMAA, a vignette and fine grain. Without the sanitising pass, one bad pixel would be spread by the bloom across the whole frame and turn it black (this happened in the corridor map's coworking close-up). Daylight scenes raise the bloom threshold, so only real light sources glow and sunlit walls do not haze over.
- Reflections come from CC0 Poly Haven HDRIs bundled in `public/hdri/`.
- Curtain walls use per-panel normal and roughness maps, so reflections break up panel by panel as they do on real glass.
- Mullions, transoms, set-back ledges, lobby piers, lantern fins and spires are real geometry.

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

## The four categories

The four concept developments, and the four zones on the corridor map, are the same four categories: **Office Spaces** (OMR), **Residential Spaces** (GST Road), **Coworking Spaces** (Sriperumbudur and Oragadam) and **Retail Spaces** (Outer Ring Road West). Their pages are `/projects/office-spaces`, `/projects/residential-spaces`, `/projects/coworking-spaces` and `/projects/retail-spaces`. Content lives in `data/projects.ts` and `lib/three/corridors.ts`. The models are `lib/three/builders/office.ts`, `residential.ts`, `coworking.ts` and `retail.ts`, with miniature versions for the map in `mapModels.ts`. The Coworking campus replaces the earlier plotted community, so plotted land no longer appears as a concept, although "residential plots" remains in the company's own list of what it builds (`data/site.ts`).

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

1. Export a `.glb` with Draco compression and save it as `public/models/residential.glb`.
2. Create `components/three/scenes/ResidentialModel.tsx`:
   ```tsx
   "use client";
   import { useGLTF } from "@react-three/drei";
   export function ResidentialModel() {
     // Drei loads the Draco decoder from a CDN by default; pass a local path
     // (e.g. "/draco/") if you copy the decoder into public/draco.
     const { scene } = useGLTF("/models/residential.glb", true);
     return <primitive object={scene} />;
   }
   useGLTF.preload("/models/residential.glb");
   ```
3. In `components/three/HeroCanvas.tsx`, wrap it in `<Suspense fallback={null}>` and render it in place of, or alongside, `<ResidentialScene />`. The still image stays visible until the first frame renders, so a large model never blocks the page.
4. Re-render the hero still so the poster matches the new model (next section).

For photographic architecture images, replace the files in `public/images/concepts/` and update the captions and alt text in `data/projects.ts`. Static imports give width, height and blur placeholders automatically, so layouts will not shift.

## Regenerating the concept images

The images were rendered from the same procedural scenes by the development-only route `/studio/<shot>`. Camera set-ups live in `lib/three/shots.ts`.

```bash
npm run dev                                   # keep it running
pip install playwright && python -m playwright install chromium
python scripts/capture-stills.py              # all shots
python scripts/capture-stills.py residential-hero   # one shot
```

The route returns 404 in production builds.

## Assets and licences

| Asset | Source | Licence |
| --- | --- | --- |
| Bodoni Moda, Figtree, IBM Plex Mono (WOFF2, Latin subset) | Copied from the `@fontsource` npm packages; originals by the Bodoni Moda Project Authors, the Figtree Project Authors and IBM | SIL Open Font License 1.1; full texts in `app/fonts/LICENSES/` |
| HDRI environment maps (`public/hdri/`): Venice Sunset, Potsdamer Platz, Dikhololo Night, 1K | Poly Haven (polyhaven.com), via the pmndrs/drei-assets repository | CC0 (public domain) |
| All 3D geometry, procedural textures and concept images | Generated by this project's code | Owned by the project; no third-party content |
| Logo mark and favicon | Original artwork for this prototype | Owned by the project |
| Icons | `lucide-react` | ISC |
| Libraries | Next.js, React (MIT), Three.js (MIT), React Three Fiber, Drei and React Postprocessing (MIT), postprocessing and N8AO (Zlib and CC0), Lenis (MIT), GSAP incl. ScrollTrigger and SplitText (GSAP standard licence, free for commercial use), Tailwind CSS (MIT) | As listed |

No photographs, stock images or third-party 3D models are included. The only third-party media are the three CC0 HDRIs above.

## Checks performed

These were actually run on this project before packaging, in a Linux container with Node 22:

- `npm ci` with the bundled lockfile, from a clean extract of the ZIP
- `npm run lint`: no errors or warnings
- `npm run typecheck`: no errors
- `npm run build`: production build succeeded, with all pages statically generated
- `npm run start`, then a headless Chromium check (software WebGL, SwiftShader) at 1440×900 and 390×844 of these pages: home, Residential Spaces, Office Spaces, notices and a 404:
  - no horizontal overflow on any of them
  - no broken images, and every image has alt text
  - no console errors on any page except the expected 404 status on the 404 page
- Live 3D (1440×900 and 1280×720):
  - the hero scene starts, with the camera flights, markers, dusk and night toggle and drag-to-orbit working
  - the skyline section pins
  - the towers rise as it arrives
  - the chapters advance with scroll
  - the light blends from golden hour through dusk to night
  - the tower buttons fly the camera to a tower and open its card
  - the horizontal reel pins and slides, and the cards tilt
  - the tower explorer selects a floor on click
- The vision model goes through all three stages with scroll (boundary and pegs, rising tower with crane and floor counter, finished and landscaped), and the matching principle is highlighted
- The corridor map tilts from plan to model, the corridors draw in with pulses and traffic, the target zones light up, and choosing GST Road flies the camera there and opens its card
- On a production build, no console errors with both new scenes running, and no horizontal overflow at 1280×800 or 390×844 (at 390 px in this container both new sections showed their fallbacks: the still and the SVG schematic)
- With reduced motion, the skyline section becomes the still sequence, the reel becomes a swipe row, and smooth scrolling and the custom cursor are off.

Not performed:

- Lighthouse or frame-rate measurement
- testing on physical phones or real GPUs; all live 3D was checked in a software renderer, so smoothness on real hardware is unverified
- screen-reader testing
- browsers other than Chromium
- a real Vercel deployment

## Known limitations

- **The architecture is procedural, not studio-modelled.** The towers are built in code, with real mullions, set-backs and crowns, and lit with HDRI reflections, ambient occlusion and bloom. They are not models from a professional architectural visualisation studio, and up close they lack the furniture, signage and fine detail of commissioned CGI. Premium marketplace models (TurboSquid, CGTrader, Sketchfab) usually carry licences that forbid redistributing them inside a website download, so none are bundled. To use a purchased or commissioned `.glb`, follow [Replacing the procedural models](#replacing-the-procedural-models).
- **Daylight stills were tried and rejected.** Re-rendering the editorial images in midday light made the procedural models look worse: pale paving read like snow and the context buildings looked flat. Low sun hides the simplifications, so the stills stay at golden hour and dusk. The clean daylight look is used only for the two new model sections, where a white study-model style is appropriate. Truly corporate daylight photography needs commissioned CGI.
- **People in the hero are stylised.** Photorealistic animated people need motion-captured, rigged models (for example from a commercial asset library or a CGI studio). None is bundled because of licensing.
- **Scenes pause off screen.** Each scene mounts a screen ahead and stops rendering whenever it is not near the viewport. Once loaded, scenes stay in memory: unmounting them during scrolling caused DOM errors from the 3D labels, so it was not adopted. If the browser drops a WebGL context, the corridor map falls back to its interactive schematic.
- **Performance budget.** The home page now runs four WebGL scenes (the hero, the vision model, the corridor map and the skyline sequence), and project pages run a model viewer or the tower explorer. The hero district is the heaviest scene. Each one loads only when it is scrolled near and renders only while it is on screen. Test on a mid-range laptop and phone before the tender. If frame rates drop, set `quality` to `"lite"` in `SkylineSection.tsx` to turn off ambient occlusion.
- **npm's ESLint 9 deprecation notice.** npm reports ESLint 9 as deprecated because ESLint 10 exists. ESLint 9 is kept deliberately: `eslint-plugin-react`, which `eslint-config-next` depends on, does not yet declare support for ESLint 10.
- **Telemetry.** Next.js collects anonymous telemetry by default. Disable it with `npx next telemetry disable`.
- **Draco decoder.** If you add Draco-compressed models, Drei fetches the Draco decoder from a public CDN unless you host it locally.
