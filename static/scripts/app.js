const home = {template: `
    <div class="p-3">
    <h2 class="d-inline font-weight-normal h1">Your Decks</h2>
    <button class="btn btn-secondary float-right m-2" data-toggle="modal" data-target="#addCardModal">Add Card</button>
    <button class="btn btn btn-dark float-right m-2" data-toggle="modal" data-target="#addDeckModal">Add Deck</button>
    </div>

                        <!-- ----------------------------Bootstrap Modals----------------------------------------- -->

    <!------------------------------------------------- Add deck Modal - Create Deck Form ---------------------------------------------------------------->
    <deck-modal :decks="decks" :last_deck_id="last_deck_id"></deck-modal>
    <!------------------------------------------------- Add Card Modal - Add Card Form ---------------------------------------------------------------->
    <card-modal :decks="decks"></card-modal>
    <!------------------------------------------ User's Decks --------------------------------------->
    <div v-if="decks" class="d-flex flex-wrap">
    <user-deck v-for="deck in decks" v-bind:key="deck.id" :data="deck" :deck="deck"></user-deck>
    </div>
    <div v-else class="d-flex m-5 justify-content-center">
    <p class="text-dark display-4">No deck is found, add a new one!</p>
    </div>
    </div>
    <script>
        window.onload = function() {
        let token = "{{token}}"
        localStorage.setItem("token", token);
};
    </script>
    <link rel="stylesheet" href="/static/styles/index.css">
`}

// TODO use vue ui in other pages and create a router
const edit_deck = {template: ` 
`}

const review = {template: `

`
}

Vue.component('deck-modal', {
  props: ['decks', 'last_deck_id'],
  template: `<div class="modal fade" id="addDeckModal" tabindex="-1" role="dialog" aria-labelledby="addDeckModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
          <div class="modal-header">
              <h5 class="modal-title" id="addDeckModalLabel">Create a new deck</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true" class="text-danger">&times;</span>
              </button>
          </div>
          <div class="modal-body">
              <form @submit.prevent="submitForm" method="post" id="add_deck">
                  <div class="form-group">
                      <label for="deck_name">Name</label>
                      <input type="text" v-model="deck_name" name="deck_name" class="form-control" placeholder="Enter deck name" required>
                  </div>
              </form>
          </div>
          <div class="modal-footer">
              <button form="add_deck" class="btn btn-success">Create</button>
          </div>
      </div>
  </div>
</div>`, 
data() {
  return {
    deck_name: '',
  }
}, 
methods: {
submitForm: function() {
  $("#addDeckModal").modal("hide");
  let token = localStorage.getItem('token')
  this.$parent.addDeck(this.last_deck_id + 1, this.deck_name, 0)
  fetch('/add?auth_token='+token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // pass in the information from our form
    body: JSON.stringify({
      deck_name: this.deck_name, 
      deck_id : this.last_deck_id + 1
    }) 
  });
}}
})

Vue.component('card-modal', 
{
  props: ['decks'],
  template: `
  <div class="modal fade" id="addCardModal" tabindex="-1" role="dialog" aria-labelledby="addCardModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
          <div class="modal-header">
              <h5 class="modal-title" id="addCardModalLabel">Add a new card</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true" class="text-danger">&times;</span>
              </button>
          </div>
          <div class="modal-body">
              <form @submit.prevent="submitForm" method="post" id="add_card">
                  <div class="form-group">
                      <label for="deck_id">Choose a Deck</label>
                      <select id="deck_id" v-model="deck_id" class="form-control">
                          <option v-for="(deck, id, i) in decks" :value="id" :selected="i == 0" >{{deck.name}}</option>
                      </select>
                  </div>
                  <div class="form-group">
                      <label for="card_front">Question</label>
                      <input type="text" class="form-control" v-model="card_front" id="card_front" placeholder="Enter question" required>
                  </div>
                  <div class="form-group">
                      <label for="card_back">Answer</label>
                      <input type="text" class="form-control" v-model="card_back" id="card_back" placeholder="Enter answer" required>
                  </div>
                </form>
          </div>
          <div class="modal-footer">
              <button form="add_card" class="btn btn-success">Add</button>
          </div>
      </div>
  </div>
</div>
  `, 
  methods: {
    submitForm: async function() {
      $("#addCardModal").modal("hide");
      token = localStorage.getItem('token')
      await fetch('/add_card?auth_token='+token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // pass in the information from our form
        body: JSON.stringify({
          'card_front': this.card_front,
          'card_back': this.card_back, 
          'deck_id' : this.deck_id
        }) 
      });
      this.$parent.incrCount(this.deck_id)
    }
  }, 
data() {
  return {
    card_front: '',
    card_back: '', 
    deck_id: ''
  }
}
})

