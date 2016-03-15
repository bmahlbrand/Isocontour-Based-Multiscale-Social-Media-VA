from Graph.AugmentedWordGraph import AugmentedWordGraph
from Graph.Manager.AbstractGraphManager import AbstractGraphManager
from igraph import summary

class AugmentedWordGraphManager(AbstractGraphManager):
    """docstring for WordGraphManager"""

    def __init__(self, database):
        super().__init__(database)
        self.min_edge_weight = 1
        self.min_edges = 1


    def add_graph(self, query, graphID):
        if graphID in self.graphPool.keys():
            self.graphPool[graphID] = None
        print('adding AugWord graphID: ' + str(graphID) + '...')
        self.graphPool[graphID] = AugmentedWordGraph(query)

    def merge_topics(self, graphIDs):
        ret = []

        theGraph = None
        print(self.graphPool.keys())
        for graphID in graphIDs:

            if graphID in self.graphPool.keys():
                print(graphID)
                if theGraph is None:
                    theGraph = self.graphPool[graphID].g
                    print('creating')
                    print(len(theGraph.es))
                else:

                    theGraph.union(self.graphPool[graphID].g)
                    print('unioning')
                    print(len(self.graphPool[graphID].g.es))
                    print(len(theGraph.es))
                ret.append(self.graphPool[graphID].g)

                # summary(self.graphPool[graphID].g)
                # print()
                # summary(theGraph)

            # 		g = Graph()

            # 		for graph in ret:
            # 			g.union(graph)

        # summary(theGraph)

        return self.merge_graphs(ret)

    def merge_graphs(self, graphs):

        edges = []
        vertices = []

        for graph in graphs:
            edges.extend(graph.es)
            vertices.extend(graph.vs['node'])

        g = AugmentedWordGraph()
        # print(edges)
        # for edge in edges:
        #     print(edge.tuple)
        for vertex in vertices:
            for node in vertex:
                g._add_term(node)

        g._process_nodes()
        print(len(g.g.es))
        return g.getJSON()