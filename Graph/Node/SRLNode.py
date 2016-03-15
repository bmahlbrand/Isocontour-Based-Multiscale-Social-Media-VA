from Graph.Node import AbstractVertexNode

class SRLNode(dict):
    def __init__(self, term, tweet_id, token_nodes, loc, created_at):
        self['term'] = term
        self['tweet_id'] = tweet_id
        self['tokens'] = token_nodes
        self['geolocation'] = loc
        self['created_at'] = created_at

    #determine if linked with another node
    def match(self, node):
        pass
