language = "python3"
run = "python3 main.py"

To run celery workers
run = "celery -A main.celery worker -l info"

To run celery beats for sheduled tasks
run = "celery -A main.celery beat --max-interval 1 -l info"

To run redis server
run = "redis-server"

To run mailhog server
run = "~/go/bin/MailHog"

Packages required

flask 
flask_sqlalchemy 
flask_security 
flask_cors 
flask_restful 
flask_caching
weasyprint 
celery
MailHog
smtplib
jinja2
 
Login Information

email - Beerus@example.com 
password - 123456