import json
from random import randint
from pprint import pprint

with open('world_large.json', encoding="utf8") as data_file:
    data = json.load(data_file)
    tweets =data['tweets']

    rst = []
    for tweet in tweets:

        if randint(0, 9) >= 1:
            continue

        tweet['text'] = tweet['tokens']
        tokens = tweet['text'].split()
        lang = tokens[len(tokens)-1]

        if lang == 'und':
            print('undefined lang')
            continue

        tweet['tweet_id'] = str(tweet['tweet_id'])
        tweet['cate'] = [lang]
        tweet['tokens'] = {}
        tweet['tokens'][lang] = [lang]
        tweet['lemmed_text'] = tweet['text']

        geo = tweet['geolocation']
        tweet['geolocation'] = {}
        tweet['geolocation']['lon'] = geo.split(',')[1]
        tweet['geolocation']['lat'] = geo.split(',')[0]

        del tweet['user_id']

        rst.append(tweet)

    with open('world.json', 'w', encoding="utf8") as outfile:
        json.dump({'tweets': rst}, outfile)
