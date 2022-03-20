from main import app, Cards, Decks, UserDecks, DeckCards, User
from flask import render_template, flash
from flask import request, url_for, redirect, send_file
from flask_cors import cross_origin
from flask_security import login_required, current_user, auth_required
from application import tasks
from main import db
import json
import datetime
import uuid
import requests

user = {
    "username": "", 
    "id": "", 
    "token": ""
}

# --------------------------- Register New User -------------------------------
@app.route("/register_user", methods=["POST"])
def register_user():
    mail = request.form.get('u_email')
    uname = request.form.get('u_name')
    pwd = request.form.get('u_pwd')
    new_user = User(username=uname, password=pwd, email=mail, curr_streak = 0, max_streak = 0, decks_deleted = 0,  fs_uniquifier=uuid.uuid4().hex[:10], active=1)
    db.session.add(new_user)
    db.session.commit()
    return redirect(url_for("dashboard"))
    


# --------------------------- Home Page -------------------------------
@app.route("/")
@login_required
def dashboard():
    # Authentication token 
    user["username"] = current_user.username
    user["id"] = current_user.id

    if not user["token"]:
        r = requests.post('http://localhost:8080/login?include_auth_token', 
                        data=json.dumps({'email':current_user.email, 'password':current_user.password}), 
                        headers={'content-type': 'application/json'})

        response = r.json()
        user["token"] = response['response']['user']['authentication_token']

    # Get all decks of user to display it
    user_decks = UserDecks.query.filter_by(user_id=current_user.id).all()
    # Used to store no. of cards in each deck
    decks = {}

    for user_deck in user_decks:
        d = Decks.query.filter_by(deck_id=user_deck.deck_id).first()
        deck_cards = DeckCards.query.filter_by(deck_id = user_deck.deck_id).all()
        card_num = len(deck_cards)
        decks[d] = card_num
    return render_template("index.html", token=user["token"]) 

# ----------------------- Deck Management ----------------------------- 
@app.route("/add", methods=["POST"])
@auth_required("token")
def add():
    name = request.json.get("deck_name")
    id = request.json.get("deck_id")
    if name is None or name == '':
        flash(message = "Name can't be empty")
        return redirect(url_for("dashboard"))
    else:
        new_deck = Decks(name=name, deck_id=id, tot_score=0, cards_deleted=0)
        db.session.add(new_deck)
        db.session.commit()
        new_user_deck = UserDecks(user_id = current_user.id, deck_id = new_deck.deck_id)
        db.session.add(new_user_deck)
        db.session.commit()

@app.route("/delete/", methods=["POST"])
@auth_required("token")
def delete():
    #Delete all cards related to deck
    deck_id = request.json.get("deck_id")
    d = Decks.query.filter_by(deck_id=deck_id).first()
    user = User.query.filter_by(id=current_user.id).first()
    if d is not None:
        deck_cards = DeckCards.query.filter_by(deck_id=deck_id).all()
        for deck_card in deck_cards:
            card = Cards.query.filter_by(card_id=deck_card.card_id).first()
            db.session.delete(deck_card)
            db.session.delete(card)

        #Delete all user_decks related to deck
        user_decks = UserDecks.query.filter_by(user_id = current_user.id, deck_id=deck_id).all()
        for user_deck in user_decks:
            db.session.delete(user_deck)
        db.session.delete(d)
        user.decks_deleted += 1
        db.session.commit()
    else:
        flash(message = "Deck can't be found")

@app.route("/edit/<int:deck_id>", methods=["GET", "POST"])
@auth_required("token")
def edit(deck_id):
    deck = Decks.query.filter_by(deck_id = deck_id).first()
    name = deck.name
    if request.method == "GET":
        deck_cards = DeckCards.query.filter_by(deck_id = deck_id).all()
        cards = []
        for deck_card in deck_cards:
            card = Cards.query.filter_by(card_id = deck_card.card_id).first()
            cards.append(card)
        return render_template("edit_deck.html", deck=deck, cards = cards)
    else:
        new_name = request.json.get("deck_name")
        if new_name is None or new_name == '':
            flash('Name must not be empty!')
            return redirect(url_for("edit", deck_id = deck_id))
        if new_name != name:
            deck.name = new_name
            db.session.commit()
            

# ---------------------- Card Management ---------------------------
@app.route("/add_card", methods=["POST"])
@auth_required("token")
def add_card():
    ques = request.json.get("card_front")
    ans = request.json.get("card_back")
    flag = True
    if ques is None or ques == '':
        flash(message = "Question can't be empty")
        flag = False
    if ans is None or ans == '':
        flash(message = "Answer can't be empty")
        flag = False
    # Ques and ans is not empty - flag = True
    if flag:
        deck_id = request.json.get('deck_id')
        new_card = Cards(front = ques, back = ans, score = 0, count = 0)
        db.session.add(new_card)
        db.session.commit()
        new_deck_card = DeckCards(deck_id = deck_id, card_id = new_card.card_id)
        db.session.add(new_deck_card)
        db.session.commit()
    return redirect(url_for("dashboard"))

@app.route("/edit_card", methods=["POST"])
@auth_required("token")
def edit_card():
    card_id = request.json.get('card_id')
    card = Cards.query.filter_by(card_id = card_id).first()
    front = request.json.get('card_front')
    back = request.json.get('card_back')

    if (front != '' and back != ''):
        card.front = front
        card.back = back
        db.session.commit()
    else:
        if front is None or front == '':
            flash("Question can't be empty!")
        if back is None or back == '':
            flash("Answer can't be empty!")


