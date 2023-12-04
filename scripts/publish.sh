

sh scripts/remove-ts-buildinfo.sh
pnpm -r --workspace-concurrency 1 rebuild

pnpm -r run patch
git add -A
git commit -m "Publish patch"

pnpm -r publish