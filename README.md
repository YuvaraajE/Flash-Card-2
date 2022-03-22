language = "python3"
run = "python3 main.py"

To run celery workers
run = "celery -A main.celery worker -l info"

To run celery beats for sheduled tasks
run = "celery -A main.celery beat --max-interval 1 -l info"

To run redis server
run = "redis-server"

## Packages required
flask <br>
flask_sqlalchemy <br>
flask_security <br>
flask_cors <br>
flask_restful <br>
weasyprint <br>
celery
 
## Login Information
email - Beerus@example.com <br>
password - 123456