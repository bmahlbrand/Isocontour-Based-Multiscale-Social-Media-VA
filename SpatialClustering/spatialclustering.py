import json
import os

import numpy as np

from sklearn.cluster import DBSCAN
from sklearn import metrics
from sklearn.datasets.samples_generator import make_blobs
from sklearn.preprocessing import StandardScaler

os.chdir('E:\Jiawei\Research\Projects\IsoContour_Multiscale_Social_Media_VA')
print(os.getcwd())
##############################################################################
# Generate sample data
# centers = [[5, 5], [-5, -5], [5, -5]]
# X, labels_true = make_blobs(n_samples=750, n_features=2, centers=centers, cluster_std=0.4,
#                             center_box=(-10.0, 10.0), shuffle=True, random_state=0)
#
# X = StandardScaler().fit_transform(X)

##############################################################################
# load data from json file;

index = 4
with open('multiscale.json') as data_file:
    rst = json.load(data_file)
    rst = rst[index]

    pts = []
    labels = []
    for pt in rst['pts']:
        pts.append([pt[1], pt[2]])
        labels.append(pt[0])

X = np.array(pts)

global_max = pow(2, index) * 256
global_min = 0

local_max = X.max()
local_min = X.min()

labels_true = labels

##############################################################################

# Compute DBSCAN
db = DBSCAN(eps=3, min_samples=5).fit(X)
core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
core_samples_mask[db.core_sample_indices_] = True
labels = db.labels_

# Number of clusters in labels, ignoring noise if present.
n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)

print('Estimated number of clusters: %d' % n_clusters_)
print("Homogeneity: %0.3f" % metrics.homogeneity_score(labels_true, labels))
print("Completeness: %0.3f" % metrics.completeness_score(labels_true, labels))
print("V-measure: %0.3f" % metrics.v_measure_score(labels_true, labels))
print("Adjusted Rand Index: %0.3f"
      % metrics.adjusted_rand_score(labels_true, labels))
print("Adjusted Mutual Information: %0.3f"
      % metrics.adjusted_mutual_info_score(labels_true, labels))
print("Silhouette Coefficient: %0.3f"
      % metrics.silhouette_score(X, labels))

##############################################################################
# Plot result
import matplotlib.pyplot as plt

# Black removed and is used for noise instead.
unique_labels = set(labels)
colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))


# plt.axis([global_min, global_max, global_min, global_max])
plt.axis([local_min, local_max, local_min, local_max])

for k, col in zip(unique_labels, colors):
    if k == -1:
        # Black used for noise.
        col = 'k'
        # do not show noise
        continue

    class_member_mask = (labels == k)

    xy = X[class_member_mask & core_samples_mask]
    plt.plot(xy[:, 0], xy[:, 1], 'o', markerfacecolor=col,
             markeredgecolor='k', markersize=5)

    xy = X[class_member_mask & ~core_samples_mask]
    plt.plot(xy[:, 0], xy[:, 1], 'o', markerfacecolor=col,
             markeredgecolor='k', markersize=5)

plt.title('Estimated number of clusters: %d' % n_clusters_)
plt.show()