# KARTIFY Customer Care — GitHub Pages

This version is configured as a **static Next.js export**. It does not require Vercel.

## Publish directly with GitHub Pages

1. Create a GitHub repository and upload all files from this project.
2. Use the `main` branch.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push the files. The included workflow builds the site and deploys it automatically.

Your URL will normally be:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## Firebase

The Firebase Web configuration is included in `app/page.tsx`. Web Firebase API keys are client-side identifiers; do not put Firebase Admin SDK credentials in this project.

For login to work on the GitHub Pages URL, add your exact `github.io` domain to Firebase Authentication → Settings → Authorized domains.

Realtime Database rules must also allow the authenticated operations used by the app.
