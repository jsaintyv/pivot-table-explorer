npm run build
rm ../jsaintyv/assets/*
cp -R dist/* ../jsaintyv

sed -i 's|"/assets|"/jsaintyv/assets|g' ../jsaintyv/index.html
