#!/bin/bash
# Replace placeholder with actual backend URL at build time
sed -i "s|BACKEND_URL_PLACEHOLDER|$BACKEND_URL|g" src/environments/environment.prod.ts
npm install
npx ng build --configuration production
