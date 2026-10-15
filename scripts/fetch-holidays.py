"""Build an offline festival-only calendar from Hong Kong Observatory open data."""
import csv
import io
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPECS = {
    ('正月', '初一'): {'id': 'spring-festival', 'name': '春节', 'hero': 'lantern', 'icon': 'lantern', 'greeting': '新的一年，快乐加满'},
    ('五月', '初五'): {'id': 'dragon-boat', 'name': '端午', 'hero': 'bag', 'icon': 'leaf', 'greeting': '端午安康，快乐相伴'},
    ('八月', '十五'): {'id': 'mid-autumn', 'name': '中秋', 'hero': 'moon', 'icon': 'moon', 'greeting': '月亮很圆，快乐也圆'},
    ('九月', '初九'): {'id': 'double-ninth', 'name': '重阳', 'hero': 'bag', 'icon': 'flower', 'greeting': '岁岁平安，久久相伴'},
}

def main():
    holidays = {}
    for year in range(2026, 2029):
        url = f'https://data.weather.gov.hk/weatherAPI/hko_data/calendar/nongli_calendar_{year}.csv'
        raw = urllib.request.urlopen(url, timeout=30).read().decode('utf-8-sig')
        rows = list(csv.reader(io.StringIO(raw)))
        current_month = None
        new_year = None
        count = 0
        for row in rows[1:]:
            if len(row) < 5:
                continue
            import datetime
            key = datetime.datetime.strptime(row[0].strip(), '%d-%b-%y').date().isoformat()
            current_month = row[3].strip().replace('一月', '正月') if row[3].strip() == '一月' else row[3].strip()
            lunar = row[4].strip()
            if (current_month, lunar) in SPECS:
                holidays[key] = SPECS[(current_month, lunar)]
                count += 1
                if current_month == '正月':
                    new_year = key
        if count != 4 or not new_year:
            raise ValueError(f'{year}: expected four verified festivals, found {count}; CSV schema may have changed')
        import datetime
        eve = (datetime.date.fromisoformat(new_year) - datetime.timedelta(days=1)).isoformat()
        holidays[eve] = {'id': 'new-year-eve', 'name': '除夕', 'hero': 'lantern', 'icon': 'lantern', 'greeting': '今夜团圆，快乐相伴'}
        holidays[f'{year}-10-01'] = {'id': 'national-day', 'name': '国庆', 'hero': 'bag', 'icon': 'flag', 'greeting': '山河锦绣，欢度国庆'}
        print(f'{year}: festival dates verified')
    out = {'coverage': '2026-2028', 'source': 'Hong Kong Observatory Gregorian-Lunar calendar open data', 'sourceUrl': 'https://www.hko.gov.hk/sc/gts/time/conversion.htm', 'note': 'Festival dates only; not statutory days off or adjusted workdays.', 'dates': dict(sorted(holidays.items()))}
    path = ROOT / 'data' / 'holidays.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
