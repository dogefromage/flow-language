

echo "Rebuilding monorepo..."

sh scripts/remove-tsbuildinfo.sh
pnpm -r --workspace-concurrency 1 rebuild