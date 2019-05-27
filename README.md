
## SETUP CLIENT
クライアントは特別何も必要がない。yarnにおまかせ。

```
cd client
yarn install
```

## SETUP SERVER
serverless-offline用のDynamoDB Localをインストールすること以外はyarnにおまかせ。

```
cd server
yarn install
sls dynamodb install
yarn start
```

## START DEVELOPMENT
server側のscriptにserverとclientの開発用サーバを立てる設定をしてあるので、server側で `yarn start` すればよい。

内部的には `node-foreman` を使って両方の開発サーバを起動してます。

```
cd server
yarn start
```

## CERT
スマフォやタブレットで確認を行う際など、`localhost` 以外で試したい場合SSL証明書のドメインを書き換える必要あり。

これはQRコード読み込み箇所でWebRTCのカメラから画像読み込みを行なっているためであり、この機能を使うためには `https` が必須のため。

https://developers.google.com/web/fundamentals/media/capturing-images/?hl=ja

ファイルの生成はコマンドがあるので実行すればOK。
IPを変えたい場合は下記ファイルの1行目にある `DOMAIN` を適宜変える。

```
cd server
sh ./dev/sslcert.sh
```

## TEST DATA
公開されているチェックリストのデータから開発用のデータを作る機能。これも下記のコマンドを用意済み。実行すればいい感じにデータが作成されるはず。

```
cd server
yarn restartDb
```

なおテスト用に読み込むためのQRコード画像が `dev` 以下にMAX20個作成されるので検証時やテスト時に利用すると捗る。
(MAX20個なのは全部生成すると重いからであり、数に意味はない)

内部的には `./dev/restart.sh` を実行し、DynamoDBに読み込ませるデータを作成した上で読み込ませ、QRコードを生成する。
