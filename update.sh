#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BRANCH="${1:-main}"

echo "[1/5] Verification des prerequis"
command -v git >/dev/null 2>&1 || { echo "git introuvable"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker introuvable"; exit 1; }

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose introuvable"
  exit 1
fi

echo "[2/5] Arret du service"
docker compose down

echo "[3/5] Mise a jour du code ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[4/5] Reconstruction et redemarrage"
docker compose up -d --build --remove-orphans

echo "[5/5] Etat final"
docker compose ps

echo "Update termine avec succes."
