const { ApiPromise, WsProvider } = require('@polkadot/api')
const types = require('../types.json')

import config from '../config'

export async function connect () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider(config.wsUrl)

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider, types })

  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ])

  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`)
  return api
}