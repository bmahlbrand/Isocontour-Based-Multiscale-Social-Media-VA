from json import dumps
import json
import csv
import traceback
import codecs

from bottle import Bottle, run, request, response, static_file, json_dumps

from Search import SolrSearcher
from Search import TimeFunc
from Graph.Manager import SRLGraphManager, WordGraphManager, AugmentedWordGraphManager
import datetime
from datetime import timedelta
import pytz
from NLP.EMTerms import EMTerms
from NLP.NLPManager import NLPManager
from NLP.TermPOSIndex import TermPOSIndex
from idlelib.IOBinding import encoding
# from Graph.WordGraphManager import wg_manager
app = Bottle()
termPOS = TermPOSIndex()

#initialize EM Terms#
EMTerms()

# # Static Routes
# @get('/<filename:re:.*\.js>')
# def javascripts(filename):
#     return static_file(filename, root='static/js')

# @get('/<filename:re:.*\.css>')
# def stylesheets(filename):
#     return static_file(filename, root='static/css')

# @get('/<filename:re:.*\.(jpg|png|gif|ico)>')
# def images(filename):
#     return static_file(filename, root='static/img')

# @get('/<filename:re:.*\.(eot|ttf|woff|svg)>')
# def fonts(filename):
#     return static_file(filename, root='static/fonts')

@app.hook('after_request')
def enable_cors():
    """
    You need to add some headers to each request.
    Don't use the wildcard '*' for Access-Control-Allow-Origin in production.
    """
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'

search = SolrSearcher.SolrSearcher('http://128.46.137.79:8983/solr/TwitterDB_casestudy/')

search_in = SolrSearcher.SolrSearcher('http://128.46.137.79:8983/solr/TwitterDB_1401/')
@app.route('/term_groups/<terms>', method = 'GET')
def query(terms):
    terms = terms.split('&')
    rst = termPOS.build_groups(terms)

    response.content_type = 'application/json'
    return json_dumps(rst, indent=2)

#incomplete
@app.route('/merge/<graphIDs>', method = 'GET')
def query(graphIDs):
    ids = graphIDs.split('&')

    return awg_manager.merge_topics(ids)

#subclusters from created graph
@app.route('/topics/<graphID>', method = 'GET')
def query(graphID):
    response.content_type = 'application/json'
    return wg_manager.topics(str(graphID))

#initial query...
@app.route('/srl', method="GET")
def query():

    term = request.query.get("query")
    graphID = request.query.get("graphID")
    radius = request.query.get("radius")
    center = request.query.get("center")

    term = term.split(' ')

    print("term, size: ", term, len(term), "; graphID: ", graphID, "; radius: ", radius, "; center: ", center)

    #test
    #term = ['shooting']
    #radius = '1000'
    #center = str('40.437829,-86.921049')
    #graphID = "0"
    geobounds = {'type' : 'circular', 'center' : center, 'radius' : radius}

    #test
    start_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-21T00:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-23T00:00:00Z')

    try:
        results = srl_manager.retrieve(term, graphID, start_time, end_time, geobounds)
        if len(results) == 0:
            raise ValueError('No topics formed from retrieved tweets.')
    except ValueError as err:
        # print("No topics found in this area")
        results = []
        print(err.args)
        print(traceback.format_exc())
    except:
        print("error retrieving topics")
        results = []
        print(traceback.format_exc())

    response.content_type = 'application/json'
    return dumps(results)

