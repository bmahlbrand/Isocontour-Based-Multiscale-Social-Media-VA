from __future__ import absolute_import, print_function

from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

import sys, json, re

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
        self.log = open('log.txt', 'a')

    def on_data(self, data):

        try:
            data = json.loads(data)
            tweet = []
            tweet.append(str(data['id']))
            tweet.append(str(data['user']['id']))
            tweet.append(str(data['created_at']))
            tweet.append(re.sub('\s+', ' ', data['text']))
            tweet.append(str(",".join(str(x) for x in data['geo']['coordinates'])))
            tweet.append(data['lang'])

            print('\t'.join(tweet)+"\n")
            self.log.write('\t'.join(tweet)+"\n")
            self.log.flush()

            self.msgCount += 1

        except:
            placeholder = 0
            # print("Unexpected error:", sys.exc_info())

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
