import csv
import copy
import json
from NLP import NLPManager
from collections import Counter
from TopicModel.lda import calc_lda
from idlelib.IOBinding import encoding
import operator

nlp = NLPManager.getInstance()

stop_word = copy.copy(nlp.stop_list)

def check_term(substring, terms):
    terms.pop(substring, None)

    group = [substring]

    for t in terms.keys():
        #sharing tokens detection, option 1
        #if substring in t:
        #   group.append(t)
        #sharing tokens detection, option 2
        
        arr1 = substring.split(' ')
        arr2 = t.split(' ')
        if len(list(set(arr1) & set(arr2))) == len(arr1):
            group.append(t)
    
    return group


def tag_index(word, words):
    i = 0
    while i < len(words):
        if word.lower() == words[i].lower():
            return i
        i += 1

    return -1


def get_tagged_tokens(row):
    phrase = row['Term'].strip('"').split(' ')
    tagged_terms = []
    for word in phrase:
        tokens = row['Example Tweet Tokens'].strip('"').split(' ')
        tags = row['Example Tweet Tags'].strip('"').split(' ')
        try:
            if len(tags) == len(tokens):
                try:
                    i = tag_index(word, tokens)
                    if i == -1:
                        if '{Number}' in word:
                            tag = '$'
                        else:
                            raise IndexError('tag index is invalid', word, tokens)
                    tag = tags[i]
                    tagged_terms.append({'token': word, 'tag': tag})

                except IndexError as err:
                    #print(err.args)
                    print()
            else:
                raise ValueError('tokens and tags are not equal')
        except ValueError as err:
            print(err.args)

    return tagged_terms


class TermFold(object):
    def __init__(self, filename, category=None):
        with open(filename, encoding="utf-8") as file:
            rst = csv.DictReader(file)
            self.terms = dict()
            for row in rst:
                
                term = row['Term'].strip().lower()
                
                if len(term) <= 0:
                    continue
                
                if term in stop_word:
                    continue
                
                if category == None or row['Category Code'] in category:
                    #add category
                    if term in self.terms:
                        self.terms[term]['cate'] = self.terms[term]['cate'] + [row['Category Code']]
                    else:
                        self.terms[term] = row
                        self.terms[term]['cate'] = [row['Category Code']]
                    

        print("init done")

    #merge phrases which share the same substring
    def fold(self):
        rst = list()

        #need to order the phrases by length ascendant
        ordered_phrases = list(self.terms)
        ordered_phrases.sort(key=len)
        
        covered_list = []

        for term in ordered_phrases:
            
            # check if term is already folded in another group
            if term not in covered_list:
                r = check_term(term, dict(self.terms))
                if r is not None:
                    rst.append(r)
                    covered_list = covered_list + r

        return rst

    def tag_terms(self):
        rst = []
        for row in self.terms.values():
            rst.append(get_tagged_tokens(row))

        return rst
    
    @staticmethod
    def test_feature(nlp_engine, token, tag):
        if token in stop_word:
            return None
        if tag == 'N' or tag == 'V':
            return nlp_engine.lemmatize(token, tag.lower())
        elif tag in ['^', '@', '#', 'A']:
            return token
        
        
    #updates the keys of the self.terms
    def extract_feature(self):
        
        terms_new = dict()
        
        for row in self.terms.values():
            group = get_tagged_tokens(row)
            
            # select important feature from tokens
            
            candidate_feature = []
            
            for word in group:
                
                tmp = TermFold.test_feature(nlp, word['token'], word['tag'])
                
                if tmp != None:
                    candidate_feature.append(tmp)
            
            # select important feature from tokens
            candidate_feature = list(set(candidate_feature))
            candidate_feature.sort()
            
            if len(candidate_feature) > 0:
                terms_new[' '.join(candidate_feature)] = row
        
        self.terms = terms_new
        
    def get_terms(self):
        return list(self.terms)
    
