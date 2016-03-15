import pdb
from Search import SolrSearcher
import pysolr
from Graph import FileFunc
import re
from re import match
from NLP.print_tree import print_tree
from NLP import NLPManager as nlp

from TopicModel import lda

preserve_pos = ['V', 'N', '^', 'O', 'S', '#']

class ParseTree(object):
    '''
    classdocs
    '''

    def __init__(self, text, tokens, chunks, pos_tags, tree, entities):
        '''
        Constructor
        '''
        self.text = text
        self.tokens = tokens.split()
        self.tree = list(map(int, tree.split()))
        self.__convert_tree_format(self.tree)

        self.pos_tags = list(pos_tags)

        #############################
        #  initialize chunks begin  #
        #############################
        
        tmp_chunks = chunks.split()
        self.chunks = [ entry.split('_')[1:] for entry in tmp_chunks ]
        self.chunks_attr = [ entry.split('_')[0] for entry in tmp_chunks ]
        
        self.chunks_scope = []
        for idx, chunk in enumerate(self.chunks):
            if idx == 0:
                self.chunks_scope.append( ( 0, len(chunk) ) )
            else:
                self.chunks_scope.append( ( self.chunks_scope[idx-1][1], self.chunks_scope[idx-1][1]+len(chunk)  ) )

        #############################
        #  initialize chunks end   #
        #############################
        
        #############################
        #  initialize entity begin  #
        #############################
        
        if entities == None:
            self.entities = []
            self.entities_attr = []
            self.entities_scope = []
        else:
            tmp_entities = entities.split()
            self.entities = [ entry.split('_')[1:] for entry in tmp_entities ]
            self.entities_attr = [ entry.split('_')[0] for entry in tmp_entities ]
            
            self.entities_scope = []
            for idx, entity in enumerate(self.entities):
                if idx == 0:
                    self.entities_scope.append( ( 0, len(entity) ) )
                else:
                    self.entities_scope.append( ( self.entities_scope[idx-1][1], self.entities_scope[idx-1][1]+len(entity)  ) )

        #############################
        #  initialize entity end   #
        #############################

        if max([len(self.tokens), len(self.pos_tags), len(self.tree)]) != min([len(self.tokens), len(self.pos_tags), len(self.tree)]):
            print("format error", len(self.tokens), len(self.pos_tags), len(self.tree))
            print(self.tokens)
            raise

        self.size = max([len(self.tokens), len(self.pos_tags), len(self.tree)])
        
        #initialize depth;
        self.depths = []
        for i in range(self.size):
            self.depths.append(-1)
        self.__calcualte_depth(self.find_all_root(), 0)

    #Tree structure from cmu ark tweet library is not intuitive to interprete.
    #After conversion, -1 stands for root, -2 stands for being out of the tree.
    def __convert_tree_format(self, tree):

        for idx, val in enumerate(tree):
            if val == -1:
                tree[idx] = -2
            elif val == 0:
                tree[idx] = -1
            else:
                tree[idx] -= 1
                
    def __calcualte_depth(self, nodes, depth):
        
        childs = []
        
        for idx in nodes:
            self.depths[idx] = depth
            childs += self.find_childs(idx)
        
        if len(childs) > 0:
            self.__calcualte_depth(childs, depth+1)

    #recursive, should be fine since tweets are short!
    def find_root(self, index):

        if self.tree[index] == -1:
            return index
        elif self.tree[index] == -2:
            return index
        else:
            return self.find_root(self.tree[index])
        
    def find_all_root(self):
        
        roots = []
        for idx, val in enumerate(self.tree):
            if val == -1 or val == -2:
                roots.append(idx)
        return roots
        
    def find_left_childs(self, index):
        
        child = []
        for idx, val in enumerate(self.tree):
            if val == index and idx < index:
                child.append(idx)
        
        return sorted(child)
    
    def find_right_childs(self, index):
        
        child = []
        for idx, val in enumerate(self.tree):
            if val == index and idx > index:
                child.append(idx)
        
        return sorted(child)
    
    def find_childs(self, index):
        return self.find_left_childs(index) + self.find_right_childs(index)
    
    def find_left_descendants(self, index):
        
        descendants = self.find_descendants(index)
        tmp = []
        for val in descendants:
            if val < index:
                tmp.append(val)
        return sorted(tmp)
    
    def find_right_descendants(self, index):
        
        descendants = self.find_descendants(index)
        tmp = []
        for val in descendants:
            if val > index:
                tmp.append(val)
        return sorted(tmp)
    
    def find_descendants(self, index):
        
        childs = self.find_childs(index)
        for val in childs:
            childs += self.find_descendants(val)
        return sorted(list(set(childs)))
    
    def get_size(self):
        return self.size

    def get_chunk_size(self):
        return self.chunks_scope[len(self.chunks_scope)-1][1]
    
    def get_phrases(self):
        
        #find verb phrases;
        #stragety: 
        #step1: use both pos_tagging and chunking result, find all V in pos_tags and VP in chunks.
        #step2: possibly combine VP + PP + VP (use regex) as one VP.
        
        #previous 
        #verb_phrases_pattern = ['V?V(PV)+', 'V+' ]
        #match = [(m.start(0), m.end(0)) for m in re.finditer(r'|'.join(verb_phrases_pattern), ''.join(self.pos_tags))]
        
        match = [ entry for idx, entry in enumerate(self.chunks_scope) if self.chunks_attr[idx] == 'VP']
        
