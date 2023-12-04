
sh scripts/build.sh

echo "Publishing patch..."

pnpm -r run patch
git add -A
git commit -m "Publish patch: $(date)"

pnpm -r publish