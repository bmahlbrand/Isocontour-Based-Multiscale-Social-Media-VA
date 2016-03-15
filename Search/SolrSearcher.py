import pysolr
import pdb
import sys
from Search import TimeFunc

class SolrSearcher:

    solr = None

    def __init__(self, database):
        self.solr = pysolr.Solr(database, timeout=60)
            # self.solr = pysolr.Solr('http://128.46.137.79:8983/solr/TwitterDB_Purdueshooting/', timeout=10)
            # self.solr = pysolr.Solr('http://128.46.137.79:8983/solr/TwitterDB/', timeout=10)

        print('init solr connector')

    def search_radius(self, isAccurate, query, start_time, end_time, center, radius, rows=5000):
        
        start_time_str = TimeFunc.time_func_python_date_to_solr_date(start_time)
        end_time_str = TimeFunc.time_func_python_date_to_solr_date(end_time)
#         q=''
#         for term in query:
#             if q is '':
#                 if isAccurate == True:
#                     q = 'text_accurate:' + ','.join(term)
#                     center = 'pt:' + ','.join(center)
#                     radius = 'd:' + ','.join(radius)
#                 else:
#                     q = 'text:' + ','.join(term)
#         #             center = 'pt:' + ','.join(str(center))
#         #             radius = 'd:' + ','.join(str(radius))
#             else:
#                 q += ' OR ' + term
#       
        q = ''         
        if not query or len(query) == 0:
            q = '*'
        else:          
            if isAccurate == True:
                q = 'text_accurate:' + ','.join(query)
        #             center = 'pt:' + ','.join(center)
        #             radius = 'd:' + ','.join(radius)
            else:
                q = 'text:' + ','.join(query)
        #             center = 'pt:' + ','.join(str(center))
        #             radius = 'd:' + ','.join(str(radius))
        spatial = True
        
        if radius is None:
            radius = '*'
            spatial = False
            
        if center is None:
            center = '*'   
            spatial = False   
            
        return_field =  ['tweet_id', 'user_id', 'created_at', 'text', 'tokens', 'token_tags', 'chunk', 'phrases', 'screen_name', 'geolocation']
        
#         print(q)
        if spatial is True:
            filter_queries = [
                'created_at:[' + start_time_str + ' TO ' + end_time_str + ']',
                "{!geofilt sfield=geolocation}"
            ]
        
#         {!geofilt%20sfield=geolocation}&pt=38,-86&d=1
            results = self.solr.search(q, fq=filter_queries, fl=return_field, rows=rows, spatial=spatial, pt=center, sfield="geolocation", d=radius,
                                       sort="random_3721117253841 desc")
        else:
            filter_queries = [
                'created_at:[' + start_time_str + ' TO ' + end_time_str + ']'
            ]
        
            results = self.solr.search(q, fq=filter_queries, fl=return_field, rows=rows)
        print("Saw {0} result(s).".format(len(results)))

        # Just loop over it to access the results.
        # for result in results:
            # print("{1}, {0}".format(result['text'], result['created_at'], result['geolocation']))
            # print("{0}".format(result['geolocation']))

        return results
    
    def search(self, isAccurate, query, start_time, end_time, min_lat, min_lng, max_lat, max_lng, rows=5000):

        start_time_str = TimeFunc.time_func_python_date_to_solr_date(start_time)
        end_time_str = TimeFunc.time_func_python_date_to_solr_date(end_time)
        
        if not query or len(query) == 0:
            query = ['*']
        
        q = ''
        if isAccurate == True:
            q = 'text_accurate:' + ','.join(query)
        else:
            q = 'text:' + ','.join(query)

        filter_queries = [
            'created_at:[' + start_time_str + ' TO ' + end_time_str + ']',
            'geolocation:[' + min_lat + "," + min_lng + ' TO ' + max_lat + "," + max_lng + ']'
        ]

        return_field = ['tweet_id', 'user_id', 'created_at', 'text', 'tokens', 'token_tags',  'screen_name', 'geolocation']
        
        results = self.solr.search(q, fq=filter_queries, fl=return_field, rows=rows)
        
        print("Saw {0} result(s).".format(len(results)))

        # Just loop over it to access the results.
        # for result in results:
            # print("{1}, {0}".format(result['text'], result['created_at'], result['geolocation']))
            # print("{0}".format(result['geolocation']))

        return results

if __name__ == '__main__':
    solrSearcher = SolrSearcher('http://128.46.137.79:8983/solr/TwitterDB_1401/')
    start_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-21T12:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-22T12:00:00Z')
    term = []
    
    rst = solrSearcher.search(False, term, start_time, end_time, str(38.5), str(-87.5), str(41.5), str(-85), 100000)