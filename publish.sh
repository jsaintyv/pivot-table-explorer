npm run build
cp -R dist/* ../jsaintyv
sed -i 's|"/assets|"/jsaintyv/assets|g' ../jsaintyv/index.html
