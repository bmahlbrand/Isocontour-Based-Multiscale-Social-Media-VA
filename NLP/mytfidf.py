import math
from textblob import TextBlob as tb

def tf(word, blob):
    return blob.words.count(word) / len(blob.words)

def n_containing(word, bloblist):
    return sum(1 for blob in bloblist if word in blob.words)

def idf(word, bloblist):
    return math.log(len(bloblist) / (1 + n_containing(word, bloblist)))

def tfidf(word, blob, bloblist):
    return tf(word, blob) * idf(word, bloblist)

def tfidfWrapper(tweets):

    bloblist = [tb(tweet) for tweet in tweets]

    scores = []
    for i, blob in enumerate(bloblist):
        # print("document -->{}".format(blob))
        score = {word: tfidf(word, blob, bloblist) for word in blob.words}
        # sorted_words = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        # for word, score in sorted_words[:3]:
        #     print("\tWord: {}, TF-IDF: {}".format(word, round(score, 5)))
        scores.append(score)

    return scores


import NLP.NLPManager as NLPManager
nlp = NLPManager.NLPManager()

def getTweetKeywords(tokens):
    tokens = [token.lower() for token in tokens]

    keywords = []
    for token in tokens:
        if token in nlp.stop_list:
            continue
        if token.startswith('http'):
            continue

        keywords.append(token)

    return keywords