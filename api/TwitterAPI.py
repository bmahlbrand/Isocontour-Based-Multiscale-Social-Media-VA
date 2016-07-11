from __future__ import absolute_import, print_function

from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

import sys, json, re, time

# Go to http://apps.twitter.com and create an app.
# The consumer key and secret will be generated for you after
consumer_key="azf16wts3mvQap316ACyb0YVk"
consumer_secret="h4y7AgGteQVTokyWm1qvjXzI4sVi7NG6pYN1Z5Nbc95lYphtRt"

# After the step above, you will be redirected to your app's page.
# Create an access token under the the "Your access token" section
access_token="3144403311-XHCpZ4Jkbp5y9axioCyfAOtsBQDX76dbgZX5J5a"
access_token_secret="1ejXmb8f92Hqk3WCcyCwoogqUOfqrDPyYS64Dz9IlFGX4"

class StdOutListener(StreamListener):
    """ A listener handles tweets that are received from the stream.
    This is a basic listener that just prints received tweets to stdout.
    """
    def __init__(self):
        self.msgCount = 0
        self.log = open('log.txt', 'a', encoding="utf8")

    def on_data(self, data):

        data_back = data
        try:
            data = json.loads(data)
            tweet = []
            tweet.append(str(data['id_str']))
            tweet.append(str(data['user']['id']))

            ts = time.strftime('%Y-%m-%d %H:%M:%S', time.strptime(data['created_at'],'%a %b %d %H:%M:%S +0000 %Y'))

            tweet.append(ts)
            tweet.append(re.sub('\s+', ' ', data['text']) + " " +data['lang'] )

            if data['geo'] is not None and data['geo']['coordinates'] is not None:
                tweet.append(str(data['geo']['coordinates'][0]))
                tweet.append(str(data['geo']['coordinates'][1]))

                print('\t'.join(tweet)+"\n")
                self.log.write('\t'.join(tweet)+"\n")
                self.log.flush()

                self.msgCount += 1
            else:
                data_back = data_back
                # print("geo is none")

        except:
            placeholder = 0
            print("Unexpected error:", sys.exc_info())
            print("data string: ", data_back)

    def on_error(self, status):
        print(status)

if __name__ == '__main__':
    l = StdOutListener()
    auth = OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)

    stream = Stream(auth, l)
    # stream.filter(track=['basketball'])

    try:
        stream.filter(locations=[-180, 0, 180, 90])
    except:
        print("Unexpected error in out loop:", sys.exc_info().join(", "))
