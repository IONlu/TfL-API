{% extends "/docs.md" %}
{% block content %}
# Streaming APIs
The Streaming APIs provide programmatic access to real time Transport for Luxembourg data. Get updates of carpark occupancy data, bus/train departures from a stop point, and more. All responses are in [JSON](https://en.wikipedia.org/wiki/JSON) format.

## Getting started
To make things easy for you, we have published a streaming API client on npmjs 👉🏽 [tfl-api-client](https://www.npmjs.com/package/tfl-api-client).
Just subscribe to the channel(s) you want to get the data from and create magical apps 🎉.

We've also published a demo that subscribes to some channels, just to explain you how simple this is 👉🏽 [DEMO TIME](https://demo.api.tfl.lu)

## Channels
Below are some documents that will help you get going with the Streaming APIs as quickly as possible:

- [BikePoint](/Streaming_APIs/BikePoint.md)
- [StopPoint](/Streaming_APIs/StopPoint.md)
- [StopPoint/Departures](/Streaming_APIs/StopPoint/departures.md)
- [Occupancy](/Streaming_APIs/Occupancy.md)
- [Weather](/Streaming_APIs/Weather.md)
- [Weather/AirQuality](/Streaming_APIs/Weather/airquality.md)
- [Highway](/Streaming_APIs/Highway.md)

## Feedback
If you find any issues with the Streaming API, please notify us via [Twitter](https://twitter.com/TfLlu) or [email](mailto:tfl@ion.lu) where we’ll be actively listening to your feedback. We look forward to working with you, and can’t wait to see what everyone builds!
{% endblock %}
