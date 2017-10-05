rm -rf dist/
rm -rf server.tar.gz
rm -rf app.tar.gz
grunt build
tar -czvf server.tar.gz dist/server/
tar -czvf app.tar.gz dist/public/app/

scp -i ~/Downloads/stagingiquippo.pem server.tar.gz       ubuntu@54.179.148.145:/tmp/dist/
scp -i ~/Downloads/stagingiquippo.pem app.tar.gz       ubuntu@54.179.148.145:/tmp/dist/public/
scp -i ~/Downloads/stagingiquippo.pem dist/public/index.html        ubuntu@54.179.148.145:/tmp/dist/public/
scp -i ~/Downloads/stagingiquippo.pem dist/package.json     ubuntu@54.179.148.145:/tmp/dist/
scp -i ~/Downloads/stagingiquippo.pem bower.json     ubuntu@54.179.148.145:/tmp/dist/


