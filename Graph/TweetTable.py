class TweetTable:

    """docstring for TweetTable"""

    def __init__(self, graph=None):
        super(TweetTable, self).__init__()
        self.table = dict()
        self.topics = None
        self.tweets = None
        self.terms = list()

        if graph is not None:
            self.build_from_graph(graph)

    def add(self, node):
        entry = self.table.get(node['tweet_id'], None)

        if entry is None:
            entry = dict()
            entry['geolocation'] = node['geolocation']
            entry['created_at'] = node['created_at']
            entry['term'] = [node['term']]
            entry['centrality'] = [node['centrality']]

            if node['term'] not in self.terms:
                self.terms.append({'term': node['term'], 'centrality' : node['centrality']})

            self.table[node['tweet_id']] = entry

        elif node['term'] not in entry['term']:
            entry['term'].append(node['term'])
        #     #add graphID as graph name, use this as topic index
        #     def build_from_graph(self, graph):
        #         print('a')
        #         for vertex in graph.vs:
        #             nodes = vertex['node']

    def build_from_graph(self, graph):
        for vertex in graph.vs:
            # print(vertex)
            # print()
            # for node in vertex['name']['node']:
            #     print(node)
            ids = [node['tweet_id'] for node in vertex['node']]
            times = [node['created_at'] for node in vertex['node']]
            locs = [node['geolocation'] for node in vertex['node']]

            for tweet_id, created_at, loc in zip(ids, times, locs):
                entryz = self.table.get(tweet_id)
                if entryz is None:
                    entry = dict()
                    entry['created_at'] = created_at
                    entry['geolocation'] = loc
                    entry['term'] = [vertex['name']]
                    entry['centrality'] = [vertex['centrality']]

                    if vertex['name'] not in self.terms:
                        self.terms.append({'term': vertex['name'], 'centrality': vertex['centrality']})
                    self.table[tweet_id] = entry
                elif vertex['name'] not in entryz['term']:
                    entryz['term'].append(vertex['name'])
                    entryz['centrality'].append(vertex['centrality'])

    def topic_indices(self, terms, topics):
        indices = []
        for topic in topics:
            for t in topic['terms']:
                for term in terms:
                    if term in t and topic['index'] not in indices:
                        indices.append(topic['index'])

        return indices

    def display(self):
        for entry in self.table.items():
            print(entry)

    def topicJSON(self):
        #         if self.topics is None:
        topic = []

        for term in self.terms:
            if term not in topic:
                topic.append({'term':term['term'],'centrality': term['centrality']})

        return {'terms': topic}

    #     def topicsJSON(self, clusters):
    # #         if self.topics is None:
    #         self.topics = []
    #         i = 0
    #         for g in clusters:
    #             self.topics.append({'index': str(i), 'terms' : [vertex['name'] for vertex in g.vs]})
    #             i = i + 1
    #
    #         return self.topics

    #     def tweetsJSON(self, topics):
    # #         if self.tweets is None:
    #         self.tweets = []
    #         for key, entry in self.table.items():
    #             entry['term'] = self.topic_indices(entry['term'], topics)
    #             entry['tweet_id'] = str(key)
    #
    #             if entry['term']:
    #                 self.tweets.append(entry)
    #
    #         return self.tweets

    def tweetJSON(self):
        #         if self.tweets is None:
        tweets = []
        for key, entry in self.table.items():
            #             entry['term'] = self.topic_indices(entry['term'], topics)
            entry['tweet_id'] = str(key)

            if entry['term']:
                tweets.append({'tweet_id': entry['tweet_id'],'created_at': entry['created_at'], 'geolocation': entry['geolocation'], 'term': entry['term']})

        return tweets

    #     def getJSON(self, clusters):
    #         topics = self.topicsJSON(clusters)
    #         tweets = self.tweetsJSON(topics)
    #         ret = {'topics' : topics, 'tweets' : tweets}
    #         FileFunc.write_dict_to_file('Data/topics.json', topics)
    #         FileFunc.write_dict_to_file('Data/tweets.json', tweets)
    #         return dumps(ret)

    def getJSON(self):
        topic = self.topicJSON()
        tweets = self.tweetJSON()

        return {'topic': topic, 'tweets': tweets}
