from Graph.AbstractGraph import AbstractGraph
from Graph.Node.WordNode import WordNode


class WordGraph(AbstractGraph):
    """docstring for WordGraph"""

    def __init__(self, query=None, graph=None):
        super().__init__(query, graph)

    # extends AbstractGraph clusters ...need to transform cluster graph to WordGraphs
    def clusters(self):
        if self.clusteringMode == 'k_cores':
            clusters = super().k_cores_clusters()
        elif self.clusteringMode == 'community':
            clusters = super().community_clusters()
        elif self.clusteringMode == 'optimal_modularity':
            clusters = super().modularity_clusters()
        elif self.clusteringMode == 'betweenness':
            clusters = super().betweenness_clusters()

        if self.logging is True:
            self.write_graph("original_WordGraph")

        ret = []

        for cluster in clusters:
            ret.append(WordGraph(graph = cluster))

        return ret

    def to_graph(self, clusters):
        return clusters.subgraphs()

    def init_tweet(self, val):

        if 'tokens' in val:
            tokens = val['tokens'].split(' ')

        if 'token_tags' in val:
            # tags = val['token_tags'].split(' ')
            tags = list(val['token_tags'])
        if 'tweet_id' in val:
            tweetID = val['tweet_id']

        if 'geolocation' in val:
            geoLoc = val['geolocation'].split(',')
            lat = geoLoc[0]
            lon = geoLoc[1]
            loc = {'lat': lat, 'lon': lon}

        if 'created_at' in val:
            timeStamp = val['created_at']

        candidates_tokens = []
        candidates_tags = []

        for token, tag in zip(tokens, tags):

            token = self.nlp.valid_token(token, tag)

            if token is not None:
                candidates_tokens.append(token)
                candidates_tags.append(tag)

        for token1, tag1 in zip(candidates_tokens, candidates_tags):
            for token2, tag2 in zip(candidates_tokens, candidates_tags):

                # remove duplicates
                if token1 != token2:
                    node1 = WordNode(token1, tweetID, tag1, loc, timeStamp)
                    node2 = WordNode(token2, tweetID, tag2, loc, timeStamp)
                    term_weight = self.edge_weight(len(candidates_tokens))
                    # print(val1.encode("utf-8") + ", ".encode("utf-8") + val2.encode("utf-8"))
                    self._queue_node(node1, node2, term_weight)


if __name__ == '__main__':
    wg = WordGraph()
    wg.add_edge('a', 'b')
    wg.add_edge('c', 'a')
    wg.add_edge('A', 'c')
    wg.add_edge('c', 'd')

    print(wg.g)
    print(wg.g.es['weight'])
