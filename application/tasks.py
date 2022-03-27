from main import celery, db, Decks, UserDecks, DeckCards, User
from celery.schedules import crontab
from flask_security import current_user, login_required
from jinja2 import Template
from weasyprint import HTML
import datetime
import requests
import json
import csv


webhook_url = 'https://chat.googleapis.com/v1/spaces/AAAAXWdk-54/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=S9GxX6JtuKcp9KlWXEg6CUOMRGLQjYEbUpmINsHkTzs%3D'

@login_required
@celery.on_after_finalize.connect
def daily_remaider_jobs(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=20, minute=0, day_of_week='*', day_of_month='*',month_of_year='*'), sendMessage.s(current_user.id,current_user.username))
    sender.add_periodic_task(crontab(hour=20, minute=0, day_of_month='1',month_of_year='*'), sendReport.s(current_user.id,current_user.username))

@celery.task()
def sendMessage(id, name):
    user_decks = UserDecks.query.filter_by(user_id=id).all()
    mx = datetime.datetime.combine(datetime.date(1,1,1), datetime.time(0, 0))
    for user_deck in user_decks:
        d = Decks.query.filter_by(deck_id=user_deck.deck_id).first()
        if d.last_reviewed > mx:
            mx = d.last_reviewed

    curr_date = datetime.datetime.now()
    duration = curr_date - mx
    duration = duration.days

    bot_message = {
        'text' : 'Hello, ' + name + '\nYou have decks pending to be reviewed!\n<http://localhost:8080|click here> to review.'
    }

    message_headers = {'Content-Type': 'application/json; charset=UTF-8'}
    user = User.query.filter_by(id=id).first()
    if duration >= 1:
        response = requests.post(webhook_url, data=json.dumps(bot_message), headers=message_headers)
        print(response)
        user.curr_streak = 1
    else:
        user.curr_streak += 1
        if user.highest_streak < user.curr_streak:
            user.highest_streak = user.curr_streak
    db.session.commit()

@celery.task()
def exportDeck(id):
    user_decks = UserDecks.query.filter_by(user_id=id).all()
    with open('user_decks.csv', 'w') as deck_file:
        writer = csv.writer(deck_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        s_no = 1
        writer.writerow(['S.no', 'id', 'name', 'score', 'last_reviewed', 'cards_count'])
        for user_deck in user_decks:
            d = Decks.query.filter_by(deck_id=user_deck.deck_id).first()
            deck_cards = DeckCards.query.filter_by(deck_id = user_deck.deck_id).all()
            card_num = len(deck_cards)
            writer.writerow([s_no, d.deck_id, d.name, d.score, d.last_reviewed, card_num])
            s_no += 1
        return 200


@celery.task() 
def sendReport(id, username):
    overall_score = 0
    num_decks_del = 0
    num_cards_del = 0
    num_cards = 0
    user = User.query.filter_by(id=id).first()
    streak = user.highest_streak
    num_decks_del = user.decks_deleted
    user.decks_deleted = 0
    user.highest_streak = 0
    db.session.commit()
    user_decks = UserDecks.query.filter_by(user_id=id).all()
    num_decks = len(user_decks) 
    decks = []
    for user_deck in user_decks:
        d = Decks.query.filter_by(deck_id=user_deck.deck_id).first()
        deck_cards = DeckCards.query.filter_by(deck_id = user_deck.deck_id).all()
        num_cards += len(deck_cards)
        num_cards_del += d.cards_deleted
        d.cards_deleted = 0
        entry = {}
        entry["name"] = d.name
        entry["avg_score"] = d.tot_score / 30
        overall_score += entry["avg_score"]
        decks.append(entry)
        d.tot_score = 0
        db.session.commit()
    overall_score = overall_score / num_decks

    template_file = "./templates/report.html"
    with open(template_file) as f:
        template = Template(f.read())
        rendered_temp = template.render(decks=decks, num_decks=num_decks,num_cards=num_cards,username=username, overall_score = overall_score, streak=streak, num_decks_del=num_decks_del, num_cards_del=num_cards_del)
        html = HTML(string = rendered_temp)
        file_name = username + '_monthly_report.pdf'
        html.write_pdf(file_name)
        # Send to email