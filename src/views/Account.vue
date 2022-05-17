<template>
  <div>
    <div class="accounts-app">
      <v-navigation-drawer
        permanent
        v-if="activated"
        app
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Account
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ this.$route.params.accountID }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider></v-divider>

        <v-list
          dense
          nav
        >
          <v-list-item link @click="selectedItem = 'twins'">
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Twin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="twinID !== 0" link @click="selectedItem = 'transfer'">
            <v-list-item-icon>
              <v-icon>mdi-swap-horizontal</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Transfer</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="twinID !== 0" link @click="selectedItem = 'farms'">
            <v-list-item-icon>
              <v-icon>mdi-barley</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Farms</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="twinID !== 0" link @click="selectedItem = 'dnodes'">
            <v-list-item-icon>
              <v-icon>mdi-resistor-nodes</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Dedicated Nodes</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="twinID !== 0" link @click="selectedItem = 'dao'">
            <v-list-item-icon>
              <v-icon>mdi-account-group</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>DAO</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item link @click="openExplorer">
            <v-list-item-icon>
              <v-icon>mdi-earth</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Capacity</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    
      <v-container>
        <Twin
          v-if="selectedItem === 'twins' && activated" 
          :twin="twin"
          :twinID="twinID"
          :createTwin="createTwinFromAccount"
          :loading="loadingCreateTwin"
          :balance="balance"
        />
        <Farm
          v-if="selectedItem === 'farms' && activated" 
        />
        <DedicatedNodes v-if="selectedItem === 'dnodes' && activated" />

        <Transfer
          v-if="selectedItem === 'transfer' && activated"
          :balance="balance"
          :getBalance="getBalance"
        />
        <Dao
          v-if="selectedItem === 'dao' && activated" 
        />
        <TermsAndConditions
          :open="!activated"
          :accept="acceptTermsAndConditions"
          :documentLink="documentLink"
          :loading="loadingActivation"
        />
      </v-container>
    </div>

    <v-footer padless app>
      <v-col class="footer">
        <span class="footertext">{{ new Date().getFullYear() }} — <strong>TF Chain Portal</strong></span>
        <span class="connection"><v-icon color="green">mdi-circle-slice-8</v-icon><strong>connected</strong></span>
      </v-col>
    </v-footer>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Farm from '../components/farm.vue'
import Twin from '../components/twin.vue'
import Transfer from '../components/transfer.vue'
import DedicatedNodes from '../components/dedicatednodes/nodes.vue'
import TermsAndConditions from './TermsAndConditions.vue'
import Dao from '../components/dao.vue'
import { activateThroughActivationService, acceptTermsAndCondition, userAcceptedTermsAndConditions } from '../lib/activation' 
import { getBalance } from '../lib/balance'
import { getTwin, getTwinID, createTwin } from '../lib/twin'
import axios from 'axios'
import blake from 'blakejs'
import config from '../config'

const DOCUMENT_RAW_LINK = 'https://library.threefold.me/info/legal/tfgrid/terms_conditions_tfgrid3'

export default {
  name: 'Account',

  components: {
    Farm,
    Twin,
    TermsAndConditions,
    Transfer,
    DedicatedNodes,
    Dao,
  },
  
  data () {
    return {
      twinID: 0,
      twin: undefined,
      loadingCreateTwin: false,
      activated: true,
      selectedItem: 'twins',
      loadingActivation: false,
      balance: 0,
      documentLink: 'https://library.threefold.me/info/legal/#/tfgrid/terms_conditions_tfgrid3',
      documentHash: ''
    }
  },

  ...mapGetters(['api']),

  async mounted () {
    if (!this.$store.state.api) return
    const api = await this.$store.state.api
    this.twinID = await getTwinID(api, this.$route.params.accountID)
    if (this.twinID != 0) {
      this.twin = await getTwin(api, this.twinID)
    } 
    this.balance = await getBalance(api, this.$route.params.accountID)
    let document = await axios.get(DOCUMENT_RAW_LINK)
    this.documentHash = blake.blake2bHex(document.data)
    const hasAcceptedTandC = await userAcceptedTermsAndConditions(api, this.$route.params.accountID, this.documentLink, this.documentHash)

    if (this.balance === 0 || !hasAcceptedTandC) {
      this.activated = false
    }
  },

  methods: {
    getBalance () {
      getBalance(this.$store.state.api, this.$route.params.accountID).then(b => this.balance = b)
    },
    acceptTermsAndConditions() {
      this.loadingActivation = true
      activateThroughActivationService(this.$route.params.accountID)
        .then(() => {
          setTimeout(() => {
            // todo, hash document content
            acceptTermsAndCondition(this.$store.state.api, this.$route.params.accountID, this.documentLink, this.documentHash, (res) => {
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
                  if (section === 'system' && method === 'ExtrinsicSuccess') {
                    this.$toasted.show('Terms and Conditions accepted!')
                    this.loadingActivation = false
                    this.activated = true
                    this.$store.dispatch('getAccounts')
                  } else if (section === 'system' && method === 'ExtrinsicFailed') {
                    this.$toasted.show('Failed to accept Terms and Conditions!')
                    this.loadingActivation = false
                  }
                })
              }
            })
          }, 1500)
        })
        .catch(err => {
          this.loadingActivation = false
          console.log(err)
        })
    },
    createTwinFromAccount (ip) {
      this.loadingCreateTwin = true
      createTwin(this.$route.params.accountID, this.$store.state.api, ip, (res) => {
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
            if (section === 'tfgridModule' && method === 'TwinStored') {
              this.$toasted.show('Twin created!')
              const twinStoredEvent = data[0]
              getTwin(this.$store.state.api, twinStoredEvent.id)
                .then(twin => {
                  this.twin = twin
                  this.twinID = twin.id
                  this.loadingCreateTwin = false
                  getBalance(this.$store.state.api, this.$route.params.accountID)
                    .then(balance => {
                      this.balance = balance / 1e7
                    })
                })
            } else if (section === 'system' && method === 'ExtrinsicFailed') {
              this.$toasted.show('Twin creation failed!')
              this.loadingCreateTwin = false
            }
          })
        }
      })
    },
    openExplorer () {
      window.open(config.explorerUrl, '_blank')
    }
  },
}
</script>
<style scoped>
.accounts-app {
  display: flex;
  flex-direction: row;
}
.account {
  background-color: rgb(255, 255, 255);
  margin-top: 0.2em;
  margin-bottom: 1em;
  border-radius: 0.3em;
  padding: 2em !important;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.account p {
  margin-bottom: 0px !important;
}
.overlay button {
  width: 100%;
}
.v-navigation-drawer {
  background: #252c48 !important;
}
.v-list-item__title {
  font-size: 18px !important;
  color:white !important;
  height: 100% !important;
}
.v-list-item__subtitle {
  color:white !important;
}
.v-list-item__icon {
  color:white !important;
}
.v-icon {
  color:white;
}
.footer {
  background: #252c48 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}
.connection {
  position: absolute;
  right: 0;
  margin-right: 0.5em;
}
</style>
