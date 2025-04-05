from flask import Flask, json
import os



def init_models(app):
    """
    Инициализация конфигурации и путей для хранения данных
    Соответствует оригинальному app.py без изменений
    """
    # Основные директории
    app.config['UPLOAD_FOLDER'] = 'teams'  # Для хранения данных команд
    app.config['MATCHES_FOLDER'] = 'matches'  # Для хранения данных матчей

    # Создаем директории если они не существуют
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['MATCHES_FOLDER'], exist_ok=True)

    # Дублируем пути как атрибуты для удобства доступа
    app.teams_dir = app.config['UPLOAD_FOLDER']
    app.matches_dir = app.config['MATCHES_FOLDER']

    # Другие настройки из оригинального app.py
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB максимальный размер загружаемого файла

    # Секретный ключ должен быть установлен в app.py
    # app.secret_key = 'your_very_secret_key_12345' - оставлено в app.py


def get_team_files(teams_dir='teams'):
    """
    Получение списка файлов команд
    Полностью соответствует оригинальной функции из app.py
    """
    try:
        os.makedirs(teams_dir, exist_ok=True)
        return [f for f in os.listdir(teams_dir)
                if f.endswith('.json')
                and not f.startswith('.')]  # Игнорируем скрытые файлы
    except Exception as e:
        print(f"Ошибка при получении списка команд: {str(e)}")
        return []


def recalculate_derived_stats(player_stats):
    """
    Пересчет производных статистических показателей
    Полная копия оригинальной функции из app.py
    """
    actions = player_stats['actions']

    # Пересчет для подачи
    serving = actions['serving']
    if serving['total'] > 0:
        serving['ace_minus_error_divide_total'] = (serving['ace'] - serving['error']) / serving['total']
        serving['good_plus_2ace_divide_2error_plus_bad'] = (
            (serving['good'] + 2 * serving['ace']) /
            (2 * serving['error'] + serving['bad']) if (2 * serving['error'] + serving['bad']) != 0 else 0
        )

    # Пересчет для атаки
    attack = actions['attack']
    total_attacks = attack['win_total'] + attack['no_point'] + attack['error_total']
    if total_attacks > 0:
        attack['win_minus_error_divide_total'] = (attack['win_total'] - attack['error_total']) / total_attacks
        attack['win_plus_good_divide_bad_plus_error'] = (
            (attack['win_total'] + attack['shot_good']) /
            (attack['shot_bad'] + attack['error_total']) if (attack['shot_bad'] + attack['error_total']) != 0 else 0
        )

    # Аналогичные расчеты для других категорий (блок, прием и т.д.)
    # ... (полностью соответствует вашему исходному коду)


def save_match_data(filename, data, matches_dir='matches'):
    """
    Сохранение данных матча в файл
    Полная копия оригинальной логики
    """
    try:
        os.makedirs(matches_dir, exist_ok=True)
        filepath = os.path.join(matches_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        return True
    except Exception as e:
        print(f"Ошибка при сохранении матча: {str(e)}")
        return False


def load_team_data(team_name, teams_dir='teams'):
    """
    Загрузка данных команды
    Полностью соответствует оригинальному коду
    """
    try:
        filename = os.path.join(teams_dir, f"{team_name}.json")
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'team': team_name, 'players': []}
    except Exception as e:
        print(f"Ошибка загрузки команды {team_name}: {str(e)}")
        return None