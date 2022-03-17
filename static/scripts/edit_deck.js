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

Vue.component('show-cards', {
  props: ['cards', 'deck'],
  template: `
  <div v-if="cards" class="m-3">
  <h2 class="m-3"><span class="font-weight-light font-italic">{{deck.name}}</span> - Cards</h2>    
  <table class="table table-striped">
          <thead class="thead-dark">
              <tr>
                  <th scope="col">S.no</th>
                  <th scope="col">Front</th>
                  <th scope="col">Back</th>
                  <th scope="col">Operations</th>
              </tr>
          </thead>
          <tbody>
              <tr v-for="(card, i, index) in cards">
                  <th scope="row">{{index + 1}}</th>
                  <td>{{card.front}}</td>
                  <td>{{card.back}}</td>
                      <td><button type ="button" @click="setSelectedCard(card.id, card.front, card.back)" class="btn btn-outline-dark mr-2" data-bs-toggle="modal" data-bs-target="#editCardModal" data-bs-card_id = "card.id" data-bs-front = "card.front" data-bs-back = "card.back">Edit</button> 
                      <button v-on:click="delete_card('http://localhost:8080/delete_card/', card.id)" class="btn btn-outline-danger">Delete</button> </td>
              </tr>
          </tbody>
      </table>
      <div class="modal fade" id="editCardModal" tabindex="-1" role="dialog" aria-labelledby="editCardModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editCardModalLabel">Edit a card</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    </button>
                </div>
                <div class="modal-body">
                    <p>Deck - <span class="font-weight-bold font-italic">{{deck.name}}</span></p>
                    <form @submit.prevent="submitForm" method="post" id="edit_card">
                        <div class="form-group"> 
                            <label for="front">Front</label>
                            <input type="text" id="front" name="front" v-model="card_front" class="form-control" required> 
                        </div>
                        <div>
                            <label for="back">Back</label>
                            <input type="text" id="back" name="back" v-model="card_back" class="form-control" required>
                        </div>
                    </form>
                    <div class="modal-footer">
                        <button form="edit_card" class="btn btn-success">Edit</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
  </div>
  <div v-else >
  <h2 class="m-3"><span class="font-weight-light font-italic">{{deck.name}}</span> - Cards</h2>
  <p class="m-3">No cards found in this deck, go to <a class = "text-danger" href="/">dashboard</a> to add one.</p></div>
  `, 
  methods : {
    delete_card: function (url, id) {
      this.$parent.delete_card(id)
      token = localStorage.getItem('token')
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('token')
      },
        body: JSON.stringify({"id": id}) 
      });
    },
      submitForm: async function() {
        $("#editCardModal").modal("hide");
        token = localStorage.getItem('token')
        await fetch('/edit_card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('token') },
          body: JSON.stringify({
            'card_front': this.card_front,
            'card_back': this.card_back, 
            'card_id' : this.card_id
          }) 
        });
        this.$parent.editCard(this.card_id, this.card_front, this.card_back)
      },
      setSelectedCard: function(id, front, back){
        this.card_id = id
        this.card_front = front
        this.card_back = back
      }
  },
  data() {
    return {
      card_front: '',
      card_back: '', 
      card_id: ''
    }}
})

Vue.component('edit-deck', {
  props: ['deck'],
  template: `
  <div class="m-3">
  <h2>Edit Deck</h2>
      <form @submit.prevent="submitForm" method="post" id="edit_deck">
          <div class="form-group">
              <label for="deck_name">Name</label>
              <input type="text" id="deck_name" ref="deck_name" :value="deck.name" class="form-control" required>
          </div>
          <button form="edit_deck" class="mt-2 btn btn-success">Edit</button>
      </form>
  </div>`,
  methods: {
  submitForm: function() {
    let name = this.$refs.deck_name.value
    let token = localStorage.getItem('token')
    this.$parent.editDeck(name)
    fetch('/edit/' + this.deck.id +'?auth_token='+token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // pass in the information from our form
      body: JSON.stringify({
        deck_name: name, 
      }) 
    });
  }
}})


var app2 = new Vue({
    el: '#app2',
    data: {
      deck: '',
      username: '', 
      cards: {}
    },
    created: async function () {
      this.getUserDetail()
      this.getDeckDetail(localStorage.getItem('currentDeckID'))
      this.getCardDetail(localStorage.getItem('currentDeckID'))
    },
    methods: {
      getUserDetail: function () {
        fetch('http://localhost:8080/api/getUserDetails', {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => this.username = data.username).catch(err => console.log(err));
    },
      getDeckDetail: function (id) {
      fetch('http://localhost:8080/api/getDeckDetail/' + id, {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => this.deck = data).catch(err => console.log(err));
  }, 
    editDeck :  function (name) {
      this.deck["name"] = name
    },
    getCardDetail: function (id) {
      fetch('http://localhost:8080/api/getCardDetail/' + id, {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => this.cards = data).catch(err => console.log(err));
    },
    delete_card: function(id)
    {
      // delete this.cards[id];
      newCards = {}
        for (i in this.cards) {
          if (i != id)
          {
            newCards[i] = this.cards[i]
          }
        }
        this.cards = {
          ...newCards
        }
    }, 
    editCard: function(id, front, back) 
    {
      this.cards[id]["front"] = front
      this.cards[id]["back"] = back
    }
  },
      delimiters: ['[[',']]'],
  })