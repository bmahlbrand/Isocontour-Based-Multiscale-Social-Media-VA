from igraph import summary

from Graph.WordGraph import WordGraph
from Graph.Manager.AbstractGraphManager import AbstractGraphManager


class WordGraphManager(AbstractGraphManager):
    """docstring for WordGraphManager"""

    def __init__(self, database):
        super().__init__(database)

    def add_graph(self, query, graphID):
        if graphID in self.graphPool.keys():
            self.graphPool[graphID] = None
        print('adding Word graphID: ' + str(graphID) + '...')
        self.graphPool[graphID] = WordGraph(query)

    def merge_topics(self, graphIDs):
        ret = []

        theGraph = None
        for graphID in graphIDs:

            if graphID in self.graphPool.keys():
                if theGraph is None:
                    theGraph = self.graphPool[graphID].g
                else:
                    theGraph.union(self.graphPool[graphID].g)
                # 					ret.append(self.graphPool[graphID].g)
                # summary(self.graphPool[graphID].g)
            print('hit')
            # 		g = Graph()

            # 		for graph in ret:
            # 			g.union(graph)

        # summary(theGraph)

    # 		self.merge_graphs(ret)

    def merge_graphs(self, graphs):

        edges = []
        vertices = []

        for graph in graphs:
            edges.extend(graph.es)
            vertices.extend(graph.vs['node'])

        g = WordGraph()
        print(edges)
        for edge in edges:
            print(edge.tuple)
        for vertex in vertices:
            for node in vertex:
                g._add_term(node)

        g._add_edges(edges)


if __name__ == '__main__':
    # 	last_time_stamp = datetime.now(pytz.utc) - timedelta(minutes=5)
    # initialize stop word list;
    stop_list = FileFunc.read_file_into_list('../Data/stopwords_en.txt')
    print('stop list size:', len(stop_list))

    protect_tag = ['N', 'S', '^', 'Z', 'V', 'A', '#', '$']
    last_time_stamp = []
    wg_manager = WordGraphManager(stop_list, protect_tag)
    wg_manager.clear_cache()
    wg_manager.fetch_tweets()
