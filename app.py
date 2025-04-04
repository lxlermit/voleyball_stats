from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_very_secret_key_12345'
app.config['UPLOAD_FOLDER'] = 'teams'
app.config['MATCHES_FOLDER'] = 'matches'


@app.route('/')
def index():
    try:
        teams = [f.replace('.json', '') for f in os.listdir('teams') if f.endswith('.json')]
        return render_template('index.html', teams=teams)
    except Exception as e:
        flash(f'Ошибка загрузки команд: {str(e)}', 'error')
        return render_template('index.html', teams=[])


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
        filename = os.path.join(app.config['UPLOAD_FOLDER'], f"{team_name}.json")

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

        filename = os.path.join(app.config['UPLOAD_FOLDER'], f"{team_name}.json")
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
        filename = os.path.join(app.config['UPLOAD_FOLDER'], f"{team_name}.json")

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
        session['match_data'] = {
            'city': request.form.get('city', 'Санкт-Петербург'),
            'address': request.form.get('address', ''),
            'competition': request.form.get('competition', ''),
            'opponent': request.form.get('opponent', 'Команда соперника'),
            'our_team': request.form['our_team']
        }

        # Загружаем информацию о команде
        team_name = request.form['our_team']
        team_file = os.path.join(app.config['UPLOAD_FOLDER'], f"{team_name}.json")

        with open(team_file, 'r', encoding='utf-8') as f:
            team_data = json.load(f)

        # Создаем структуру статистики для игроков
        players_stats = {}
        for player in team_data['players']:
            players_stats[player['number']] = {
                'player_info': {
                    'number': player['number'],
                    'last_name': player['last_name'],
                    'first_name': player['first_name'],
                    'role': player['role'],
                    'color': player.get('color', '#FF5733')
                },
                'actions': {
                    'points_on_court': 0,
                    'total_points': {
                        'win_points': 0,
                        'lose_points': 0,
                        'win_minus_lose': 0,
                        'win_divide_lose': 0
                    },
                    'serving': {
                        'total': 0,
                        'ace': 0,
                        'error': 0,
                        'good': 0,
                        'normal': 0,
                        'bad': 0,
                        'ace_minus_error_divide_total': 0,
                        'good_plus_2ace_divide_2error_plus_bad': 0
                    },
                    'block': {
                        'win': 0,
                        'softened': 0,
                        'double_block': 0,
                        'error': 0
                    },
                    'attack': {
                        'win_total': 0,
                        'win_kill': 0,
                        'win_tip': 0,
                        'no_point': 0,
                        'shot_good': 0,
                        'shot_normal': 0,
                        'shot_bad': 0,
                        'tip_good': 0,
                        'tip_bad': 0,
                        'hands_below_good': 0,
                        'hands_below_normal': 0,
                        'hands_below_bad': 0,
                        'error_total': 0,
                        'error_kill': 0,
                        'error_tip': 0,
                        'win_plus_good_divide_bad_plus_error': 0,
                        'win_minus_error_divide_total': 0
                    },
                    'set_assist': {
                        'total': 0,
                        'good': 0,
                        'normal': 0,
                        'bad': 0,
                        'error': 0,
                        'error_divide_total': 0,
                        'good_divide_bad_plus_error': 0,
                        'normal_plus_2good_divide_2bad_plus_3error': 0
                    },
                    'serve_reception': {
                        'total': 0,
                        'error': 0,
                        'good': 0,
                        'normal': 0,
                        'bad': 0,
                        'good_divide_total': 0,
                        'error_divide_total': 0,
                        'bad_plus_error_divide_total': 0,
                        'normal_plus_2good_divide_2bad_plus_3error': 0
                    },
                    'dig': {
                        'total': 0,
                        'error': 0,
                        'good': 0,
                        'normal': 0,
                        'bad': 0,
                        'error_divide_total': 0,
                        'error_plus_bad_divide_total': 0,
                        'normal_plus_2good_divide_3error_plus_2bad': 0
                    }
                },
                'time_played': 0,
                'rotations': []
            }

        # Создание файла статистики
        now = datetime.now()
        date_part = now.strftime("%Y_%m_%d")
        time_part = now.strftime("%H_%M")
        opponent_name = request.form.get('opponent', 'Команда соперника')

        filename = (
            f"{team_name}_{date_part}__{time_part}_{opponent_name}.json"
            .replace(" ", "_")
            .replace("/", "")
            .replace("\\", "")
            .replace(":", "")
            .replace("*", "")
            .replace("?", "")
            .replace('"', "")
            .replace("<", "")
            .replace(">", "")
            .replace("|", "")
        )

        match_stats = {
            "meta": {
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "filename": filename,  # Сохраняем имя файла в метаданные
                "city": request.form.get('city', 'Санкт-Петербург'),
                "address": request.form.get('address', ''),
                "competition": request.form.get('competition', ''),
                "our_team": team_name,
                "opponent": request.form.get('opponent', 'Команда соперника'),
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

        os.makedirs(app.config['MATCHES_FOLDER'], exist_ok=True)
        filepath = os.path.join(app.config['MATCHES_FOLDER'], filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(match_stats, f, ensure_ascii=False, indent=4)

        session['current_match_file'] = filename
        return redirect(url_for('placement'))

    # Обработка GET-запроса
    teams = [f.replace('.json', '') for f in os.listdir('teams') if f.endswith('.json')]
    if not teams:
        flash('Сначала создайте команду!', 'error')
        return redirect(url_for('index'))

    return render_template('match.html', teams=teams)

@app.route('/placement')
def placement():
    if 'match_data' not in session:
        flash('Сначала настройте параметры матча', 'error')
        return redirect(url_for('match'))

    team_name = session['match_data']['our_team']
    filename = os.path.join(app.config['UPLOAD_FOLDER'], f"{team_name}.json")

    with open(filename, 'r', encoding='utf-8') as f:
        team_data = json.load(f)

    return render_template('placement.html',
                           team=team_data['players'],
                           match_data=session['match_data'])


@app.route('/record_event', methods=['POST'])
def record_event():
    try:
        data = request.json
        filename = session.get('current_match_file')
        if not filename:
            return jsonify({'status': 'error', 'message': 'No active match'}), 400

        filepath = os.path.join(app.config['MATCHES_FOLDER'], filename)

        with open(filepath, 'r+', encoding='utf-8') as f:
            stats = json.load(f)

            # Добавляем событие в лог
            event = {
                'timestamp': datetime.now().strftime("%H:%M:%S"),
                'type': data['event_type'],
                'player': data['player_number'],
                'details': data.get('details', {}),
                'set': data['current_set'],
                'score': data['score']
            }
            stats['match_events'].append(event)

            # Обновляем статистику игрока
            player_stats = stats['players_stats'].get(data['player_number'])
            if player_stats:
                action_type = data['event_type'].split('_')[0]  # serving, block, attack и т.д.
                quality = data['event_type'].split('_')[-1]  # win, error, good и т.д.

                # Обновляем базовые счетчики
                if action_type in player_stats['actions']:
                    if quality in player_stats['actions'][action_type]:
                        player_stats['actions'][action_type][quality] += 1
                    player_stats['actions'][action_type]['total'] += 1

                # Пересчитываем производные показатели
                recalculate_derived_stats(player_stats)

            f.seek(0)
            json.dump(stats, f, ensure_ascii=False, indent=4)
            f.truncate()

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


def recalculate_derived_stats(player_stats):
    """Пересчитывает все производные показатели статистики"""
    actions = player_stats['actions']

    # Пересчет для serving
    serving = actions['serving']
    if serving['total'] > 0:
        serving['ace_minus_error_divide_total'] = (serving['ace'] - serving['error']) / serving['total']
        serving['good_plus_2ace_divide_2error_plus_bad'] = (serving['good'] + 2 * serving['ace']) / (
                    2 * serving['error'] + serving['bad'])

    # Пересчет для attack
    attack = actions['attack']
    total_attacks = attack['win_total'] + attack['no_point'] + attack['error_total']
    if total_attacks > 0:
        attack['win_minus_error_divide_total'] = (attack['win_total'] - attack['error_total']) / total_attacks
        attack['win_plus_good_divide_bad_plus_error'] = (attack['win_total'] + attack['shot_good']) / (
                    attack['shot_bad'] + attack['error_total'])

    # Аналогично для других разделов (block, set_assist, serve_reception, dig)
    # ...


@app.route('/end_match', methods=['POST'])
def end_match():
    try:
        filename = session.get('current_match_file')
        if not filename:
            return redirect(url_for('index'))

        filepath = os.path.join(app.config['MATCHES_FOLDER'], filename)

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
        return redirect(url_for('placement'))


@app.route('/save_set', methods=['POST'])
def save_set():
    try:
        data = request.json
        filename = session.get('current_match_file')
        if not filename:
            return jsonify({'status': 'error', 'message': 'No active match'}), 400

        filepath = os.path.join(app.config['MATCHES_FOLDER'], filename)

        with open(filepath, 'r+', encoding='utf-8') as f:
            stats = json.load(f)

            # Сохраняем результат партии
            set_num = data['set_number']
            stats['sets'][f"set_{set_num}"] = [
                data['result']['our'],
                data['result']['opponent']
            ]

            # Если это конец матча
            if data.get('end_match'):
                stats['meta']['status'] = 'completed'
                stats['meta']['end_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                session.pop('current_match_file', None)

            f.seek(0)
            json.dump(stats, f, ensure_ascii=False, indent=4)
            f.truncate()

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    os.makedirs('teams', exist_ok=True)
    os.makedirs('matches', exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
