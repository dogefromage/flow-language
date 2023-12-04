

sh scripts/remove-tsbuildinfo.sh
pnpm -r --workspace-concurrency 1 rebuild

pnpm -r run patch
git add -A
git commit -m "Publish patch: $(date)"

# pnpm -r publish