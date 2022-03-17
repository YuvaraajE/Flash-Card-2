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

  Vue.component('deck', {
    props: ['deck'],
    template: `    <div class="card m-3">
    <h4 class="card-header">{{deck.name}}</h4>
    <div class="card-body">
    <h5 class="card-text font-weight-normal">No. of cards - {{deck.count}}</h5> 
      
    <h5 v-if="!deck.score" class="card-text font-weight-normal">Remark - <span id='score_n'>None</span></h5>
    
    <h5 v-else-if="deck.score >= 1 && deck.score <= 2" class="card-text font-weight-normal">Remark - <span id='score_g'>Good</span></h5>
    
    <h5 v-else-if="deck.score >= 3 && deck.score <= 4" class="card-text font-weight-normal" >Remark - <span id='score_a'>Average</span></h5>
    
    <h5 v-else class="card-text font-weight-normal">Remark - <span id='score_b'>Bad</span></h5>
    
    <h5 v-if="deck.last_reviewed" class="card-text font-weight-normal">Last reviewed - {{deck.last_reviewed}}</h5>
    <h5 v-else class="card-text font-weight-normal">Last reviewed - Not yet! </h5> 
    </div>
</div>`
  })



  Vue.component('deck-review', {
    props: ['deck', 'cards', 'curr_card'],
    template: `
    <div>
    <div v-if="Object.keys(cards).length">
    <div class="card text-center mx-auto" id="review-card" style="height: 15rem; width: 50%;">
        <div class="card-header">
            <h5>Card</h5>
        </div>
        <div class="card-body d-flex align-items-center flex-column justify-content-center" @click = showAns>
            <div style="width: 90%">
                <h4 class="p-3 font-weight-normal" style="word-wrap: break-word; ">{{ curr_card.front }}</h4>
            </div>
            <div style="width: 90%">
                <h4 class="p-3 font-weight-normal" id="back" style="display: none; word-wrap: break-word; ">{{ curr_card.back }}</h4>
            </div>
        </div>
    </div>

    <!--------------------------------------------- Review Buttons ------------------------------------------------->
      <div class="d-flex m-4 justify-content-center">
          <form @submit.prevent="submitForm" method="post">
              <button name="eval" @click="onEasyClick(curr_card.id)" value="easy" class="mr-3 btn btn-outline-success">Easy</button> 
              <button name="eval" @click="onMediumClick(curr_card.id)" value="medium" class="mr-3 btn btn-outline-secondary">Medium</button> 
              <button name="eval" @click="onHardClick(curr_card.id)" value="hard" class="mr-3 btn btn-outline-danger">Hard</button>
          </form>
      </div>
    </div>
    <div v-else class="text-center">
        <h1 class="font-weight-normal p-3 text-success">Deck Reviewed!</h1>
        <a href="/" class="btn btn-outline-dark">Go Home</a>
    </div>
    </div>
    </div>`,
    methods: {
        showAns: function() {
        ans = document.getElementById('back');
        ans.style.display = 'block';
    },
    hideAns: function() {
      ans = document.getElementById('back');
      ans.style.display = 'none';
    },
    onEasyClick: function(id) {
        this.mode = "easy"
        this.$parent.incScore(id, 9)
        this.$parent.incCount(id)
        this.submitForm(id)

    },    onMediumClick: function(id) {
            this.mode = "medium"
            this.$parent.incScore(id, 6)
            this.$parent.incCount(id)
            this.submitForm(id)

    },    onHardClick: function(id) {
            this.mode = "hard"
            this.$parent.incScore(id, 3)
            this.$parent.incCount(id)
            this.submitForm(id)

    },
    submitForm: async function(id) {
      let token = localStorage.getItem('token')
      if (this.l == '')
      {
        this.l = Object.keys(this.cards).length 
      }
        this.hideAns()
        if (this.cards[id]['score'] >= 18)
        {
          this.$parent.delete_card(id) 
          this.l -= 1  
        }
        if (this.l == 0)
        {
          await fetch('/review/' + this.deck.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
            'Authentication-Token': token
          },
            // pass in the information from our form
            body: JSON.stringify({
              'card_id': id,
              'eval': this.mode
            }) 
          })
          await fetch('/review/' + this.deck.id, {
            method: 'GET',
            headers: {
            'Authentication-Token': token
          }})
          this.$parent.getDeckDetail(this.deck.id)
        }
        else {
          await fetch('/review/' + this.deck.id, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
            'Authentication-Token': token
          },
          // pass in the information from our form
          body: JSON.stringify({
            'card_id': this.curr_card.id,
            'eval': this.mode
          }) 
        });
        var keys = Object.keys(this.cards);
        this.curr_card = this.cards[keys[ keys.length * Math.random() << 0]];
        }
      }
  },
  data() {
    return {
        mode: '', 
        l: '',
    }}
})

  var app3 = new Vue({
    el: '#app3',
    data: {
      deck: '',
      username: '', 
      cards: {}, 
      curr_card: ''
    },
    created : function () {
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
    getCardDetail: async function (id) {
      this.cards = await fetch('http://localhost:8080/api/getCardDetail/' + id, {headers:{'Authentication-Token': localStorage.getItem('token')}}).then(response => response.json()).then(data => data).catch(err => console.log(err));
      var keys = Object.keys(this.cards);
      this.curr_card =  this.cards[keys[ keys.length * Math.random() << 0]];
    }, 
    delete_card: function(id){
        delete this.cards[id]
    }, 
    incCount: function(id){
        this.cards[id].count += 1
    },
    incScore: function(id, s){
        this.cards[id].score += s
    }, 
  },
      delimiters: ['[[',']]'],
  })