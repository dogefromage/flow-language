

sh scripts/remove-ts-buildinfo.sh

pnpm -r run build
pnpm -r run patch

git add -A
git commit -m "Automatic publish"

pnpm -r publish