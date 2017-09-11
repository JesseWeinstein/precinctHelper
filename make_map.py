import geojson
import csv


class Maker:
    def __init__(self, precincts_filename, areas_filename):
        self.d = geojson.load(open(precincts_filename))

        self.areas = {}
        for row in csv.reader(open(areas_filename)):
            self.areas.setdefault(row[0], []).append(row[1])

    def make_feature(self, area):
        feat = [x for x in self.d.features if x.properties['votdst'] in self.areas[area]]
        geo = [x.geometry for x in feat]
        pro = {'name': area + (
            "\nVoters: %d" % sum([int(x.properties['SUM_VOTERS']) for x in feat]))}
        return geojson.Feature(id=area, properties=pro, geometry=geojson.GeometryCollection(geo))

    def write(self, output_filename):
        geojson.dump(geojson.FeatureCollection([self.make_feature(area) for area in self.areas]),
                     open(output_filename, 'w'))


if __name__ == '__main__':
    m = Maker("/home/jesse/FreeProjects/precinctHelper/precincts.geojson",
              '/home/jesse/Downloads/PrecinctToArea.csv')
    m.write('/home/jesse/FreeProjects/precinctHelper/thing.geojson')
