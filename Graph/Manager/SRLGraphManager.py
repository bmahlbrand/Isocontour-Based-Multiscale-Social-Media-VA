from Graph.Manager.AbstractGraphManager import AbstractGraphManager
from Graph.SRLGraph import SRLGraph


class SRLGraphManager(AbstractGraphManager):
    def __init__(self, database):
        super().__init__(database)

    def add_graph(self, query, graphID):
        if graphID in self.graphPool.keys():
            self.graphPool[graphID] = None

        print('adding SRL graphID: ' + str(graphID) + '...')
        self.graphPool[graphID] = SRLGraph(query)

    # def fetch_tweets(self, query, start_time, end_time, geobounds):
    #     results = self.solr_searcher._search()
    #     return results