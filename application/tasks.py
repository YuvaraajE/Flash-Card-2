from main import celery, db, Decks, UserDecks
from celery.schedules import crontab
from flask_security import current_user
import datetime
import requests
import json
webhook_url = 'https://chat.googleapis.com/v1/spaces/AAAAXWdk-54/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=S9GxX6JtuKcp9KlWXEg6CUOMRGLQjYEbUpmINsHkTzs%3D'

@celery.on_after_finalize.connect
def daily_remaider_jobs(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=20, minute=0, day_of_week='*', day_of_month='*',month_of_year='*'), sendMessage.s())

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
    if duration >= 1:
        response = requests.post(webhook_url, data=json.dumps(bot_message), headers=message_headers)
        print(response.text)
    else:
        print("Deck reviewed for today")