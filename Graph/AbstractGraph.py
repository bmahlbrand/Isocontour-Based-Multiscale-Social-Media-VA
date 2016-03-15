import traceback

from igraph import *

from NLP import NLPManager as nlp
from Utils.FileFunc import FileFunc
from Graph.TweetTable import TweetTable


class AbstractGraph:
    '''
    classdocs
    '''

    def __init__(self, query, graph):
        '''
        Constructor
        '''
        #         self.start_time
        #         self.end_time

        if graph is None:
            self.g = Graph()
            self.table = TweetTable()
        else:
            self.g = graph
            self.table = TweetTable(graph=graph)

        self.nodeQueue = list()

        try:
            self.nlp = nlp.getInstance(query)
        except TypeError:
            print('failed')
            print(query)
            print(traceback.format_exc())

        self.logging = False

        # min edge weight to keep in graph when clustering
        self.min_edge_weight = 3

        #min count of edges in graph
        self.min_edges = 3

        #change clustering mode
        self.clusteringMode = 'community'
        # self.clusteringMode = 'k_cores'
        #self.clusteringMode = 'optimal_modularity'
#         self.clusteringMode = 'betweenness'

    def get_graph(self):
        return self.g

    def getJSON(self):
        return self.table.getJSON()

    ##################################
    #            Scoring             #
    ##################################

    def edge_weight(self, n):
        if n > 1:
            return 1/(n - 1)

        return 1

    ##################################
    #      Graph Construction        #
    ##################################

    def _exist_term(self, term):
        term_index = -1

        try:
            tmp_term = self.g.vs.find(name=term)
            term_index = tmp_term.index
        except ValueError:
            return -1

        return term_index

    def _add_term(self, node):
        # print("adding node",node)
        i = self._exist_term(node['term'])
        # print(node)
        # self.table.add(node)

        if i == -1:

            self.g.add_vertex(node['term'])
            i = self._exist_term(node['term'])
            self.g.vs[i]['node'] = [node]

        elif str(node['tweet_id']) not in [str(node['tweet_id']) for node in self.g.vs[i]['node']]:
            self.g.vs[i]['node'].append(node)

    def _add_edges(self, edges, weights):
        self.g.add_edges(edges)
        self.g.es['weight'] = weights
        # for i in range(len(self.g.es)):
        #     self.g.es[i]['weight'] = 1.0
        # self.g.es['weight'] = range(len(self.g.es))
        self.g.simplify(multiple=True, loops=False, combine_edges=dict(weight="sum"))

    def _queue_node(self, node_a, node_b, weight):
        pair = (node_a, node_b, weight)
        # if pair not in self.edgeQueue and reversed(pair) not in self.edgeQueue:
        self.nodeQueue.append(pair)

    def _process_nodes(self):

        edges = list()
        weights = list()

        for node in self.nodeQueue:
            self._add_term(node[0])
            self._add_term(node[1])

            edges.append((node[0]['term'], node[1]['term']))
            weights.append(node[2])

        self._add_edges(edges, weights)

    def _get_vertex_neighbors(self, term):
        v = self.g.vs.select(name_eq=term)
        neighbors = self.g.neighbors(v, mode="all")
        return neighbors

    def undirected_density(self):
        edgeCt = self.g.es.length
        vertCt = self.g.vs.length
        score = 2 * edgeCt / (vertCt * (vertCt - 1))
        return score

    def directed_density(self):
        edgeCt = self.g.es.length
        vertCt = self.g.vs.length
        score = edgeCt / (vertCt * (vertCt - 1))
        return score

    ##################################
    #           filtering            #
    ##################################

    # def graph_spatial_filter(self, minLat, minLon, maxLat, maxLon):
    #    self.g.vs.select(lat_ge = minLat, lat_le = maxLat, lon_ge = minLon, lon_le = maxLon)

    # def graph_temporal_filter(self, start_time, end_time):
    #    self.g.vs.select(created_at_ge = start_time, created_at_le = end_time)

    def _prepare(self):
        if self.nodeQueue:
            self._process_nodes()

        edges = self.g.es.select(weight_ge = self.min_edge_weight)

        if len(edges) < self.min_edges:
            raise ValueError('graph size smaller than min_edges parameter')

        vertices = list()
        for edge in edges:
            vertices.append(edge.tuple[0])
            vertices.append(edge.tuple[1])

        subGraph = self.g.subgraph(vertices)

        # summary(subGraph)

        if len(subGraph.vs) == 1:
            raise ValueError('graph size')

        return subGraph

    ##################################
    #          clustering            #
    ##################################

    # returns list of generic iGraph 'Graph' objects, should be used in child class to transform to respective graph type
    def community_clusters(self):
        subGraph = self._prepare()

        dendrogram = subGraph.community_fastgreedy(weights='weight')
        clusters = dendrogram.as_clustering()

        if self.logging is True:
            self._cluster_log(clusters)

        return self.calc_centrality(clusters.subgraphs())

    def k_cores_clusters(self):
        self.g = self._prepare()

        clusters = self.g.k_core()

        print(self.g.coreness())

        if self.logging is True:
            self._cluster_log(clusters)

        return self.calc_centrality(clusters)

    def to_graph(self, clusters):
        pass

    def modularity_clusters(self):
        self.g = self._prepare()

        clusters = self.g.community_optimal_modularity(weights='weight')
        # print(clusters)
        # print(clusters._graph)
        clusters = self.to_graph(clusters)

        if self.logging is True:
            self._cluster_log(clusters)

        return self.calc_centrality(clusters)

    def betweenness_clusters(self):
        subGraph = self._prepare()

        dendrogram = subGraph.community_edge_betweenness(weights='weight')
        clusters = dendrogram.as_clustering()

        if self.logging is True:
            self._cluster_log(clusters)

        return self.calc_centrality(clusters)

    def calc_centrality(self, clusters):
        ret = []

        for cluster in clusters:
            vector = cluster.evcent(scale=True)

            for i in range(len(cluster.vs)):
                cluster.vs[i]['centrality'] = vector[i]

            ret.append(cluster)

        return ret

    ##################################
    #           caching              #
    ##################################

    def write_graph(self, name):
        filename = name + ".dot"
        graph = self.g
        stuff = graph.vs['name']
        # del graph.vs['name']
        graph.vs['label'] = stuff
        with open(filename, 'wb') as file:
            graph.write(file, format="dot")
        print('graph', name, 'written')

    # def write_graph(self, startTime):
    #
    #     filename = "Data/GraphCache/graph_" + startTime.strftime("%Y-%m-%d_%H-%M-%S") + ".dot"
    #     with open(filename, 'wb') as file:
    #         self.g.write(file, format="dot")
    #     #         filename = "../Data/GraphCache/graph_" + startTime.strftime("%Y-%m-%d_%H-%M-%S") + ".p"
    #     #         file = open(filename, 'wb')
    #     #         self.g.write(file, format = "pickle")
    #
    #     print("graph processed " + startTime.strftime("%Y-%m-%d_%H-%M-%S"))

    #         summary(self.g)

    def read_graph(self, filename):
        #         with open(filename, 'r') as file:
        #             load(file, 'dot')
        pass

    def _cluster_log(self, clusters):
        i = 0

        FileFunc.clear_folder('Data/ClusterTests')

        for g in clusters:

            if len(g.vs) < self.min_edges:
                continue
            i += 1

            filename = 'Data/ClusterTests/dendro_test' + str(i) + '.dot'

            with open(filename, 'wb') as file:
                g.write(file, format="dot")

    #DictList(klass, vertices, edges, directed=False, vertex_name_attr='name', edge_foreign_keys=('source', 'target'), iterative=False)
