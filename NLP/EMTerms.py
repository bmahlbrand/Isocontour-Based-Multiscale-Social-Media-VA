import csv
from idlelib.IOBinding import encoding
from Search import SolrSearcher
from Search import TimeFunc
from itertools import groupby
import json
import re
from Basic.AhocSearch import AhocSearch
from NLP.TermFold import TermFold
from NLP import NLPManager
import pandas
from test.test_buffer import _ca

stopwords = open("Data/stopwords_en.txt", encoding="utf-8").read().lower().splitlines()
print(stopwords)

nlp = NLPManager.getInstance()

class EMTerms(object):
    
    corpus_dir = "Data/EMTerms-light.csv"
    tf_threshold = 1
    #23 categories, so tp_theshold does not affect#
    tp_threshold = 30
    keyword_mode = 1 # mode 2 needs pos tagging for each input tweet
    
    class __EMTerms:
        
        def __init__(self):
            
            self.term_db = {}
            self.code_db = {}
            self.term_searcher = AhocSearch()
            
            # initialize term_db and code_db:
            
            with open(EMTerms.corpus_dir, encoding="utf-8") as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    term = row['Term'].lower()
                    term = self.clean_term(term)
#                     term = re.sub(r'[^\w'+'@ '+']', '',term)
#                     
#                     if term != row['Term'].lower():
#                         print(row['Term'].lower(), "-->", term)
                    
                    code = row['Code']
                    
                    # initialize term db:
                    
                    if term in self.term_db:
                        codes = self.term_db.get(term)
                        self.term_db.update({term:[code]+codes })
                    else:
                        self.term_db.update({term:[code]})
                    
                    # initialize code db:
                    
                    if code in self.code_db:
                        terms = self.code_db.get(code)
                        self.code_db.update({code:terms+[term]})
                    else:
                        self.code_db.update({code:[term]})
                
                #initialize search tree#
                for term in self.term_db.keys():
                    self.term_searcher.add(term)
                
                self.term_searcher.make()
                
        ##verion2 ##
        ##initialize manual terms
        manual_dict = dict()
        manual_dict_dir = "Data/Manual_Filter_Taxonomy/ct_cate.csv"
        
        with open(manual_dict_dir, encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row['flag'] != '1':
                    continue
                else:
                    cate = row['category']
                    if cate not in manual_dict:
                        manual_dict[cate] = AhocSearch()
                    
                    manual_dict[cate].add("_"+row['term'].lower().strip()+"_")
        
        for cate in manual_dict:
            manual_dict[cate].make()
        
        print('finished')
                    
                    
            
        def has(self, term):
            return term.lower() in self.term_db
        
        def clean_term(self, term):
            terms = term.split()
            term_new = []
            for t in terms:
                if t.isdigit():
                    term_new.append('{number}')
                else:
                    term_new.append(t)
            return "_" + "_".join(term_new) + "_"
        
        def stat(self):
            print("terms: ", len(self.term_db))
            cnt = 0
            for term in self.term_db:
                cnt += len(self.term_db.get(term))
                
            print("codes: ", cnt)
        
        def match(self, text):
            
#             category = {}
#             
#             for term in self.term_db:
#                 if term in self.clean_term(text.lower()):
#                     cates = self.term_db.get(term)
#                     for cate in cates:
#                         if cate in category:
#                             category.update({cate:category.get(cate)+[term]})
#                         else:
#                             category.update({cate:[term]})
#             
#             return category

            #apply new searcher to speed up multi-keyword search#
            
            category = {}
            
            matches = self.term_searcher.search(self.clean_term(text.lower()))
            
            for term in matches:
                cates = self.term_db.get(term)
                for cate in cates:
                    if cate in category:
                        category.update({cate:category.get(cate)+[term]})
                    else:
                        category.update({cate:[term]})
            
#             if len(category) == 0:
#                 print(text, category)
                
            return category
            
        def category_tweets_to_topics(self, tweets):
            
            for idx, tweet in enumerate(tweets):
                tweet['category'] = self.match(tweet['text'])
                tweets[idx] = tweet
            
            cates = []
            for tweet in tweets:
                cates.append(list(tweet['category'].keys()))
            
            # category distribution and top categories;
            
            codes = []
            for code in cates:
                if code != None:
                    codes += code
    
            codes.sort()
            top_cates = [(key, len(list(group))) for key, group in groupby(codes)]
            top_cates.sort(key=lambda tup: tup[1], reverse=True)
            top_cates = [ entry[0] for entry in top_cates[0:min(EMTerms.tp_threshold, len(top_cates))] ]
            
            # generate tweets:
            
            # need to have a new tweet corpus, because some tweets may not have any categories;
            tweet_corpus = []
            
            for tweet in tweets:
                
                if len(tweet['category']) == 0:
                    tweet['cate'] = []
                    tweet['tokens'] = {}
                    tweet_corpus.append(tweet)
                    continue
                
                #tweet['term'] = [ top_cates.index(entry) for entry in tweet['category'].keys() if entry in top_cates ]
                tweet['cate'] = [ entry for entry in tweet['category'].keys() if entry in top_cates ]
                
                # tweet['category']: {'T11': ['_stay_safe_'], 'T07': ['_police_'], 'O02': ['_police_'], 'C04': ['_police_'], 'T0
                #two modes here:
                #mode1: only return emterms;
                if EMTerms.keyword_mode == 1:
                    
                    tweet['tokens'] = {}
                     
                    for entry in tweet['category']:
                        key = entry
                        values = list(set(tweet['category'][key]))
                         
                        for value in values:
                             
                            value = value.replace('_', ' ').strip()
                            if value in tweet['tokens']:
                                tweet['tokens'][value].append(key)
                            else:
                                tweet['tokens'][value] = [key]
                
                #mode2: return general terms;
                else:
                    tmp_tokens = tweet['tokens']
                    
                    all_categories = list(tweet['category'].keys())
                    
                    tweet['tokens'] = {}
                    
                    for tmp_token in tmp_tokens:
                        tweet['tokens'][tmp_token] = all_categories
                    
                    
                ## change to general tokens instead of just em terms
#                 tweet['tokens'] = []
#                 
#                 for key in tweet['category'].values():
#                     tweet['tokens'] += [ entry.replace("_", " ").strip() for entry in key ]
#                     
#                 tweet['tokens'] = list(set(tweet['tokens']))
                
                tweet.pop("category", None)
                tweet_corpus.append(tweet)
            
            print("number of tweets from emterms: ", len(tweet_corpus))
            return json.dumps({'tweets':tweet_corpus})
    
        def category_tweets_to_topics2(self, tweets):
            
            for tweet in tweets:
                
                tks = tweet['text'].split(' ')
                tags = list(tweet['token_tags'])
                
                feature = []
                for idx, tk in enumerate(tks):
                    t = TermFold.test_feature(nlp, tks[idx], tags[idx])
                    if t != None:
                        feature.append(t)
                
                feature = '_'.join(list(set(feature)))
                feature = '_'+feature.lower()+'_'
                
                #output
                cates = []
                tokens = dict()
                
                for cate in self.manual_dict:
                    search = self.manual_dict[cate]
                    
                    hits = search.search(feature)
                    
                    if len(hits) > 0:
                        
                        #deal with cates
                        cates.append(cate)
                    
                        #deal with tokens
                        for hit in hits:
                            hit = hit.strip('_')
                            if hit not in tokens:
                                tokens[hit] = []
                            tokens[hit].append(cate)
                
                #remove duplicates:
                cates = list(set(cates))
                for t in tokens:
                    tokens[t] = list(set(tokens[t]))
                        
                tweet['cate'] = cates
                tweet['tokens'] = tokens
                
                tweet.pop('token_tags', None)
                
                #test
#                 if len(tweet['cate']) > 0:
#                     print(tweet['text'])
#                     print(feature)
#                     print(tweet['tokens'])
#                     print(tweet['cate'])
            
            rst_tweets = []
            
            for t in tweets:
                if len(t['cate']) > 0:
                    rst_tweets.append(t)
            
            
            print("number of tweets from emterms: ", len(rst_tweets))
            
#             with open('sandy.json', 'w') as outfile:
#                 json.dump({'tweets':rst_tweets}, outfile, indent=4, sort_keys=True)

            return json.dumps({'tweets':rst_tweets})
        
        
        def category_tweets_to_topics_vn_pair(self, tweets):
            
            cates = ['T02', 'T03', 'T04', 'T09', 'C07', 'O02', 'E01', 'T11']

#             cates = ['T02', 'T03', 'T04', 'T09', 'C07', 'O01', 'O03', 'O04']
            
            for cate in cates:
                print("processing" + cate)
                tweets = self._category_tweets_to_topics_vn_pair(tweets, cate)
            
            rst_tweets = []
            
            for t in tweets:
                if 'cate' in t and len(t['cate']) > 0:
                    rst_tweets.append(t)
                    
            print("number of tweets from emterms: ", len(rst_tweets))
            
#             with open('sandy.json', 'w') as outfile:
#                 json.dump({'tweets':rst_tweets}, outfile, indent=4, sort_keys=True)
#                 print("write to file")

            return json.dumps({'tweets':rst_tweets})
        
        def _category_tweets_to_topics_vn_pair(self, tweets, category):
            
            colnames = ['noun', 'number', 'verb', 'adjective', 'reserved']
            data = pandas.read_csv('Data/Manual_Filter_Taxonomy/' + category + '.csv', names=colnames)
            
            ns = data.noun.dropna().tolist()
            vs = data.verb.dropna().tolist()
            adjs = data.adjective.dropna().tolist()
            num = data.number.dropna().tolist()
            reserved = data.reserved.dropna().tolist()
            
            for tweet in tweets:
                
                tks = tweet['text'].split(' ')
                tags = list(tweet['token_tags'])
                
                lemmed_tks = []
                
                for idx, tk in enumerate(tks):
                    if tags[idx] == 'V' or tags[idx] == 'N':
                        lemmed_tks.append(nlp.lemmatize(tks[idx], tags[idx].lower()))
                    else:
                        lemmed_tks.append(tks[idx])
                
                tweet['lemmed_text'] = ' '.join(lemmed_tks)
                tweet['lemmed_text'] = tweet['lemmed_text'].lower()
                
                local_ns = []
                local_vs = []
                local_num = []
                local_adjs = []
                local_reserved = []
                
                for idx, tk in enumerate(tks):
                    if tags[idx] == 'V':
                        local_vs.append(lemmed_tks[idx].lower())
                    elif tags[idx] == 'N':
                        local_ns.append(lemmed_tks[idx].lower())
                    elif tags[idx] == '$':
                        local_num.append(tks[idx].lower())
                    elif tags[idx] == 'A':
                        local_adjs.append(tks[idx].lower())
                        
                local_ns_lemed = []
                local_vs_lemed = []
                
                for n in local_ns:
                    local_ns_lemed.append(n)
                    
                for v in local_vs:
                    local_vs_lemed.append(v)
                    
                local_reserved = local_ns_lemed + local_vs_lemed + local_adjs
                
                keywords = []
                
                flag_noun = True if len(set(local_ns_lemed).intersection(ns)) > 0 else False
                keywords += list(set(local_ns_lemed).intersection(ns))
                
                flag_num = True if len(local_num) > 0 and len(num) > 0 else False
                
                flag_adj = True if len(set(local_adjs).intersection(adjs)) > 0 else False
                keywords += list(set(local_adjs).intersection(adjs))
                
                flag_verb = True if len(set(local_vs_lemed).intersection(vs)) > 0 else False
                keywords += list(set(local_vs_lemed).intersection(vs))
                
                flag_reserve = True if len(set(local_reserved).intersection(reserved)) > 0 else False
                keywords += list(set(local_reserved).intersection(reserved))
                
                if (( flag_noun or flag_num ) and ( flag_adj or flag_verb )) or flag_reserve:
                    
                    if 'cate' not in tweet:
                        tweet['cate'] = []
                    
                    if 'tokens' not in tweet:
                        tweet['tokens'] = dict()
                    
                    tweet['cate'].append(category)
                    
                    for keyword in keywords:
                        if keyword in tweet['tokens'] and category not in tweet['tokens'][keyword]:
                            tweet['tokens'][keyword].append(category)
                        else:
                            tweet['tokens'][keyword] = [category]
            
            return tweets
        
    instance = None
    def __new__(cls):
        if not EMTerms.instance:
            EMTerms.instance = EMTerms.__EMTerms()
        return EMTerms.instance
    
    @staticmethod
    def has(term):
        return EMTerms.instance.has(term)
    
    @staticmethod
    def category_tweets(tweets):
        return EMTerms.instance.category_tweets(tweets)
    
if __name__ == '__main__':
    
#     rst = EMTerms().category_tweets(['this is one shooter', 'a shooting on campus', 'the victims is andrew bolt'])
    start_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-21T00:00:00Z')
    end_time = TimeFunc.time_func_solr_date_to_python_date('2014-01-23T00:00:00Z')

    search = SolrSearcher.SolrSearcher('http://128.46.137.79:8983/solr/TwitterDB_Purdueshooting/')
    rst = search.search(False, [], start_time, end_time, str(25), str(-129), str(50), str(-60))
    
    tweets = []
    for t in rst:
        tweet = {}
        tweet['tweet_id'] = str(t['tweet_id'])
        tweet['created_at'] = t['created_at']
        tweet['geolocation'] = {}
        tweet['geolocation']['lon'] = t['geolocation'].split(',')[1]
        tweet['geolocation']['lat'] = t['geolocation'].split(',')[0]
        tweet['text'] = t['text']
        tweets.append(tweet)
        
    
    topics = EMTerms().category_tweets_to_topics_vn_pair(tweets)
#     while True:
#         category = input('Enter category:')
#         code = input('Enter code:')
#         for idx, tweet in enumerate(tweets):
#             if int(category) in tweet['term']:
#                 print(tweet['category'][code], tweet['text'])
#         print()