@app.route("/delete_card/", methods=["POST"])
@auth_required("token")
def delete_card():
    card_id = request.json.get("id")
    card = Cards.query.filter_by(card_id =card_id).first()
    if card is None:
        flash("Card not found or can't be deleted!")
        return redirect(url_for("dashboard"))
    else:
        deck_card = DeckCards.query.filter_by(card_id = card_id).first()
        deck = Decks.query.filter_by(deck_id = deck_card.deck_id).first()
        if deck_card:
            db.session.delete(deck_card)
        deck.cards_deleted += 1
        db.session.delete(card)
        db.session.commit()

# ------------------- Deck Review --------------------------------
@app.route("/review/<int:deck_id>", methods=["GET", "POST"])
@auth_required("token")
def review(deck_id):
    # Basic Validation
    deck = Decks.query.filter_by(deck_id = deck_id).first()
    if deck is None:
        flash("Deck can't be found!")
        return redirect(url_for("dashboard"))
    deck_cards = DeckCards.query.filter_by(deck_id = deck_id).all()

    if len(deck_cards) == 0:
        print("No cards")
        flash("No cards in the deck!")
        return redirect(url_for("dashboard"))
    cards = []

    # Check which cards need to be reviewed
    
    if request.method == "GET":
        card_count = 0
        for deck_card in deck_cards:
            card = Cards.query.filter_by(card_id = deck_card.card_id).first()
            card_count += 1
            if card.score < 18:
                cards.append(card)
        if not cards:
            sum_count = 0
            count = 0
            for deck_card in deck_cards:
                mod_card = Cards.query.filter_by(card_id = deck_card.card_id).first()
                mod_card.score = 0
                sum_count += mod_card.count
                mod_card.count = 0
                count += 1
            avg_count = sum_count // count
            deck.score = avg_count
            deck.tot_score += avg_count
            deck.last_reviewed = datetime.datetime.now()
            db.session.commit()
        else:
            return render_template("review.html")
        
    
    # POST
    else:
        eval = request.json.get("eval")
        card_id = request.json.get('card_id')
        card = Cards.query.filter_by(card_id = card_id).first()
        if eval == "easy":
            card.score = card.score + 9
        elif eval == "medium":
            card.score = card.score + 6
        else:
            card.score = card.score + 3
        card.count = card.count + 1 
        db.session.commit()


# APIs 
@app.route('/api/getUserDetails')
def getUserId():
    return json.dumps(user)

@app.route("/api/getDeckDetails")
def getDeckDetails():
    decks = {}
    user_decks = UserDecks.query.filter_by(user_id=user["id"]).all()
    for user_deck in user_decks:
        d = Decks.query.filter_by(deck_id=user_deck.deck_id).first()
        deck_cards = DeckCards.query.filter_by(deck_id = user_deck.deck_id).all()
        card_num = len(deck_cards)
        decks[user_deck.deck_id] = {}
        decks[user_deck.deck_id]["name"] = d.name
        decks[user_deck.deck_id]["score"] = d.score
        if d.last_reviewed:
            decks[user_deck.deck_id]["last_reviewed"] = d.last_reviewed.strftime("%m/%d/%Y, %H:%M:%S")
        else:
            decks[user_deck.deck_id]["last_reviewed"] = d.last_reviewed
        decks[user_deck.deck_id]["count"] = card_num
        decks[user_deck.deck_id]["id"] = user_deck.deck_id
    return json.dumps(decks)

@app.route("/api/getMaxDeckID")
def getMaxDeckID():
    m = -1
    decks = Decks.query.all()
    for deck in decks:
        if deck.deck_id > m:
            m = deck.deck_id
    return json.dumps({'max_id': m})

@app.route("/api/getDeckDetail/<int:deck_id>")
def getDeckDetail(deck_id):
    deck = Decks.query.filter_by(deck_id = deck_id).first()
    d_deck = {}
    d_deck["id"] = deck.deck_id
    d_deck["name"] = deck.name
    d_deck["score"] = deck.score
    deck_cards = DeckCards.query.filter_by(deck_id = deck.deck_id).all()
    card_num = len(deck_cards)
    d_deck["count"] = card_num
    if deck.last_reviewed:
        d_deck["last_reviewed"] = deck.last_reviewed.strftime("%m/%d/%Y, %H:%M:%S")
    else:
        d_deck["last_reviewed"] = deck.last_reviewed
    return json.dumps(d_deck)

@app.route("/api/getCardDetail/<int:deck_id>")
def getCardDetail(deck_id):
    deck_cards = DeckCards.query.filter_by(deck_id = deck_id).all()
    cards = {}
    for deck_card in deck_cards:
        card = Cards.query.filter_by(card_id = deck_card.card_id).first()
        cards[card.card_id] = {}
        cards[card.card_id]["front"] = card.front 
        cards[card.card_id]["back"] = card.back
        cards[card.card_id]["id"] =  card.card_id 
        cards[card.card_id]["score"] = card.score 
        cards[card.card_id]["count"] =  card.count
    return json.dumps(cards)

@app.route("/remaind")
def hello():
    job = tasks.sendMessage.delay(current_user.id, current_user.username)
    return str(job) +" " + str(current_user.id), 200

@app.route("/export")
def export():
    job = tasks.exportDeck.delay(current_user.id)
    while job.state != "SUCCESS":
        pass
    return send_file('user_decks.csv',  as_attachment=True)


@app.route("/report")
def report():
    job = tasks.sendReport.delay(current_user.id, current_user.username)
    while job.state != "SUCCESS":
        pass
    file = current_user.username + '_monthly_report.pdf'
    return send_file(file, as_attachment=True)