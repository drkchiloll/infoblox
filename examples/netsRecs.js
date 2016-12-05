var Infoblox = require('../lib/infoblox'),
    config = require('./config');

var ipam = new Infoblox({
  ip: config.ip,
  apiVersion: config.apiVersion
});

ipam.login(config.user, config.password).then(() => {
  let ip = '10.254.152.10';
  ipam.getNetworkFromIp(ip).then(resp => {
    console.log(resp);
    ipam.logout()
  }, err => {
    console.log(err);
  })
  // var network = '10.255.4.0/24';
  // ipam.getNetwork(network).then((res) => {
  //   try {
  //     if(res.length === 0) throw new Error();
  //     ipam.getIpsFromSubnet(network).then((res) => {
  //       var usedRecords = (JSON.parse(res)).filter(record => record.status === 'USED');
  //       console.log(usedRecords);
  //     })
  //   } catch(err) {
  //     console.log('no network');
  //   }
  // })
})
