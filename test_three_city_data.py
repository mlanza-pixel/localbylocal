import json, pathlib
base=pathlib.Path(__file__).parent
for name,n,prefix in [('chicago',3747,'CHI-'),('los_angeles',2835,'LA-'),('new_york',3944,'NYC-')]:
    rows=json.loads((base/'cities'/f'{name}.json').read_text(encoding='utf-8'))
    assert len(rows)==n,(name,len(rows))
    ids=[x['ID'] for x in rows]
    assert len(ids)==len(set(ids)) and all(i.startswith(prefix) for i in ids)
    assert all(x.get('Description') and x.get('Why Go') for x in rows)
    assert all(x.get('Latitude') is not None and x.get('Longitude') is not None for x in rows)
    assert all('Local_Score' not in x or x['Local_Score'] is not None for x in rows)
    print(name,n,'PASS')
