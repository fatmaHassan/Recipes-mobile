# Recipes Mobile App

This is a mobile app that depends on the Recipes API hosted on Render:  
https://recipes-gifa.onrender.com/

The same backend is also available via a web UI at:  
https://recipes-gifa.onrender.com/

The app communicates with the API under the `/api` base path (see `constants/api.ts`), where the configured base URL is:
`https://recipes-gifa.onrender.com/api`

## What the app expects

The Recipes API provides the routes used by this app, including (among others):
- Authentication: `/login`, `/register`, `/logout`, `/user`
- Pantry: `/ingredients` and `/ingredients/search` (plus ingredient checks/deletes)
- Allergies: `/allergies` (plus allergy deletes)
- Recipes: `/recipes/search`, `/recipes` (details), `/recipes/save`, favorites actions
- Profile and dashboard data (e.g. `/profile`, `/dashboard`)

## Get started

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npx expo start
```

## Development note

If you change the backend host (or want to point to a local API), update the base URL in `constants/api.ts`.
