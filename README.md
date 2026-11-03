# Venture Built Club

A website for Venture Built Club at Obafemi Awolowo University (OAU), showcasing the program that turns Great Ife's most driven builders into venture-ready founders.

## Project Structure

- `index.html` - Main landing page with hero, stats, program details, FAQs, and team information

## Features

- Responsive design optimized for mobile and desktop
- Scroll reveal animations for sections
- Clean, modern aesthetic with forest green and bright accent colors
- CTA-focused layout encouraging applications and engagement

## Getting Started

Simply open `index.html` in your browser to view the website.

## Stack

- HTML5
- CSS3 (responsive, modern)
- Vanilla JavaScript (scroll reveal)
- Google Fonts (Montserrat)

## Homepage config (`site-config.js`)

The HTML ships in the safe state ("Applications opening soon") and `site-config.js` turns the live forms on. Flip states in `site-config.js`, no markup changes needed:

- `cohort.applicationsOpen` – `false`: "Applications opening soon" (disabled, no link); `true`: "Apply for the Cohort" → `/apply`
- `club.access` (`"apply"` | `"open"`) and `club.applicationsOpen` – "Apply to the Club" / "Join the Club" → `/apply/club`
- `features.whatsappFoundersCopy`, `investorIntroductionLine`, `coBuildersSpace`, `hubSharingSpace`
- `routes.founders | investors | partners | contactEmail`

## Updating the Hub screenshot

The Hub section shows `images/hub/hub-screenshot.webp` (a real screenshot taken with a test account). To refresh it, replace that one file, keep it under ~200 KB, and update the `width`/`height` on the `<img>` in the `#hub` section if the dimensions change. Never use a screenshot showing real students' names, photos, messages or contact details.
