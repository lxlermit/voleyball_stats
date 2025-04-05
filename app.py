# from flask import Flask
# from routes import init_routes
# import os
#
# app = Flask(__name__)
# app.secret_key = 'your_very_secret_key_12345'
# app.teams_dir = 'teams'
# app.matches_dir = 'matches'
#
# init_routes(app)
#
# if __name__ == '__main__':
#     os.makedirs('teams', exist_ok=True)
#     os.makedirs('matches', exist_ok=True)
#     app.run(host='0.0.0.0', port=5000, debug=True)
from flask import Flask
from routes import init_routes
from models import init_models

app = Flask(__name__)
app.secret_key = 'your_very_secret_key_12345'

# Инициализация
init_models(app)
init_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)