#         print('match:', match)
        verb_to_lift = []
        
        for rg in match:
            top_idx = self.depths[rg[0]:rg[1]].index(min(self.depths[rg[0]:rg[1]])) + rg[0]
            verb_to_lift.append(top_idx)
        
        #lift verbs to roots;
        for val in verb_to_lift:
            self.tree[val] = -1
            
    def print(self):
        print_tree(self)
        
    def retrieve_phrases(self, toString=False):
    
        phrases = []
        
        for idx in self.find_all_root():
     
                descendants = self.find_descendants(idx)
                descendants += [idx]
                 
                descendants = sorted(descendants)
                #remove stop list;
                descendants = [ idx for idx in descendants if self.tokens[idx].lower() not in nlp.getInstance().stop_list ]
                #remove by pos tagging;
                descendants = [ idx for idx in descendants if self.pos_tags[idx] in preserve_pos ]
                 
                tokens = [ self.tokens[idx] for idx in descendants ]
                tags = [ self.pos_tags[idx] for idx in descendants ]
                
                if len(tokens) > 0:
                    phrases.append(tokens)
        
        if not toString:
            return phrases
        else:
            phrases = [ "_".join(entry) for entry in phrases ]
            return " ".join(phrases)

def treeify_tweet(tweet):
    tree = ParseTree(tweet['tokens'], tweet['chunk'], tweet['token_tags'], tweet['parser'])
    rst = []

    segment = []
    for idx in range(tree.get_size()):
        segment.append( (tree.find_root(idx), tree.tokens[idx]) )

    for idx in tree.find_all_root():

        descendants = tree.find_descendants(idx)
        descendants += [idx]
        tokens = [ tree.tokens[idx] for idx in descendants if tree.tokens[idx].lower() not in nlp.getInstance().stop_list ]
        pos_tags = [ tree.pos_tags[idx] for idx in descendants if tree.tokens[idx].lower() not in nlp.getInstance().stop_list ]

        if 'V' in pos_tags or 'N' in pos_tags or '^' in pos_tags:
            rst.append((tokens, pos_tags, tree.tokens[idx]))

            # print(tokens, pos_tags, tree.tokens[idx])

    return rst




if __name__ == '__main__':
    
    solr = pysolr.Solr('http://128.46.137.79:8983/solr/TwitterDB_Purdueshooting/', timeout=10)
    rst = solr.search('*', rows=10000, sort="created_at desc")
#     
#     doc_to_add = []
#     
    for tweet in rst:
#         
        tree = ParseTree(tweet['text'], tweet['tokens'], tweet['chunk'], tweet['token_tags'], tweet['parser'], tweet['entity'] if 'entity' in tweet else None)
        
#         if tree.get_chunk_size() - tree.get_size() != 0:
#             print(tree.chunks)
#             print(tree.tokens)
#             print("length difference:", (tree.get_chunk_size() - tree.get_size()))
#         print(tree.chunks)
#         print(tree.chunks_attr)
#         print(tree.chunks_scope)
#         print(tree.tokens)
#         
#         print(tree.pos_tags)
#         
#         print("before lifting verbs", tree.tree)
#         
#         tree.get_phrases()
#         
#         print("after lifting verbs", tree.tree)
#         
        segment = []
        for idx in range(tree.get_size()):
            segment.append( (tree.find_root(idx), tree.tokens[idx]) )
#         
        print("segment", segment)
# 
#         print()
#         
#         print(tree.tokens)
#         print()
#         
#         tree.get_phrases()
#         print("tweet text: ", tree.text)
#         print("tweet chunks: ", tree.chunks)
#         print("tweet entity: ", tree.entities)
#         print("tweet pos: ", tree.pos_tags)
#         
#         print(tree.text)
#         print(tree.retrieve_phrases())
#         print()
        
#         phrases = [ " ".join(entry) for entry in tree.retrieve_phrases() ]
#         phrases = " ".join(phrases)
#         doc_to_add.append(phrases.split())
#     
        
    solr = pysolr.Solr('http://128.46.137.79:8983/solr/TwitterDB_Purdueshooting/', timeout=10)
    rst = solr.search('*', rows=10000, sort="created_at desc")
    
    doc_for_lda = []
    
    for entry in rst:
        phrases = entry['phrases']
        phrases = phrases.replace("_", " ").lower()
        phrases = phrases.split()
        doc_for_lda.append(phrases)
    
    lda.calc_lda(doc_for_lda, 100)
    
