from flask import render_template, request, redirect, url_for, session, flash, jsonify, abort
import json
import os
from datetime import datetime
from werkzeug.utils import secure_filename

from models import get_team_files, save_match_data, load_team_data

import logging
logging.basicConfig(level=logging.DEBUG)

# === Лимиты для запросов ===
MAX_TEAM_NAME_LENGTH = 50  # Максимальная длина имени команды
MAX_PLAYERS_PER_TEAM = 20  # Максимальное количество игроков
# ==========================


def init_routes(app):

    # Сохраняем ссылку на app для доступа в функциях
    global flask_app
    flask_app = app

    # Инициализация путей
    app.teams_dir = 'teams'  # относительный путь к папке с командами
    app.matches_dir = 'matches'  # относительный путь к папке с матчами

    # Создаем папки при их отсутствии
    os.makedirs(app.teams_dir, exist_ok=True)
    os.makedirs(app.matches_dir, exist_ok=True)

    @app.route('/')
    def index():
        try:
            teams = [f.replace('.json', '') for f in os.listdir('teams') if f.endswith('.json')]
            return render_template('index.html', teams=teams)
        except Exception as e:
            flash(f'Ошибка загрузки команд: {str(e)}', 'error')
            return render_template('index.html', teams=[])

    @app.route('/live_stats')
    def live_stats():
        if 'match_data' not in session:
            flash('Сначала настройте параметры матча', 'error')
            return redirect(url_for('match'))

        team_name = session['match_data']['our_team']
        filename = os.path.join(flask_app.config['UPLOAD_FOLDER'], f"{team_name}.json")

        with open(filename, 'r', encoding='utf-8') as f:
            team_data = json.load(f)

        return render_template('live_stats.html',
                               team=team_data['players'],
                               match_data=session['match_data'])



    @app.route('/teams')
    @app.route('/teams')
    def teams():
        try:
            # Проверяем существование директории
            if not os.path.exists(app.teams_dir):
                os.makedirs(app.teams_dir)
                return render_template('teams.html', teams=[])

            # Получаем список файлов команд
            team_files = [f for f in os.listdir(app.teams_dir)
                          if f.endswith('.json') and os.path.isfile(os.path.join(app.teams_dir, f))]

            teams = []
            for filename in team_files:
                try:
                    with open(os.path.join(app.teams_dir, filename), 'r', encoding='utf-8') as f:
                        team_data = json.load(f)
                        teams.append({
                            'name': team_data.get('team', filename[:-5]),
                            'filename': filename,
                            'player_count': len(team_data.get('players', []))
                        })
                except json.JSONDecodeError:
                    continue  # Пропускаем битые JSON-файлы

            return render_template('teams.html', teams=teams)

        except Exception as e:
            flash(f'Ошибка загрузки команд: {str(e)}', 'error')
            return render_template('teams.html', teams=[])

    @app.route('/team/<team_name>')
    def team_detail(team_name):
        # Загружаем данные с обработкой ошибок
        team_result = load_team_data(team_name, app.teams_dir)

        # Обработка ошибок
        if team_result['status'] != 'success':
            flash(team_result.get('message', 'Команда не найдена'), 'error')
            abort(404)

        team_data = team_result['data']

        # Группировка игроков по амплуа
        players_by_role = {}
        for player in team_data.get('players', []):
            role = player.get('role', 'Без амплуа')
            if role not in players_by_role:
                players_by_role[role] = []
            players_by_role[role].append(player)

        return render_template('team_detail.html',
                               team=team_data,
                               players_by_role=players_by_role,
                               team_name=team_name)

    @app.route('/create_team', methods=['GET'])
    def show_create_team():
        try:
            existing_teams = [f.replace('.json', '') for f in os.listdir('teams') if f.endswith('.json')]
            return render_template('edit_team.html',
                                   existing_teams=existing_teams,
                                   creating_new=True,
                                   new_team_players=[])
        except Exception as e:
            flash(f'Ошибка при создании команды: {str(e)}', 'error')
            return redirect(url_for('index'))

    @app.route('/edit_team/<team_name>')
    def edit_existing_team(team_name):
        try:
            existing_teams = [f.replace('.json', '') for f in os.listdir('teams') if f.endswith('.json')]
            filename = os.path.join(app.teams_dir, f"{team_name}.json")

            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    team_data = json.load(f)
                return render_template('edit_team.html',
                                       existing_teams=existing_teams,
                                       creating_new=True,
                                       players=team_data['players'],
                                       team_name=team_name)
            else:
                flash(f'Команда "{team_name}" не найдена', 'error')
                return redirect(url_for('index'))
        except Exception as e:
            flash(f'Ошибка загрузки команды: {str(e)}', 'error')
            return redirect(url_for('index'))

    @app.route('/save_team', methods=['POST'])
    def save_team():
        try:
            team_name = request.form['team_name']
            players = []
            used_numbers = set()

            i = 1
            while f'number_{i}' in request.form:
                number = request.form[f'number_{i}']
                if number in used_numbers:
                    flash(f'Номер {number} уже используется!', 'error')
                    return redirect(url_for('edit_existing_team', team_name=team_name))

                used_numbers.add(number)
                players.append({
                    'number': number,
                    'last_name': request.form[f'last_name_{i}'],
                    'first_name': request.form[f'first_name_{i}'],
                    'role': request.form[f'role_{i}'],
                    'front_pos': request.form[f'front_pos_{i}'],
                    'back_pos': request.form[f'back_pos_{i}'],
                    'color': request.form.get(f'color_{i}', '#FF5733')
                })
                i += 1

            filename = os.path.join(app.teams_dir, f"{team_name}.json")
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({'team': team_name, 'players': players}, f, ensure_ascii=False)

            flash(f'Команда "{team_name}" успешно сохранена!', 'success')
            return redirect(url_for('edit_existing_team', team_name=team_name))

        except Exception as e:
            flash(f'Ошибка сохранения: {str(e)}', 'error')
            return redirect(url_for('index'))

    @app.route('/delete_team', methods=['POST'])
    def delete_team():
        try:
            team_name = request.form['team_name']
            filename = os.path.join(app.teams_dir, f"{team_name}.json")

            if os.path.exists(filename):
                os.remove(filename)
                flash(f'Команда "{team_name}" удалена', 'success')
            else:
                flash(f'Команда "{team_name}" не найдена', 'error')

            return redirect(url_for('index'))
        except Exception as e:
            flash(f'Ошибка удаления команды: {str(e)}', 'error')
            return redirect(url_for('index'))

    @app.route('/match', methods=['GET', 'POST'])
    def match():
        if request.method == 'POST':
            # Проверка обязательных полей
            if 'our_team' not in request.form or not request.form['our_team']:
                flash('Не выбрана наша команда!', 'error')
                return redirect(url_for('match'))

            # Сохраняем данные матча в сессию
            session['match_data'] = {
                'city': request.form.get('city', 'Санкт-Петербург'),
                'address': request.form.get('address', ''),
                'competition': request.form.get('competition', ''),
                'opponent': request.form.get('opponent', 'Команда соперника'),
                'our_team': request.form['our_team']
            }

            team_name = request.form['our_team']
            team_file = os.path.join(app.teams_dir, f"{team_name}.json")

            # Загружаем данные команды
            try:
                with open(team_file, 'r', encoding='utf-8') as f:
                    team_data = json.load(f)
            except Exception as e:
                flash(f'Ошибка загрузки команды: {str(e)}', 'error')
                return redirect(url_for('match'))

            # Подготавливаем структуру для статистики игроков
            players_stats = {}
            for player in team_data['players']:
                players_stats[player['number']] = {
                    'player_info': player,
                    'actions': {
                        'serving': {'ace': 0, 'good': 0, 'bad': 0, 'error': 0, 'total': 0},
                        'attack': {'win_total': 0, 'shot_good': 0, 'shot_bad': 0, 'no_point': 0, 'error_total': 0},
                        'block': {'win': 0, 'cover': 0, 'error': 0, 'total': 0},
                        'receive': {'excellent': 0, 'good': 0, 'bad': 0, 'error': 0, 'total': 0},
                        'set': {'excellent': 0, 'good': 0, 'bad': 0, 'error': 0, 'total': 0},
                        'defence': {'excellent': 0, 'good': 0, 'bad': 0, 'error': 0, 'total': 0}
                    },
                    'time_played': 0,
                    'rotations': []
                }

            # Генерируем безопасное имя файла для матча
            now = datetime.now()
            opponent_name = request.form.get('opponent', 'Команда соперника')

            # Очищаем имя от недопустимых символов
            def sanitize_filename(name):
                keepchars = (' ', '.', '_')
                return "".join(c for c in name if c.isalnum() or c in keepchars).rstrip()

            safe_opponent = sanitize_filename(opponent_name)
            filename = (
                f"{team_name}_{now.strftime('%Y_%m_%d__%H_%M')}_"
                f"{safe_opponent}.json"
            ).replace(" ", "_")

            # Создаем директорию matches если её нет
            os.makedirs(app.matches_dir, exist_ok=True)

            # Формируем структуру данных матча
            match_stats = {
                "meta": {
                    "date": now.strftime("%Y-%m-%d %H:%M:%S"),
                    "filename": filename,
                    "city": request.form.get('city', 'Санкт-Петербург'),
                    "address": request.form.get('address', ''),
                    "competition": request.form.get('competition', ''),
                    "our_team": team_name,
                    "opponent": opponent_name,
                    "status": "ongoing",
                    "team_lineup": [p['number'] for p in team_data['players']]
                },
                "sets": {},
                "players_stats": players_stats,
                "match_events": [],
                "team_stats": {
                    "total_points": 0,
                    "attack_points": 0,
                    "block_points": 0,
                    "serve_points": 0,
                    "opponent_errors": 0,
                    "timeouts_used": 0,
                    "substitutions_used": 0
                }
            }

            # Сохраняем данные матча
            try:
                filepath = os.path.join(app.matches_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(match_stats, f, ensure_ascii=False, indent=4)
            except Exception as e:
                flash(f'Ошибка при создании файла матча: {str(e)}', 'error')
                return redirect(url_for('match'))

            session['current_match_file'] = filename
            return redirect(url_for('live_stats'))

        # GET запрос - отображаем форму
        teams_result = get_team_files(app.teams_dir)

        if teams_result['status'] != 'success':
            flash(f"Ошибка загрузки команд: {teams_result.get('message', 'Неизвестная ошибка')}", 'error')
            return redirect(url_for('index'))

        teams = [f.replace('.json', '') for f in teams_result['files']]

        if not teams:
            flash('Сначала создайте команду!', 'error')
            return redirect(url_for('index'))

        return render_template('pre_game_setup.html',
                               teams=teams,
                               default_city='Санкт-Петербург',
                               default_opponent='Команда соперника')

    @app.route('/stats')
    def stats():
        try:
            with open('match_data.json', 'r') as f:
                match_data = json.load(f)
            return render_template('stats.html', data=match_data)
        except FileNotFoundError:
            return render_template('stats.html', data=None)

    @app.route('/settings')
    def settings():
        return render_template('app_settings.html')

    @app.route('/add_team', methods=['GET', 'POST'])
    def add_team():
        if request.method == 'POST':
            team_name = request.form.get('team_name').strip()
            if not team_name:
                return render_template('add_team.html', error="Введите название команды")

            filename = f"{team_name}.json"
            if filename in get_team_files(app.teams_dir):
                return render_template('add_team.html', error="Команда с таким именем уже существует")

            new_team = {
                "team": team_name,
                "players": []
            }

            with open(os.path.join(app.teams_dir, filename), 'w', encoding='utf-8') as f:
                json.dump(new_team, f, ensure_ascii=False, indent=4)

            return redirect(url_for('teams'))

        return render_template('add_team.html')

    @app.route('/record_event', methods=['POST'])
    def record_event():
        try:
            data = request.json
            filename = session.get('current_match_file')
            if not filename:
                return jsonify({'status': 'error', 'message': 'No active match'}), 400

            filepath = os.path.join(app.matches_dir, filename)

            with open(filepath, 'r+', encoding='utf-8') as f:
                stats = json.load(f)
                event = {
                    'timestamp': datetime.now().strftime("%H:%M:%S"),
                    'type': data['event_type'],
                    'player': data['player_number'],
                    'details': data.get('details', {}),
                    'set': data['current_set'],
                    'score': data['score']
                }
                stats['match_events'].append(event)

                player_stats = stats['players_stats'].get(data['player_number'])
                if player_stats:
                    action_type = data['event_type'].split('_')[0]
                    quality = data['event_type'].split('_')[-1]

                    if action_type in player_stats['actions']:
                        if quality in player_stats['actions'][action_type]:
                            player_stats['actions'][action_type][quality] += 1
                        player_stats['actions'][action_type]['total'] += 1

                    recalculate_derived_stats(player_stats)

                f.seek(0)
                json.dump(stats, f, ensure_ascii=False, indent=4)
                f.truncate()

            return jsonify({'status': 'success'})

        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

    def recalculate_derived_stats(player_stats):
        actions = player_stats['actions']

        serving = actions['serving']
        if serving['total'] > 0:
            serving['ace_minus_error_divide_total'] = (serving['ace'] - serving['error']) / serving['total']
            serving['good_plus_2ace_divide_2error_plus_bad'] = (serving['good'] + 2 * serving['ace']) / (
                    2 * serving['error'] + serving['bad'])

        attack = actions['attack']
        total_attacks = attack['win_total'] + attack['no_point'] + attack['error_total']
        if total_attacks > 0:
            attack['win_minus_error_divide_total'] = (attack['win_total'] - attack['error_total']) / total_attacks
            attack['win_plus_good_divide_bad_plus_error'] = (attack['win_total'] + attack['shot_good']) / (
                    attack['shot_bad'] + attack['error_total'])

    @app.route('/end_match', methods=['POST'])
    def end_match():
        try:
            filename = session.get('current_match_file')
            if not filename:
                return redirect(url_for('index'))

            filepath = os.path.join(app.matches_dir, filename)

            with open(filepath, 'r+', encoding='utf-8') as f:
                stats = json.load(f)
                stats['meta']['status'] = 'completed'
                stats['meta']['end_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                f.seek(0)
                json.dump(stats, f, ensure_ascii=False, indent=4)
                f.truncate()

            session.pop('current_match_file', None)
            flash('Матч успешно завершен и статистика сохранена', 'success')
            return redirect(url_for('index'))

        except Exception as e:
            flash(f'Ошибка при завершении матча: {str(e)}', 'error')
            return redirect(url_for('live_stats'))

    @app.route('/save_set', methods=['POST'])
    def save_set():
        try:
            logging.debug(f"Attempting to save to: {os.path.abspath(app.matches_dir)}")
            # Получаем данные из запроса
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'No data provided'}), 400

            filename = session.get('current_match_file')
            if not filename:
                return jsonify({'status': 'error', 'message': 'No active match'}), 400

            # Создаем директорию matches, если её нет
            os.makedirs(app.matches_dir, exist_ok=True)

            filepath = os.path.join(app.matches_dir, filename)

            # Читаем текущие данные матча
            with open(filepath, 'r', encoding='utf-8') as f:
                match_data = json.load(f)

            # Обновляем данные сета
            set_num = data.get('set_number')
            if not set_num:
                return jsonify({'status': 'error', 'message': 'Set number not provided'}), 400

            match_data['sets'][f"set_{set_num}"] = [
                data.get('result', {}).get('our', 0),
                data.get('result', {}).get('opponent', 0)
            ]

            # Если матч завершён
            if data.get('end_match'):
                match_data['meta']['status'] = 'completed'
                match_data['meta']['end_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                session.pop('current_match_file', None)

            # Записываем обновлённые данные
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(match_data, f, ensure_ascii=False, indent=4)

            return jsonify({'status': 'success'})

        except json.JSONDecodeError as e:
            return jsonify({'status': 'error', 'message': f'JSON decode error: {str(e)}'}), 500
        except IOError as e:
            return jsonify({'status': 'error', 'message': f'File operation failed: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Unexpected error: {str(e)}'}), 500