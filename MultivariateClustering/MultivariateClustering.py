import matplotlib.pyplot as plt
import numpy
import scipy.cluster.hierarchy as hcluster
from SampleFile import *

# generate 3 clusters of each around 100 points and an orphan vector
# N=100
# data = numpy.random.randn(3*N,2)
# data[:N] += 5
# data[-N:] += 10
# data[-1:] -= 20

# clustering
thresh = 0.1
clusters = hcluster.fclusterdata(sampleData, thresh, criterion="distance")

clusters = clusters.tolist()
stat = {}
for idx, val in enumerate(clusters):
    if val not in stat:
        stat[val] = []

    stat[val].append(mapping[str(idx)])

for key in stat:
    print(key, len(stat[key]))