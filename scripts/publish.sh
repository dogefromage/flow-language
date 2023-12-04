

sh scripts/remove-ts-buildinfo.sh
pnpm -r run rebuild
pnpm -r run patch

git add -A
git commit -m "Automatic publish"

pnpm -r publish