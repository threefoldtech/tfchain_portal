<template>
  <div>
    <v-dialog
      v-model="open"
      width="50vw"
      v-on:click:outside="close"
    >
      <v-card class="card">
        <v-card-title class="text-h5">
          Proposals information
        </v-card-title>

        <v-card-text>
          <div class="textContainer">
            <h2>General</h2>
            <span>A proposal can be created by one of the council members of tfchain.</span>
            <span> Once a proposal has reached it's timelimit, voting stops and a proposal can be closed.</span>
            <span> A proposal is either approved or dissapproved based on the majority of the weights of yes / no votes (50%).</span>
            <span> A minimal participation threshold must be met. If there are not enough votes and the timelimit is reached, the proposal is dissapproved.</span>
            <br>
            <h2>How do we count weight:</h2>
            <span>Votes are weighted based on the farmers stake in the network. One vote by default is 1 weight.</span>
            <span> If the farmers has nodes, the weight of the vote is calulcated as following:</span>
            <ul>
              <li>Sum of all nodes of the farmer: (node CU * 2 + node SU)</li>
            </ul>
          </div>
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
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'Info',
  props: ['open', 'close'],
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
