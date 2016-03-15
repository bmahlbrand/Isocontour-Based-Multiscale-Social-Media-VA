class WordNode(dict):
    def __init__(self, term, tweet_id, tag, loc, created_at):
        self['term'] = term
        self['tweet_id'] = tweet_id
        self['tag'] = tag
        self['geolocation'] = loc
        self['created_at'] = created_at