<template>
  <div class="main">
    <div class="header">
      <h2>Proposals</h2>
      <v-tooltip bottom class="infoTooltip">
        <template v-slot:activator="{ on, attrs }">
          <v-icon
            class="infoIcon"
            dark
            right
            v-bind="attrs"
            v-on="on"
            @click="openInfoModal = true"
          >
            mdi-information-outline
          </v-icon>
        </template>
        <span>
          Click for more info
        </span>
      </v-tooltip>
    </div>
    <div
      v-for="proposal in proposals"
      :key="proposal.hash"
    >
      <div
        class="proposal"
      >
        <div class="infoContainer">
          <span>Proposal: {{ proposal.hash }}</span>
          <span>Description: {{ proposal.description }}</span>
          <span>Link: <a v-bind:href="proposal.link">{{ proposal.link }}</a></span>
        </div>

        <v-row class="votesContainer" v-if="proposal.ayes">
          <v-col
            xs="5"
            md="5"
            class="yesContainer"
            @click="openVoteProposalModal(proposal.hash, true)"
          >
            <span>Yes</span>
            <v-progress-circular
              v-if="proposal.hash === selectedProposal && loadingYes"
              indeterminate
              color="primary"
            ></v-progress-circular>
            <span v-else class="counter">{{ proposal.ayes.length }}</span>
          </v-col>

          <v-col
            xs="5"
            md="5"
            class="noContainer"
            @click="openVoteProposalModal(proposal.hash, false)"
          >
            <span>No</span>
            <v-progress-circular
              v-if="proposal.hash === selectedProposal && loadingNo"
              indeterminate
              color="primary"
            ></v-progress-circular>
            <span v-else class="counter">{{ proposal.nayes.length }}</span>
          </v-col>
          <v-progress-linear
            class="progress"
            color="light-blue"
            height="18"
            :value="getProgress(proposal.hash)"
            striped
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.ceil(value) }}% in favor</strong>
            </template>
          </v-progress-linear>
        </v-row>
        <span class="tip">Click on yes/no to vote!</span>
        <span class="timer">You can vote until: {{ proposal.timeUntilEnd }}</span>
      </div>
    </div>

    <div v-if="proposals.length === 0" class="note">
      <h3>No Active proposals at this time</h3>
    </div>
    <InfoModal
      :open="this.openInfoModal"
      :close="() => openInfoModal = false"
    />
    <VoteModal
      :open="this.openVoteModal"
      :approved="this.approved"
      :close="() => openVoteModal = false"
      :farms="this.farms"
      :vote="this.voteProposal"
    />
  </div>
</template>
<script>
import {
  getProposals,
  vote
} from '../lib/dao'
import {
  getFarm,
} from '../lib/farm'
import { getTwinID } from '../lib/twin'
import InfoModal from './dao/infoModal.vue'
import VoteModal from './dao/voteModal.vue'

export default {
  components: {
    InfoModal,
    VoteModal
  },

  async mounted () {
    this.$store.dispatch('getAPI')
    this.proposals = await getProposals(this.$store.state.api)
    this.twinID = await getTwinID(this.$store.state.api, this.$route.params.accountID)
    this.farms = await getFarm(this.$store.state.api, this.twinID)
  },

  data () {
    return {
      proposals: [],
      twinID: 0,
      farms: [],
      loadingVote: false,
      loadingYes: false,
      loadingNo: false,
      selectedProposal: undefined,
      openInfoModal: false,
      openVoteModal: false,
      approved: false
    }
  },

  methods : {
    openVoteProposalModal (hash, approved) {
      if (this.farms.length === 0) {
        alert("You need to create a farm first")
        return
      }
      this.approved = approved
      this.selectedProposal = hash
      this.openVoteModal = true
    },
    voteProposal (farmID) {
      this.setLoading(this.approved, true)
      vote(this.$route.params.accountID, this.$store.state.api, farmID, this.selectedProposal, this.approved, (res) => {
        console.log(res)
        if (res instanceof Error) {
          console.log(res)
          return
        }
  
        const { events = [], status } = res
        console.log(`Current status is ${status.type}`)
        switch (status.type) {
          case 'Ready': this.$toasted.show(`Transaction submitted`)
        }
      
        if (status.isFinalized) {
          console.log(`Transaction included at blockHash ${status.asFinalized}`)
      
          // Loop through Vec<EventRecord> to display all events
          events.forEach(({ phase, event: { data, method, section } }) => {
            console.log(`\t' ${phase}: ${section}.${method}:: ${data}`)
            if (section === 'dao' && method === 'Voted') {
              this.$toasted.show('Voted for proposal!')
              this.setLoading(this.approved, false)
              getProposals(this.$store.state.api)
                .then(proposals => this.proposals = proposals)
            } else if (section === 'system' && method === 'ExtrinsicFailed') {
              this.$toasted.show('Vote failed')
              this.setLoading(this.approved, false)
            }
          })
        }
      }).catch(err => {
        this.$toasted.show(err.message)
        this.setLoading(this.approved, false)
      })
    },
    setLoading (approve, value) {
      if (approve) {
        this.loadingYes = value
      } else {
        this.loadingNo = value
      }
    },
    getProgress (hash) {
      const proposal = this.proposals.filter(p => p.hash === hash)[0]

      const totalAyeWeight = proposal.ayes.reduce((total, v) => total + v.weight, 0)
      const totalNayeWeight = proposal.nayes.reduce((total, v) => total + v.weight, 0)

      const total = totalAyeWeight + totalNayeWeight

      return (totalAyeWeight / total) * 100
    }
  }
}
</script>
<style scoped>
.main {
  width: 100% !important;
  margin: auto;
}
.main h2 {
  text-align: center;
}
.link {
  color: white !important;
}
.proposal {
  display: flex;
  flex-direction: column;
  background: #252c48 !important;
  width: 70%;
  padding: 1em;
  padding-bottom: 2em;
  border-radius: 0.3em;
  margin: auto;
  margin-bottom: 1em;
  margin-top: 1em;
}
.proposal span {
  color: white;
}
.infoContainer {
  padding: 1em;
  display: flex;
  flex-direction: column;
}
.infoContainer a {
  color: orange;
}
.votesContainer {
  height: 7em;
  margin: 1em;
  margin-top: 0;
  margin-bottom: 2em;
  display: flex;
  justify-content: space-between !important;
}
.yesContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #86B049;
  border-radius: 0.3em;
  cursor: pointer;
}
.yesContainer span {
  color: white;
  font-size: 24px;
}
.noContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FF4359;
  border-radius: 0.3em;
  cursor: pointer !important;
}
.noContainer span {
  color: white;
  font-size: 24px;
}
.counter {
  color: white !important;
  font-size: 32px !important;
}
.tip {
  margin-top: 1em;
  text-align: center;
  color: rgb(160, 160, 160) !important;
  font-size: 20px;
}
.timer {
  margin-top: 1em;
  text-align: center;
  color: rgb(160, 160, 160) !important;
  font-size: 20px;
}
.progress {
  margin-top: 1em;
  margin-bottom: 1em;
}
.note {
  text-align: center;
  margin-top: 5em;
  font-size: 32px;
}
.header {
  display: flex;
  justify-content: center;
}
</style>
