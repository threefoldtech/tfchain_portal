<template>
  <div>
    <v-dialog
      v-model="open"
      width="50vw"
      v-on:click:outside="close"
    >
      <v-card class="card">
        <v-card-title class="text-h5">
          Vote
        </v-card-title>

        <v-card-text>
          <v-select
            :items="farms"
            label="Select a farm"
            outlined
            item-text="name"
            item-value="id"
            v-model="selectedFarm"
          ></v-select>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="close"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="voteApproval"
            :disabled="!selectedFarm"
          >
            Vote {{ approved ? 'yes' : 'no' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { getNodesByFarm } from '../../lib/nodes'

export default {
  name: 'Info',
  props: ['open', 'close', 'approved', 'farms', 'vote'],

  data () {
    return {
      selectedFarm: undefined
    }
  },

  methods: {
    async voteApproval () {
      const nodes = await getNodesByFarm(this.selectedFarm)
      if (nodes.length === 0) {
        alert("Your selected farm has no nodes attached.")
        return
      }
      this.vote(this.selectedFarm)
      this.close()
    }
  }
}
</script>
<style scoped>
h2 {
  margin-top: 1em;
  margin-bottom: 1em;
  font-size: 26px;
}
span {
  font-size: 18px;
}
li {
  margin-top: 1em;
  font-size: 18px;
}
.card {
  background: #252c48 !important;
}
</style>
