npm run build
rm ../jsaintyv/assets/*
cp -R dist/* ../jsaintyv

cd ../jsaintyv
git add .
git commit 
git push