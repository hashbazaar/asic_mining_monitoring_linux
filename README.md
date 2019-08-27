# asic_mining_monitoring_linux
This apps get status data of each miner and send it to Hashbazaar server, you can see your data in Hashbazaar dashboard.

Installation
====
1- install node js
 ```
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install nodejs
 ```
 2- install packages
 ```
 cd asic_mining_monitoring_linux
npm install
 ```
3- get your id from hashbazaar.com website and edit inex.js like bellow:
```
var farmID = "your id";
```
4- run command below
```
node index.js
```
5-after 30 minutes you can see your miners data in hashbazaar.com dashboard
