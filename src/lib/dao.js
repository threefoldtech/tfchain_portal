import {
  web3FromAddress,
} from '@polkadot/extension-dapp'
import { hex2a } from './util'
import moment from 'moment'

export async function vote (address, api, farmId, hash, approve, callback) {
  try {
    const injector = await web3FromAddress(address)
    return api.tx.dao
      .vote(farmId, hash, approve)
      .signAndSend(address, { signer: injector.signer }, callback)
  } catch (error) {
    console.log(`err while trying to get injector ${error}`)
  }
}

export async function getProposals (api) {
  const hashes = await getProposalHashes(api)
  const parsedHashes = hashes.map(async h => {
    const daoProposal = await getDaoProposal(api, h)
    daoProposal.description = hex2a(daoProposal.description)
    daoProposal.link = hex2a(daoProposal.link)

    const daoProposalMethod = await getDaoProposalMethod(api, h)
    const votes = await getDaoProposalVotes(api, h)
    if (votes) {
      const nowBlock = await api.query.system.number()
      const timeUntilEnd = (votes.end - nowBlock.toJSON()) * 6
      votes.timeUntilEnd = moment().add('second', timeUntilEnd)
      console.log(timeUntilEnd)
    }
    console.log(votes)
    return {
      hash: h.toJSON(),
      ...daoProposal,
      method: daoProposalMethod,
      ...votes,
    }
  })
  return await Promise.all(parsedHashes)
}

export async function getProposalHashes (api) {
  return await api.query.dao.proposalList()
}

export async function getDaoProposal (api, hash) {
  const proposal = await api.query.dao.proposals(hash)
  return proposal.toJSON()
}

export async function getDaoProposalMethod (api, hash) {
  const proposal = await api.query.dao.proposalOf(hash)
  return proposal.toJSON()
}

export async function getDaoProposalVotes (api, hash) {
  const voting = await api.query.dao.voting(hash)
  return voting.toJSON()
}
