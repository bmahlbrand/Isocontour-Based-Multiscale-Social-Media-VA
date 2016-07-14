import json
from random import randint
from pprint import pprint

with open('world_large.json', encoding="utf8") as data_file:
    data = json.load(data_file)
    tweets =data['tweets']

    rst = []
    for tweet in tweets:

        if randint(0, 9) >= 3:
            continue

        tweet['text'] = tweet['tokens']
        tokens = tweet['text'].split()
        lang = tokens[len(tokens)-1]

        if lang == 'und':
            print('undefined lang')
            continue
        # skip english
        # if lang == 'en':
        #     continue

        tweet['tweet_id'] = str(tweet['tweet_id'])
        tweet['cate'] = [lang]
        tweet['tokens'] = {}
        tweet['tokens'][lang] = [lang]
        tweet['lemmed_text'] = tweet['text']

        geo = tweet['geolocation']
        tweet['geolocation'] = {}
        tweet['geolocation']['lon'] = geo.split(',')[1]
        tweet['geolocation']['lat'] = geo.split(',')[0]

        lat = float(tweet['geolocation']['lat'])
        lon = float(tweet['geolocation']['lon'])

        # US: 50.908018, -134.559077, 21.885955, -53.764995
        # EURO: 70.642718, -23.889952, 35.962543, 43.082705
        # if lat > 50 or lat < 20 or lon > -53 or lon < -134:
        if lat > 70 or lat < 35 or lon > 43 or lon < -23:
            continue

        del tweet['user_id']

        rst.append(tweet)

    with open('euro.json', 'w', encoding="utf8") as outfile:
        json.dump({'tweets': rst}, outfile)
