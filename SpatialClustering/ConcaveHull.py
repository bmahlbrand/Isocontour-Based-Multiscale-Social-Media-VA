import shapely.geometry as geometry
from descartes import PolygonPatch
import pylab as pl
import shapely
from shapely.ops import cascaded_union, polygonize
from scipy.spatial import Delaunay
import numpy as np
import math
import json
import os
from rdp import rdp

os.chdir('E:\Jiawei\Research\Projects\IsoContour_Multiscale_Social_Media_VA')

class ConcaveHull:

    def __init__(self):
        print('init concave hull')

    # def genConcaveHull(self, points):
    #
    #     point_collection = geometry.MultiPoint(list(points))
    #     point_collection.envelope
    #
    #     self.plot_polygon(point_collection.envelope)

    def plot_polygons(self, polygons):

        fig = pl.figure(figsize=(10, 10))
        ax = fig.add_subplot(111)
        margin = .3

        x_min = []
        y_min = []
        x_max = []
        y_max = []

        for polygon in polygons:
            a, b, c, d = polygon.bounds
            x_min.append(a)
            y_min.append(b)
            x_max.append(c)
            y_max.append(d)

        ax.set_xlim([min(x_min)-margin, max(x_max)+margin])
        ax.set_ylim([min(y_min)-margin, max(y_max)+margin])

        for polygon in polygons:
            patch = PolygonPatch(polygon, fc='#999999',
                                ec='#000000', fill=True,
                                zorder=-1)
            ax.add_patch(patch)
        return fig

    def genConcaveHull(self, points, ids, alpha, simplify):
        """
        Compute the alpha shape (concave hull) of a set
        of points.
        @param points: Iterable container of points.
        @param alpha: alpha value to influence the
            gooeyness of the border. Smaller numbers
            don't fall inward as much as larger numbers.
            Too large, and you lose everything!
        """
        if len(points) < 4:
            # When you have a triangle, there is no sense
            # in computing an alpha shape.
            return geometry.MultiPoint(points).convex_hull

        def add_edge(edges, edge_points, coords, i, j):
            """
            Add a line between the i-th and j-th points,
            if not in the list already
            """
            if (i, j) in edges or (j, i) in edges:
                # already added
                return
            edges.add((i, j))
            edge_points.append(coords[[i, j]])

        # coords = np.array([point.coords[0] for point in points])
        coords = np.array(points)

        try:
            tri = Delaunay(coords)
        except:
            return None, None

        edges = set()
        edge_points = []
        # loop over triangles:
        # ia, ib, ic = indices of corner points of the triangle
        for ia, ib, ic in tri.vertices:
            pa = coords[ia]
            pb = coords[ib]
            pc = coords[ic]
            # Lengths of sides of triangle
            a = math.sqrt((pa[0]-pb[0])**2 + (pa[1]-pb[1])**2)
            b = math.sqrt((pb[0]-pc[0])**2 + (pb[1]-pc[1])**2)
            c = math.sqrt((pc[0]-pa[0])**2 + (pc[1]-pa[1])**2)
            # Semiperimeter of triangle
            s = (a + b + c)/2.0
            # Area of triangle by Heron's formula
            area = math.sqrt(s*(s-a)*(s-b)*(s-c))
            circum_r = a*b*c/(4.0*area)
            # Here's the radius filter.
            # print circum_r
            if alpha < 0.00000001 or circum_r < 1.0/alpha:
                add_edge(edges, edge_points, coords, ia, ib)
                add_edge(edges, edge_points, coords, ib, ic)
                add_edge(edges, edge_points, coords, ic, ia)

        m = geometry.MultiLineString(edge_points)
        triangles = list(polygonize(m))

        if len(triangles) <= 0:
            return None, None

        hull = cascaded_union(triangles)

        hulls = []
        # sometimes the hull is a multi-polygon type.
        if type(hull) is shapely.geometry.polygon.Polygon:
            hulls.append(hull)
        else:
            hulls = hull

        hullsRst = []
        endpointsRst = []

        for hull in hulls:

            x = hull.boundary.coords.xy[0]
            y = hull.boundary.coords.xy[1]

            # simplify the boundary, xy = [[x1,y1]...]
            xy = [list(a) for a in zip(x, y)]

            # before simplification, not a polygon
            if len(xy) < 3:
                continue

            # simplify method 1: rdp
            # xy = rdp(xy, epsilon=simplify)

            # simplify method 2: shapely simplify
            tmp = geometry.Polygon(xy)
            simplified = tmp.simplify(tolerance=simplify, preserve_topology=True)

            x = simplified.boundary.coords.xy[0]
            y = simplified.boundary.coords.xy[1]

            xy = [list(a) for a in zip(x, y)]

            # after simplification, not a polygon
            if len(xy) < 3:
                continue

            x = [t[0] for t in xy]
            y = [t[1] for t in xy]

            hull = geometry.Polygon(xy)
            # simplify the boundary, xy = [[x1,y1]...]

            endpoints = []

            for i, val in enumerate(x):

                for j, point in enumerate(points):
                    if abs(point[0] - x[i]) < 0.1 and abs(point[1] - y[i]) < 0.1:
                        endpoints.append(ids[j])
                        break

            if len(x) != len(endpoints):
                print("fatal error in concave hull generation")

            hullsRst.append(hull)
            endpointsRst.append(endpoints)

        return hullsRst, endpointsRst

if __name__ == '__main__':

    ch = ConcaveHull()

    global_stat = 0

    # load points from file;
    with open('multiscale.json') as data_file:
        db = json.load(data_file)

    with open('cluster_list.json') as data_file:
        clusters = json.load(data_file)

    zoom = 11

    data = [dat['pts'] for dat in db if dat['zoom'] == zoom]
    data = data[0]

    dataCache = dict()
    for d in data:
        dataCache[d[0]] = [d[1], d[2]]

    clusters = [cluster['ids'] for cluster in clusters if cluster['zoom'] == zoom]

    pointsDB = []
    idsDB = []

    for cluster in clusters:
        points = []
        ids = []
        for id in cluster:
            points.append(dataCache[id])
            ids.append(id)

        idsDB.append(ids)
        pointsDB.append(points)

    concave_hulls = []
    for i, points in enumerate(pointsDB):

        # adapt rdp epsilon based on zoom level;
        # rdpeps = 2*pow(2, 10-zoom)
        # fixed epsilon
        rdpeps = 4

        concave_hull, endpointIds = ch.genConcaveHull(points, idsDB[i], alpha=0.3, rdpeps=rdpeps)

        if concave_hull is not None:
            concave_hulls = concave_hulls + concave_hull
        else:
            global_stat += 1

        x = [p[0] for p in points]
        y = [p[1] for p in points]

        pl.plot(x, y, 'o', color='#f16824')

    print("# of polys", len(concave_hulls), "; # of clusters", len(pointsDB))
    print("stat:", global_stat)

    ch.plot_polygons(concave_hulls)
    pl.show()
