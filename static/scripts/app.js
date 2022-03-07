Vue.component('nav-bar', {
  props: ['username'],
  template: `<nav class="navbar navbar-expand-lg navbar-light" style="background-color: #e4e4e4;"> 
  <div class="container-fluid">
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
      <h5 v-else class="card-text font-weight-normal">Last reviewed - {{deck.last_reviewed}} </h5> 

      <a :href="'/review/' + deck.id" class="btn btn-outline-success mr-2">Review</a>
      <a :href="'/edit/' + deck.id" class="btn btn-outline-dark mr-2">Edit</a>
      <a :href="'/delete/' + deck.id" class="btn btn-outline-danger">Delete</a>
  </div>
</div>`
})

var app = new Vue({
    el: '#app',
    data: {
      username: "", 
      decks: {}
    },
    created: function () {
      this.getUserDetail()
      this.getDeckDetail()
    },
    methods: {
      getUserDetail: function () {
        fetch('http://localhost:8080/api/getUserDetails').then(response => response.json()).then(data => this.username = data.username).catch(err => console.log(err));
    },
      getDeckDetail: function() {
        fetch('http://localhost:8080/api/getDeckDetails').then(response => response.json()).then(data => this.decks = data).catch(err => console.log(err));
      } 

  },
      delimiters: ['[[',']]'],
  })