Vue.component('nav-bar', {
  props: ['username'],
  template: `<nav class="navbar navbar-expand-lg navbar-light" style="background-color: #e4e4e4;"> 
  <div class="container-fluid">
  <!-- <router-link to="/">Dashboard</router-link> -->
  <a class="navbar-brand" href="/">Dashboard</a>
      <span class="navbar-text">
          Welcome back, {{username}}
      </span>
      <!-- Clear the local storage auth token and logout the user -->
      <button type="button" class="btn btn-outline-danger" onclick="localStorage.removeItem('token');location.href='/logout';">logout</button>
  </div>
  </nav>`
})

Vue.component('user-deck', {
  props: ['deck'],
  template: `<div class="card m-3" style="min-width: 300px">
  <h4 class="card-header">{{deck.name}}</h4>
  <div class="card-body">
      <h5 class="card-text font-weight-normal">No. of cards - {{deck.count}}</h5> 
      
      <h5 v-if="!deck.score" class="card-text font-weight-normal">Remark - <span id='score_n'>None</span></h5>
      
      <h5 v-else-if="deck.score >= 1 && deck.score <= 2" class="card-text font-weight-normal">Remark - <span id='score_g'>Good</span></h5>
      
      <h5 v-else-if="deck.score >= 3 && deck.score <= 4" class="card-text font-weight-normal" >Remark - <span id='score_a'>Average</span></h5>
      
      <h5 v-else class="card-text font-weight-normal">Remark - <span id='score_b'>Bad</span></h5>
      
      <h5 v-if="deck.last_reviewed" class="card-text font-weight-normal">Last reviewed - {{deck.last_reviewed}}</h5>
      <h5 v-else class="card-text font-weight-normal">Last reviewed - Not yet! </h5> 

      <button v-on:click="authAndGet('http://localhost:8080/review/' + deck.id, deck.id)" class="btn btn-outline-success mr-2">Review</button> 
      <!-- <router-link to="/review:id" class="btn btn-outline-dark mr-2">Review</router-link> -->
      <button v-on:click="authAndGet('http://localhost:8080/edit/' + deck.id, deck.id)" class="btn btn-outline-dark mr-2">Edit</button> 
      <!-- <router-link to="/edit:id" class="btn btn-outline-dark mr-2">Edit</router-link> -->
      <button v-on:click="delete_deck('http://localhost:8080/delete/', deck.id)" class="btn btn-outline-danger">Delete</button>
  </div>
</div>`,
  methods: {
    authAndGet: function (url, id) {
      token = localStorage.getItem('token')
      localStorage.setItem('currentDeckID', id)
      fetch(url + '?auth_token='+token).then(response => window.location.href = response.url).catch(err => console.log(err));
    },
    authAndPost: function(url, content){
      token = localStorage.getItem('token')
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('token')
      },
        body: JSON.stringify(content) 
      });
    }, 
    delete_deck: async function(url, deck_id) {
      this.$parent.delDeck(deck_id)
      this.authAndPost(url, {'deck_id': deck_id})
    } 
  }
})

var app = new Vue({
    el: '#app',
    data: {
      username: "", 
      decks: {}, 
      last_deck_id: ''
    },
    created: async function () {
      this.getUserDetail()
      this.getDeckDetail()
      fetch('/api/getMaxDeckID').then(response => response.json()).then(data => this.last_deck_id = data["max_id"])
    },
    methods: {
      getUserDetail: function () {
        fetch('http://localhost:8080/api/getUserDetails', {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => this.username = data.username).catch(err => console.log(err));
    },
      getDeckDetail: function() {
        fetch('http://localhost:8080/api/getDeckDetails', {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => this.decks = data).catch(err => console.log(err));
      }, 

      addDeck: function(current_id, deck_name, count) {
        this.last_deck_id += 1
        let new_decks = {...this.decks}
        new_decks[current_id] = {'name': deck_name, 'score': '', 'last_reviewed': '', 'id': current_id, 'count': count}
        this.decks = {...new_decks}
      }, 
      incrCount: function(deck_id) {
        this.decks[deck_id].count++;
      }, 
      delDeck: function(deck_id) {
        newDecks = {}
        for (i in this.decks) {
          if (i != deck_id)
          {
            newDecks[i] = this.decks[i]
          }
        }
        this.decks = {
          ...newDecks
        }
        if (this.last_deck_id > 0){
          this.last_deck_id -= 1;
        }
      }

  },
      delimiters: ['[[',']]'],
  })
