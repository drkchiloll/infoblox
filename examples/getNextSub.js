var Infoblox = require('../lib/infoblox'),
    config = require('./config');

var ipam = new Infoblox({
  ip: config.ip,
  apiVersion: config.apiVersion
});

ipam.login(config.user, config.password).then(() => {
  return;
}).then(() => {
  return ipam.getContainer('10.255.0.0/16');
}).then((data) => {
  let netId = JSON.parse(data)[0]._ref;
  return ipam.getNextSubnets({
    netId, cidr: 21, num: 3
  })
}).then(data => {
  // console.log(data);
}).catch(err => console.log(err))
