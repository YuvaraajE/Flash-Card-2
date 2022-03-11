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
          <button form="edit_deck" class="btn btn-success">Edit</button>
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
      username: ''
    },
    created: async function () {
      this.getUserDetail()
      this.getDeckDetail(localStorage.getItem('currentDeckID'))
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
    }
  },
      delimiters: ['[[',']]'],
  })