@app.route('/topicsRT', method="GET")
def query():

    term = request.query.get("query")
    graphID = request.query.get("graphID")
    radius = request.query.get("radius")
    center = request.query.get("center")

    term = term.split(' ')

    print("term, size: ", term, len(term), "; graphID: ", graphID, "; radius: ", radius, "; center: ", center)

    #test
    #term = ['shooting']
    #radius = '1000'
    #center = str('40.437829,-86.921049')
    #graphID = "0"
    geobounds = {'type' : 'circular', 'center' : center, 'radius' : radius}

    #test
    start_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-21T00:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-23T00:00:00Z')

    try:
        results = awg_manager.retrieve(term, graphID, start_time, end_time, geobounds, realtime = False)
        if len(results) == 0:
            raise ValueError('No topics formed from retrieved tweets.')
    except ValueError as err:
        # print("No topics found in this area")
        results = []
        print(err.args)
        print(traceback.format_exc())
    except:
        print("error retrieving topics")
        results = []
        print(traceback.format_exc())

    response.content_type = 'application/json'
    return dumps(results)

@app.route('/topics', method="GET")
def query():
    
    term = request.query.get("query")
    graphID = request.query.get("graphID")
    radius = request.query.get("radius")
    center = request.query.get("center")
    
    if term != None:
        term = term.split(' ')
    else:
        term = []
    
    print("term, size: ", term, "; graphID: ", graphID, "; radius: ", radius, "; center: ", center)
    
    #test
    #term = ['shooting']
    #radius = '1000'
    #center = str('40.437829,-86.921049')
    #graphID = "0"
    geobounds = {'type' : 'circular', 'center' : center, 'radius' : radius}

    #test
    start_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-21T00:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-23T00:00:00Z')
    
    try:
        results = awg_manager.retrieve(term, graphID, start_time, end_time, geobounds)
        if len(results) == 0:
            raise ValueError('No topics formed from retrieved tweets.')
    except ValueError as err:
        # print("No topics found in this area")
        results = []
        print(err.args)
        print(traceback.format_exc())
    except:
        print("error retrieving topics")
        results = []
        print(traceback.format_exc())

    response.content_type = 'application/json'
    return dumps(results)

@app.route('/EMcategory', method="GET")
def query():
     
    term = request.query.get("query")
    graphID = request.query.get("graphID")
    radius = request.query.get("radius")
    center = request.query.get("center")
    start_time = request.query.get("start_time")
    end_time = request.query.get("end_time")
    
    start_time = TimeFunc.time_func_solr_date_to_python_date(start_time)
    end_time = TimeFunc.time_func_solr_date_to_python_date(end_time)
     
    if term != None:
        term = term.split(' ')
    else:
        term = []
     
    print("term, size: ", term, "; graphID: ", graphID, "; radius: ", radius, "; center: ", center)
    print("start_time: ", start_time, "; end_time: ", end_time)
    
    geobounds = {'type' : 'circular', 'center' : center, 'radius' : radius}
    
    # 41.855140, -88.373475;
    # 37.625001, -83.902040
    try:
#         rst = search_in.search(False, term, start_time, end_time, str(38.5), str(-87.5), str(41.5), str(-85), 100000)
        rst = search.search_radius(False, term, start_time, end_time, center, radius, rows=500000)
        
        if len(rst) == 0:
            raise ValueError('No topics formed from retrieved tweets.')
        
        tweets = []
        for t in rst:
            tweet = {}
            tweet['tweet_id'] = str(t['tweet_id'])
            
            tweet['created_at'] = t['created_at']
            tweet['geolocation'] = {}
            tweet['geolocation']['lon'] = t['geolocation'].split(',')[1]
            tweet['geolocation']['lat'] = t['geolocation'].split(',')[0]
            tweet['text'] = t['tokens']
            tweet['token_tags'] = t['token_tags']
            
            #initialize tokens#
            #this is required by emterms mode 1
            
#             nlp = NLPManager()
#             tokens = t['tokens'].split()
#             token_tags = list(t['token_tags'])
#             
#             tweet['tokens'] = []
#             
#             tags = ['N', 'S', '^', 'Z', 'V', '#']
#             
#             for idx, val in enumerate(tokens):
#                 if token_tags[idx] in tags and val.lower() not in nlp.stop_list:
#                     if val.lower() not in tweet['tokens']:
#                         tweet['tokens'].append(val.lower())
            
            #initialize tokens#
            
            tweets.append(tweet)
        
        print("num of tweets", len(tweets))
        
