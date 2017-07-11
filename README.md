# soyfall [![Build Status](https://img.shields.io/travis/kevmannn/soyfall/master.svg?style=flat-square)](https://travis-ci.org/kevmannn/soyfall)

> A React / Redux app to monitor daily rainfall in soybean-saturated locales

> [soyfall](https://soyfall.now.sh)

## The problem (and a solution):
> Create a service that shows today's total rainfall for counties that produce a lot of soybeans. The user can choose a state to filter the results.

i.e. Represent the _location_ and _magnitude_ of rainfall for soybean-producing counties within a given state.

## Focus:
> Frontend

## Stack & Technical choices:
> React, Redux, React-mapbox-gl, React-vis, Reselect, Material-ui

## Tradeoffs:
> ...?

## Lessons:
* Willingness to close the laptop and just think should be commensurate with obscurity concerning the "large-scale path" of the solution.

* The interpretation of the problem will fluctuate, and given its extreme importance (with respect to how all subsequent thinking takes shape) thus demands attention to how it is "heard".

* Much thinking can be contingent on (apparent) API limitations and assumptions about response formats.

## Future:
* Timezones(?)

* Chart (and compute) "the day's result" in a strict sense (i.e midnight - midnight).

* Create layer of polygons representing the boundaries of each county within `ForecastMap`.

* Use [`rheostat`](https://github.com/airbnb/rheostat) to allow the user to dynamically set `soybeanYieldBounds`.

* Correlate the forecast with boon / doom of the crop (given the nature of soybean and the crop's history).

* For the sake of triage, use mapbox API to show shortest paths (and directions) between farm locations the user cares about.

* Account for the fact of weather forecasting (possibly) being [PSPACE-hard](http://www.sigecom.org/exchanges/volume_7/3/FORTNOW.pdf)

<!-- finding a path: -->
<!-- "Create a service that shows today's total rainfall for counties that produce a lot of soybeans. The user can choose a state to filter the results." -->

> Given a state and a range of soybean output, show today's _total_ rainfall across _all_ resultant counties (= activeCounties).
> Chart their aggregate cumulative precipIntensity (= "inches of liquid water per hour"), with hint showing this accumulation at that (= highlighted) point (and the 5 leading activeCounties in this regard).
> Represent activeCounties and their total rainfall with layers in Map. Make layer style (and map bounds / zoom) reflect what is shown in hint.

<!-- ? -->
> Is history (midnight) required of the forecast req fso the requirement of "the day's total"? (yes!?) (and ultimately concatenated to the startpoint of the non-historical req...)

## License

MIT © [Kevin Donahue](https://twitter.com/nonnontrivial)
