<template>
  <div>
    <v-card class="card">
      <v-card-title class="text-h5">
        Transfer TFT
      </v-card-title>

      <v-card-text>
        <span class="text-muted">Transfer TFT from your account to another account on TF Chain</span>
        <v-text-field
          label="Recipient address"
          v-model="target"
          :error-messages="errorMessages"
          :rules="[
            () => !!target || 'This field is required',
            isValidAddress()
          ]"
        ></v-text-field>
        <v-text-field
          label="Amount"
          v-model="amount"
          type="number"
          :rules="[
            () => !!amount || 'This field is required',
            () => !!amount && amount * 1e7 < this.balance || 'Amount cannot exceed balance',
          ]"
        ></v-text-field>
        <span>Available balance: {{(balance/1e7).toFixed(4)}} TFT</span>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text
          @click="transferFrom()"
          :loading="loadingTransfer"
          :disabled="!!errorMessages || amount === '' || target === ''"
        >
          Transfer
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script>
import { transfer, checkAddress } from '../lib/transfer'
export default {
  props: ['balance', 'getBalance'],
  data () {
    return {
      target: '',
      amount: '',
      loadingTransfer: false,
      errorMessages: '',
    }
  },
  methods: {
    isValidAddress () {
      const isValid = checkAddress(this.target)
      console.log(isValid)
      if (isValid === true) {
        console.log('addr is valid')
        this.errorMessages = ''
        return true
      } else {
        return isValid.message
      }
    },
    transferFrom () {
      if (this.amount === '' || this.target === '') {
        this.errorMessages = 'No target specified'
        return
      }
      transfer(this.$route.params.accountID, this.$store.state.api, this.target, this.amount, (res) => {
        this.loadingTransfer = true
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
            if (section === 'balances' && method === 'Transfer') {
              this.$toasted.show('Transfer succeeded!')
              this.loadingTransfer = false
              this.getBalance()
            } else if (section === 'system' && method === 'ExtrinsicFailed') {
              this.$toasted.show('Transfer failed!')
              this.loadingTransfer = false
            }
          })
        }
      }).catch(err => {
        this.$toasted.show(err.message)
        this.loadingTransfer = false
      })
    }
  }
}
</script>
<style scoped>
.card {
  width: 90%;
  margin: auto;
  margin-top: 1em;
  background: #252c48 !important;
}
</style>