#     def generate_weka_file(self, train_file, test_file, tweets):
#         corpus = self.get_terms()
#         terms = []
#         for phrase in corpus:
#             terms = terms + phrase.lower().split(' ')
#             
#         #calculate statistics
#         counts = Counter(terms)
#         sorted = counts.most_common()
#          
#         for term in sorted:
#             print(term[0]+","+str(term[1]))
# 
#         return
#     
#         terms = list(set(terms))
#         terms = [ tk for tk in terms if '\'s' not in tk and '\'t' not in tk and '\'d' not in tk ]
#         
#         print(len(terms))
#         
#         category = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']
#         
#         #training file
#         f = open(train_file, 'w', encoding="utf-8")
#         f.write('@relation \'EMTerms: -C -11\'\n\n')
#         
#         for term in terms:
#             f.write('@attribute ' + term + ' {0,1}\n')
#         
#         for term in category:
#             f.write('@attribute ' + term + ' {0,1}\n')
#         
#         f.write('\n@data\n\n')
#         
#         features = []
# 
#         for phrase in corpus:
#             feature = []
#             
#             # feature
#             tks = phrase.lower().split(' ')
#             for term in terms:
#                 if term in tks:
#                     feature.append(1)
#                 else:
#                     feature.append(0)
#             
#             # target feature
#             for ct in category:
#                 if ct in self.terms[phrase]['cate']:
#                     feature.append(1)
#                 else:
#                     feature.append(0)
#             
#             features.append(feature)
#             
#         for idx, feature in enumerate(features):
#             feature = [ str(f) for f in feature ]
#             f.write(','.join(feature))
# #             f.write('}' + corpus[idx] + '\n')
#             f.write('\n')
#             
#         f.close()
#         
#         #clean test data#
#         test_data = []
#         for t in tweets:
#             data = []
#             tks = t['tokens'].split(' ')
#             tags = list(t['token_tags'])
#             
#             if len(tks) != len(tags):
#                 print("error", tks)
#             
#             for idx, val in enumerate(tks):
#                 if TermFold.test_feature(nlp, tks[idx], tags[idx]) != None:
#                     data.append(TermFold.test_feature(nlp, tks[idx], tags[idx]))
#             
#             test_data.append(' '.join(data))
#         
#         #test file
#         f = open(test_file, 'w', encoding="utf-8")
#         f.write('@relation \'EMTerms: -C -11\'\n\n')
#         
#         for term in terms:
#             f.write('@attribute ' + term + ' {0,1}\n')
#         
#         for term in category:
#             f.write('@attribute ' + term + ' {0,1}\n')
#         
#         f.write('\n@data\n\n')
#         
#         features = []
# 
#         for phrase in test_data:
#             feature = []
#             
#             # feature
#             tks = phrase.lower().split(' ')
#             for term in terms:
#                 if term in tks:
#                     feature.append(1)
#                 else:
#                     feature.append(0)
#             
#             # target feature
#             for ct in category:
#                 feature.append('?')
#             
#             features.append(feature)
#             
#         for idx, feature in enumerate(features):
#             feature = [ str(f) for f in feature ]
#             f.write(','.join(feature))
# #             f.write('}' + corpus[idx] + '\n')
#             f.write('\n')
#             
#         f.close()
        

if __name__ == '__main__':
    
    
    #test
#     category = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']
#     category = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08']
# 
#     for cate in category:
#         print("cate", cate)
#         termfold = TermFold('../Data/EMTerms-POS-clean.csv', category=cate)
#         termfold.extract_feature()
#         termfold.generate_weka_file('emterms_train.arff', 'emterms_test.arff', None)
#     
    #parse test data
    #clean_raw_file('../Data/EMTerms-POS.csv')
#     category = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']
    category = ['T09']
    termfold = TermFold('../Data/EMTerms-POS-clean.csv', category=category)
 
    termfold.extract_feature()
#     for group in termfold.fold():
#         print(len(group), group)

#     with open('tweets.json', encoding="utf-8") as data_file:
#         tweets = json.load(data_file)
# 
#     termfold.generate_weka_file('emterms_train.arff', 'emterms_test.arff', tweets)
#   
    rst = termfold.tag_terms()
  
    nlp = NLPManager.getInstance()
    for group in rst:
        for word in group:
            if word['tag'] == 'N' or word['tag'] == 'V':
                word['token'] = nlp.lemmatize(word['token'], word['tag'].lower())

    vn_pair = dict()
    all_n = []
    all_v = []

    for group in rst:
        ns = [ e['token'] for e in group if e['tag'] == 'N' ]
        vs = [ e['token'] for e in group if e['tag'] == 'V' ]
        
        all_n += ns
        all_v += vs
        
        for n in ns:
            for v in vs:
                k = n + "," + v
                if k in vn_pair:
                    vn_pair[k] += 1
                else:
                    vn_pair[k] = 1
    
    vn_list = sorted(vn_pair.items(), key=operator.itemgetter(1))
    vn_list = [ vn[0] for vn in vn_list ]
    
    print('\n'.join(vn_list))
    print('\n')
    print('\n'.join(list(set(all_n))))
    print('\n')
    print('\n'.join(list(set(all_v))))

#################################################
#######         added by Jiawei       ###########
#################################################

# def clean_raw_file(filename):
#     with open(filename, encoding="utf-8") as file:
#         rst = csv.DictReader(file)
#         
#         new_rows = []
#         for row in rst:
#             
#             #remove {number} related tokens
#             if '{' in row['Term']:
#                 tokens = [ token for token in row['Term'].strip('"').split(' ') if '{' not in token ]
#                 row['Term'] = ' '.join(tokens)
#             
#             new_rows.append(row)
#     
#     with open('../Data/EMTerms-POS-clean.csv', 'w', encoding="utf-8") as csvfile:
#         fieldnames = ['Term','Category Code','Category Name','Tweet','Example Tweet Tokens','Example Tweet Tags']
#         writer = csv.DictWriter(csvfile, fieldnames=fieldnames, lineterminator='\n')
#         writer.writeheader()
#         
#         for row in new_rows:
#             writer.writerow(row)