#         return EMTerms().category_tweets_to_topics2(tweets)
        return EMTerms().category_tweets_to_topics_vn_pair(tweets)
         
    except ValueError as err:
        # print("No topics found in this area")
        results = []
        print(err.args)
        print(traceback.format_exc())
    except:
        print("error retrieving topics")
        results = []
        print(traceback.format_exc())
 
    response.content_type = 'application/json'
    return dumps(results)

@app.route('/EMcategory_cache', method="GET")
def query():
    
    start_time = request.query.get("start_time")
    end_time = request.query.get("end_time")
    
    case_index = int(request.query.get("case_index"))
    
    fname = ''
    if case_index == 0:
        fname = 'shooting.json'
    elif case_index == 1:
        fname = 'boston.json'
    elif case_index == 2:
        fname = 'sandy.json'
    elif case_index == 4:
        fname = 'keene.json'
        
    with open(fname) as data_file:
        
#         cate = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08']
#         cate = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']
#         db = json.load(data_file)
#         for c in cate:
#             fil_db = [ tweet for tweet in db['tweets'] if c in tweet['cate'] ]
#             fil_db = sorted(fil_db, key=lambda k: k['created_at'])
#             
#             f = csv.writer(open(c+".csv", "w", encoding="utf8"))
# 
#             # Write CSV Header, If you dont need that, remove this line
#             f.writerow(["created_at", "text"])
#             
#             for x in fil_db:
#                 f.writerow([x['created_at'], x['text']])
        rst = json.load(data_file)
        rst_new = []
        
        for t in rst['tweets']:
            
            if t['created_at'] >= start_time and t['created_at'] < end_time:
                rst_new.append(t)
                
        print("return tweets;", start_time, end_time, len(rst_new))
            
    return json.dumps({'tweets':rst_new})


@app.route('/search', method="POST")
def query():
    start_time = TimeFunc.time_func_solr_date_to_python_date('2015-05-13T00:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2016-01-21T20:00:00Z')

    term = request.forms.get("queryText")

    if term is None:
        return None
    
    term = term.split()

    results = search.search(False, term, start_time, end_time, str(25), str(-129), str(50), str(-60))

    rst = []
    
    for result in results:
        rst.append(result)
    
    response.content_type = "application/json"
    return dumps(rst)


@app.get('/<filename:path>', method="GET")
def server_static(filename):
    print(filename)
    return static_file(filename, root='Static')


@app.route('/')
def index():
    return static_file('Static/main.html', '')


@app.route('/map')
def index():
    return static_file('Static/map_test/map_d3_test.html', '')


if __name__ == '__main__':
    wg_manager = WordGraphManager.WordGraphManager(search)
    srl_manager = SRLGraphManager.SRLGraphManager(search)
    awg_manager = AugmentedWordGraphManager.AugmentedWordGraphManager(search)
    run(app, host='128.46.137.79', port=9006, debug=True)
#     rst = []
#     rst = json.load(codecs.open('boston_ori.json', 'r', 'utf-8-sig'))
#          
#     tweets = []
#     for t in rst:
#         tweet = {}
#         tweet['tweet_id'] = str(t['tweet_id'])
#               
#         tweet['created_at'] = t['created_at']
#         tweet['geolocation'] = {}
#         tweet['geolocation']['lon'] = t['geolocation'].split(',')[1]
#         tweet['geolocation']['lat'] = t['geolocation'].split(',')[0]
#         tweet['text'] = t['tokens']
#         tweet['token_tags'] = t['token_tags']
#               
#         tweets.append(tweet)
#               
#         print("num of tweets", len(tweets))
#               
#     rst = EMTerms().category_tweets_to_topics_vn_pair(tweets)
#          
#     with open("boston.json", "w") as text_file:
#         text_file.write(rst)