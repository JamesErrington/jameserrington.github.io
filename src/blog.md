---
layout: base
templateEngineOverride: njk,md
---
<h2 class="blog-title">Posts</h2>
{% set tagList = collections.tags %}
{% include "tag-list.njk" %}
{% set postlist = collections.blog %}
{% include "post-list.njk" %}
