import shapely.geometry as geometry
from descartes import PolygonPatch
import pylab as pl
from shapely.ops import cascaded_union, polygonize
from scipy.spatial import Delaunay
import numpy as np
import math

class ConcaveHull:

    def __init__(self):
        print('init concave hull')

    # def genConcaveHull(self, points):
    #
    #     point_collection = geometry.MultiPoint(list(points))
    #     point_collection.envelope
    #
    #     self.plot_polygon(point_collection.envelope)

    def plot_polygon(self, polygon):

        fig = pl.figure(figsize=(10, 10))
        ax = fig.add_subplot(111)
        margin = .3
        x_min, y_min, x_max, y_max = polygon.bounds
        ax.set_xlim([x_min-margin, x_max+margin])
        ax.set_ylim([y_min-margin, y_max+margin])
        patch = PolygonPatch(polygon, fc='#999999',
                             ec='#000000', fill=True,
                             zorder=-1)
        ax.add_patch(patch)
        return fig

    def genConcaveHull(self, points, alpha):
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

        tri = Delaunay(coords)
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
            if circum_r < 1.0/alpha:
                add_edge(edges, edge_points, coords, ia, ib)
                add_edge(edges, edge_points, coords, ib, ic)
                add_edge(edges, edge_points, coords, ic, ia)
        m = geometry.MultiLineString(edge_points)
        triangles = list(polygonize(m))

        return cascaded_union(triangles), edge_points

if __name__ == '__main__':

    ch = ConcaveHull()

    points = [[0, 0], [0, 1], [1, 0], [0.2, 0.2], [0.4, 0.4]]
    points = [[p[0]*10, p[1]*10] for p in points]
    concave_hull, edge_points = ch.genConcaveHull(points, 0.4)

    x = [p[0] for p in points]
    y = [p[1] for p in points]

    ch.plot_polygon(concave_hull)
    _ = pl.plot(x, y, 'o', color='#f16824')
    pl.show()
