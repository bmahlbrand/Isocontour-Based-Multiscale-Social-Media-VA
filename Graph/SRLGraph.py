from Graph.AbstractGraph import AbstractGraph
from NLP.ParseTree import treeify_tweet

from Graph.Node.SRLNode import SRLNode
from Graph.Node.SRLTokenNode import SRLTokenNode


class SRLGraph(AbstractGraph):
    def __init__(self, query=None, graph=None):
        super().__init__(query, graph)

    # extends AbstractGraph's clusters ...need to transform Graph to SRLGraphs
    def clusters(self):
        if self.clusteringMode == 'k_cores':
            clusters = super().k_cores_clusters()
        elif self.clusteringMode == 'community':
            clusters = super().community_clusters()

        self.write_graph("original_SRLGraph")

        ret = []
        for cluster in clusters:
            ret.append(SRLGraph(graph=cluster))

        return ret


    # def match_tokens(self):
    #     return
    #
    # def nothing(self):
    #
    #     for vertex in graph:
    #         graph.vs.select(lambda v: v['node'].match() == True)

    def init_tweet(self, tweet):
        print(tweet['text'])
        processed = treeify_tweet(tweet)
        print(processed)
        print()

        if not processed:
            print("no phrases found in tweet", tweet['tweet_id'])
            return

        # if 'tokens' in tweet:
        #     tokens = tweet['tokens'].split(' ')
        #
        # if 'token_tags' in tweet:
        #     tags = tweet['token_tags'].split(' ')
        #
        # if 'chunk' in tweet:
        #     chunks = tweet['chunk'].split(' ')

        # if 'entity' in tweet:
        #     entities = tweet['entity'].split(' ')

        # if 'parser' in tweet:
        #     parser_indices = tweet['parser'].split(' ')

        if 'tweet_id' in tweet:
            tweet_id = tweet['tweet_id']

        if 'geolocation' in tweet:
            geoLoc = tweet['geolocation'].split(',')
            lat = geoLoc[0]
            lon = geoLoc[1]
            loc = {'lat': lat, 'lon': lon}

        if 'created_at' in tweet:
            created_at = tweet['created_at']

        nodes = []
        for element in processed:
            tokens = element[0]
            tags = element[1]
            token_nodes = []

            for token, tag in zip(tokens, tags):
                token = self.nlp.valid_token(token, tag)

                if token:
                    token_nodes.append(SRLTokenNode(token, tag, None))

            #tag of key phrase
            term = element[2]

            if token_nodes:
                nodes.append(SRLNode(term, tweet_id, token_nodes, loc, created_at))

        for node1 in nodes:
            for node2 in nodes:
                if node1['term'] != node2['term']:
                    self._queue_node(node1, node2)

if __name__ == '__main__':
    wg = SRLGraph()
    wg.add_edge('a', 'b')
    wg.add_edge('c', 'a')
    wg.add_edge('A', 'c')
    wg.add_edge('c', 'd')

    print(wg.g)
    print(wg.g.es['weight'])
