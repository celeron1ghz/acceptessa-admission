DOMAIN=10.0.1.6

cd `dirname $0`/..
mkdir -p .cert
cd .cert
echo "cert_dir: $(pwd)"
rm -f *.pem

echo "generate cert for $DOMAIN..."
openssl genrsa 2048 > key.pem
openssl req -subj "/C=JP/ST=Tokyo/L=Chuo-ku/O=Example K.K./OU=Example Section/CN=$DOMAIN" -new -key key.pem > csr.pem
openssl x509 -days 3650 -req -signkey key.pem < csr.pem > cert.pem

cat key.pem  >> server.pem
cat cert.pem >> server.pem
cp server.pem ../../client/node_modules/webpack-dev-server/ssl/
