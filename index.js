var request = require('request');
const jsdom = require("jsdom");
const axios = require('axios');
const find = require('local-devices');
const { JSDOM } = jsdom;

// farm id
var farmID = "";
// authentication
var authUserName = 'root';
var authPassword = 'root';

var arrayMiners = [];
var minerStatus = [];


function checkInternet(cb) {
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}

function updateMinersState() {
	if(minerStatus.length >0) {
		sendMinersInfo(minerStatus)
		minerStatus = [];
	}
	for(var i=0; i< arrayMiners.length; i++) {
       readMinerStatus(arrayMiners[i].ip, '80', authUserName, authPassword);  
	}
}

updateMinersState();

function readMinerStatus(host,port, username, password) {
	console.log("readMinerStatus");console.log(host);
 request.get('http://' + host + ':' + port + '/cgi-bin/minerStatus.cgi', {
    'auth': {
      'user': username,
      'pass': password,
      'sendImmediately': false
    }
  }, function (error, response, body) {
    if(error) 
    {
      console.log("error");
      console.log(error);
      // callback(error, null);
      return;
    } 

    const frag = JSDOM.fragment(body);
    // console.log(body);
    if(frag.querySelector("#ant_ghs5s") !== null) {
     try {
      // miner totalHashrate
       var totalHashrate = frag.querySelector("#ant_ghs5s").textContent;
       // miners name
       var minerName = "unknown";
       if( (parseInt(totalHashrate.replace(',','')) > 14000) && (parseInt(totalHashrate.replace(',','')) < 15000) ) {
    	  minerName = "S9";
       } else if( (parseInt(totalHashrate.replace(',','')) > 18000) && (parseInt(totalHashrate.replace(',','')) < 22000) ) {
    	  minerName = "S11";
       }
       // miner fan speed
        var fanCells = frag.querySelectorAll("table#ant_fans tbody tr.cbi-section-table-row td.cbi-value-field");
        var fanSpeeds = [];
        for(var i = 0; i < fanCells.length; i++) {
         if(fanCells[i].textContent !== "0" && fanCells[i].textContent !== "") {
           fanSpeeds.push( parseFloat(fanCells[i].textContent.replace(',','')) );
         }
        }
        // miner tempertures
        var temperture1Array = []; var temperture2Array = []; 
        var temperture1 = frag.querySelectorAll("#cbi-table-1-temp");
        var temperture2 = frag.querySelectorAll("#cbi-table-1-temp2");
        for(var i=0; i< temperture1.length; i++) {
    	   if(temperture1[i].textContent !== "") {
    	    	temperture1Array.push(temperture1[i].textContent);
    	   }
        }
        for(var i=0; i< temperture2.length; i++) {
    	   if(temperture2[i].textContent !== "") {
    	    	temperture2Array.push(temperture2[i].textContent);
    	   }
        }
        // miners uptime
        var upTime = frag.querySelector("#ant_elapsed").textContent;

        minerStatus.push({"ip": host, "minerName": minerName, "temp1": temperture1Array, 
    	  "temp2": temperture2Array, "fanSpeeds": fanSpeeds, "totalHashrate": totalHashrate, "upTime": upTime});
       } catch (err) {
          console.log("error tfirst Type")
          console.log(err);
       }
   } else {getType2Miners(host,port,username,password);}
  });
}


function sendMinersInfo() {
	var minersInfo = {"minersInfo": minerStatus, "id": farmID};
	var message = JSON.stringify(minersInfo);

	axios.post('https://hashbazaar.com/api/remote', minersInfo).then((response) => {
       // console.log("sendMinersInfo response"); console.log(response.data);
	}).catch( (error) => {
		console.log("error sendMinersInfo");console.log(error);
	}) 
}

// updateMinersState();

function referesh() {
	checkInternet(function(isConnected) {
    if (isConnected) {
        // connected to the internet
        arrayMiners = [];
        find().then(devices => {
         console.log(devices) ;
         for(var i=0; i< devices.length; i++) {
             arrayMiners.push({ip: devices[i].ip});
         }
         updateMinersState();
      });
    } else {
        // not connected to the internet
        console.log("not connected to the internet") ;
    }
});
}

function getType2Miners(host,port,username,password) {
   request.get('http://' + host + ':' + port + '/cgi-bin/miner_stats.cgi', {
    'auth': {
      'user': username,
      'pass': password,
      'sendImmediately': false
    }
   }, function (error, response, body) {
    if(error) 
    {
      console.log("getType2Miners error");
      console.log(error);
      // callback(error, null);
      return;
    } 
    try {
      var data = JSON.parse(body);

      var STATS = data.STATS;
      // miner totalHashrate
      var totalHashrate = STATS[1]["GHS av"];
       // miner name
       var minerName = STATS[0].Type;
       // miner fan speed
       var fanSpeeds = [];fanSpeeds.push(STATS[1]["fan1"]);fanSpeeds.push(STATS[1]["fan2"]);
       // miner tempertures
       var temperture1Array = []; var temperture2Array = []; 
       temperture1Array.push(STATS[1]["temp_pcb1"]);temperture1Array.push(STATS[1]["temp_pcb2"]);
       temperture1Array.push(STATS[1]["temp_pcb3"]);
       temperture2Array.push(STATS[1]["temp_chip1"]);temperture2Array.push(STATS[1]["temp_chip2"]);
       temperture2Array.push(STATS[1]["temp_chip3"]);
       // miner uptime
       var upTime = STATS[1]["Elapsed"];
       upTime = formatDateTime(upTime);

       minerStatus.push({"ip": host, "minerName": minerName, "temp1": temperture1Array, 
         "temp2": temperture2Array, "fanSpeeds": fanSpeeds, "totalHashrate": totalHashrate, "upTime": upTime});
       } catch (err) {
          console.log("error second Type")
          console.log(err);
       }
   });
	
}

function formatDateTime(inputTime) {    
            var d = parseInt(inputTime / 86400);
            var h = parseInt((inputTime-d*86400)/3600); 
            var m = parseInt((inputTime - d*86400 - h*3600) / 60);
            var s = (inputTime - d*86400 - h*3600 - m*60);

            var dStr = d==0 ? '' : d+'d';
            var hStr = h==0 ? '' : h+'h';
            var mStr = m==0 ? '' : m+'m';
            var sStr = s==0 ? '' : s+'s';
            return dStr + hStr + mStr + sStr;
}; 

referesh();

setInterval(referesh,900000);

// getMinerType('192.168.100.6','80', 'root', 'root');