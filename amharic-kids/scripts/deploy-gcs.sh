#!/usr/bin/env bash
# Deploys the app to a public Google Cloud Storage bucket.
#   scripts/deploy-gcs.sh PROJECT_ID [BUCKET_NAME]
# Needs: gcloud (logged in with `gcloud auth login`), Node, and a project with billing enabled.
# The app ends up at https://storage.googleapis.com/BUCKET_NAME/index.html. That address is HTTPS and
# the app is not inside a frame, so microphone recording, offline mode and "Add to Home Screen" all work.
set -euo pipefail
PROJECT="${1:?usage: scripts/deploy-gcs.sh PROJECT_ID [BUCKET_NAME]}"
BUCKET="${2:-${PROJECT}-selam-anbessa}"
cd "$(dirname "$0")/.."

npm run build

if ! gcloud storage buckets describe "gs://${BUCKET}" --project "${PROJECT}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${BUCKET}" --project "${PROJECT}" --location=US --uniform-bucket-level-access
fi
# anyone with the link can open the app (read-only)
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member=allUsers --role=roles/storage.objectViewer >/dev/null

gcloud storage rsync dist "gs://${BUCKET}" --recursive --delete-unmatched-destination-objects
# always check for a new version of the page, service worker and manifest; hashed assets never change
gcloud storage objects update "gs://${BUCKET}/index.html" "gs://${BUCKET}/sw.js" --cache-control="no-cache"
gcloud storage objects update "gs://${BUCKET}/manifest.webmanifest" --cache-control="no-cache" --content-type="application/manifest+json"
gcloud storage objects update "gs://${BUCKET}/assets/**" --cache-control="public, max-age=31536000, immutable"

echo
echo "Deployed: https://storage.googleapis.com/${BUCKET}/index.html"
