import {
  web3FromAddress,
} from '@polkadot/extension-dapp'
import { hex2a } from './util'

export async function getFarm (api, twinID) {
  const farms = await api.query.tfgridModule.farms.entries()
  const twinFarms = farms.filter(farm => {
    if (farm[1].toJSON().twinId === twinID) {
      return farm
    }
  })

  const parsedFarms = twinFarms.map(async farm => {
    const parsedFarm = farm[1].toJSON()
    const v2address = await getFarmPayoutV2Address(api, parsedFarm.id)

    return {
      ...parsedFarm,
      name: hex2a(parsedFarm.name),
      v2address: hex2a(v2address)
    }
  })

  return await Promise.all(parsedFarms)
}

export async function getFarmByID (api, id) {
  const farm = await api.query.tfgridModule.farms(id)
  return farm.toJSON()
}

export async function createFarm (address, api, name, callback) {
  const injector = await web3FromAddress(address)

  return api.tx.tfgridModule
    .createFarm(name, [])
    .signAndSend(address, { signer: injector.signer }, callback)
}

export async function deleteIP (address, api, farmID, ip, callback) {
  const injector = await web3FromAddress(address)

  return api.tx.tfgridModule
    .removeFarmIp(farmID, ip.ip)
    .signAndSend(address, { signer: injector.signer }, callback)
}

export async function createIP (address, api, farmID, ip, gateway, callback) {
  const injector = await web3FromAddress(address)

  return api.tx.tfgridModule
    .addFarmIp(farmID, ip, gateway)
    .signAndSend(address, { signer: injector.signer }, callback)
}

export async function getFarmPayoutV2Address (api, id) {
  const address = await api.query.tfgridModule.farmPayoutV2AddressByFarmID(id)
  return address.toJSON()
}

export async function setFarmPayoutV2Address (address, api, id, v2address, callback) {
  const injector = await web3FromAddress(address)

  return api.tx.tfgridModule
    .addStellarPayoutV2Address(id, v2address)
    .signAndSend(address, { signer: injector.signer }, callback)
}

export async function acceptTermsAndConditionFarmer (api, address, documentLink, documentHash, callback) {
  const injector = await web3FromAddress(address)
  return api.tx.tfgridModule
    .farmerAcceptTc(documentLink, documentHash)
    .signAndSend(address, { signer: injector.signer }, callback)
}

export async function farmerAcceptedTermsAndConditions (api, address, documentLink, documentHash) {
  const tcs = await api.query.tfgridModule.farmersTermsAndConditions(address)
  const parsedTcs = tcs.toJSON()

  return parsedTcs.filter(tc => hex2a(tc.documentLink) === documentLink && hex2a(tc.documentLash) === documentHash).length > 0
}

export async function deleteNode (address, api, nodeId, callback) {
  const injector = await web3FromAddress(address)

  return api.tx.tfgridModule
    .deleteNodeFarm(nodeId)
    .signAndSend(address, { signer: injector.signer }, callback)
}