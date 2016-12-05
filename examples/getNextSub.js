// var Infoblox = require('../lib/infoblox'),
//     config = require('./config');

let  Infoblox = require('../lib/infoblox'),
     { ip, apiVersion, user, password } = require('./config');

var ipam = new Infoblox({ ip, apiVersion });

ipam.login(user, password).then(() => {
  return;
}).then(() => {
  return ipam.getContainer('10.255.0.0/16');
}).then((data) => {
  let netId = JSON.parse(data)[0]._ref;
  return ipam.getNextSubnets({
    netId, cidr: 24, num: 5
  })
}).then(data => {
  console.log(data);
}).catch(err => console.log(err))
