from Graph.AbstractGraph import AbstractGraph
from Graph.Node.WordNode import WordNode


class AugmentedWordGraph(AbstractGraph):
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
            self.write_graph("original_AugmentedWordGraph")

        ret = []
        for cluster in clusters:
            ret.append(AugmentedWordGraph(graph = cluster))

        return ret

    def to_graph(self, clusters):
        ret = []
        members = dict()
        for v, i in zip(clusters._graph.vs, clusters._membership):
            # print(v)
            # print()
            # print(i, v['node'])
            key = str(i)
            if key in members.keys():
                members[key].append(v['node'])
                # print('appending node', v['node'])
                # members[key].append(v['node'])
            else:
                members[key] = []
                members[key].append(v['node'])

            k = i

        for values in members.values():
            ret.append(values)
        # print(ret)
            # for node in v['node']:
                # print(node)
                # print(node)

            # print(members[i])
        # print()
        # print(len(ret))
        rst = []
        for cluster in ret:
            # print('new cluster')
            g = AugmentedWordGraph()
            for v in cluster:
                # print(v)
                for node in v:
                    # print(node)
                    g._add_term(node)

            rst.append(g.g)

        return rst

    def get_index(self, token, tokens):
        for i in range(len(tokens)):
            if token == tokens[i]:
                return i

    def init_tweet(self, val):

        if 'phrases' in val:
            phrases = val['phrases'].split(' ')
            ret = []

            for phrase in phrases:
                ret.append(phrase.split('_'))

            phrases = ret

        if 'tokens' in val:
            tokens = val['tokens'].split(' ')

        if 'token_tags' in val:
            tags = list(val['token_tags'])
            # tags = val['token_tags'].split()

        if 'tweet_id' in val:
            tweetID = val['tweet_id']

        if 'geolocation' in val:
            geoLoc = val['geolocation'].split(',')
            lat = geoLoc[0]
            lon = geoLoc[1]
            loc = {'lat': lat, 'lon': lon}

        if 'created_at' in val:
            timeStamp = val['created_at']

        # candidates_tokens = []
        # candidates_tags = []

        processing = []

        for phrase in phrases:
            chunk = []
            for token in phrase:

                i = self.get_index(token, tokens)
                tag = tags[i]
                token = self.nlp.valid_token(token, tag)
                if token:
                    chunk.append(WordNode(token, tweetID, tag, loc, timeStamp))
            processing.append(chunk)

        for chunk in processing:
            term_weight = self.edge_weight(len(chunk))

            for node1 in chunk:
                for node2 in chunk:
                    if node1['term'] is not node2['term']:
                        self._queue_node(node1, node2, term_weight)

        # for token, tag in zip(tokens, tags):
        #
        #     token = self.nlp.valid_token(token, tag)
        #
        #     if token is not None:
        #         candidates_tokens.append(token)
        #         candidates_tags.append(tag)

        # for token1, tag1 in zip(candidates_tokens, candidates_tags):
        #     for token2, tag2 in zip(candidates_tokens, candidates_tags):
        #
        #         # remove duplicates
        #         if token1 != token2:
        #             node1 = WordNode(token1, tweetID, tag1, loc, timeStamp)
        #             node2 = WordNode(token2, tweetID, tag2, loc, timeStamp)
        #             # print(val1.encode("utf-8") + ", ".encode("utf-8") + val2.encode("utf-8"))
        #             self._queue_node(node1, node2)


if __name__ == '__main__':
    wg = AugmentedWordGraph()
    wg.add_edge('a', 'b')
    wg.add_edge('c', 'a')
    wg.add_edge('A', 'c')
    wg.add_edge('c', 'd')

    print(wg.g)
    print(wg.g.es['weight'])
