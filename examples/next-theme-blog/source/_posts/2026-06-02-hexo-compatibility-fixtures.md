---
title: Hexo Compatibility Fixtures
date: 2026-06-02 00:00:00
tags:
  - xhalo-blog
  - compatibility
  - hexo
categories:
  - Example
---

This post exercises the default `hexo-next` compatibility baseline without copying production content.

<div class="photopad"><div class="border"><a data-fancybox="images" class="frame" href="fixture-gallery.jpg"><img class="image" src="fixture-image.png" data-src="fixture-image.png" alt="fixture image" /></a></div></div>

<div class="photopad"><div class="border">
  <a data-fancybox="html5-video" class="frame" href="#fixture-video">
    <img class="image" src="fixture-video-poster.jpg" alt="fixture video" />
  </a>
  <video width="100%" height="100%" controls loop preload="auto" poster="fixture-video-poster.jpg" id="fixture-video" style="display: none;" class="fancybox-video">
    <source src="fixture-video.mp4" type="video/mp4">
    <source src="fixture-video.webm" type="video/webm">
  </video>
</div></div>

{% pdf fixture-document.pdf %}

{% chart 100% 240 %}
{
  "type":"bar",
  "data":{
    "labels":["draft","preview","publish"],
    "datasets":[
      {
        "label":"compatibility fixture",
        "data":[1,2,3],
        "backgroundColor":["#4F46E5","#10B981","#F59E0B"]
      }
    ]
  },
  "options":{
    "responsive":true,
    "maintainAspectRatio":false
  }
}
{% endchart %}
