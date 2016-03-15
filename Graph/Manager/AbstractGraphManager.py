from Utils.FileFunc import FileFunc
from Graph.TweetTable import TweetTable

from Search import TimeFunc

import threading
import _thread

from calendar import January
import datetime
from datetime import datetime
from _datetime import timedelta
from _datetime import date

import pytz

from json import dumps
import pdb
from test.test__locale import candidate_locales

from Search.SolrSearcher import SolrSearcher
import pysolr

class AbstractGraphManager(object):
    def __init__(self, search):
        self.solr_searcher = search
        self.graphPool = dict()
        last_time_stamp = datetime.now(pytz.utc) - timedelta(minutes=.5)
        #         self.time_slice = timedelta(minutes = 5).total_seconds()
        self.start_app_time = last_time_stamp
        self.last_time_stamp = last_time_stamp

    def get_elapsed_time(self):
        return self.last_time_stamp - self.start_app_time

    def get_table(self, graphID):
        return self.graphPool[graphID].table

    ##################################
    #          graphID utils         #
    ##################################

    # given 0&1&2 returns 0
    def get_root_graphID(self, graphID):
        ids = graphID.split('&')
        return ids[0]

    # given 0&1&2 returns 0&1
    def get_parent_graphID(self, graphID):
        ids = graphID.split('&')
        parent = ""
        l = len(ids)

        if l == 1:
            return graphID

        i = 0

        while i < len(ids) - 1:
            parent += ids[i]
            i += 1

        return parent

    # given 0&1&2 returns 2
    def get_current_graphID(self, graphID):
        ids = graphID.split('&')
        ind = len(ids) - 1
        return ids[ind]

    ##################################
    #         subgraph utils         #
    ##################################

    def subgraphs_exist(self, graphID):
        for key in self.graphPool.keys():
            if key.startswith(graphID) and len(key) > len(graphID):
                return True
        return False

    def clear_graph(self, graphID):
        if graphID in self.graphPool.keys():
            del self.graphPool[graphID]

    def add_subgraphs(self, graphID, topicClusters):
        i = 0
        for cluster in topicClusters:
            gid = graphID + '&' + str(i)
            if gid in self.graphPool.keys():
                print('graph id exists')
            self.graphPool[gid] = cluster
            #             self.graphPool[gid].table = TweetTable(graph = cluster)
            i += 1

    ##################################
    #            topics              #
    ##################################

    def merge_tweets(self, tweets):
        ret = dict()
        for tweet in tweets:
            if tweet['tweet_id'] not in ret.keys():
                ret[tweet['tweet_id']] = tweet
            elif tweet['term'] not in ret[tweet['tweet_id']]['term']:
                ret[tweet['tweet_id']]['term'] += tweet['term']

        return ret

    def get_topic_id(self, topics, term):
        for t in topics:
            for pair in t['terms']:
                if term == pair['term']:
                    return t['index']
            # if term in t['terms']:
            #     return t['index']

    def assign_topic_ids(self, tweets, topics):
        ret = []
        for tweet in tweets:
            termIndices = []
            cp = list(tweet['term'])
            for term in tweet['term']:
                i = self.get_topic_id(topics, term)

                if i is not None and i not in termIndices:
                    termIndices.append(i)

            tokens = []
            for term in cp:
                if term not in tokens:
                    tokens.append(term)

            tweet['tokens'] = tokens
            tweet['term'] = termIndices

            ret.append(tweet)

        return ret

    def get_topics_json(self, graphID):
        ret = []
        topicIDs = []

        keys = list(self.graphPool.keys())
        keys.sort()

        for key in keys:
            if key.startswith(graphID) and len(key) > len(graphID):
                stuff = self.graphPool[key].getJSON()
                ret.append(stuff)
                topicIDs.append(self.get_current_graphID(key))

        things = []
        topics = []

        for thing, id in zip(ret, topicIDs):
            topics.append({'terms': thing['topic']['terms'], 'index': id})
            things += thing['tweets']

        tweets = self.merge_tweets(things)

        ret = {'topics': topics, 'tweets': self.assign_topic_ids(tweets.values(), topics)}
        print("returning " + str(len(topics)) + " topics")

        return ret

    def topics(self, graphID):
        if graphID not in self.graphPool.keys():
            parent = self.get_parent_graphID(graphID)

            if parent in self.graphPool.keys():
                topicClusters = self.graphPool[parent].clusters()
                self.add_subgraphs(parent, topicClusters)
            else:
                print("parent topic's clusters not stored")

        else:  # if children exist, return them
            # if self.subgraphs_exist(graphID):
            #     return self.get_topics_json(graphID)

            topicClusters = self.graphPool[graphID].clusters()
            self.add_subgraphs(graphID, topicClusters)

        return self.get_topics_json(graphID)

    ##################################
    #        tweet retrieval         #
    ##################################

    def retrieve(self, query, graphID, start_time, end_time, geobounds, realtime = False):

        # if graphID not in self.graphPool.keys():
        results = self.fetch_tweets(query, start_time, end_time, geobounds, realtime)

        if len(results) == 0:
            raise ValueError('No tweets to form a topic.')

        self.add_graph(query, graphID)

        # parse tweets and construct graph:
        for val in results:
            # print(val)
            self.graphPool[graphID].init_tweet(val)
        #         self.graphPool[graphID].write_graph(start_time)

        return self.topics(graphID)

    def fetch_tweets(self, query, start_time, end_time, geobounds, realtime):
        if realtime is True:
            cp_self = self
            # timer;
            threading.Timer(.25 * 60, cp_self.fetch_tweets, [query, start_time, end_time, geobounds, realtime]).start()
            # start_time = self.last_time_stamp
            # self.last_time_stamp = end_time = self.last_time_stamp + timedelta(minutes=5)

        #     # _thread.start_new_thread(solr_searcher.search, (False, '*', start_time, end_time, str(-90), str(-180), str(90), str(180)))

        if geobounds['type'] == 'circular':
            results = self.solr_searcher.search_radius(False, query, start_time, end_time, geobounds['center'],
                                                       geobounds['radius'])
        elif geobounds['type'] == 'rectangular':
            results = self.solr_searcher.search(False, query, start_time, end_time, str(0), str(-150), str(60),
                                                str(-60))

        return results

    # def timed_fetch(self):
    # def fetch_tweets(self, query, start_time, end_time, geobounds):


        #         rst = fetch_tweets('*', start_time, end_time, geobounds)

        # if geobounds['type'] == 'circular':
        #     results = self.solr_searcher.search_radius(False, query, start_time, end_time, geobounds['center'],
        #                                                geobounds['radius'])
        # elif geobounds['type'] == 'rectangular':
        #     results = self.solr_searcher.search(False, query, start_time, end_time, str(0), str(-150), str(60),
        #                                         str(-60))

        # solr = pysolr.Solr('http://128.46.137.79:8983/solr/TwitterDB_Purdueshooting/', timeout=10)
        # results = self.solr_searcher._search()
        # print('saw ' + str(len(results)) + ' results')
        # return results
        # pass

    ##################################
    #            caching             #
    ##################################

    def merge_time_window(self):
        pass

    def cache_time_window(self):

        pass

    def cache_topics(self, topics):
        FileFunc.write_dict_to_file('Data/topics.json', topics)

    def clear_cache(self):
        FileFunc.clear_folder('../Data/ClusterTests/*.dot')
        FileFunc.clear_folder('../Data/GraphCache/*.dot')
