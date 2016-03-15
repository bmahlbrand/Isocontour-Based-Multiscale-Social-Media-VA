from gensim import corpora, models, similarities
import logging
import os
import gensim

def calc_lda(documents, num_of_topics):
    dictionary = corpora.Dictionary(documents=documents)
    
    print("perform lda, doc size:", len(documents))

    corpus = [dictionary.doc2bow(doc) for doc in documents]

    lda = gensim.models.LdaModel(corpus, id2word=dictionary, num_topics=num_of_topics)

    lda.show_topics()

    for i in range(0, lda.num_topics):
        print(lda.print_topic(i))
#         
#     top_topics = lda.top_topics(corpus, num_topics=10, num_words=10)
#     
#     for doc in top_topics:
#         print(doc)
    
    docTopicProbMat = lda[corpus]
    for doc in docTopicProbMat:
        print(doc)


if __name__ == '__main__':
    documents = [['human', 'interface', 'computer'],
                 ['survey', 'user', 'computer', 'system', 'response', 'time'],
                 ['eps', 'user', 'interface', 'system'],
                 ['system', 'human', 'system', 'eps'],
                 ['user', 'response', 'time'],
                 ['trees'],
                 ['graph', 'trees'],
                 ['graph', 'minors', 'trees'],
                 ['graph', 'minors', 'survey']]
    calc_lda(documents, 3);